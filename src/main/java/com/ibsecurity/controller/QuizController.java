package com.ibsecurity.controller;

import com.ibsecurity.model.PhishingScenario;
import com.ibsecurity.model.Question;
import com.ibsecurity.model.QuizResult;
import com.ibsecurity.service.AiPersonalizationService;
import com.ibsecurity.service.GigaChatService;
import com.ibsecurity.service.QuizService;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class QuizController {

    private final QuizService quizService;
    private final GigaChatService gigaChatService;
    private final AiPersonalizationService aiPersonalizationService;

    public QuizController(QuizService quizService,
                          GigaChatService gigaChatService,
                          AiPersonalizationService aiPersonalizationService) {
        this.quizService = quizService;
        this.gigaChatService = gigaChatService;
        this.aiPersonalizationService = aiPersonalizationService;
    }

    @GetMapping("/questions")
    public List<Question> getQuestions(
            @RequestParam(required = false) String difficulty,
            @RequestParam(required = false) List<String> topics,
            @RequestParam(defaultValue = "10") int count) {
        return quizService.getQuestions(difficulty, topics, count);
    }

    @PostMapping("/results")
    public QuizResult saveResult(@RequestBody QuizResult result, Authentication authentication) {
        return quizService.saveResult(authentication.getName(), result);
    }

    @GetMapping("/results")
    public List<QuizResult> getResults(Authentication authentication) {
        return quizService.getResults(authentication.getName());
    }

    @GetMapping("/stats")
    public Map<String, Object> getStats(Authentication authentication) {
        return quizService.getStats(authentication.getName());
    }

    @GetMapping("/ai/personalize/me")
    public Map<String, Object> getAiPersonalization(Authentication authentication) {
        try {
            return Map.of(
                    "success", true,
                    "data", aiPersonalizationService.buildAiPersonalization(authentication.getName())
            );
        } catch (IllegalStateException e) {
            return Map.of("success", false, "error", "API ключ не настроен. Перейдите в Настройки.");
        } catch (Exception e) {
            return Map.of("success", false, "error", "Ошибка AI-персонализации: " + e.getMessage());
        }
    }

    @PostMapping("/phishing/generate")
    public List<PhishingScenario> generatePhishing(@RequestBody Map<String, Object> params) {
        String type = (String) params.getOrDefault("type", "");
        String difficulty = (String) params.getOrDefault("difficulty", "");
        String trigger = (String) params.getOrDefault("trigger", "");
        int count = params.containsKey("count") ? ((Number) params.get("count")).intValue() : 3;

        return quizService.getPhishingScenarios(type, difficulty, trigger, count);
    }

    @PostMapping("/ai/generate-questions")
    public Map<String, Object> aiGenerateQuestions(@RequestBody Map<String, Object> params) {
        try {
            @SuppressWarnings("unchecked")
            List<String> weakTopics = (List<String>) params.getOrDefault("weakTopics", List.of("phishing"));
            String difficulty = (String) params.getOrDefault("difficulty", "базовый");
            int count = params.containsKey("count") ? ((Number) params.get("count")).intValue() : 5;

            List<Question> questions = gigaChatService.generateQuestions(weakTopics, difficulty, count);
            return Map.of("success", true, "questions", questions);
        } catch (IllegalStateException e) {
            return Map.of("success", false, "error", "API ключ не настроен. Перейдите в Настройки.");
        } catch (Exception e) {
            return Map.of("success", false, "error", "Ошибка генерации: " + e.getMessage());
        }
    }

    @PostMapping("/ai/feedback")
    public Map<String, Object> aiFeedback(@RequestBody Map<String, Object> params) {
        try {
            int score = ((Number) params.get("score")).intValue();
            int total = ((Number) params.get("total")).intValue();

            @SuppressWarnings("unchecked")
            Map<String, Object> topicResults = (Map<String, Object>) params.get("topicResults");

            String feedback = gigaChatService.generateFeedback(score, total, topicResults);
            return Map.of("success", true, "feedback", feedback);
        } catch (IllegalStateException e) {
            return Map.of("success", false, "error", "API ключ не настроен. Перейдите в Настройки.");
        } catch (Exception e) {
            return Map.of("success", false, "error", "Ошибка генерации: " + e.getMessage());
        }
    }

    @PostMapping("/ai/phishing")
    public Map<String, Object> aiPhishing(@RequestBody Map<String, Object> params) {
        try {
            String type = (String) params.getOrDefault("type", "email");
            String difficulty = (String) params.getOrDefault("difficulty", "средний");
            String trigger = (String) params.getOrDefault("trigger", "срочность");

            Map<String, Object> scenario = gigaChatService.generatePhishingScenario(type, difficulty, trigger);
            return Map.of("success", true, "scenario", scenario);
        } catch (IllegalStateException e) {
            return Map.of("success", false, "error", "API ключ не настроен. Перейдите в Настройки.");
        } catch (Exception e) {
            return Map.of("success", false, "error", "Ошибка генерации: " + e.getMessage());
        }
    }

    @PostMapping("/settings/api-key")
    public Map<String, Object> setApiKey(@RequestBody Map<String, String> params) {
        String apiKey = params.get("apiKey");

        if (apiKey == null || apiKey.isBlank()) {
            return Map.of("success", false, "error", "API ключ не может быть пустым");
        }

        gigaChatService.setApiKey(apiKey);
        return Map.of("success", true, "message", "API ключ сохранён");
    }

    @GetMapping("/settings/api-key/status")
    public Map<String, Object> getApiKeyStatus() {
        return Map.of("configured", gigaChatService.isApiKeyConfigured());
    }
}
