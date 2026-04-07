package com.ibsecurity.service;

import com.ibsecurity.data.QuestionBank;
import com.ibsecurity.data.PhishingBank;
import com.ibsecurity.model.PhishingScenario;
import com.ibsecurity.model.Question;
import com.ibsecurity.model.QuizResult;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.stream.Collectors;

@Service
public class QuizService {

    private final List<QuizResult> results = new CopyOnWriteArrayList<>();

    public List<Question> getQuestions(String difficulty, List<String> topics, int count) {
        List<Question> filtered = QuestionBank.QUESTIONS.stream()
                .filter(q -> difficulty == null || difficulty.isEmpty() || q.difficulty().equals(difficulty))
                .filter(q -> topics == null || topics.isEmpty() || topics.contains(q.topic()))
                .collect(Collectors.toList());

        Collections.shuffle(filtered);
        return filtered.stream().limit(count).collect(Collectors.toList());
    }

    public QuizResult saveResult(QuizResult result) {
        result.setId(UUID.randomUUID().toString());
        results.add(result);
        return result;
    }

    public List<QuizResult> getResults() {
        return new ArrayList<>(results);
    }

    public List<PhishingScenario> getPhishingScenarios(String type, String difficulty, String trigger, int count) {
        List<PhishingScenario> filtered = PhishingBank.SCENARIOS.stream()
                .filter(s -> type == null || type.isEmpty() || s.type().equals(type))
                .filter(s -> difficulty == null || difficulty.isEmpty() || s.difficulty().equals(difficulty))
                .filter(s -> trigger == null || trigger.isEmpty() || s.trigger().equals(trigger))
                .collect(Collectors.toList());

        Collections.shuffle(filtered);
        return filtered.stream().limit(count).collect(Collectors.toList());
    }

    public Map<String, Object> getStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalTests", results.size());
        if (!results.isEmpty()) {
            double avgScore = results.stream()
                    .mapToDouble(r -> (double) r.getScore() / r.getTotalQuestions() * 100)
                    .average().orElse(0);
            stats.put("averageScore", Math.round(avgScore));
            stats.put("lastResult", results.get(results.size() - 1));
        }
        return stats;
    }
}
