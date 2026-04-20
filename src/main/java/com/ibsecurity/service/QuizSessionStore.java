package com.ibsecurity.service;

import com.ibsecurity.model.Question;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class QuizSessionStore {

    private final Map<String, List<Question>> sessions = new ConcurrentHashMap<>();

    public String createSession(List<Question> questions) {
        String sessionId = UUID.randomUUID().toString();
        sessions.put(sessionId, List.copyOf(questions));
        return sessionId;
    }

    public List<Question> consumeSession(String sessionId) {
        if (sessionId == null || sessionId.isBlank()) {
            throw new IllegalArgumentException("sessionId пустой");
        }

        List<Question> questions = sessions.remove(sessionId);
        if (questions == null || questions.isEmpty()) {
            throw new IllegalArgumentException("Сессия теста не найдена или уже использована");
        }

        return questions;
    }
}
