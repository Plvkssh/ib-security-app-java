package com.ibsecurity.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.ibsecurity.model.Question;
import org.springframework.stereotype.Service;

import javax.net.ssl.SSLContext;
import javax.net.ssl.TrustManager;
import javax.net.ssl.X509TrustManager;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.security.SecureRandom;
import java.security.cert.X509Certificate;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.locks.ReentrantLock;

@Service
public class GigaChatService {

    private static final String OAUTH_URL = "https://ngw.devices.sberbank.ru:9443/api/v2/oauth";
    private static final String CHAT_URL = "https://gigachat.devices.sberbank.ru/api/v1/chat/completions";

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final HttpClient httpClient;
    private final ReentrantLock tokenLock = new ReentrantLock();

    private volatile String apiKey;
    private volatile String accessToken;
    private volatile long tokenExpiresAt; // epoch millis

    public GigaChatService() {
        this.httpClient = createInsecureHttpClient();
    }

    // --- API Key management ---

    public void setApiKey(String apiKey) {
        this.apiKey = apiKey;
        this.accessToken = null;
        this.tokenExpiresAt = 0;
    }

    public boolean isApiKeyConfigured() {
        return apiKey != null && !apiKey.isBlank();
    }

    // --- Token management ---

    private String getAccessToken() throws Exception {
        if (!isApiKeyConfigured()) {
            throw new IllegalStateException("GigaChat API key is not configured");
        }

        // Reuse token if still valid (refresh 1 min before expiry)
        if (accessToken != null && Instant.now().toEpochMilli() < (tokenExpiresAt - 60_000)) {
            return accessToken;
        }

        tokenLock.lock();
        try {
            // Double-check after acquiring lock
            if (accessToken != null && Instant.now().toEpochMilli() < (tokenExpiresAt - 60_000)) {
                return accessToken;
            }

            String rqUID = UUID.randomUUID().toString();

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(OAUTH_URL))
                    .header("Content-Type", "application/x-www-form-urlencoded")
                    .header("Accept", "application/json")
                    .header("RqUID", rqUID)
                    .header("Authorization", "Basic " + apiKey)
                    .POST(HttpRequest.BodyPublishers.ofString("scope=GIGACHAT_API_PERS"))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() != 200) {
                throw new RuntimeException("OAuth failed: " + response.statusCode() + " — " + response.body());
            }

            JsonNode json = objectMapper.readTree(response.body());
            this.accessToken = json.get("access_token").asText();
            this.tokenExpiresAt = json.get("expires_at").asLong() * 1000; // convert seconds to millis

            return this.accessToken;
        } finally {
            tokenLock.unlock();
        }
    }

    // --- Chat completion ---

    private String chatCompletion(String userMessage) throws Exception {
        return chatCompletion(userMessage, 0.7, 2000);
    }

    private String chatCompletion(String userMessage, double temperature, int maxTokens) throws Exception {
        String token = getAccessToken();

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("model", "GigaChat:latest");
        body.put("messages", List.of(Map.of("role", "user", "content", userMessage)));
        body.put("temperature", temperature);
        body.put("max_tokens", maxTokens);

        String jsonBody = objectMapper.writeValueAsString(body);

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(CHAT_URL))
                .header("Content-Type", "application/json")
                .header("Authorization", "Bearer " + token)
                .POST(HttpRequest.BodyPublishers.ofString(jsonBody))
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

        if (response.statusCode() != 200) {
            throw new RuntimeException("GigaChat API error: " + response.statusCode() + " — " + response.body());
        }

        JsonNode json = objectMapper.readTree(response.body());
        return json.get("choices").get(0).get("message").get("content").asText();
    }

    // --- Public methods ---

    public List<Question> generateQuestions(List<String> weakTopics, String difficulty, int count) throws Exception {
        List<Question> allQuestions = new ArrayList<>();

        for (String topic : weakTopics) {
            String prompt = String.format(
                "Ты — эксперт по информационной безопасности. Сгенерируй %d вопросов для теста на осведомлённость сотрудников. " +
                "Тема: %s. Уровень: %s. Формат ответа — JSON-массив объектов: " +
                "[{\"question\": \"...\", \"options\": [\"...\", \"...\", \"...\", \"...\"], \"correctAnswer\": 0, \"explanation\": \"...\"}]. " +
                "correctAnswer — индекс правильного ответа (0-3). " +
                "Вопросы должны быть практичными и актуальными для российских организаций. " +
                "Верни ТОЛЬКО JSON-массив, без пояснений.",
                count, topic, difficulty
            );

            String responseText = chatCompletion(prompt);

            // Extract JSON array from response (handle cases where AI wraps it in markdown)
            String jsonStr = extractJsonArray(responseText);

            List<Map<String, Object>> parsed = objectMapper.readValue(jsonStr, new TypeReference<>() {});

            for (int i = 0; i < parsed.size(); i++) {
                Map<String, Object> q = parsed.get(i);
                @SuppressWarnings("unchecked")
                List<String> options = (List<String>) q.get("options");
                int correctAnswer = q.get("correctAnswer") instanceof Number
                        ? ((Number) q.get("correctAnswer")).intValue()
                        : Integer.parseInt(q.get("correctAnswer").toString());

                allQuestions.add(new Question(
                        "ai-" + UUID.randomUUID().toString().substring(0, 8),
                        topic,
                        difficulty,
                        "ai-generated",
                        (String) q.get("question"),
                        options,
                        correctAnswer,
                        (String) q.get("explanation"),
                        null
                ));
            }
        }

        return allQuestions;
    }

    public String generateFeedback(int score, int total, Map<String, Object> topicResults) throws Exception {
        int percentage = total > 0 ? Math.round((float) score / total * 100) : 0;

        List<String> weakTopics = new ArrayList<>();
        List<String> strongTopics = new ArrayList<>();

        if (topicResults != null) {
            for (Map.Entry<String, Object> entry : topicResults.entrySet()) {
                @SuppressWarnings("unchecked")
                Map<String, Object> vals = (Map<String, Object>) entry.getValue();
                int correct = ((Number) vals.get("correct")).intValue();
                int topicTotal = ((Number) vals.get("total")).intValue();
                if (topicTotal > 0 && (double) correct / topicTotal < 0.7) {
                    weakTopics.add(entry.getKey());
                } else {
                    strongTopics.add(entry.getKey());
                }
            }
        }

        String prompt = String.format(
            "Ты — ИИ-ассистент по информационной безопасности. Проанализируй результаты теста сотрудника и дай " +
            "персональные рекомендации на русском языке. Результат: %d/%d (%d%%). Слабые темы: %s. Сильные темы: %s. " +
            "Дай 3-5 конкретных рекомендаций по улучшению знаний в слабых областях. Укажи конкретные действия и ресурсы.",
            score, total, percentage,
            weakTopics.isEmpty() ? "нет" : String.join(", ", weakTopics),
            strongTopics.isEmpty() ? "нет" : String.join(", ", strongTopics)
        );

        return chatCompletion(prompt);
    }

    public Map<String, Object> generatePhishingScenario(String type, String difficulty, String trigger) throws Exception {
        String prompt = String.format(
            "Ты — эксперт по социальной инженерии (этичный). Сгенерируй обучающий сценарий фишинговой атаки " +
            "типа '%s' уровня сложности '%s' с триггером '%s'. " +
            "Ответ в формате JSON: {\"from\": \"...\", \"subject\": \"...\", \"body\": \"...\", " +
            "\"redFlags\": [\"...\"], \"correctActions\": [\"...\"], \"dangerousActions\": [\"...\"]}. " +
            "Сценарий должен быть реалистичным для российской организации. Верни ТОЛЬКО JSON-объект, без пояснений.",
            type, difficulty, trigger
        );

        String responseText = chatCompletion(prompt);
        String jsonStr = extractJsonObject(responseText);

        return objectMapper.readValue(jsonStr, new TypeReference<>() {});
    }

    // --- Helpers ---

    private String extractJsonArray(String text) {
        // Try to find JSON array in the response
        int start = text.indexOf('[');
        int end = text.lastIndexOf(']');
        if (start >= 0 && end > start) {
            return text.substring(start, end + 1);
        }
        return text;
    }

    private String extractJsonObject(String text) {
        // Try to find JSON object in the response
        int start = text.indexOf('{');
        int end = text.lastIndexOf('}');
        if (start >= 0 && end > start) {
            return text.substring(start, end + 1);
        }
        return text;
    }

    private static HttpClient createInsecureHttpClient() {
        try {
            TrustManager[] trustAllCerts = new TrustManager[]{
                new X509TrustManager() {
                    public X509Certificate[] getAcceptedIssuers() { return new X509Certificate[0]; }
                    public void checkClientTrusted(X509Certificate[] certs, String authType) {}
                    public void checkServerTrusted(X509Certificate[] certs, String authType) {}
                }
            };

            SSLContext sslContext = SSLContext.getInstance("TLS");
            sslContext.init(null, trustAllCerts, new SecureRandom());

            return HttpClient.newBuilder()
                    .sslContext(sslContext)
                    .build();
        } catch (Exception e) {
            throw new RuntimeException("Failed to create insecure HTTP client", e);
        }
    }
}
