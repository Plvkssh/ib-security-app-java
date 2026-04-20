package com.ibsecurity.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "quiz_results")
public class QuizResult {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private AppUser user;

    @Column(nullable = false)
    private int score;

    @Column(nullable = false)
    private int totalQuestions;

    @Column(length = 50)
    private String difficulty;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(
            name = "quiz_result_topics",
            joinColumns = @JoinColumn(name = "quiz_result_id")
    )
    @Column(name = "topic", nullable = false)
    private List<String> topics = new ArrayList<>();

    @Column(length = 50)
    private String level;

    @Column(length = 50)
    private String completedAt;

    @Column(nullable = false)
    private int phishingScore = 0;

    @Column(nullable = false)
    private int passwordPolicyScore = 0;

    @Column(nullable = false)
    private int emailSafetyScore = 0;

    @Column(nullable = false)
    private int personalDataScore = 0;

    @Column(nullable = false)
    private int mobileSecurityScore = 0;

    @Column(nullable = false)
    private int incidentResponseScore = 0;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    public QuizResult() {
    }

    @PrePersist
    public void prePersist() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (completedAt == null || completedAt.isBlank()) {
            completedAt = createdAt.toString();
        }
    }

    public double getPercent() {
        if (totalQuestions == 0) {
            return 0.0;
        }
        return (score * 100.0) / totalQuestions;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public AppUser getUser() {
        return user;
    }

    public void setUser(AppUser user) {
        this.user = user;
    }

    public int getScore() {
        return score;
    }

    public void setScore(int score) {
        this.score = score;
    }

    public int getTotalQuestions() {
        return totalQuestions;
    }

    public void setTotalQuestions(int totalQuestions) {
        this.totalQuestions = totalQuestions;
    }

    public String getDifficulty() {
        return difficulty;
    }

    public void setDifficulty(String difficulty) {
        this.difficulty = difficulty;
    }

    public List<String> getTopics() {
        return topics;
    }

    public void setTopics(List<String> topics) {
        this.topics = topics;
    }

    public String getLevel() {
        return level;
    }

    public void setLevel(String level) {
        this.level = level;
    }

    public String getCompletedAt() {
        return completedAt;
    }

    public void setCompletedAt(String completedAt) {
        this.completedAt = completedAt;
    }

    public int getPhishingScore() {
        return phishingScore;
    }

    public void setPhishingScore(int phishingScore) {
        this.phishingScore = phishingScore;
    }

    public int getPasswordPolicyScore() {
        return passwordPolicyScore;
    }

    public void setPasswordPolicyScore(int passwordPolicyScore) {
        this.passwordPolicyScore = passwordPolicyScore;
    }

    public int getEmailSafetyScore() {
        return emailSafetyScore;
    }

    public void setEmailSafetyScore(int emailSafetyScore) {
        this.emailSafetyScore = emailSafetyScore;
    }

    public int getPersonalDataScore() {
        return personalDataScore;
    }

    public void setPersonalDataScore(int personalDataScore) {
        this.personalDataScore = personalDataScore;
    }

    public int getMobileSecurityScore() {
        return mobileSecurityScore;
    }

    public void setMobileSecurityScore(int mobileSecurityScore) {
        this.mobileSecurityScore = mobileSecurityScore;
    }

    public int getIncidentResponseScore() {
        return incidentResponseScore;
    }

    public void setIncidentResponseScore(int incidentResponseScore) {
        this.incidentResponseScore = incidentResponseScore;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
