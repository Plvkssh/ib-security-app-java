package com.ibsecurity.rag;

import com.ibsecurity.data.PhishingBank;
import com.ibsecurity.data.QuestionBank;
import com.ibsecurity.model.PhishingScenario;
import com.ibsecurity.model.Question;
import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Component;

import java.util.*;
import java.util.stream.Collectors;

@Component
public class LocalKnowledgeBase {

    private final List<KnowledgeChunk> chunks = new ArrayList<>();

    @PostConstruct
    public void init() {
        loadQuestionChunks();
        loadScenarioChunks();
    }

    public List<KnowledgeChunk> getAll() {
        return List.copyOf(chunks);
    }

    private void loadQuestionChunks() {
        for (Question q : QuestionBank.QUESTIONS) {
            String text = """
                    Тема: %s
                    Сложность: %s
                    Тип: %s
                    Вопрос: %s
                    Варианты: %s
                    Пояснение: %s
                    Нормативная ссылка: %s
                    """.formatted(
                    safe(q.topic()),
                    safe(q.difficulty()),
                    safe(q.type()),
                    safe(q.question()),
                    q.options() == null ? "" : String.join(" | ", q.options()),
                    safe(q.explanation()),
                    safe(q.regulation())
            );

            chunks.add(new KnowledgeChunk(
                    "q-" + q.id(),
                    "question_bank",
                    normalizeTopic(q.topic()),
                    "training",
                    buildTags(q.topic(), q.difficulty(), q.type(), q.regulation()),
                    text
            ));
        }
    }

    private void loadScenarioChunks() {
        for (PhishingScenario s : PhishingBank.SCENARIOS) {
            String text = """
                    Канал: %s
                    Сложность: %s
                    Триггер: %s
                    Тема письма: %s
                    Текст сценария: %s
                    Красные флаги: %s
                    Корректные действия: %s
                    """.formatted(
                    safe(s.type()),
                    safe(s.difficulty()),
                    safe(s.trigger()),
                    safe(s.subject()),
                    safe(s.body()),
                    joinList(s.redFlags()),
                    joinList(s.correctActions())
            );

            chunks.add(new KnowledgeChunk(
                    "s-" + s.id(),
                    "phishing_bank",
                    normalizeTopic(s.type()),
                    "scenario",
                    buildTags(s.type(), s.difficulty(), s.trigger(), null),
                    text
            ));
        }
    }

    private Set<String> buildTags(String a, String b, String c, String d) {
        Set<String> tags = new LinkedHashSet<>();
        List<String> raw = Arrays.asList(a, b, c, d);
        for (String v : raw) {
            if (v == null || v.isBlank()) continue;
            tags.add(normalize(v));
            tags.addAll(expandTopicTags(v));
        }
        return tags;
    }

    private Set<String> expandTopicTags(String value) {
        String n = normalize(value);
        Set<String> tags = new LinkedHashSet<>();

        if (n.contains("phishing") || n.contains("фиш")) {
            tags.addAll(Set.of("phishing", "фишинг", "социальная инженерия"));
        }
        if (n.contains("password") || n.contains("парол")) {
            tags.addAll(Set.of("password", "пароль", "парольная политика"));
        }
        if (n.contains("email") || n.contains("почт")) {
            tags.addAll(Set.of("email", "почта", "безопасная работа с email"));
        }
        if (n.contains("personal") || n.contains("152") || n.contains("персонал")) {
            tags.addAll(Set.of("personal_data", "152-фз", "персональные данные"));
        }
        if (n.contains("mobile") || n.contains("моб")) {
            tags.addAll(Set.of("mobile", "мобильная безопасность"));
        }
        if (n.contains("incident") || n.contains("инцид")) {
            tags.addAll(Set.of("incident", "инциденты", "реагирование на инциденты"));
        }
        if (n.contains("spear")) {
            tags.addAll(Set.of("spear phishing", "целевой фишинг"));
        }
        if (n.contains("smishing")) {
            tags.addAll(Set.of("smishing", "смишинг", "sms"));
        }
        if (n.contains("vishing")) {
            tags.addAll(Set.of("vishing", "вишинг", "голосовые звонки"));
        }
        return tags;
    }

    private String normalizeTopic(String value) {
        String n = normalize(value);
        if (n.contains("phishing") || n.contains("фиш")) return "phishing";
        if (n.contains("password") || n.contains("парол")) return "password";
        if (n.contains("email") || n.contains("почт")) return "email";
        if (n.contains("personal") || n.contains("152") || n.contains("персонал")) return "personal_data";
        if (n.contains("mobile") || n.contains("моб")) return "mobile";
        if (n.contains("incident") || n.contains("инцид")) return "incident";
        return n;
    }

    private String normalize(String value) {
        return value == null ? "" : value.trim().toLowerCase(Locale.ROOT);
    }

    private String joinList(List<String> values) {
        return values == null ? "" : values.stream()
                .filter(Objects::nonNull)
                .collect(Collectors.joining(" | "));
    }

    private String safe(String value) {
        return value == null ? "" : value;
    }
}
