package com.ibsecurity.rag;

import java.util.Set;

public record KnowledgeChunk(
        String id,
        String source,
        String topic,
        String category,
        Set<String> tags,
        String text
) {
}
