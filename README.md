# ИБ-Ассистент — Security Awareness Platform

Платформа для тестирования осведомлённости сотрудников в области информационной безопасности и моделирования целевых фишинговых кампаний.  
**MVP магистерской работы.**

## Возможности

- **Тесты на осведомлённость** — 157 вопросов по 6 темам, 3 уровня сложности
- **Фишинговые сценарии** — готовые примеры фишинговых атак с разбором красных флагов
- **Обучающие материалы** — встроенный справочник по кибербезопасности
- **ИИ-функции (GigaChat)** — персонализированный анализ, генерация вопросов, создание учебных фишинговых сценариев
- **Регистрация / аутентификация** — Spring Security + сессии

## Технологический стек

- **Backend:** Java 21, Spring Boot 3.2.4, Spring Security, Spring Data JPA, Maven
- **Frontend:** React 18, Vite, Tailwind CSS
- **База данных:** PostgreSQL
- **ИИ:** GigaChat API (Сбер)

## Темы тестирования

| Тема | Вопросов |
|------|----------|
| Фишинг и социальная инженерия | 26 |
| Парольная политика | 26 |
| Безопасная работа с email | 26 |
| Защита персональных данных (152-ФЗ) | 26 |
| Безопасность мобильных устройств | 26 |
| Реагирование на инциденты | 27 |
| **Итого** | **157** |

## Быстрый старт (Windows)

### Требования

- **Java 21 JDK** (например, [Adoptium Temurin](https://adoptium.net/))
- **Apache Maven 3.9+**
- **PostgreSQL** (любая актуальная версия)
- **Node.js 18+** (только если нужно пересобрать фронтенд)

### 1. Настройка базы данных

1. Установи PostgreSQL и запомни пароль пользователя `postgres`.
2. Запусти `pgAdmin` или `psql` и создай базу:
   ```sql
   CREATE DATABASE ib_security;### Запуск (фронтенд уже собран)

```bash
cd ib-security-app-java
mvn package -DskipTests
java -jar target/ib-security-awareness-1.0.0.jar
```

Откройте http://localhost:5000

### Пересборка фронтенда (опционально)

```bash
cd frontend
npm install
npm run build
cd ..
mvn package -DskipTests
```

## Настройка GigaChat API

1. Зарегистрируйтесь на [developers.sber.ru](https://developers.sber.ru)
2. Создайте проект GigaChat API
3. Получите Authorization-ключ (Base64)
4. В приложении перейдите в Настройки → вставьте ключ

## API Endpoints

|Метод|Путь|Описание|
|-|-|-|
|POST|/api/auth/register|Регистрация|
|POST|/api/auth/login|Вход|
|GET|/api/auth/me|Текущий пользователь|
|POST|/api/auth/logout|Выход|
|GET|/api/questions|Получить вопросы|
|POST|/api/results|Сохранить результат теста|
|GET|/api/results|Получить результаты|
|GET|/api/stats|Статистика|
|POST|/api/phishing/generate|Фишинговые сценарии из банка|
|POST|/api/ai/feedback|ИИ-анализ результатов|
|POST|/api/ai/generate-questions/me|ИИ-генерация вопросов|
|GET|/api/ai/phishing/me|ИИ-фишинг сценарий|
|POST|/api/settings/api-key|Установить API-ключ GigaChat|
|GET|/api/settings/api-key/status|Статус API-ключа|

## Структура проекта

```
ib-security-app-java/
├── frontend/                  # Исходники React
│   ├── src/
│   │   ├── App.jsx
│   │   ├── lib/api.js
│   │   └── pages/
│   ├── package.json
│   └── vite.config.js
├── src/main/java/com/ibsecurity/
│   ├── Application.java
│   ├── WebConfig.java
│   ├── controller/
│   │   ├── AuthController.java
│   │   └── QuizController.java
│   ├── service/
│   │   ├── QuizService.java
│   │   ├── GigaChatService.java
│   │   ├── AiPersonalizationService.java
│   │   ├── PersonalRecommendationService.java
│   │   └── QuizSessionStore.java
│   ├── model/
│   │   ├── AppUser.java
│   │   ├── Question.java
│   │   ├── QuizResult.java
│   │   └── PhishingScenario.java
│   ├── dto/
│   │   ├── QuestionView.java
│   │   ├── QuizStartResponse.java
│   │   └── QuizSubmissionRequest.java
│   ├── data/
│   │   ├── QuestionBank.java
│   │   └── PhishingBank.java
│   ├── rag/
│   │   ├── KnowledgeChunk.java
│   │   ├── LocalKnowledgeBase.java
│   │   ├── RagQuery.java
│   │   └── RagRetrievalService.java
│   ├── repository/
│   │   ├── UserRepository.java
│   │   └── QuizResultRepository.java
│   └── security/
│       └── SecurityConfig.java
├── src/main/resources/
│   ├── application.properties
│   └── static/               # Собранный фронтенд
├── .gitignore
├── pom.xml
└── README.md
```

## Статус проекта
MVP (прототип) готов.
Проект запущен, база данных подключена, фронтенд работает. Основные функции (тестирование, фишинговые сценарии, обучение, аутентификация) реализованы.
