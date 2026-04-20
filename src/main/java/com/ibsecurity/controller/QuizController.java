package com.ibsecurity.controller;

import com.ibsecurity.dto.QuizStartResponse;
import com.ibsecurity.dto.QuizSubmissionRequest;
import com.ibsecurity.model.PhishingScenario;
import com.ibsecurity.model.QuizResult;
import com.ibsecurity.service.AiPersonalizationService;
import com.ibsecurity.service.GigaChatService;
import com.ibsecurity.service.QuizService;
import jakarta.validation.Valid;
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

    public QuizController(
            QuizService quizService,
            GigaChatService gigaChatService,
            AiPersonalizationService aiPersonalizationService
    ) {
        this.quizService = quizService;
        this.gigaChatService = gigaChatService;
        this.aiPersonalizationService = aiPersonalizationService;
    }

    @GetMapping("/questions")
    public QuizStartResponse getQuestions(
            @RequestParam(required = false) String difficulty,
            @RequestParam(required = false) List<String> topics,
            @RequestParam(defaultValue = "10") int count
    ) {
        return quizService.createQuestionSession(difficulty, topics, count);
    }

    @PostMapping("/results")
    public QuizResult saveResult(
            @Valid @RequestBody QuizSubmissionRequest request,
            Authentication authentication
    ) {
        return quizService.saveResult(authentication.getName(), request);
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
            return Map.of("success", false, "error", "API ключ не настроен");
        } catch (Exception e) {
            return Map.of("success", false, "error", "Ошибка AI: " + e.getMessage());
        }
    }

    @PostMapping("/ai/generate-questions/me")
    public Map<String, Object> generateAiQuestionsForMe(
            @RequestBody Map<String, Object> params,
            Authentication authentication
    ) {
        try {
            String difficulty = (String) params.getOrDefault("difficulty", "medium");
            int count = params.containsKey("count") ? ((Number) params.get("count")).intValue() : 5;

            QuizStartResponse response = quizService.createAiQuestionSession(
                    authentication.getName(),
                    difficulty,
                    count
            );

            return Map.of(
                    "success", true,
                    "sessionId", response.sessionId(),
                    "questions", response.questions()
            );
        } catch (IllegalStateException e) {
            return Map.of("success", false, "error", "API ключ не настроен");
        } catch (Exception e) {
            return Map.of("success", false, "error", e.getMessage());
        }
    }

    @GetMapping("/ai/phishing/me")
    public Map<String, Object> generateAiPhishingForMe(Authentication authentication) {
        try {
            String username = authentication.getName();

            String position = quizService.getUserPosition(username);
            List<String> weakTopics = quizService.findWeakTopicsForUser(username);
            String wrongAnswersSummary = quizService.getLastWrongAnswersSummaryForUser(username);

            Map<String, Object> scenario = aiPersonalizationService.generateTargetedPhishingCampaign(
                    position,
                    weakTopics,
                    wrongAnswersSummary
            );

            return Map.of(
                    "success", true,
                    "scenario", scenario
            );
        } catch (IllegalStateException e) {
            return Map.of("success", false, "error", "API ключ не настроен");
        } catch (Exception e) {
            return Map.of("success", false, "error", "Ошибка AI: " + e.getMessage());
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
            return Map.of("success", false, "error", "API ключ не настроен");
        } catch (Exception e) {
            return Map.of("success", false, "error", e.getMessage());
        }
    }

    @PostMapping("/settings/api-key")
    public Map<String, Object> setApiKey(@RequestBody Map<String, String> params) {
        String apiKey = params.get("apiKey");

        if (apiKey == null || apiKey.isBlank()) {
            return Map.of("success", false, "error", "API ключ пустой");
        }

        gigaChatService.setApiKey(apiKey);
        return Map.of("success", true, "message", "API ключ сохранён");
    }

    @GetMapping("/settings/api-key/status")
    public Map<String, Object> getApiKeyStatus() {
        return Map.of("configured", gigaChatService.isApiKeyConfigured());
    }
}
