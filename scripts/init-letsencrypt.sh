set -e

DOMAIN=$(grep DOMAIN .env | cut -d '=' -f2)
EMAIL=$(grep LETSENCRYPT_EMAIL .env | cut -d '=' -f2)
PROJ_NAME=$(grep PROJ_NAME .env | cut -d '=' -f2)

# Запустить Nginx для ACME challenge
docker compose up -d nginx
docker compose up -d prosody

sleep 10

curl -sf http://$DOMAIN/ || { echo "Nginx недоступен"; exit 1; }

# Получить сертификаты
docker run --rm \
  -v "$(pwd)/certs:/etc/letsencrypt" \
  -v "${PROJ_NAME}_certbot-webroot:/var/www/certbot" \
  certbot/certbot certonly \
  --webroot -w /var/www/certbot \
  --email "$EMAIL" \
  --agree-tos \
  --no-eff-email \
  --keep-until-expiring \
  -d "$DOMAIN"

# Настроить права доступа
chmod -R 755 certs/live certs/archive
chmod 644 certs/archive/"$DOMAIN"/*.pem

# Перезапустить Nginx с SSL
docker compose restart nginx

chmod +x scripts/init-letsencrypt.sh