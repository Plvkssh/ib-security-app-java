package com.ibsecurity.service;

import com.ibsecurity.data.PhishingBank;
import com.ibsecurity.data.QuestionBank;
import com.ibsecurity.model.AppUser;
import com.ibsecurity.model.PhishingScenario;
import com.ibsecurity.model.Question;
import com.ibsecurity.model.QuizResult;
import com.ibsecurity.repository.QuizResultRepository;
import com.ibsecurity.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class QuizService {

    private final QuizResultRepository quizResultRepository;
    private final UserRepository userRepository;

    public QuizService(QuizResultRepository quizResultRepository,
                       UserRepository userRepository) {
        this.quizResultRepository = quizResultRepository;
        this.userRepository = userRepository;
    }

    public List<Question> getQuestions(String difficulty, List<String> topics, int count) {
        List<Question> filtered = QuestionBank.QUESTIONS.stream()
                .filter(q -> difficulty == null || difficulty.isBlank() || q.difficulty().equals(difficulty))
                .filter(q -> topics == null || topics.isEmpty() || topics.contains(q.topic()))
                .collect(Collectors.toList());

        Collections.shuffle(filtered);
        return filtered.stream().limit(count).collect(Collectors.toList());
    }

    public QuizResult saveResult(String username, QuizResult incoming) {
        AppUser user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Пользователь не найден"));

        QuizResult entity = new QuizResult();
        entity.setUser(user);
        entity.setScore(incoming.getScore());
        entity.setTotalQuestions(incoming.getTotalQuestions());
        entity.setDifficulty(incoming.getDifficulty());
        entity.setTopics(incoming.getTopics() == null ? new ArrayList<>() : new ArrayList<>(incoming.getTopics()));
        entity.setLevel(incoming.getLevel());
        entity.setCompletedAt(incoming.getCompletedAt());
        entity.setPhishingScore(incoming.getPhishingScore());
        entity.setPasswordPolicyScore(incoming.getPasswordPolicyScore());
        entity.setEmailSafetyScore(incoming.getEmailSafetyScore());
        entity.setPersonalDataScore(incoming.getPersonalDataScore());
        entity.setMobileSecurityScore(incoming.getMobileSecurityScore());
        entity.setIncidentResponseScore(incoming.getIncidentResponseScore());
        entity.setCreatedAt(LocalDateTime.now());

        return quizResultRepository.save(entity);
    }

    public List<QuizResult> getResults(String username) {
        AppUser user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Пользователь не найден"));

        return quizResultRepository.findByUser_IdOrderByCreatedAtDesc(user.getId());
    }

    public Optional<QuizResult> getLatestResult(String username) {
        AppUser user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Пользователь не найден"));

        return quizResultRepository.findTopByUser_IdOrderByCreatedAtDesc(user.getId());
    }

    public Map<String, Object> getStats(String username) {
        List<QuizResult> results = getResults(username);

        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("totalTests", results.size());

        if (!results.isEmpty()) {
            double avgScore = results.stream()
                    .mapToDouble(r -> r.getTotalQuestions() == 0 ? 0 : (double) r.getScore() / r.getTotalQuestions() * 100)
                    .average()
                    .orElse(0);

            stats.put("averageScore", Math.round(avgScore));
            stats.put("lastResult", results.get(0));
        } else {
            stats.put("averageScore", 0);
            stats.put("lastResult", null);
        }

        return stats;
    }

    public List<PhishingScenario> getPhishingScenarios(String type, String difficulty, String trigger, int count) {
        List<PhishingScenario> filtered = PhishingBank.SCENARIOS.stream()
                .filter(s -> type == null || type.isBlank() || s.type().equals(type))
                .filter(s -> difficulty == null || difficulty.isBlank() || s.difficulty().equals(difficulty))
                .filter(s -> trigger == null || trigger.isBlank() || s.trigger().equals(trigger))
                .collect(Collectors.toList());

        Collections.shuffle(filtered);
        return filtered.stream().limit(count).collect(Collectors.toList());
    }
}
