package com.ibsecurity.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.ibsecurity.model.Question;
import com.ibsecurity.rag.KnowledgeChunk;
import com.ibsecurity.rag.RagQuery;
import com.ibsecurity.rag.RagRetrievalService;
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
    private final RagRetrievalService ragRetrievalService;

    private volatile String apiKey;
    private volatile String accessToken;
    private volatile long tokenExpiresAt;

    public GigaChatService(RagRetrievalService ragRetrievalService) {
        this.ragRetrievalService = ragRetrievalService;
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

        if (accessToken != null && Instant.now().toEpochMilli() < (tokenExpiresAt - 60_000)) {
            return accessToken;
        }

        tokenLock.lock();
        try {
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
            this.tokenExpiresAt = json.get("expires_at").asLong() * 1000;

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
        List<KnowledgeChunk> contextChunks = ragRetrievalService.retrieve(
                new RagQuery(null, weakTopics, null, "question_generation", Math.min(count, 6))
        );

        String prompt = """
                Ты — эксперт по информационной безопасности.
                Сгенерируй %d вопросов для теста на осведомлённость сотрудников.

                Темы: %s
                Уровень: %s

                Контекст из локальной базы знаний:
                %s

                Формат ответа — JSON-массив объектов:
                [{"question":"...","options":["...","...","...","..."],"correctAnswer":0,"explanation":"..."}]

                Требования:
                1. correctAnswer — индекс правильного ответа (0-3).
                2. Вопросы должны быть практичными и актуальными для российских организаций.
                3. Используй факты и формулировки, совместимые с контекстом.
                4. Если контекста недостаточно, не выдумывай конкретные нормативные факты.
                5. Верни ТОЛЬКО JSON-массив, без пояснений.
                """.formatted(
                count,
                formatTopics(weakTopics, "Фишинг и социальная инженерия"),
                safeBlank(difficulty, "средний"),
                buildContextBlock(contextChunks)
        );

        String responseText = chatCompletion(prompt, 0.4, 2600);
        String jsonStr = extractJsonArray(responseText);

        List<Map<String, Object>> parsed = objectMapper.readValue(jsonStr, new TypeReference<>() {});
        List<Question> allQuestions = new ArrayList<>();

        for (Map<String, Object> q : parsed) {
            @SuppressWarnings("unchecked")
            List<String> options = (List<String>) q.get("options");

            int correctAnswer = q.get("correctAnswer") instanceof Number
                    ? ((Number) q.get("correctAnswer")).intValue()
                    : Integer.parseInt(q.get("correctAnswer").toString());

            String topic = weakTopics != null && !weakTopics.isEmpty()
                    ? weakTopics.get(0)
                    : "Фишинг и социальная инженерия";

            allQuestions.add(new Question(
                    "ai-" + UUID.randomUUID().toString().substring(0, 8),
                    topic,
                    difficulty == null || difficulty.isBlank() ? "средний" : difficulty,
                    "ai-generated",
                    (String) q.get("question"),
                    options,
                    correctAnswer,
                    (String) q.get("explanation"),
                    null
            ));
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

        List<KnowledgeChunk> contextChunks = ragRetrievalService.retrieve(
                new RagQuery(null, weakTopics, null, "training_material", 4)
        );

        String prompt = """
                Ты — ИИ-ассистент по информационной безопасности.
                Проанализируй результаты теста сотрудника и дай персональные рекомендации на русском языке.

                Результат: %d/%d (%d%%)
                Слабые темы: %s
                Сильные темы: %s

                Контекст из локальной базы знаний:
                %s

                Требования:
                1. Дай 3-5 конкретных рекомендаций по улучшению знаний в слабых областях.
                2. Укажи конкретные действия и практические советы.
                3. Не выдумывай нормативные требования, которых нет в контексте.
                """.formatted(
                score,
                total,
                percentage,
                weakTopics.isEmpty() ? "нет" : String.join(", ", weakTopics),
                strongTopics.isEmpty() ? "нет" : String.join(", ", strongTopics),
                buildContextBlock(contextChunks)
        );

        return chatCompletion(prompt, 0.5, 1800);
    }

    public Map<String, Object> generatePhishingScenario(String type, String difficulty, String trigger) throws Exception {
        List<String> topics = new ArrayList<>();
        if (type != null && !type.isBlank()) {
            topics.add(type);
        }

        List<KnowledgeChunk> contextChunks = ragRetrievalService.retrieve(
                new RagQuery(null, topics, trigger, "phishing_campaign", 5)
        );

        String prompt = """
                Ты — эксперт по социальной инженерии (этичный).
                Сгенерируй обучающий сценарий фишинговой атаки.

                Тип: %s
                Уровень сложности: %s
                Триггер: %s

                Контекст из локальной базы знаний:
                %s

                Ответ в формате JSON:
                {"from":"...","subject":"...","body":"...","redFlags":["..."],"correctActions":["..."],"dangerousActions":["..."]}

                Требования:
                1. Сценарий должен быть реалистичным для российской организации.
                2. Используй признаки атак, совместимые с контекстом.
                3. Не добавляй реально вредоносные инструкции.
                4. Верни ТОЛЬКО JSON-объект, без пояснений.
                """.formatted(
                safeBlank(type, "email"),
                safeBlank(difficulty, "средний"),
                safeBlank(trigger, "срочность"),
                buildContextBlock(contextChunks)
        );

        String responseText = chatCompletion(prompt, 0.6, 2200);
        String jsonStr = extractJsonObject(responseText);

        return objectMapper.readValue(jsonStr, new TypeReference<>() {});
    }

    public Map<String, Object> generatePersonalizedTrainingMaterial(
            String position,
            List<String> weakTopics,
            String wrongAnswersSummary,
            int score,
            int totalQuestions
    ) throws Exception {

        List<KnowledgeChunk> contextChunks = ragRetrievalService.retrieve(
                new RagQuery(position, weakTopics, wrongAnswersSummary, "training_material", 5)
        );

        String prompt = """
                Ты — ИИ-ассистент по обучению сотрудников в области информационной безопасности.
                Сформируй персонализированный обучающий материал для сотрудника.

                Входные параметры:
                Должность: %s
                Слабые темы: %s
                Ошибки пользователя: %s
                Результат теста: %d/%d

                Контекст из локальной базы знаний:
                %s

                Требования:
                1. Используй только факты и формулировки, совместимые с данным контекстом.
                2. Если контекста недостаточно, не выдумывай новые факты.
                3. Верни JSON-объект формата:
                {"title":"...","summary":"...","keyPoints":["..."],"microTraining":["..."],"nextStep":"..."}
                4. Материал должен быть коротким, практичным, применимым к российской организации и без воды.
                5. Верни только JSON.
                """.formatted(
                safe(position, "не указана"),
                formatTopics(weakTopics, "не определены"),
                safeBlank(wrongAnswersSummary, "нет подробного описания ошибок"),
                score,
                totalQuestions,
                buildContextBlock(contextChunks)
        );

        String responseText = chatCompletion(prompt, 0.3, 2200);
        String jsonStr = extractJsonObject(responseText);
        return objectMapper.readValue(jsonStr, new TypeReference<>() {});
    }

    public Map<String, Object> generateTargetedPhishingCampaign(
            String position,
            List<String> weakTopics,
            String wrongAnswersSummary
    ) throws Exception {

        List<KnowledgeChunk> contextChunks = ragRetrievalService.retrieve(
                new RagQuery(position, weakTopics, wrongAnswersSummary, "phishing_campaign", 5)
        );

        String prompt = """
                Ты — ИИ-ассистент по информационной безопасности.
                Сгенерируй учебный персонализированный сценарий контролируемой фишинговой кампании для сотрудника.

                Входные параметры:
                Должность: %s
                Слабые темы: %s
                Ошибки пользователя: %s

                Контекст из локальной базы знаний:
                %s

                Требования:
                1. Используй стиль и признаки атак, согласованные с данным контекстом.
                2. Не придумывай вредоносные инструкции и не давай реально опасных действий.
                3. Верни JSON-объект формата:
                {"scenarioName":"...","channel":"email","subject":"...","body":"...","legend":"...","redFlags":["..."],"correctActions":["..."],"whyThisFitsUser":"..."}
                4. Сценарий должен быть реалистичным, но безопасным и учебным.
                5. Верни только JSON.
                """.formatted(
                safe(position, "не указана"),
                formatTopics(weakTopics, "не определены"),
                safeBlank(wrongAnswersSummary, "нет подробного описания ошибок"),
                buildContextBlock(contextChunks)
        );

        String responseText = chatCompletion(prompt, 0.5, 2200);
        String jsonStr = extractJsonObject(responseText);
        return objectMapper.readValue(jsonStr, new TypeReference<>() {});
    }

    // --- Helpers ---

    private String buildContextBlock(List<KnowledgeChunk> chunks) {
        if (chunks == null || chunks.isEmpty()) {
            return "Контекст не найден. Не выдумывай факты, используй безопасные общие рекомендации.";
        }

        StringBuilder sb = new StringBuilder();
        int i = 1;

        for (KnowledgeChunk chunk : chunks) {
            sb.append("Фрагмент ").append(i++).append(":\n");
            sb.append("Источник: ").append(chunk.source()).append("\n");
            sb.append("Тема: ").append(chunk.topic()).append("\n");
            sb.append(chunk.text()).append("\n\n");
        }

        return sb.toString();
    }

    private String formatTopics(List<String> topics, String fallback) {
        return (topics == null || topics.isEmpty()) ? fallback : String.join(", ", topics);
    }

    private String safe(String value, String fallback) {
        return value == null ? fallback : value;
    }

    private String safeBlank(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value;
    }

    private String extractJsonArray(String text) {
        int start = text.indexOf('[');
        int end = text.lastIndexOf(']');
        if (start >= 0 && end > start) {
            return text.substring(start, end + 1);
        }
        return text;
    }

    private String extractJsonObject(String text) {
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
                        public X509Certificate[] getAcceptedIssuers() {
                            return new X509Certificate[0];
                        }

                        public void checkClientTrusted(X509Certificate[] certs, String authType) {
                        }

                        public void checkServerTrusted(X509Certificate[] certs, String authType) {
                        }
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
