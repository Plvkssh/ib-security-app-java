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
        return new PhishingScenarioEntity(
                s.scenarioId(),
                s.type(),
                s.difficulty(),
                s.trigger(),
                s.sender(),
                s.subject(),
                s.body(),
                s.redFlags(),
                s.contextDetails(),
                s.correctActions(),
                s.wrongActions()
        );
    }
}
