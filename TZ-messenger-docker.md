# Техническое задание: Веб-мессенджер с E2EE на базе XMPP

**Версия:** 3.0  
**Дата:** 28 февраля 2026  
**Статус:** Утверждено  
**Тип развертывания:** Docker Compose

---

## 1. Общие сведения

### 1.1 Цель проекта
Разработка защищённого веб-мессенджера с end-to-end шифрованием (OMEMO) для обмена текстовыми сообщениями между пользователями через браузер.

### 1.2 Основные требования
- Сквозное шифрование сообщений (сервер не имеет доступ к plaintext)
- Веб-интерфейс без установки дополнительного ПО
- Контейнеризация всех компонентов (Docker)
- Воспроизводимое развертывание через Infrastructure as Code

### 1.3 Ожидаемый результат
- HTTPS-сайт с интерфейсом мессенджера
- Система аутентификации пользователей (JID)
- Функциональность 1-на-1 чатов с E2EE
- Хранение офлайн-сообщений
- Архив истории сообщений (зашифрованный)

---

## 2. Архитектура системы

### 2.1 Технологический стек

| Компонент | Технология | Версия |
|-----------|------------|--------|
| Контейнеризация | Docker Compose | 3.8+ |
| Веб-сервер / Reverse Proxy | Nginx | alpine |
| XMPP-сервер | Prosody | 0.12+ |
| SSL-сертификаты | Let's Encrypt + Certbot | latest |
| База данных | PostgreSQL | 15-alpine |
| Веб-клиент | Converse.js | 11.0.0+ |
| Криптография | libsignal-protocol.js | latest |
| Протокол E2EE | OMEMO (XEP-0384) | - |

### 2.2 Схема взаимодействия

```
┌──────────────────────────────────────────────────────────┐
│  Browser (Converse.js + libsignal)                       │
│  ↕ WSS (WebSocket Secure)                                │
└──────────────────────────────────────────────────────────┘
                        ↓
┌──────────────────────────────────────────────────────────┐
│  Docker Host                                             │
│  ┌────────────────────────────────────────────────────┐ │
│  │  nginx (proxy, SSL termination)                    │ │
│  │  ↓                                                  │ │
│  │  prosody (XMPP routing, PubSub)                    │ │
│  │  ↓                                                  │ │
│  │  postgres (аккаунты, ростер, офлайн-очередь)      │ │
│  └────────────────────────────────────────────────────┘ │
│  Volumes: certs, prosody-data, postgres-data, www       │
└──────────────────────────────────────────────────────────┘
```

### 2.3 Контейнеры и их функции

#### nginx
- **Назначение:** Reverse proxy, раздача статики, SSL termination
- **Образ:** `nginx:alpine`
- **Порты:** 80, 443
- **Volumes:** `/etc/nginx/conf.d`, `/var/www/html`, `/etc/letsencrypt`

#### prosody
- **Назначение:** XMPP-сервер, маршрутизация сообщений, PubSub для OMEMO-ключей
- **Образ:** `prosody/prosody:latest`
- **Порты:** 5222 (C2S), 5269 (S2S), 5280 (HTTP/WebSocket - internal)
- **Volumes:** `/etc/prosody`, `/var/lib/prosody`, `/etc/letsencrypt`

#### postgres
- **Назначение:** Хранение аккаунтов, ростеров, офлайн-сообщений, MAM-архива
- **Образ:** `postgres:15-alpine`
- **Порты:** 5432 (internal only)
- **Volumes:** `/var/lib/postgresql/data`

#### certbot
- **Назначение:** Получение и обновление SSL-сертификатов Let's Encrypt
- **Образ:** `certbot/certbot`
- **Volumes:** `/etc/letsencrypt`, `/var/www/certbot`

---

## 3. Функциональные требования

### 3.1 MVP (Минимально жизнеспособный продукт)

#### Аутентификация
- Регистрация через CLI (`prosodyctl adduser`)
- Вход по JID/паролю (SASL PLAIN over TLS)
- Выход с завершением сессии

#### Контакты
- Добавление контакта по JID
- Отображение ростера с presence-статусами
- Удаление контакта

#### Обмен сообщениями
- Отправка/получение текстовых сообщений в реальном времени
- Офлайн-доставка сообщений
- Индикатор "печатает..." (XEP-0085)

#### E2EE
- Автогенерация OMEMO-ключей при первом входе
- Публикация публичных ключей через PubSub (XEP-0060, XEP-0163)
- Автоматическая установка сессии шифрования
- Визуальная индикация (иконка замочка)

#### История
- MAM (Message Archive Management, XEP-0313)
- Хранение зашифрованных сообщений на сервере
- Срок хранения: 7 дней (конфигурируемо)

### 3.2 Исключено из MVP

- Подтверждение отпечатков ключей (fingerprint verification)
- Групповые чаты (MUC)
- Отправка файлов
- Мультиустройство с синхронизацией ключей
- Федерация с другими XMPP-серверами

---

## 4. Нефункциональные требования

### 4.1 Безопасность

| Требование | Реализация |
|------------|------------|
| Шифрование транспорта | TLS 1.2+ (HTTPS, WSS) |
| Шифрование сообщений | OMEMO (Signal Protocol / Double Ratchet) |
| Хранение паролей | bcrypt (Prosody default) |
| Приватные ключи | Только в браузере (IndexedDB), не покидают клиент |
| Логирование | Минимальное (warn/error), без plaintext сообщений |
| Сертификаты | Let's Encrypt, автообновление каждые 90 дней |

### 4.2 Производительность

- **Одновременные пользователи (MVP):** до 50
- **Задержка доставки:** <500ms (локальная сеть), <2s (WAN)
- **RAM на контейнер:**
  - nginx: ~10 MB
  - prosody: ~50-80 MB
  - postgres: ~30-50 MB
- **CPU:** 1 vCPU достаточно для MVP

### 4.3 Доступность

- **Uptime MVP:** 95%+
- **Restart policy:** `unless-stopped` для всех контейнеров
- **Health checks:** Для prosody и postgres

### 4.4 Совместимость

**Браузеры (клиент):**
- Chrome/Chromium 90+
- Firefox 88+
- Safari 14+
- Edge 90+

**XMPP-клиенты (тестирование):**
- Gajim (Linux/Windows)
- Conversations (Android)
- Siskin IM (iOS)

---

## 5. Структура проекта

```
xmpp-messenger/
├── docker-compose.yml
├── .env.example
├── .gitignore
├── README.md
├── nginx/
│   ├── Dockerfile
│   └── conf.d/
│       └── default.conf
├── prosody/
│   ├── prosody.cfg.lua
│   └── modules/          # custom modules (опционально)
├── www/
│   └── index.html
├── certs/                # volume mount, в .gitignore
├── scripts/
│   ├── init-letsencrypt.sh
│   └── backup.sh
└── docs/
    └── deployment.md
```

---

## 6. Docker Compose конфигурация

### 6.1 Основной файл `docker-compose.yml`

```yaml
version: '3.8'

services:
  nginx:
    image: nginx:alpine
    container_name: xmpp-nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/conf.d:/etc/nginx/conf.d:ro
      - ./www:/var/www/html:ro
      - ./certs:/etc/letsencrypt:ro
      - certbot-webroot:/var/www/certbot:ro
    depends_on:
      - prosody
    networks:
      - xmpp-net

  prosody:
    image: prosody/prosody:latest
    container_name: xmpp-prosody
    restart: unless-stopped
    ports:
      - "5222:5222"   # C2S
      - "5269:5269"   # S2S
    volumes:
      - ./prosody/prosody.cfg.lua:/etc/prosody/prosody.cfg.lua:ro
      - prosody-data:/var/lib/prosody
      - ./certs:/etc/letsencrypt:ro
    environment:
      - LOCAL=${PROSODY_ADMIN_USER:-admin}
      - DOMAIN=${DOMAIN}
      - PASSWORD=${PROSODY_ADMIN_PASS}
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - xmpp-net
    healthcheck:
      test: ["CMD", "prosodyctl", "status"]
      interval: 30s
      timeout: 10s
      retries: 3

  postgres:
    image: postgres:15-alpine
    container_name: xmpp-postgres
    restart: unless-stopped
    environment:
      POSTGRES_DB: prosody
      POSTGRES_USER: prosodyuser
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres-data:/var/lib/postgresql/data
    networks:
      - xmpp-net
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U prosodyuser -d prosody"]
      interval: 10s
      timeout: 5s
      retries: 5

  certbot:
    image: certbot/certbot
    container_name: xmpp-certbot
    volumes:
      - ./certs:/etc/letsencrypt
      - certbot-webroot:/var/www/certbot
    entrypoint: "/bin/sh -c 'trap exit TERM; while :; do certbot renew --webroot -w /var/www/certbot; sleep 12h & wait $${!}; done;'"
    networks:
      - xmpp-net

volumes:
  prosody-data:
  postgres-data:
  certbot-webroot:

networks:
  xmpp-net:
    driver: bridge
```

### 6.2 Переменные окружения `.env`

```env
# Домен
DOMAIN=chat.example.com

# Prosody admin
PROSODY_ADMIN_USER=admin
PROSODY_ADMIN_PASS=changeme_strong_password

# PostgreSQL
POSTGRES_PASSWORD=changeme_db_password

# Let's Encrypt
LETSENCRYPT_EMAIL=admin@example.com
```

---

## 7. Конфигурационные файлы

### 7.1 Nginx `/nginx/conf.d/default.conf`

```nginx
map $http_upgrade $connection_upgrade {
    default upgrade;
    '' close;
}

server {
    listen 80;
    listen [::]:80;
    server_name ${DOMAIN};

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 301 https://$server_name$request_uri;
    }
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name ${DOMAIN};

    ssl_certificate /etc/letsencrypt/live/${DOMAIN}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${DOMAIN}/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    root /var/www/html;
    index index.html;

    location / {
        try_files $uri $uri/ =404;
    }

    location /xmpp-websocket {
        proxy_pass http://prosody:5280/xmpp-websocket;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $connection_upgrade;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 900s;
        proxy_send_timeout 900s;
        proxy_buffering off;
    }

    access_log /var/log/nginx/xmpp-access.log combined;
    error_log /var/log/nginx/xmpp-error.log warn;
}
```

### 7.2 Prosody `/prosody/prosody.cfg.lua`

```lua
---------- Server-wide settings ----------

plugin_paths = {}

modules_enabled = {
    -- Core
    "roster";
    "saslauth";
    "tls";
    "dialback";
    "disco";
    "carbons";
    "mam";
    "csi_simple";
    "ping";
    
    -- OMEMO
    "pubsub";
    "pep";
    
    -- Web
    "websocket";
    "http";
    
    -- Admin
    "admin_adhoc";
    "blocklist";
    "bookmarks";
}

modules_disabled = {
    "s2s";  -- Отключить федерацию для изоляции
}

allow_registration = false
c2s_require_encryption = true
s2s_require_encryption = true
consider_websocket_secure = true

limits = {
    c2s = {
        rate = "10kb/s";
        burst = "2s";
    };
}
c2s_stanza_size_limit = 256 * 1024

log = {
    warn = "*syslog";
    error = "*syslog";
}

storage = "sql"
sql = {
    driver = "PostgreSQL";
    database = "prosody";
    username = "prosodyuser";
    password = os.getenv("POSTGRES_PASSWORD");
    host = "postgres";
}

archive_expires_after = "1week"

http_ports = { 5280 }
http_interfaces = { "0.0.0.0", "::" }
https_ports = {}
https_interfaces = {}

---------- VirtualHost ----------
VirtualHost (os.getenv("DOMAIN") or "localhost")
    enabled = true
    
    ssl = {
        certificate = "/etc/letsencrypt/live/" .. (os.getenv("DOMAIN") or "localhost") .. "/fullchain.pem";
        key = "/etc/letsencrypt/live/" .. (os.getenv("DOMAIN") or "localhost") .. "/privkey.pem";
    }
```

### 7.3 Веб-клиент `/www/index.html`

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Secure Messenger</title>
    <link rel="stylesheet" href="https://cdn.conversejs.org/11.0.0/dist/converse.min.css">
    <script src="https://cdn.conversejs.org/3rdparty/libsignal-protocol.min.js"></script>
    <style>
        body { margin: 0; padding: 0; height: 100vh; overflow: hidden; }
        #conversejs { height: 100vh; }
    </style>
</head>
<body>
    <div id="conversejs"></div>
    <script src="https://cdn.conversejs.org/11.0.0/dist/converse.min.js"></script>
    <script>
        converse.initialize({
            websocket_url: `wss://${window.location.host}/xmpp-websocket`,
            authentication: 'login',
            auto_login: false,
            view_mode: 'fullscreen',
            allow_registration: false,
            omemo_default: true,
            trusted: true,
            show_controlbox_by_default: true,
            allow_contact_requests: true,
            allow_contact_removal: true,
            allow_logout: true,
            message_archiving: 'always',
            archived_messages_page_size: 50,
            loglevel: 'warn',
            theme: 'concord',
            i18n: 'en'
        });
    </script>
</body>
</html>
```

---

## 8. Процедура развертывания

### 8.1 Подготовка инфраструктуры

**Требования:**
- VPS: 1 vCPU, 2 GB RAM, 20 GB SSD, Ubuntu 22.04/24.04
- Домен с настроенными DNS-записями:
  - A: `chat.example.com` → IP сервера
  - SRV: `_xmpp-client._tcp` → `0 5 5222 chat.example.com`
  - SRV: `_xmpp-server._tcp` → `0 5 5269 chat.example.com`

**Установка Docker:**
```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
```

### 8.2 Инициализация проекта

```bash
# Клонировать репозиторий
git clone <repository-url> xmpp-messenger
cd xmpp-messenger

# Настроить переменные окружения
cp .env.example .env
nano .env  # Заполнить DOMAIN, пароли, email

# Создать директории для сертификатов
mkdir -p certs/live certs/archive
chmod 755 certs
```

### 8.3 Получение SSL-сертификатов

```bash
# Скрипт инициализации Let's Encrypt (scripts/init-letsencrypt.sh)
#!/bin/bash
set -e

DOMAIN=$(grep DOMAIN .env | cut -d '=' -f2)
EMAIL=$(grep LETSENCRYPT_EMAIL .env | cut -d '=' -f2)

# Запустить Nginx для ACME challenge
docker-compose up -d nginx

# Получить сертификаты
docker run --rm \
  -v "$(pwd)/certs:/etc/letsencrypt" \
  -v "$(pwd)/certbot-webroot:/var/www/certbot" \
  certbot/certbot certonly \
  --webroot -w /var/www/certbot \
  --email "$EMAIL" \
  --agree-tos \
  --no-eff-email \
  -d "$DOMAIN"

# Настроить права доступа
chmod -R 755 certs/live certs/archive
chmod 644 certs/archive/"$DOMAIN"/*.pem

# Перезапустить Nginx с SSL
docker-compose restart nginx
```

```bash
chmod +x scripts/init-letsencrypt.sh
./scripts/init-letsencrypt.sh
```

### 8.4 Запуск сервисов

```bash
# Запустить все контейнеры
docker-compose up -d

# Проверить статус
docker-compose ps

# Просмотр логов
docker-compose logs -f prosody
docker-compose logs -f nginx
```

### 8.5 Создание пользователей

```bash
# Создать аккаунта через CLI
docker exec -it xmpp-prosody prosodyctl adduser alice@chat.example.com
docker exec -it xmpp-prosody prosodyctl adduser bob@chat.example.com

# Проверить существующих пользователей
docker exec -it xmpp-prosody prosodyctl about
```

### 8.6 Верификация

**Проверка портов:**
```bash
docker exec xmpp-prosody ss -tulpn | grep -E '(5222|5280)'
```

**Проверка SSL:**
```bash
curl https://chat.example.com
# Ожидается: HTML страница Converse.js

openssl s_client -connect chat.example.com:443 -servername chat.example.com
# Ожидается: Let's Encrypt сертификат
```

**Проверка WebSocket:**
```bash
npm install -g wscat
wscat -c wss://chat.example.com/xmpp-websocket
# Ожидается: Connected (open stream)
```

**Проверка OMEMO:**
1. Открыть `https://chat.example.com` в двух браузерах
2. Войти как Alice и Bob
3. Alice добавляет Bob в контакты
4. Отправить сообщение
5. Проверить наличие иконки замочка

---

## 9. Эксплуатация и поддержка

### 9.1 Мониторинг

```bash
# Использование ресурсов
docker stats

# Логи в реальном времени
docker-compose logs -f --tail=100

# Статус здоровья контейнеров
docker-compose ps
```

### 9.2 Бэкапы

**Скрипт резервного копирования `scripts/backup.sh`:**
```bash
#!/bin/bash
BACKUP_DIR="./backups"
DATE=$(date +%Y%m%d-%H%M%S)

mkdir -p "$BACKUP_DIR"

# Бэкап конфигурации
tar -czf "$BACKUP_DIR/config-$DATE.tar.gz" \
  prosody/prosody.cfg.lua \
  nginx/conf.d \
  .env

# Бэкап базы данных
docker exec xmpp-postgres pg_dump -U prosodyuser prosody | \
  gzip > "$BACKUP_DIR/postgres-$DATE.sql.gz"

# Бэкап volume prosody-data
docker run --rm \
  -v xmpp-messenger_prosody-data:/data \
  -v "$(pwd)/$BACKUP_DIR":/backup \
  alpine tar czf "/backup/prosody-data-$DATE.tar.gz" /data

# Удалить бэкапы старше 7 дней
find "$BACKUP_DIR" -name "*.gz" -mtime +7 -delete

echo "Backup completed: $DATE"
```

**Автоматизация через cron:**
```bash
crontab -e
# Добавить: 0 3 * * * /path/to/xmpp-messenger/scripts/backup.sh
```

### 9.3 Обновление компонентов

```bash
# Обновить образы
docker-compose pull

# Пересоздать контейнеры с новыми образами
docker-compose up -d --force-recreate

# Очистить неиспользуемые образы
docker image prune -a
```

### 9.4 Масштабирование

**Переход на production-конфигурацию:**
- Увеличить `archive_expires_after` до 1 месяца
- Настроить регулярную ротацию логов (logrotate)
- Добавить мониторинг (Prometheus + Grafana)
- Настроить алерты (когда контейнер падает)
- Использовать внешний PostgreSQL (managed DB)

---

## 10. Безопасность

### 10.1 Файрволл

```bash
# UFW конфигурация
sudo ufw allow 22/tcp     # SSH
sudo ufw allow 80/tcp     # HTTP (для ACME)
sudo ufw allow 443/tcp    # HTTPS
sudo ufw allow 5222/tcp   # XMPP C2S
sudo ufw allow 5269/tcp   # XMPP S2S (если нужна федерация)
sudo ufw enable
```

### 10.2 Проверка уязвимостей

```bash
# Сканирование образов
docker scan prosody/prosody:latest
docker scan nginx:alpine
docker scan postgres:15-alpine

# Автоматическое обновление через Watchtower (опционально)
docker run -d \
  --name watchtower \
  -v /var/run/docker.sock:/var/run/docker.sock \
  containrrr/watchtower \
  --interval 86400
```

### 10.3 Аудит логов

```bash
# Проверка попыток несанкционированного доступа
docker exec xmpp-prosody grep "authentication failed" /var/log/prosody/prosody.log

# Мониторинг подозрительной активности
docker exec xmpp-postgres psql -U prosodyuser -d prosody -c \
  "SELECT username, COUNT(*) FROM prosodyarchive GROUP BY username ORDER BY COUNT(*) DESC LIMIT 10;"
```

---

## 11. Устранение неполадок

### 11.1 WebSocket не подключается

**Симптомы:** Browser Console: `WebSocket connection failed`

**Диагностика:**
```bash
# Проверить, что Prosody слушает 5280
docker exec xmpp-prosody ss -tulpn | grep 5280

# Проверить логи Nginx
docker logs xmpp-nginx 2>&1 | grep error

# Проверить логи Prosody
docker logs xmpp-prosody 2>&1 | grep websocket
```

**Решение:**
- Проверить `consider_websocket_secure = true` в prosody.cfg.lua
- Убедиться, что заголовки `Upgrade` и `Connection` настроены в Nginx
- Перезапустить контейнеры: `docker-compose restart`

### 11.2 OMEMO не активируется

**Симптомы:** Нет иконки замочка в интерфейсе

**Диагностика:**
```javascript
// В Browser DevTools Console
converse.plugins.omemo
// Должно вернуть: Object {...}
```

**Решение:**
- Проверить, что libsignal-protocol.js загружен ДО converse.min.js
- Убедиться, что модули `pubsub` и `pep` включены в Prosody
- Очистить IndexedDB: DevTools → Application → IndexedDB → Delete

### 11.3 Permission denied на сертификатах

**Симптомы:** Prosody не стартует с ошибкой "Failed to load privkey.pem"

**Решение:**
```bash
# Настроить права доступа
chmod -R 755 certs/live certs/archive
chmod 644 certs/archive/"$DOMAIN"/*.pem

# Перезапустить Prosody
docker-compose restart prosody
```

### 11.4 База данных недоступна

**Симптомы:** Prosody логи содержат "connection to database failed"

**Диагностика:**
```bash
# Проверить статус Postgres
docker exec xmpp-postgres pg_isready -U prosodyuser

# Проверить подключение из Prosody
docker exec xmpp-prosody ping -c 3 postgres
```

**Решение:**
- Убедиться, что пароль в `.env` совпадает с `prosody.cfg.lua`
- Проверить healthcheck Postgres: `docker inspect xmpp-postgres`
- Пересоздать контейнер: `docker-compose up -d --force-recreate postgres`

---

## 12. Дальнейшее развитие

### 12.1 Групповые чаты (MUC)

**Изменения в `prosody.cfg.lua`:**
```lua
Component "conference.chat.example.com" "muc"
    modules_enabled = { "muc_mam" }
    restrict_room_creation = "local"
    max_history_messages = 50
```

### 12.2 Отправка файлов

**Добавить в `prosody.cfg.lua`:**
```lua
Component "upload.chat.example.com" "http_upload"
    http_upload_file_size_limit = 10485760  -- 10 MB
    http_upload_expire_after = 604800       -- 7 дней
    http_upload_quota = 104857600           -- 100 MB на пользователя
```

**Примонтировать volume для хранения:**
```yaml
prosody:
  volumes:
    - uploads:/var/lib/prosody/http_upload
```

### 12.3 CI/CD

**GitHub Actions pipeline `.github/workflows/deploy.yml`:**
```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to server
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            cd /opt/xmpp-messenger
            git pull origin main
            docker-compose pull
            docker-compose up -d --force-recreate
```

---

## 13. Чек-лист приёмки

### Инфраструктура
- [ ] VPS развёрнут, доступен по SSH
- [ ] Домен настроен, DNS-записи распространились
- [ ] Docker и Docker Compose установлены

### Конфигурация
- [ ] Файл `.env` заполнен корректными значениями
- [ ] SSL-сертификаты получены через Let's Encrypt
- [ ] `docker-compose.yml` содержит все 4 сервиса (nginx, prosody, postgres, certbot)
- [ ] Конфигурационные файлы (nginx, prosody) синтаксически корректны

### Развертывание
- [ ] `docker-compose up -d` запускается без ошибок
- [ ] Все контейнеры в статусе `Up` и `healthy`
- [ ] Порты 80, 443, 5222 открыты и слушают

### Функциональность
- [ ] HTTPS-сайт доступен по адресу домена
- [ ] Converse.js загружается в браузере
- [ ] WebSocket подключается (нет ошибок в Console)
- [ ] Пользователи созданы через `prosodyctl adduser`
- [ ] Вход по JID/паролю работает
- [ ] Ростер загружается
- [ ] Сообщения доставляются между пользователями
- [ ] OMEMO активен (иконка замочка видна)
- [ ] Офлайн-сообщения сохраняются и доставляются

### Безопасность
- [ ] SSL Labs тест показывает рейтинг A/A+
- [ ] Приватные ключи не покидают браузер (проверка IndexedDB)
- [ ] Логи Prosody не содержат plaintext сообщений
- [ ] Файрволл настроен, закрыты лишние порты

### Эксплуатация
- [ ] Скрипт бэкапа настроен и протестирован
- [ ] Автообновление SSL-сертификатов работает (certbot контейнер)
- [ ] Логи доступны через `docker-compose logs`
- [ ] Мониторинг ресурсов через `docker stats`

---

## 14. Справочная информация

### 14.1 Официальная документация
- Prosody: https://prosody.im/doc/
- Converse.js: https://conversejs.org/docs/html/
- XMPP Standards: https://xmpp.org/extensions/
- OMEMO Spec (XEP-0384): https://xmpp.org/extensions/xep-0384.html
- Docker Compose: https://docs.docker.com/compose/

### 14.2 Полезные команды

```bash
# Управление контейнерами
docker-compose up -d              # Запустить в фоне
docker-compose down               # Остановить и удалить
docker-compose restart <service>  # Перезапустить сервис
docker-compose logs -f <service>  # Логи в реальном времени

# Отладка
docker exec -it xmpp-prosody bash           # Войти в контейнер
docker inspect xmpp-prosody                 # Детали контейнера
docker network inspect xmpp-messenger_xmpp-net  # Сетевая конфигурация

# Prosody CLI
docker exec xmpp-prosody prosodyctl adduser <jid>     # Создать пользователя
docker exec xmpp-prosody prosodyctl deluser <jid>     # Удалить пользователя
docker exec xmpp-prosody prosodyctl status            # Статус сервера
docker exec xmpp-prosody prosodyctl check             # Проверка конфигурации

# PostgreSQL
docker exec -it xmpp-postgres psql -U prosodyuser -d prosody  # SQL консоль
```

---

## 15. Контакты и поддержка

**Разработчик:** [Имя]  
**Email:** [email@example.com]  
**Репозиторий:** [https://github.com/username/xmpp-messenger]  
**Документация:** [https://docs.example.com]

**Сообщества:**
- XMPP: xmpp:prosody@conference.prosody.im
- Reddit: r/xmpp
- Matrix: #xmpp:matrix.org

---

**Конец документа**