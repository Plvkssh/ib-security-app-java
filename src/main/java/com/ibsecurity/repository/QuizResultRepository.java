package com.ibsecurity.repository;

import com.ibsecurity.model.QuizResult;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface QuizResultRepository extends JpaRepository<QuizResult, Long> {

    List<QuizResult> findByUser_IdOrderByCreatedAtDesc(Long userId);

    Optional<QuizResult> findTopByUser_IdOrderByCreatedAtDesc(Long userId);
}
