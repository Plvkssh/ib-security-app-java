package com.ibsecurity.model;

import java.util.List;

public record PhishingScenario(
        String scenarioId,
        String type,
        String difficulty,
        String trigger,
        String sender,
        String subject,
        String body,
        List<String> redFlags,
        List<String> contextDetails,
        List<String> correctActions,
        List<String> wrongActions
) {}
