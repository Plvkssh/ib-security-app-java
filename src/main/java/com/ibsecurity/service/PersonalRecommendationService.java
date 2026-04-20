package com.ibsecurity.service;

import com.ibsecurity.model.AppUser;
import com.ibsecurity.model.QuizResult;
import com.ibsecurity.repository.QuizResultRepository;
import com.ibsecurity.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class PersonalRecommendationService {

    private final UserRepository userRepository;
    private final QuizResultRepository quizResultRepository;

    public PersonalRecommendationService(UserRepository userRepository,
                                         QuizResultRepository quizResultRepository) {
        this.userRepository = userRepository;
        this.quizResultRepository = quizResultRepository;
    }

    public Map<String, Object> buildForUser(String username) {
        AppUser user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Пользователь не найден"));

        QuizResult latestResult = quizResultRepository.findTopByUser_IdOrderByCreatedAtDesc(user.getId())
                .orElseThrow(() -> new RuntimeException("У пользователя пока нет результатов тестирования"));

        List<String> weakTopics = detectWeakTopics(latestResult);
        String phishingCampaign = choosePhishingCampaign(user, weakTopics);
        List<String> literature = chooseLiterature(weakTopics, user.getJobClass().name());
        List<String> recommendedTests = chooseRecommendedTests(user, weakTopics);
        String riskLevel = calculateRiskLevel(latestResult, weakTopics);

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("username", user.getUsername());
        response.put("fullName", user.getFullName());
        response.put("position", user.getPosition());
        response.put("jobClass", user.getJobClass().name());
        response.put("lastScorePercent", Math.round(latestResult.getPercent()));
        response.put("riskLevel", riskLevel);
        response.put("weakTopics", weakTopics);
        response.put("recommendedPhishingCampaign", phishingCampaign);
        response.put("recommendedLiterature", literature);
        response.put("recommendedTests", recommendedTests);

        return response;
    }

    private List<String> detectWeakTopics(QuizResult result) {
        List<String> weakTopics = new ArrayList<>();

        if (result.getPhishingScore() < 70) {
            weakTopics.add("Фишинг и социальная инженерия");
        }
        if (result.getPasswordPolicyScore() < 70) {
            weakTopics.add("Парольная политика");
        }
        if (result.getEmailSafetyScore() < 70) {
            weakTopics.add("Безопасная работа с email");
        }
        if (result.getPersonalDataScore() < 70) {
            weakTopics.add("Защита персональных данных");
        }
        if (result.getMobileSecurityScore() < 70) {
            weakTopics.add("Безопасность мобильных устройств");
        }
        if (result.getIncidentResponseScore() < 70) {
            weakTopics.add("Реагирование на инциденты");
        }

        if (weakTopics.isEmpty()) {
            weakTopics.add("Повторное контрольное тестирование");
        }

        return weakTopics;
    }

    private String choosePhishingCampaign(AppUser user, List<String> weakTopics) {
        String mainWeakTopic = weakTopics.get(0);

        return switch (user.getJobClass()) {
            case HR -> "Сценарий для HR: письмо с резюме кандидата, архивом документов или ссылкой на портфолио. Акцент на теме: " + mainWeakTopic;
            case FINANCE -> "Сценарий для финансового отдела: срочный счёт, изменение банковских реквизитов, акт сверки. Акцент на теме: " + mainWeakTopic;
            case IT -> "Сценарий для IT-специалиста: уведомление о доступе, сбросе пароля, VPN или тикете Service Desk. Акцент на теме: " + mainWeakTopic;
            case MANAGEMENT -> "Сценарий для руководителя: письмо от контрагента, срочное согласование договора или финансового документа. Акцент на теме: " + mainWeakTopic;
            case GENERAL -> "Базовый сценарий: уведомление от корпоративной почты, доставки или внутреннего портала. Акцент на теме: " + mainWeakTopic;
        };
    }

    private List<String> chooseLiterature(List<String> weakTopics, String jobClass) {
        List<String> literature = new ArrayList<>();

        for (String topic : weakTopics) {
            switch (topic) {
                case "Фишинг и социальная инженерия" ->
                        literature.add("Памятка по фишингу: проверка домена отправителя, ссылок, вложений и признаков срочности.");
                case "Парольная политика" ->
                        literature.add("Материал по парольной политике: уникальные пароли, менеджеры паролей, MFA и запрет повторного использования.");
                case "Безопасная работа с email" ->
                        literature.add("Памятка по безопасной работе с email: проверка адреса отправителя, вложений и подтверждение запросов по второму каналу.");
                case "Защита персональных данных" ->
                        literature.add("Материал по защите персональных данных: что относится к ПДн, как их передавать и как минимизировать риск утечки.");
                case "Безопасность мобильных устройств" ->
                        literature.add("Памятка по мобильной безопасности: блокировка экрана, обновления ОС, запрет непроверенных приложений.");
                case "Реагирование на инциденты" ->
                        literature.add("Материал по реагированию на инциденты: кому сообщать, как фиксировать событие и почему нельзя удалять следы атаки.");
                default ->
                        literature.add("Общий материал по кибергигиене и повторному прохождению контрольного теста.");
            }
        }

        if ("HR".equals(jobClass)) {
            literature.add("Дополнительно для HR: безопасная обработка резюме, анкет и персональных данных кандидатов.");
        } else if ("FINANCE".equals(jobClass)) {
            literature.add("Дополнительно для финансового отдела: признаки мошенничества в счетах, актах и реквизитах.");
        } else if ("MANAGEMENT".equals(jobClass)) {
            literature.add("Дополнительно для руководителей: атаки через срочность, авторитет и поддельные письма от партнёров.");
        }

        return literature;
    }

    private List<String> chooseRecommendedTests(AppUser user, List<String> weakTopics) {
        List<String> tests = new ArrayList<>();

        switch (user.getJobClass()) {
            case HR -> {
                tests.add("Тест по персональным данным и 152-ФЗ");
                tests.add("Тест по фишингу в кадровом документообороте");
            }
            case FINANCE -> {
                tests.add("Тест по фишингу в финансовых процессах");
                tests.add("Тест по безопасной работе с email и вложениями");
            }
            case IT -> {
                tests.add("Тест по парольной политике и управлению доступом");
                tests.add("Тест по реагированию на инциденты");
            }
            case MANAGEMENT -> {
                tests.add("Тест по целевому фишингу для руководителей");
                tests.add("Тест по корпоративной переписке и инцидентам");
            }
            case GENERAL -> {
                tests.add("Базовый тест по фишингу");
                tests.add("Базовый тест по email-безопасности");
            }
        }

        if (weakTopics.contains("Фишинг и социальная инженерия")) {
            tests.add("Повторный адаптивный тест по фишингу");
        }
        if (weakTopics.contains("Защита персональных данных")) {
            tests.add("Повторный тест по защите персональных данных");
        }

        return tests;
    }

    private String calculateRiskLevel(QuizResult result, List<String> weakTopics) {
        double percent = result.getPercent();

        if (percent < 50 || weakTopics.size() >= 4) {
            return "Высокий";
        }
        if (percent < 75 || weakTopics.size() >= 2) {
            return "Средний";
        }
        return "Низкий";
    }
}
