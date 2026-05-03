package com.ibsecurity.service;

import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
public class AiPersonalizationService {

    private final GigaChatService gigaChatService;
    private final QuizService quizService;

    public AiPersonalizationService(GigaChatService gigaChatService, QuizService quizService) {
        this.gigaChatService = gigaChatService;
        this.quizService = quizService;
    }

    public Map<String, Object> buildAiPersonalization(String username) {
        String position = quizService.getUserPosition(username);
        List<String> weakTopics = quizService.findWeakTopicsForUser(username);
        String wrongAnswersSummary = quizService.getLastWrongAnswersSummaryForUser(username);

        try {
            return gigaChatService.generateTargetedPhishingCampaign(position, weakTopics, wrongAnswersSummary);
        } catch (Exception e) {
            throw new RuntimeException("Ошибка генерации ИИ-персонализации: " + e.getMessage());
        }
    }

    public Map<String, Object> generateTargetedPhishingCampaign(
            String position,
            List<String> weakTopics,
            String wrongAnswersSummary) {
        try {
            return gigaChatService.generateTargetedPhishingCampaign(position, weakTopics, wrongAnswersSummary);
        } catch (Exception e) {
            throw new RuntimeException("Ошибка генерации фишинговой кампании: " + e.getMessage());
        }
    }
}
