#!/bin/bash

# Создаем директорию для сертификатов
mkdir -p tls

# Генерируем CA (Certificate Authority)
openssl req -x509 -newkey rsa:4096 -days 365 -nodes -keyout tls/ca.key -out tls/ca.crt \
  -subj "/CN=Redis-CA"

# Генерируем серверный ключ и запрос на подпись
openssl req -newkey rsa:4096 -nodes -keyout tls/server.key -out tls/server.csr \
  -subj "/CN=redis-test"

# Подписываем серверный сертификат с помощью CA
openssl x509 -req -in tls/server.csr -CA tls/ca.crt -CAkey tls/ca.key \
  -CAcreateserial -out tls/server.crt -days 365 \
  -extfile <(printf "subjectAltName=DNS:redis-test,DNS:localhost,IP:127.0.0.1")

# Генерируем клиентский ключ и запрос на подпись
openssl req -newkey rsa:4096 -nodes -keyout tls/client.key -out tls/client.csr \
  -subj "/CN=redis-client"

# Подписываем клиентский сертификат с помощью CA
openssl x509 -req -in tls/client.csr -CA tls/ca.crt -CAkey tls/ca.key \
  -CAcreateserial -out tls/client.crt -days 365

# Устанавливаем правильные права доступа
chmod 644 tls/*.crt
chmod 600 tls/*.key

# Очищаем временные файлы
rm -f tls/*.csr tls/*.srl

echo "TLS сертификаты успешно созданы в директории tls/"
