package com.ibsecurity.dto;

import java.util.List;

public record QuizStartResponse(
        String sessionId,
        List<QuestionView> questions
) {}
