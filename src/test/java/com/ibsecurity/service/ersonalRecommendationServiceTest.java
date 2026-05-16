package com.ibsecurity.service;

import com.ibsecurity.model.AppUser;
import com.ibsecurity.model.QuizResult;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
class PersonalRecommendationServiceTest {

    @Autowired
    private PersonalRecommendationService service;

    @Test
    void testRiskLevelHigh() {
        QuizResult result = new QuizResult();
        result.setScore(40);
        result.setTotalQuestions(100);
        List<String> weakTopics = List.of("Тема1", "Тема2", "Тема3", "Тема4");
        String level = service.calculateRiskLevel(result, weakTopics);
        assertThat(level).isEqualTo("Высокий");
    }

    @Test
    void testRiskLevelMedium() {
        QuizResult result = new QuizResult();
        result.setScore(70);
        result.setTotalQuestions(100);
        List<String> weakTopics = List.of("Тема1", "Тема2");
        String level = service.calculateRiskLevel(result, weakTopics);
        assertThat(level).isEqualTo("Средний");
    }

    @Test
    void testPhishingCampaignForHR() {
        AppUser user = new AppUser();
        user.setJobClass(AppUser.JobClass.HR);
        String campaign = service.choosePhishingCampaign(user, List.of("Фишинг"));
        assertThat(campaign).contains("HR");
    }
}
