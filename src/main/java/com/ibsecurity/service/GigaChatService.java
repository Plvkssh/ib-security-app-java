public Map<String, Object> generatePersonalizedTrainingMaterial(
        String position,
        List<String> weakTopics,
        String wrongAnswersSummary,
        int score,
        int totalQuestions
) throws Exception {
    String prompt = String.format(
            "Ты — ИИ-ассистент по обучению сотрудников в области информационной безопасности. " +
            "Сформируй персонализированный обучающий материал для сотрудника. " +
            "Должность: %s. Слабые темы: %s. Ошибки пользователя: %s. Результат теста: %d/%d. " +
            "Верни JSON-объект формата: " +
            "{\"title\":\"...\",\"summary\":\"...\",\"keyPoints\":[\"...\"],\"microTraining\":[\"...\"],\"nextStep\":\"...\"}. " +
            "Материал должен быть коротким, практичным, применимым к российской организации и без воды. " +
            "Верни только JSON.",
            position,
            weakTopics == null || weakTopics.isEmpty() ? "не определены" : String.join(", ", weakTopics),
            (wrongAnswersSummary == null || wrongAnswersSummary.isBlank()) ? "нет подробного описания ошибок" : wrongAnswersSummary,
            score,
            totalQuestions
    );

    String responseText = chatCompletion(prompt, 0.4, 2200);
    String jsonStr = extractJsonObject(responseText);
    return objectMapper.readValue(jsonStr, new TypeReference<>() {});
}

public Map<String, Object> generateTargetedPhishingCampaign(
        String position,
        List<String> weakTopics,
        String wrongAnswersSummary
) throws Exception {
    String prompt = String.format(
            "Ты — ИИ-ассистент по информационной безопасности. Сгенерируй учебный персонализированный сценарий " +
            "контролируемой фишинговой кампании для сотрудника. " +
            "Должность: %s. Слабые темы: %s. Ошибки пользователя: %s. " +
            "Верни JSON-объект формата: " +
            "{\"scenarioName\":\"...\",\"channel\":\"email\",\"subject\":\"...\",\"body\":\"...\",\"legend\":\"...\",\"redFlags\":[\"...\"],\"correctActions\":[\"...\"],\"whyThisFitsUser\":\"...\"}. " +
            "Сценарий должен быть реалистичным, но безопасным и учебным, без вредоносных инструкций и без реального вреда. " +
            "Верни только JSON.",
            position,
            weakTopics == null || weakTopics.isEmpty() ? "не определены" : String.join(", ", weakTopics),
            (wrongAnswersSummary == null || wrongAnswersSummary.isBlank()) ? "нет подробного описания ошибок" : wrongAnswersSummary
    );

    String responseText = chatCompletion(prompt, 0.6, 2200);
    String jsonStr = extractJsonObject(responseText);
    return objectMapper.readValue(jsonStr, new TypeReference<>() {});
}
