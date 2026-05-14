package com.ibsecurity.repository;

import com.ibsecurity.model.PhishingScenarioEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PhishingScenarioRepository extends JpaRepository<PhishingScenarioEntity, Long> {
    List<PhishingScenarioEntity> findByTypeIgnoreCaseAndDifficultyIgnoreCase(String type, String difficulty);
    List<PhishingScenarioEntity> findByDifficultyIgnoreCase(String difficulty);
    List<PhishingScenarioEntity> findByTypeIgnoreCaseAndDifficultyIgnoreCaseAndTriggerContainsIgnoreCase(String type, String difficulty, String trigger);
    List<PhishingScenarioEntity> findByDifficultyIgnoreCaseAndTriggerContainsIgnoreCase(String difficulty, String trigger);
}
