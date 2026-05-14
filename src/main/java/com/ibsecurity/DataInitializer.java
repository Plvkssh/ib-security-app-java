package com.ibsecurity.config;

import com.ibsecurity.data.PhishingBank;
import com.ibsecurity.model.PhishingScenario;
import com.ibsecurity.model.PhishingScenarioEntity;
import com.ibsecurity.repository.PhishingScenarioRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class DataInitializer implements CommandLineRunner {

    private final PhishingScenarioRepository phishingRepo;

    public DataInitializer(PhishingScenarioRepository phishingRepo) {
        this.phishingRepo = phishingRepo;
    }

    @Override
    public void run(String... args) {
        if (phishingRepo.count() > 0) {
            return;
        }

        List<PhishingScenarioEntity> entities = PhishingBank.SCENARIOS.stream()
                .map(this::toEntity)
                .toList();

        phishingRepo.saveAll(entities);
        System.out.println(">>> Перенесено сценариев в БД: " + entities.size());
    }

   private PhishingScenarioEntity toEntity(PhishingScenario s) {
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
}
