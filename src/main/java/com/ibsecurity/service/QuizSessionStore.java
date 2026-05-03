package com.ibsecurity.service;

import com.ibsecurity.model.Question;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class QuizSessionStore {

    private final Map<String, SessionEntry> sessions = new ConcurrentHashMap<>();

    public String createSession(List<Question> questions) {
        String sessionId = UUID.randomUUID().toString();
        sessions.put(sessionId, new SessionEntry(questions, Instant.now()));
        return sessionId;
    }

    public List<Question> consumeSession(String sessionId) {
        if (sessionId == null || sessionId.isBlank()) {
            throw new IllegalArgumentException("sessionId пустой");
        }

        SessionEntry entry = sessions.remove(sessionId);
        if (entry == null) {
            throw new IllegalArgumentException("Сессия теста не найдена или уже использована");
        }

        return entry.questions();
    }

    @Scheduled(fixedRate = 60_000)
    public void cleanUp() {
        Instant cutoff = Instant.now().minus(30, ChronoUnit.MINUTES);
        sessions.entrySet().removeIf(e -> e.getValue().createdAt().isBefore(cutoff));
    }

    private record SessionEntry(List<Question> questions, Instant createdAt) {}
}
