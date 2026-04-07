# ИБ-Ассистент — Security Awareness Platform

Платформа для тестирования осведомлённости сотрудников в области информационной безопасности и моделирования целевых фишинговых кампаний. Адаптирована под российское законодательство (152-ФЗ, КИИ, ФСТЭК).

## Возможности

* **Тесты на осведомлённость** — 157 вопросов по 6 темам, 3 уровня сложности
* **Фишинговые сценарии** — готовые примеры фишинговых атак с разбором
* **Обучающие материалы** — справочник по кибербезопасности
* **ИИ-функции (GigaChat)** — генерация вопросов, адаптивная обратная связь, ИИ-фишинг

## Технологический стек

* **Backend:** Java 21, Spring Boot 3.2.4, Maven
* **Frontend:** React 18, Vite, Tailwind CSS
* **ИИ:** GigaChat API (Сбер)

## Темы тестирования

|Тема|Вопросов|
|-|-|
|Фишинг и социальная инженерия|26|
|Парольная политика|26|
|Безопасная работа с email|26|
|Защита персональных данных (152-ФЗ)|26|
|Безопасность мобильных устройств|26|
|Реагирование на инциденты|27|
|**Итого**|**157**|

## Быстрый старт

### Требования

* Java 21 JDK (Adoptium Temurin)
* Apache Maven 3.9+
* Node.js 18+ (для пересборки фронтенда)

### Запуск (фронтенд уже собран)

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
|GET|/api/questions|Получить вопросы (параметры: difficulty, topics, count)|
|POST|/api/results|Сохранить результат теста|
|GET|/api/results|Получить все результаты|
|GET|/api/stats|Статистика тестирования|
|POST|/api/phishing/generate|Получить фишинговые сценарии из банка|
|POST|/api/ai/generate-questions|ИИ-генерация вопросов|
|POST|/api/ai/feedback|ИИ-анализ результатов|
|POST|/api/ai/phishing|ИИ-генерация фишинговых сценариев|
|POST|/api/settings/api-key|Установить API-ключ GigaChat|
|GET|/api/settings/api-key/status|Статус API-ключа|

## Структура проекта

```
ib-security-app-java/
├── src/main/java/com/ibsecurity/
│   ├── Application.java              # Точка входа Spring Boot
│   ├── WebConfig.java                # CORS конфигурация
│   ├── controller/
│   │   └── QuizController.java       # REST API контроллер
│   ├── service/
│   │   ├── QuizService.java          # Бизнес-логика тестов
│   │   └── GigaChatService.java      # Интеграция с GigaChat API
│   ├── model/
│   │   ├── Question.java             # Модель вопроса
│   │   ├── QuizResult.java           # Модель результата
│   │   └── PhishingScenario.java     # Модель фишингового сценария
│   └── data/
│       ├── QuestionBank.java         # Банк вопросов (157 шт.)
│       └── PhishingBank.java         # Банк фишинговых сценариев
├── src/main/resources/
│   ├── application.properties
│   └── static/                       # Собранный фронтенд
├── frontend/                         # Исходники React
│   ├── src/
│   │   ├── App.jsx
│   │   ├── lib/api.js
│   │   └── pages/
│   │       ├── HomePage.jsx
│   │       ├── QuizPage.jsx
│   │       ├── PhishingPage.jsx
│   │       ├── TrainingPage.jsx
│   │       └── SettingsPage.jsx
│   ├── package.json
│   └── vite.config.js
└── pom.xml
```

