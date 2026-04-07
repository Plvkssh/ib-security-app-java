package com.ibsecurity.model;

import java.util.List;

public record PhishingScenario(
    String id,
    String type,
    String difficulty,
    String trigger,
    String from,
    String subject,
    String body,
    List<String> redFlags,
    List<String> hiddenFlags,
    List<String> correctActions,
    List<String> dangerousActions
) {}
