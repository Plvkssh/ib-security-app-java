package com.ibsecurity.config;

import com.ibsecurity.data.PhishingBank;
import com.ibsecurity.data.QuestionBank;
import com.ibsecurity.model.PhishingScenario;
import com.ibsecurity.model.PhishingScenarioEntity;
import com.ibsecurity.model.QuestionEntity;
import com.ibsecurity.repository.PhishingScenarioRepository;
import com.ibsecurity.repository.QuestionRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class DataInitializer implements CommandLineRunner {

    private final PhishingScenarioRepository phishingRepo;
    private final QuestionRepository questionRepo;

    public DataInitializer(PhishingScenarioRepository phishingRepo,
                           QuestionRepository questionRepo) {
        this.phishingRepo = phishingRepo;
        this.questionRepo = questionRepo;
    }

    @Override
    public void run(String... args) {
        if (phishingRepo.count() == 0) {
            List<PhishingScenarioEntity> entities = PhishingBank.SCENARIOS.stream()
                    .map(this::toPhishingEntity)
                    .toList();
            phishingRepo.saveAll(entities);
            System.out.println(">>> Загружено фишинговых сценариев в БД: " + entities.size());
        }

        if (questionRepo.count() == 0) {
            List<QuestionEntity> questionEntities = QuestionBank.QUESTIONS.stream()
                    .map(q -> new QuestionEntity(
                            q.id(),
                            q.topic(),
                            q.difficulty(),
                            q.type(),
                            q.question(),
                            q.options(),
                            q.correctAnswer(),
                            q.explanation(),
                            q.regulation()
                    ))
                    .toList();
            questionRepo.saveAll(questionEntities);
            System.out.println(">>> Загружено вопросов в БД: " + questionEntities.size());
        }
    }

    private PhishingScenarioEntity toPhishingEntity(PhishingScenario s) {
        PhishingScenarioEntity e = new PhishingScenarioEntity();
        e.setScenarioId(s.scenarioId());
        e.setType(s.type());
        e.setDifficulty(s.difficulty());
        e.setTrigger(s.trigger());
        e.setSender(s.sender());
        e.setSubject(s.subject());
        e.setBody(s.body());
        e.setRedFlags(s.redFlags());
        e.setContextDetails(s.contextDetails());
        e.setCorrectActions(s.correctActions());
        e.setWrongActions(s.wrongActions());
        return e;
    }
}
