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
- **Кэш сессий:** Redis
- **ИИ:** GigaChat API

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

## Безопасность

- Пароли пользователей хэшируются с помощью BCrypt.
- Пароль к БД вынесен в переменную окружения `DB_PASSWORD`.
- Используется стандартный HTTP-клиент с проверкой SSL-сертификатов (без отключения верификации).
- Сессии пользователей защищены (HttpOnly, SameSite=Lax).
- Ролевая модель: USER и ADMIN.

## Логирование

Ведётся лог действий пользователей (прохождение тестов) с помощью SLF4J.  

## Тестирование

В проекте реализованы модульные тесты для сервиса персонализации:
- `PersonalRecommendationServiceTest` проверяет расчёт уровня риска и подбор фишинговых кампаний.
- Для запуска тестов: `mvn test`

## Требования

- **Java 21 JDK** 
- **Apache Maven 3.9+**
- **PostgreSQL** 
- **Redis**
- **Node.js 18+** 

## Настройка GigaChat API

1. Зарегистрируйтесь на [developers.sber.ru](https://developers.sber.ru)
2. Создайте проект GigaChat API
3. Получите Authorization-ключ (Base64)
4. В приложении перейдите в Настройки → вставьте ключ

## API Endpoints

| Метод | Путь | Описание |
|-------|------|----------|
| POST | `/api/auth/register` | Регистрация |
| POST | `/api/auth/login` | Вход |
| GET | `/api/auth/me` | Текущий пользователь |
| POST | `/api/auth/logout` | Выход |
| GET | `/api/questions` | Получить вопросы |
| POST | `/api/results` | Сохранить результат теста |
| GET | `/api/results` | Получить результаты |
| GET | `/api/stats` | Статистика |
| POST | `/api/phishing/generate` | Фишинговые сценарии из банка |
| POST | `/api/ai/feedback` | ИИ-анализ результатов |
| POST | `/api/ai/generate-questions/me` | ИИ-генерация вопросов |
| GET | `/api/ai/phishing/me` | ИИ-фишинг сценарий |
| POST | `/api/settings/api-key` | Установить API-ключ GigaChat |
| GET | `/api/settings/api-key/status` | Статус API-ключа |
## Структура проекта

```
ib-security-app-java/
├── frontend/
│ ├── src/
│ │ ├── lib/
│ │ │ └── api.js
│ │ ├── pages/
│ │ │ ├── HomePage.jsx
│ │ │ ├── QuizPage.jsx
│ │ │ ├── PhishingPage.jsx
│ │ │ ├── TrainingPage.jsx
│ │ │ └── SettingsPage.jsx
│ │ ├── App.jsx
│ │ ├── main.jsx
│ │ └── index.css
│ ├── index.html
│ ├── package.json
│ ├── package-lock.json
│ ├── vite.config.js
│ ├── tailwind.config.js
│ └── postcss.config.js
├── src/
│ ├── main/
│ │ ├── java/com/ibsecurity/
│ │ │ ├── Application.java
│ │ │ ├── WebConfig.java
│ │ │ ├── config/
│ │ │ │ ├── DataInitializer.java
│ │ │ │ └── RedisConfig.java
│ │ │ ├── controller/
│ │ │ │ ├── AuthController.java
│ │ │ │ └── QuizController.java
│ │ │ ├── data/
│ │ │ │ ├── QuestionBank.java
│ │ │ │ └── PhishingBank.java
│ │ │ ├── dto/
│ │ │ │ ├── QuestionView.java
│ │ │ │ ├── QuizStartResponse.java
│ │ │ │ └── QuizSubmissionRequest.java
│ │ │ ├── model/
│ │ │ │ ├── AppUser.java
│ │ │ │ ├── Question.java
│ │ │ │ ├── QuestionEntity.java
│ │ │ │ ├── QuizResult.java
│ │ │ │ ├── PhishingScenario.java
│ │ │ │ └── PhishingScenarioEntity.java
│ │ │ ├── rag/
│ │ │ │ ├── KnowledgeChunk.java
│ │ │ │ ├── LocalKnowledgeBase.java
│ │ │ │ ├── RagQuery.java
│ │ │ │ └── RagRetrievalService.java
│ │ │ ├── repository/
│ │ │ │ ├── UserRepository.java
│ │ │ │ ├── QuizResultRepository.java
│ │ │ │ ├── QuestionRepository.java
│ │ │ │ └── PhishingScenarioRepository.java
│ │ │ ├── security/
│ │ │ │ └── SecurityConfig.java
│ │ │ └── service/
│ │ │ ├── QuizService.java
│ │ │ ├── GigaChatService.java
│ │ │ ├── AiPersonalizationService.java
│ │ │ ├── PersonalRecommendationService.java
│ │ │ └── QuizSessionStore.java
│ │ └── resources/
│ │ ├── application.properties
│ │ └── static/
│ └── test/
│ └── java/com/ibsecurity/service/
│ └── PersonalRecommendationServiceTest.java
├── .gitignore
├── pom.xml
└── README.md
```
## Статус проекта

MVP (прототип) готов.  
- Вопросы и сценарии хранятся в PostgreSQL.
- Реализовано логирование ключевых событий.
- Добавлены модульные тесты.
- Исправлены потенциальные уязвимости.
