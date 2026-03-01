# Secure XMPP Messenger

Защищённый веб-мессенджер с end-to-end шифрованием (E2EE) на базе XMPP протокола и OMEMO криптографии.

## Содержание

- [О проекте](#о-проекте)
- [Возможности](#возможности)
- [Архитектура](#архитектура)
- [Технологический стек](#технологический-стек)
- [Требования](#требования)
- [Установка](#установка)
- [Конфигурация](#конфигурация)
- [Использование](#использование)
- [Безопасность](#безопасность)
- [Устранение неполадок](#устранение-неполадок)
- [Развитие проекта](#развитие-проекта)
- [Лицензия](#лицензия)

## О проекте

Это полнофункциональная реализация защищённого мессенджера, где сервер **не может прочитать** содержимое переписки благодаря шифрованию OMEMO (Double Ratchet алгоритм). Проект разработан с образовательной целью для понимания принципов безопасной коммуникации и может быть развёрнут на собственном сервере.

### Ключевые особенности

- **End-to-End шифрование**: Сообщения шифруются на устройстве отправителя и расшифровываются только на устройстве получателя
- **Perfect Forward Secrecy**: Компрометация долгосрочных ключей не раскрывает прошлые сообщения
- **Полный контроль**: Все компоненты опенсорсные и разворачиваются на собственной инфраструктуре
- **Веб-интерфейс**: Доступ через браузер без установки дополнительного ПО
- **Совместимость**: Поддержка стандартных XMPP-клиентов (Gajim, Conversations, Siskin IM)

## Возможности

### MVP (Minimum Viable Product)

- Регистрация и аутентификация пользователей
- Список контактов (ростер) с индикаторами онлайн/офлайн
- Обмен текстовыми сообщениями в реальном времени
- Офлайн-доставка сообщений
- OMEMO E2EE шифрование по умолчанию
- Визуальная индикация защищённых чатов
- История сообщений (MAM)
- Статусы печати

### Запланированные функции

- Групповые чаты с OMEMO
- Отправка файлов с шифрованием
- Верификация отпечатков ключей
- Мультиустройственная синхронизация
- Мосты к другим платформам (Signal, Telegram)

## Архитектура

```
┌─────────────────────────────────────────┐
│         Браузер (Client)                │
│  ┌───────────────────────────────────┐  │
│  │  Converse.js                      │  │
│  │  + libsignal-protocol.js          │  │
│  │  (OMEMO шифрование)               │  │
│  └───────────────────────────────────┘  │
└──────────────┬──────────────────────────┘
               │ WSS (WebSocket Secure)
               ↓
┌─────────────────────────────────────────┐
│         VPS Server (Ubuntu)             │
│  ┌───────────────────────────────────┐  │
│  │  Nginx (Reverse Proxy)            │  │
│  │  - SSL termination                │  │
│  │  - Static files serving           │  │
│  │  - WebSocket proxying             │  │
│  └───────────────┬───────────────────┘  │
│                  ↓                       │
│  ┌───────────────────────────────────┐  │
│  │  Prosody (XMPP Server)            │  │
│  │  - User authentication            │  │
│  │  - Message routing                │  │
│  │  - PubSub (key distribution)      │  │
│  └───────────────┬───────────────────┘  │
│                  ↓                       │
│  ┌───────────────────────────────────┐  │
│  │  PostgreSQL (Database)            │  │
│  │  - User accounts                  │  │
│  │  - Rosters                        │  │
│  │  - Encrypted message queue        │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

### Компоненты

| Компонент | Роль | Что видит |
|-----------|------|-----------|
| **Converse.js** | Веб-клиент XMPP | Plaintext сообщения |
| **libsignal-protocol.js** | Криптография OMEMO | Приватные ключи, plaintext |
| **Nginx** | Реверс-прокси | Зашифрованный WebSocket-трафик |
| **Prosody** | XMPP-сервер | Зашифрованные blob'ы, метаданные |
| **PostgreSQL** | Хранилище данных | Зашифрованные сообщения, хеши паролей |
| **IndexedDB** | Браузерное хранилище | Приватные ключи OMEMO |

## Технологический стек

### Backend

- **Prosody** 0.12+ - XMPP сервер
- **PostgreSQL** 14+ - База данных
- **Nginx** 1.18+ - Веб-сервер и реверс-прокси
- **Ubuntu** 22.04/24.04 LTS - Операционная система

### Frontend

- **Converse.js** 12.0+ - XMPP веб-клиент
- **libsignal-protocol.js** - Библиотека криптографии Signal Protocol

### Криптография

- **OMEMO** (XEP-0384) - End-to-end шифрование
- **TLS 1.2/1.3** - Транспортное шифрование
- **AES-256** - Симметричное шифрование сообщений
- **Double Ratchet** - Алгоритм генерации ключей

## Требования

### Инфраструктура

- VPS с публичным IP-адресом
- Минимум 1 GB RAM, 1 vCPU, 20 GB SSD
- Домен с настроенными DNS-записями (A, SRV)

### Программное обеспечение



## Установка

### Быстрый старт

```bash
# 1. Клонировать репозиторий
git clone https://github.com/yourusername/secure-xmpp-messenger.git
cd secure-xmpp-messenger

# 2. Запустить скрипт автоматической установки
sudo ./scripts/init-letsencrypt.sh

# 3. Установить и настроить компоненты
sudo ./scripts/install.sh

# 4. Создать первого пользователя
sudo prosodyctl adduser alice@chat.example.com
```

### Пошаговая установка



Основные этапы:

1. **Подготовка**: Подготовка VPS, покупка домена, настройка DNS
2. **Базовая инфраструктура**: Установка Nginx, PostgreSQL, SSL-сертификаты
3. **XMPP-сервер**: Установка и настройка Prosody
4. **Веб-клиент**: Интеграция Converse.js
5. **Тестирование**: Проверка E2EE, офлайн-доставки
6. **Production**: Закрытие регистрации, файрволл, бэкапы

## Конфигурация

### Prosody

Основной конфигурационный файл: `/etc/prosody/prosody.cfg.lua`

Критические параметры для работы OMEMO:

```lua
consider_websocket_secure = true
consider_bosh_secure = true

modules_enabled = {
    "websocket",
    "bosh",
    "pubsub",
    "pep",
    -- другие модули
}
```

### Nginx

Конфигурация для WebSocket: `/etc/nginx/sites-available/xmpp`

Ключевые заголовки для проксирования WebSocket:

```nginx
proxy_http_version 1.1;
proxy_set_header Upgrade $http_upgrade;
proxy_set_header Connection $connection_upgrade;
```

### Converse.js

Параметры в `/var/www/xmpp/index.html`:

```javascript
converse.initialize({
    websocket_url: 'wss://chat.example.com/xmpp-websocket',
    omemo_default: true,
    authentication: 'login',
    // другие параметры
});
```

## Использование

### Регистрация пользователя

**Через веб-интерфейс** (только для MVP):

1. Открыть `https://chat.example.com`
2. Нажать "Register"
3. Заполнить форму регистрации

**Через командную строку** (production):

```bash
sudo prosodyctl adduser username@chat.example.com
```

### Добавление контакта

1. В веб-интерфейсе нажать "Add contact"
2. Ввести JID контакта (например, `bob@chat.example.com`)
3. Отправить запрос на добавление
4. Дождаться подтверждения от контакта

### Проверка работы E2EE

Индикатор шифрования (замочек) должен отображаться в окне чата. В консоли браузера (F12) проверить логи:

```
OMEMO devicelist published
OMEMO bundle published
```

### Управление пользователями

```bash
# Создать пользователя
sudo prosodyctl adduser username@domain

# Изменить пароль
sudo prosodyctl passwd username@domain

# Удалить пользователя
sudo prosodyctl deluser username@domain

# Список пользователей
sudo prosodyctl list users domain
```

## Безопасность

### Реализованные меры

- HTTPS/WSS для всех соединений (TLS 1.2+)
- Приватные ключи хранятся только в браузере (IndexedDB)
- Хеширование паролей bcrypt на сервере
- Ограничение rate limits против флуда
- Минимальное логирование для защиты приватности

### Конфигурация для production

```lua
-- В prosody.cfg.lua
allow_registration = false
archive_expires_after = "1week"

limits = {
    c2s = {
        rate = "10kb/s";
        burst = "2s";
    };
}
```

### Файрволл

```bash
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP (для Let's Encrypt)
sudo ufw allow 443/tcp  # HTTPS
sudo ufw allow 5222/tcp # XMPP C2S
sudo ufw enable
```

### Бэкапы

Скрипт резервного копирования: `scripts/backup-xmpp.sh`

```bash
# Запустить бэкап вручную
./scripts/backup-xmpp.sh

# Настроить автоматический бэкап (ежедневно в 3:00)
crontab -e
0 3 * * * /home/xmppuser/backup-xmpp.sh
```

## Устранение неполадок

### WebSocket не подключается

**Симптомы**: `WebSocket connection failed` в консоли браузера

**Решения**:

```bash
# Проверить, что Prosody слушает порт 5280
sudo ss -tulpn | grep 5280

# Проверить логи
sudo journalctl -u prosody -f
sudo tail -f /var/log/nginx/xmpp-error.log

# Проверить параметры в prosody.cfg.lua
consider_websocket_secure = true
```

### OMEMO не активируется

**Симптомы**: Отсутствует замочек в интерфейсе

**Решения**:

- Убедиться, что `libsignal-protocol.js` загружен **перед** `converse.min.js`
- Проверить включение модулей `pubsub` и `pep` в Prosody
- Очистить IndexedDB в DevTools и перезайти

### Prosody не подключается к PostgreSQL

**Симптомы**: `Failed to initialize SQL driver` в логах

**Решения**:

```bash
# Установить драйвер
sudo apt install lua-dbi-postgresql

# Проверить доступ к БД
sudo -u postgres psql -d prosody -c "SELECT 1;"

# Перезапустить Prosody
sudo systemctl restart prosody
```

### Офлайн-сообщения не доставляются

**Решения**:

- Проверить включение модуля `mam` в `modules_enabled`
- Проверить параметр `archive_expires_after` (не слишком короткий)

## Развитие проекта


## Лицензия

Проект использует следующие компоненты с различными лицензиями:

- **Prosody**: MIT License
- **Converse.js**: Mozilla Public License 2.0
- **libsignal-protocol.js**: GPLv3

## Контакты
