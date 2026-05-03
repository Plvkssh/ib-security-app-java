package com.ibsecurity.rag;

import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class RagRetrievalService {

    private final LocalKnowledgeBase knowledgeBase;

    public RagRetrievalService(LocalKnowledgeBase knowledgeBase) {
        this.knowledgeBase = knowledgeBase;
    }

    public List<KnowledgeChunk> retrieve(RagQuery query) {
        Set<String> queryTokens = buildQueryTokens(query);

        return knowledgeBase.getAll().stream()
                .map(chunk -> Map.entry(chunk, score(chunk, query, queryTokens)))
                .filter(e -> e.getValue() > 0)
                .sorted((a, b) -> Double.compare(b.getValue(), a.getValue()))
                .limit(query.limit() <= 0 ? 5 : query.limit())
                .map(Map.Entry::getKey)
                .toList();
    }

    private double score(KnowledgeChunk chunk, RagQuery query, Set<String> queryTokens) {
        double score = 0.0;

        Set<String> chunkTokens = tokenize(chunk.text());
        for (String token : queryTokens) {
            if (chunkTokens.contains(token) || chunk.tags().contains(token)) {
                score += 1.0;
            }
        }

        if ("training_material".equals(query.purpose()) && "training".equals(chunk.category())) {
            score += 2.0;
        }

        if ("phishing_campaign".equals(query.purpose()) && "scenario".equals(chunk.category())) {
            score += 2.0;
        }

        if ("question_generation".equals(query.purpose()) && "training".equals(chunk.category())) {
            score += 1.5;
        }

        if (query.weakTopics() != null) {
            for (String topic : query.weakTopics()) {
                String t = normalize(topic);
                if (chunk.tags().contains(t) || tokenize(chunk.text()).contains(t)) {
                    score += 2.5;
                }
            }
        }

        if (query.position() != null && !query.position().isBlank()) {
            String position = normalize(query.position());
            if (position.contains("hr") && chunk.text().toLowerCase(Locale.ROOT).contains("кадр")) score += 1.5;
            if (position.contains("фин") && chunk.text().toLowerCase(Locale.ROOT).contains("плат")) score += 1.5;
            if (position.contains("it") && chunk.text().toLowerCase(Locale.ROOT).contains("доступ")) score += 1.5;
            if (position.contains("руковод") && chunk.text().toLowerCase(Locale.ROOT).contains("срочно")) score += 1.0;
        }

        return score;
    }

    private Set<String> buildQueryTokens(RagQuery query) {
        Set<String> tokens = new LinkedHashSet<>();

        if (query.position() != null) {
            tokens.addAll(tokenize(query.position()));
        }
        if (query.weakTopics() != null) {
            for (String topic : query.weakTopics()) {
                tokens.addAll(tokenize(topic));
            }
        }
        if (query.wrongAnswersSummary() != null) {
            tokens.addAll(tokenize(query.wrongAnswersSummary()));
        }
        if (query.purpose() != null) {
            tokens.add(normalize(query.purpose()));
        }

        return tokens;
    }

    private Set<String> tokenize(String text) {
        if (text == null || text.isBlank()) return Set.of();

        return Arrays.stream(text.toLowerCase(Locale.ROOT)
                        .replaceAll("[^\\p{IsAlphabetic}\\p{IsDigit}\\s-]", " ")
                        .split("\\s+"))
                .filter(s -> s.length() > 2)
                .collect(Collectors.toCollection(LinkedHashSet::new));
    }

    private String normalize(String value) {
        return value == null ? "" : value.trim().toLowerCase(Locale.ROOT);
    }
}
