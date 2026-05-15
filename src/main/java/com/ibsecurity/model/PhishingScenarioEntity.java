package com.ibsecurity.model;

import jakarta.persistence.*;
import java.util.List;

@Entity
@Table(name = "phishing_scenarios")
public class PhishingScenarioEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;  
    private String scenarioId;   
    private String type;        
    private String difficulty;   
    private String trigger;     
    private String sender;       
    private String subject;      
    @Column(length = 2000)
    private String body;         
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "phishing_red_flags", joinColumns = @JoinColumn(name = "scenario_id"))
    @Column(name = "flag")
    private List<String> redFlags;     
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "phishing_context", joinColumns = @JoinColumn(name = "scenario_id"))
    @Column(name = "detail")
    private List<String> contextDetails;
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "phishing_correct_actions", joinColumns = @JoinColumn(name = "scenario_id"))
    @Column(name = "action")
    private List<String> correctActions;   
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "phishing_wrong_actions", joinColumns = @JoinColumn(name = "scenario_id"))
    @Column(name = "action")
    private List<String> wrongActions;    
    
    public PhishingScenarioEntity() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getScenarioId() { return scenarioId; }
    public void setScenarioId(String scenarioId) { this.scenarioId = scenarioId; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getDifficulty() { return difficulty; }
    public void setDifficulty(String difficulty) { this.difficulty = difficulty; }

    public String getTrigger() { return trigger; }
    public void setTrigger(String trigger) { this.trigger = trigger; }

    public String getSender() { return sender; }
    public void setSender(String sender) { this.sender = sender; }

    public String getSubject() { return subject; }
    public void setSubject(String subject) { this.subject = subject; }

    public String getBody() { return body; }
    public void setBody(String body) { this.body = body; }

    public List<String> getRedFlags() { return redFlags; }
    public void setRedFlags(List<String> redFlags) { this.redFlags = redFlags; }

    public List<String> getContextDetails() { return contextDetails; }
    public void setContextDetails(List<String> contextDetails) { this.contextDetails = contextDetails; }

    public List<String> getCorrectActions() { return correctActions; }
    public void setCorrectActions(List<String> correctActions) { this.correctActions = correctActions; }

    public List<String> getWrongActions() { return wrongActions; }
    public void setWrongActions(List<String> wrongActions) { this.wrongActions = wrongActions; }
}
