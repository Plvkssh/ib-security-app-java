package com.ibsecurity.model;

import java.util.List;

public record Question(
    String id,
    String topic,
    String difficulty,
    String type,
    String question,
    List<String> options,
    int correctAnswer,
    String explanation,
    String regulation
) {}
