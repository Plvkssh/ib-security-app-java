package com.ibsecurity.repository;

import com.ibsecurity.model.QuestionEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface QuestionRepository extends JpaRepository<QuestionEntity, String> {
    List<QuestionEntity> findByDifficultyIgnoreCase(String difficulty);
    List<QuestionEntity> findByTopicIgnoreCase(String topic);
}
