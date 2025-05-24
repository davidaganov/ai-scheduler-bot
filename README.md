# Telegram Ассистент для управления задачами

Telegram-бот, который помогает управлять задачами. Бот пересылает сообщения от заказчика через OpenAI GPT-4, преобразует их в задачи и сохраняет в базе данных SQLite.

## Возможности

- ✅ Преобразование сообщений в задачи с помощью GPT-4
- ✅ Тегирование задач по проектам
- ✅ Управление статусами: `не начато`, `в работе`, `сделано`
- ✅ Фильтрация задач по статусу и проекту
- ✅ Удобный интерфейс с кнопками
- ✅ Локальное хранилище SQLite

## Технологии

- Node.js с TypeScript
- Telegraf.js для работы с Telegram Bot API
- OpenAI GPT-4 Turbo для анализа сообщений
- SQLite (better-sqlite3) для хранения данных

## Установка и запуск

1. Клонировать репозиторий:

```
git clone https://github.com/yourusername/ai-scheduler-bot.git
cd ai-scheduler-bot
```

2. Установить зависимости:

```
npm install
```

3. Создать файл `.env` в корне проекта со следующими переменными:

```
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
OPENAI_API_KEY=your_openai_api_key
```

4. Запустить бота в режиме разработки:

```
npm run dev
```

Или собрать и запустить:

```
npm run build
npm start
```

## Команды бота

- `/start` - Начать работу с ботом
- `/list` - Показать список задач
- `/projects` - Управление проектами
- `/help` - Получить справку по боту

## Структура проекта

```
src/
  ├── database/            # База данных и запросы
  │   ├── databaseService.ts  # Базовый класс с инициализацией
  │   ├── taskQueries.ts      # Запросы для задач
  │   ├── projectQueries.ts   # Запросы для проектов
  │   └── index.ts            # Экспорты
  │
  ├── formatter/           # Форматирование данных
  │   ├── dateFormatters.ts   # Форматирование дат
  │   ├── statusFormatters.ts # Форматирование статусов
  │   ├── taskFormatters.ts   # Форматирование задач
  │   └── index.ts            # Экспорты
  │
  ├── handlers/            # Обработчики событий бота
  │   ├── callbacks/          # Обработчики callback-запросов
  │   ├── commands/           # Обработчики команд
  │   ├── messages/           # Обработчики сообщений
  │   └── index.ts            # Экспорты
  │
  ├── keyboard/            # Клавиатуры для интерфейса
  │   ├── taskKeyboards.ts    # Клавиатуры для задач
  │   ├── projectKeyboards.ts # Клавиатуры для проектов
  │   ├── commonKeyboards.ts  # Общие клавиатуры
  │   ├── screenState.ts      # Функция getKeyboardByScreenState
  │   └── index.ts            # Экспорты
  │
  ├── openai/              # Интеграция с OpenAI
  │   ├── openaiService.ts    # Базовый класс
  │   ├── fallbackAnalysis.ts # Резервный анализ
  │   ├── taskExtractor.ts    # Извлечение задач
  │   └── index.ts            # Экспорты
  │
  ├── session/             # Управление сессиями
  │   ├── eventEmitter.ts     # Механизм событий
  │   ├── tasksBatchManager.ts # Управление пакетами задач
  │   ├── stateManager.ts     # Управление состоянием
  │   ├── sessionService.ts   # Основной сервис
  │   └── index.ts            # Экспорты
  │
  ├── types/               # TypeScript типы
  │   └── enums/              # Перечисления
  │
  ├── utils/               # Вспомогательные функции
  │
  └── index.ts             # Точка входа

db/                      # База данных SQLite
```
