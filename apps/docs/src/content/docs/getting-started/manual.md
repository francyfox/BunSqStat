---
title: Manual install
---

~~~
🛑 Alert

Currently for releases used only basic bun version. 
If you are working with virtual machines, you need to enable AVX2 support.

Or you can clone repository and compile to binary baseline version (in future i fix this)
~~~

If you don't use docker/kubes, you can install manually.

Before install:
- redis-stack:7.2.0-v18 or higher (we need to use RediSearch module)
- Caddy/Nginx/Apache for serving static pages.
- [Bun](https://bun.com/docs/installation)

You can use my configurations for docker in [git repository](https://github.com/francyfox/BunSqStat):
- docker/redis/redis.conf
- docker/caddy/Caddyfile

Then [download](https://github.com/francyfox/BunSqStat/releases) actual build release.

Unzip file, rename `.env.example` to `.env`. Set variables.
For frontend use [reverse proxy](https://caddy.community/t/caddy-for-spa-api/11580) (need to proxy backend api, or you will see CORS errors)

For backend use bun like `bun backend/index.js` or you can demonize with [PM2](https://bun.com/docs/guides/ecosystem/pm2)
