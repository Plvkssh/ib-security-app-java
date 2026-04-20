package com.ibsecurity.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;

@Entity
@Table(name = "app_users")
public class AppUser {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 100)
    private String username;

    @Column(nullable = false, unique = true, length = 150)
    private String email;

    @JsonIgnore
    @Column(nullable = false, length = 255)
    private String passwordHash;

    @Column(nullable = false, length = 150)
    private String fullName;

    @Column(nullable = false, length = 150)
    private String position;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private JobClass jobClass = JobClass.GENERAL;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private UserRole role = UserRole.USER;

    public AppUser() {
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPasswordHash() {
        return passwordHash;
    }

    public void setPasswordHash(String passwordHash) {
        this.passwordHash = passwordHash;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getPosition() {
        return position;
    }

    public void setPosition(String position) {
        this.position = position;
    }

    public JobClass getJobClass() {
        return jobClass;
    }

    public void setJobClass(JobClass jobClass) {
        this.jobClass = jobClass;
    }

    public UserRole getRole() {
        return role;
    }

    public void setRole(UserRole role) {
        this.role = role;
    }

    public enum UserRole {
        USER,
        ADMIN
    }

    public enum JobClass {
        HR,
        FINANCE,
        IT,
        MANAGEMENT,
        GENERAL;

        public static JobClass fromPosition(String position) {
            if (position == null || position.isBlank()) {
                return GENERAL;
            }

            String p = position.toLowerCase();

            if (p.contains("hr") || p.contains("кадр") || p.contains("персонал")) {
                return HR;
            }

            if (p.contains("бух") || p.contains("фин") || p.contains("эконом")) {
                return FINANCE;
            }

            if (p.contains("it") || p.contains("разработ") || p.contains("сисадм")
                    || p.contains("devops") || p.contains("администратор")) {
                return IT;
            }

            if (p.contains("директор") || p.contains("руковод") || p.contains("manager")
                    || p.contains("менеджер")) {
                return MANAGEMENT;
            }

            return GENERAL;
        }
    }
}
