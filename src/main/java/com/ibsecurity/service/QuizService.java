package com.ibsecurity.service;

import com.ibsecurity.data.PhishingBank;
import com.ibsecurity.data.QuestionBank;
import com.ibsecurity.dto.QuestionView;
import com.ibsecurity.dto.QuizStartResponse;
import com.ibsecurity.dto.QuizSubmissionRequest;
import com.ibsecurity.model.AppUser;
import com.ibsecurity.model.PhishingScenario;
import com.ibsecurity.model.Question;
import com.ibsecurity.model.QuizResult;
import com.ibsecurity.repository.QuizResultRepository;
import com.ibsecurity.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class QuizService {

    private static final String TOPIC_PHISHING = "Фишинг и социальная инженерия";
    private static final String TOPIC_PASSWORDS = "Парольная политика";
    private static final String TOPIC_EMAIL = "Безопасная работа с email";
    private static final String TOPIC_PD = "Защита персональных данных (152-ФЗ)";
    private static final String TOPIC_MOBILE = "Безопасность мобильных устройств";
    private static final String TOPIC_INCIDENTS = "Реагирование на инциденты";

    private final UserRepository userRepository;
    private final QuizResultRepository quizResultRepository;
    private final GigaChatService gigaChatService;
    private final QuizSessionStore quizSessionStore;

    public QuizService(
            UserRepository userRepository,
            QuizResultRepository quizResultRepository,
            GigaChatService gigaChatService,
            QuizSessionStore quizSessionStore
    ) {
        this.userRepository = userRepository;
        this.quizResultRepository = quizResultRepository;
        this.gigaChatService = gigaChatService;
        this.quizSessionStore = quizSessionStore;
    }

    public QuizStartResponse createQuestionSession(String difficulty, List<String> topics, int count) {
        List<Question> selected = filterQuestions(
                QuestionBank.QUESTIONS,
                normalizeDifficulty(difficulty),
                topics,
                count
        );

        String sessionId = quizSessionStore.createSession(selected);

        return new QuizStartResponse(
                sessionId,
                selected.stream().map(this::toQuestionView).toList()
        );
    }

    public QuizStartResponse createAiQuestionSession(String username, String difficulty, int count) throws Exception {
        List<String> weakTopics = findWeakTopicsForUser(username);
        if (weakTopics.isEmpty()) {
            weakTopics = List.of(TOPIC_PHISHING);
        }

        List<Question> aiQuestions = gigaChatService.generateQuestions(
                weakTopics,
                normalizeDifficulty(difficulty),
                safeCount(count)
        );

        if (aiQuestions == null || aiQuestions.isEmpty()) {
            throw new IllegalStateException("ИИ не вернул вопросы");
        }

        String sessionId = quizSessionStore.createSession(aiQuestions);

        return new QuizStartResponse(
                sessionId,
                aiQuestions.stream().map(this::toQuestionView).toList()
        );
    }

    public QuizResult saveResult(String username, QuizSubmissionRequest request) {
        AppUser user = getUserByUsername(username);

        if (request == null || request.sessionId() == null || request.sessionId().isBlank()) {
            throw new IllegalStateException("Не передан sessionId");
        }

        List<Question> sessionQuestions = quizSessionStore.consumeSession(request.sessionId());
        if (sessionQuestions == null || sessionQuestions.isEmpty()) {
            throw new IllegalStateException("Сессия теста не найдена или уже завершена");
        }

        Map<String, Question> questionMap = sessionQuestions.stream()
                .filter(Objects::nonNull)
                .collect(Collectors.toMap(
                        Question::id,
                        q -> q,
                        (a, b) -> a,
                        LinkedHashMap::new
                ));

        Map<String, Integer> answerMap = new LinkedHashMap<>();
        if (request.answers() != null) {
            for (QuizSubmissionRequest.AnswerItem answer : request.answers()) {
                if (answer != null && answer.questionId() != null && !answer.questionId().isBlank()) {
                    answerMap.put(answer.questionId(), answer.selectedAnswer());
                }
            }
        }

        QuizResult result = new QuizResult();
        result.setUser(user);
        result.setDifficulty(normalizeDifficulty(request.difficulty()));

        Set<String> actualTopics = new LinkedHashSet<>();
        List<String> wrongLines = new ArrayList<>();

        int score = 0;
        int total = questionMap.size();

        Map<String, Integer> topicTotals = new LinkedHashMap<>();
        Map<String, Integer> topicCorrect = new LinkedHashMap<>();

        for (Question question : questionMap.values()) {
            actualTopics.add(question.topic());

            String normalizedTopic = normalize(question.topic());
            String topicGroup = detectTopicGroup(normalizedTopic);

            if (topicGroup != null) {
                topicTotals.put(topicGroup, topicTotals.getOrDefault(topicGroup, 0) + 1);
            }

            Integer selectedAnswer = answerMap.get(question.id());
            boolean correct = selectedAnswer != null && selectedAnswer == question.correctAnswer();

            if (correct) {
                score++;
                if (topicGroup != null) {
                    topicCorrect.put(topicGroup, topicCorrect.getOrDefault(topicGroup, 0) + 1);
                }
            } else {
                wrongLines.add(formatWrongAnswer(question, selectedAnswer));
            }
        }

        int phishingScore = (int) Math.round(calcTopicPercent(topicCorrect, topicTotals, TOPIC_PHISHING));
        int passwordScore = (int) Math.round(calcTopicPercent(topicCorrect, topicTotals, TOPIC_PASSWORDS));
        int emailScore = (int) Math.round(calcTopicPercent(topicCorrect, topicTotals, TOPIC_EMAIL));
        int personalDataScore = (int) Math.round(calcTopicPercent(topicCorrect, topicTotals, TOPIC_PD));
        int mobileScore = (int) Math.round(calcTopicPercent(topicCorrect, topicTotals, TOPIC_MOBILE));
        int incidentScore = (int) Math.round(calcTopicPercent(topicCorrect, topicTotals, TOPIC_INCIDENTS));

        LocalDateTime now = LocalDateTime.now();

        result.setScore(score);
        result.setTotalQuestions(total);
        result.setTopics(new ArrayList<>(actualTopics));
        result.setCreatedAt(now);
        result.setCompletedAt(now.toString());
        result.setWrongAnswersSummary(
                wrongLines.isEmpty() ? "Ошибок нет" : String.join("\n\n", wrongLines)
        );

        result.setPhishingScore(phishingScore);
        result.setPasswordPolicyScore(passwordScore);
        result.setEmailSafetyScore(emailScore);
        result.setPersonalDataScore(personalDataScore);
        result.setMobileSecurityScore(mobileScore);
        result.setIncidentResponseScore(incidentScore);

        result.setLevel(calculateLevel(score, total));

        return quizResultRepository.save(result);
    }

    public List<QuizResult> getResults(String username) {
        AppUser user = getUserByUsername(username);
        return quizResultRepository.findByUser_IdOrderByCreatedAtDesc(user.getId());
    }

    public Map<String, Object> getStats(String username) {
        AppUser user = getUserByUsername(username);
        List<QuizResult> results = quizResultRepository.findByUser_IdOrderByCreatedAtDesc(user.getId());

        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("attempts", results.size());

        if (results.isEmpty()) {
            stats.put("averagePercent", 0.0);
            stats.put("lastPercent", 0.0);
            stats.put("weakTopics", List.of());
            stats.put("lastResult", null);
            return stats;
        }

        double averagePercent = results.stream()
                .mapToDouble(QuizResult::getPercent)
                .average()
                .orElse(0.0);

        QuizResult last = results.get(0);

        stats.put("averagePercent", Math.round(averagePercent * 100.0) / 100.0);
        stats.put("lastPercent", Math.round(last.getPercent() * 100.0) / 100.0);
        stats.put("weakTopics", findWeakTopicsForUser(username));
        stats.put("lastResult", last);

        return stats;
    }

    public List<PhishingScenario> getPhishingScenarios(String type, String difficulty, String trigger, int count) {
        List<PhishingScenario> filtered = new ArrayList<>(PhishingBank.SCENARIOS);

        if (type != null && !type.isBlank()) {
            filtered = filtered.stream()
                    .filter(s -> s.type() != null && s.type().equalsIgnoreCase(type))
                    .toList();
        }

        if (difficulty != null && !difficulty.isBlank()) {
            filtered = filtered.stream()
                    .filter(s -> s.difficulty() != null && s.difficulty().equalsIgnoreCase(difficulty))
                    .toList();
        }

        if (trigger != null && !trigger.isBlank()) {
            String normalizedTrigger = normalize(trigger);
            filtered = filtered.stream()
                    .filter(s -> s.trigger() != null && normalize(s.trigger()).contains(normalizedTrigger))
                    .toList();
        }

        List<PhishingScenario> result = new ArrayList<>(filtered);
        Collections.shuffle(result);
        return result.stream().limit(safeCount(count)).toList();
    }

    public List<String> findWeakTopicsForUser(String username) {
        AppUser user = getUserByUsername(username);

        return quizResultRepository.findTopByUser_IdOrderByCreatedAtDesc(user.getId())
                .map(this::extractWeakTopicsFromResult)
                .orElse(List.of());
    }

    public String getLastWrongAnswersSummaryForUser(String username) {
        AppUser user = getUserByUsername(username);

        return quizResultRepository.findTopByUser_IdOrderByCreatedAtDesc(user.getId())
                .map(QuizResult::getWrongAnswersSummary)
                .orElse("");
    }

    public String getUserPosition(String username) {
        return getUserByUsername(username).getPosition();
    }

    private AppUser getUserByUsername(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalStateException("Пользователь не найден"));
    }

    private List<Question> filterQuestions(List<Question> source, String difficulty, List<String> topics, int count) {
        List<Question> filtered = new ArrayList<>(source);

        if (difficulty != null && !difficulty.isBlank()) {
            filtered = filtered.stream()
                    .filter(q -> q.difficulty() != null && q.difficulty().equalsIgnoreCase(difficulty))
                    .toList();
        }

        if (topics != null && !topics.isEmpty()) {
            Set<String> normalizedTopics = topics.stream()
                    .filter(Objects::nonNull)
                    .map(this::normalize)
                    .collect(Collectors.toSet());

            filtered = filtered.stream()
                    .filter(q -> normalizedTopics.contains(normalize(q.topic())))
                    .toList();
        }

        List<Question> result = new ArrayList<>(filtered);
        Collections.shuffle(result);
        return result.stream().limit(safeCount(count)).toList();
    }

    private QuestionView toQuestionView(Question q) {
        return new QuestionView(
                q.id(),
                q.topic(),
                q.difficulty(),
                q.type(),
                q.question(),
                q.options(),
                q.regulation()
        );
    }

    private String formatWrongAnswer(Question question, Integer selectedAnswer) {
        String selectedText = "не выбран";
        if (selectedAnswer != null
                && selectedAnswer >= 0
                && selectedAnswer < question.options().size()) {
            selectedText = question.options().get(selectedAnswer);
        }

        String correctText = "неизвестно";
        if (question.correctAnswer() >= 0
                && question.correctAnswer() < question.options().size()) {
            correctText = question.options().get(question.correctAnswer());
        }

        return "Тема: " + question.topic() +
                "\nВопрос: " + question.question() +
                "\nВаш ответ: " + selectedText +
                "\nПравильный ответ: " + correctText +
                "\nПояснение: " + question.explanation();
    }

    private String calculateLevel(int score, int total) {
        if (total == 0) {
            return "Начальный";
        }

        double percent = (score * 100.0) / total;

        if (percent < 50) {
            return "Начальный";
        }
        if (percent < 80) {
            return "Средний";
        }
        return "Продвинутый";
    }

    private int safeCount(int count) {
        if (count <= 0) {
            return 10;
        }
        return Math.min(count, 50);
    }

    private String normalize(String value) {
        return value == null ? "" : value.trim().toLowerCase(Locale.ROOT);
    }

    private String normalizeDifficulty(String difficulty) {
        if (difficulty == null || difficulty.isBlank()) {
            return "базовый";
        }

        String normalized = difficulty.trim().toLowerCase(Locale.ROOT);

        return switch (normalized) {
            case "basic", "easy", "beginner", "базовый" -> "базовый";
            case "medium", "intermediate", "advanced", "продвинутый" -> "продвинутый";
            case "hard", "expert", "экспертный" -> "экспертный";
            default -> "базовый";
        };
    }

    private String detectTopicGroup(String topicKey) {
        if (topicKey.contains("фиш")) return TOPIC_PHISHING;
        if (topicKey.contains("парол")) return TOPIC_PASSWORDS;
        if (topicKey.contains("email") || topicKey.contains("почт")) return TOPIC_EMAIL;
        if (topicKey.contains("персонал") || topicKey.contains("152")) return TOPIC_PD;
        if (topicKey.contains("моб")) return TOPIC_MOBILE;
        if (topicKey.contains("инцид")) return TOPIC_INCIDENTS;
        return null;
    }

    private double calcTopicPercent(Map<String, Integer> topicCorrect,
                                    Map<String, Integer> topicTotals,
                                    String topic) {
        int total = topicTotals.getOrDefault(topic, 0);
        if (total == 0) {
            return 0.0;
        }

        int correct = topicCorrect.getOrDefault(topic, 0);
        return correct * 100.0 / total;
    }

    private List<String> extractWeakTopicsFromResult(QuizResult result) {
        List<String> weakTopics = new ArrayList<>();

        if (result.getPhishingScore() < 70) {
            weakTopics.add(TOPIC_PHISHING);
        }
        if (result.getPasswordPolicyScore() < 70) {
            weakTopics.add(TOPIC_PASSWORDS);
        }
        if (result.getEmailSafetyScore() < 70) {
            weakTopics.add(TOPIC_EMAIL);
        }
        if (result.getPersonalDataScore() < 70) {
            weakTopics.add(TOPIC_PD);
        }
        if (result.getMobileSecurityScore() < 70) {
            weakTopics.add(TOPIC_MOBILE);
        }
        if (result.getIncidentResponseScore() < 70) {
            weakTopics.add(TOPIC_INCIDENTS);
        }

        return weakTopics;
    }
}
