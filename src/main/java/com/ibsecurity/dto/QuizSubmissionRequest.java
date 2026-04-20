package com.ibsecurity.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;

import java.util.List;

public record QuizSubmissionRequest(
        @NotBlank String sessionId,
        String difficulty,
        List<String> topics,
        @NotEmpty List<AnswerItem> answers
) {
    public record AnswerItem(
            @NotBlank String questionId,
            int selectedAnswer
    ) {}
}
