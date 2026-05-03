package com.ibsecurity.rag;

import java.util.List;

public record RagQuery(
        String position,
        List<String> weakTopics,
        String wrongAnswersSummary,
        String purpose,
        int limit
) {
}
