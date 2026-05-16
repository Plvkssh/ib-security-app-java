package com.ibsecurity.service;

import com.ibsecurity.model.Question;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.List;
import java.util.UUID;

@Component
public class QuizSessionStore {

    private final RedisTemplate<String, Object> redisTemplate;
    private final Duration sessionTtl;

    public QuizSessionStore(RedisTemplate<String, Object> redisTemplate,
                            @Value("${redis.session.ttl:1800}") long ttlSeconds) {
        this.redisTemplate = redisTemplate;
        this.sessionTtl = Duration.ofSeconds(ttlSeconds);
    }

    public String createSession(List<Question> questions) {
        String sessionId = UUID.randomUUID().toString();
        redisTemplate.opsForValue().set(sessionId, questions, sessionTtl);
        return sessionId;
    }

    @SuppressWarnings("unchecked")
    public List<Question> consumeSession(String sessionId) {
        if (sessionId == null || sessionId.isBlank()) {
            throw new IllegalArgumentException("sessionId пустой");
        }

        Object value = redisTemplate.opsForValue().get(sessionId);
        if (value == null) {
            throw new IllegalArgumentException("Сессия теста не найдена или уже использована");
        }

        redisTemplate.delete(sessionId);

        if (value instanceof List<?> list && !list.isEmpty() && list.get(0) instanceof Question) {
            return (List<Question>) list;
        }
        
        throw new IllegalStateException("Некорректный тип данных в сессии");
    }
}
