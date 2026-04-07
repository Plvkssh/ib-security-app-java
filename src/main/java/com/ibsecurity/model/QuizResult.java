package com.ibsecurity.model;

import java.util.List;

public class QuizResult {
    private String id;
    private int score;
    private int totalQuestions;
    private String difficulty;
    private List<String> topics;
    private String level;
    private String completedAt;

    public QuizResult() {}

    public QuizResult(String id, int score, int totalQuestions, String difficulty,
                      List<String> topics, String level, String completedAt) {
        this.id = id;
        this.score = score;
        this.totalQuestions = totalQuestions;
        this.difficulty = difficulty;
        this.topics = topics;
        this.level = level;
        this.completedAt = completedAt;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public int getScore() { return score; }
    public void setScore(int score) { this.score = score; }
    public int getTotalQuestions() { return totalQuestions; }
    public void setTotalQuestions(int totalQuestions) { this.totalQuestions = totalQuestions; }
    public String getDifficulty() { return difficulty; }
    public void setDifficulty(String difficulty) { this.difficulty = difficulty; }
    public List<String> getTopics() { return topics; }
    public void setTopics(List<String> topics) { this.topics = topics; }
    public String getLevel() { return level; }
    public void setLevel(String level) { this.level = level; }
    public String getCompletedAt() { return completedAt; }
    public void setCompletedAt(String completedAt) { this.completedAt = completedAt; }
}
