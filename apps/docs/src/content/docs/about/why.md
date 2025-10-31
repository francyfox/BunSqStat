---
title: Why?
---

### History:

This web app modern analog of SqStat. Old web app used object_cache (removed in squid 6), so we cant use
socket for grabbing realtime data. Now we can only use logs like: access_log/cache_log

Alternative SquidAnalyzer, but it runs only by cron

## 🏗️ Logs roadmap


```
Squid logs UDP -> UDP listen -> Parse logs ->
-> Store logs to Redis -> Websockets 
-> Vue 3 Web UI
```

## FAQ:

TODO: