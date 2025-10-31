---
title: Ручная установка
---

~~~
🛑 Внимание

В настоящее время для релизов используется только стандартная версия bun.
Если вы работаете с виртуальными машинами, вам необходимо включить поддержку AVX2.

Или вы можете клонировать репозиторий и скомпилировать бинарную базовую версию (в будущем я это исправлю)
~~~

Если вы не используете docker/kubes, вы можете установить вручную.

Перед установкой:
- redis-stack:7.2.0-v18 или выше (нам нужно использовать модуль RediSearch)
- Caddy/Nginx/Apache для обслуживания статических страниц.
- [Bun](https://bun.com/docs/installation)

Вы можете использовать мои конфигурации для docker в [git репозитории](https://github.com/francyfox/BunSqStat):
- docker/redis/redis.conf
- docker/caddy/Caddyfile

Также вы можете посмотреть [Deployment Guide](/advanced/deployment/)

Затем [скачайте](https://github.com/francyfox/BunSqStat/releases) актуальный релиз.

Распакуйте файл, переименуйте `.env.example` в `.env`. Установите переменные.
Для фронтенда используйте [обратный прокси](https://caddy.community/t/caddy-for-spa-api/11580) (необходимо проксировать API бэкенда, иначе вы увидите ошибки CORS)

Для бэкенда используйте bun, например `bun backend/index.js`, или вы можете запустить его как демон с помощью [PM2](https://bun.com/docs/guides/ecosystem/pm2)
