## 0.27.0 - 10 Nov 2025

Feature:
- Sentry for backend/frontend (firefox doesn't support)
- /settings/heap - return heap snapshot

## 0.26.0 - 07 Nov 2025

Feature:
- Add origin display (display all or only one)
- Time zone

Bugfix:
- Time zone (wrong timestamp in access data)
- Bandwidth
- Remove column blocked from domains
- Domain adaptive

## 0.25.2 - 04 Nov 2025

Bugfix:
- fixed [Issue](https://github.com/francyfox/BunSqStat/issues/38) Turn on legacy support. Add copy text to popup
- fixed [Issue](https://github.com/francyfox/BunSqStat/issues/37) Add check on empty users

## 0.25.1 - 04 Nov 2025

Bugfix:
- [Issue](https://github.com/francyfox/BunSqStat/issues/36) Double websockets, replace composable fn to store

## 0.25.0 - 03 Nov 2025

Feature:
- UDP logs origins (added prefix to redis log:access:{originPrefix})
- Added origins switcher in settings
- Update interval translated to settings

Bugfix:

- Pause button. Not working after enabling shared workers

## 0.24.0 - 27 Oct 2025

Feature:
- Listen UDP logs (new env)
- Remove chokidar (file watcher)

Bugfix:
- Columns ellipsis for domain tables

## 0.23.0 - 21 Oct 2025

Feature:
- Optimization fix. Replaced websockets to shared worker. (1 browser = 1 client)

## 0.22.7 - 21 Oct 2025

Bugfix:
- Hard http for api

## 0.22.6 - 21 Oct 2025

Bugfix:
- Fixes for production

## 0.22.5 - 21 Oct 2025

Bugfix:
- Fixes for production

## 0.22.4 - 21 Oct 2025

Bugfix:
- ports for production!

## 0.22.3 - 20 Oct 2025

Bugfix:
- redis.conf

## 0.22.2 - 20 Oct 2025

Bugfix:
- Include redis-stack.conf

## 0.22.1 - 17 Oct 2025

Bugfix:
- Locale store persist. Browser locale auto-detect

## 0.22.0 - 16 Oct 2025

Feature:
- i18n (English/Russian)

## 0.21.2 - 15 Oct 2025

Bugfix:
- Removed manual bun download. Changed compile mode

## 0.21.1 - 15 Oct 2025

Test:
- binary backend format

## 0.21.0 - 15 Oct 2025

Bugfix:
- CRITICAL!!! Replaced to Bun baseline for dockerfile. Compatibility with old processors and virtual machines (KVM, LXC etc.)

## 0.2.0 - 13 Oct 2025

Feature:
- Added DOMAINS tab

## 0.1.8 - 09 Oct 2025

Bugfix:
- Aliases for users table
- Fixed/Resizeble user column for users table

## 0.1.7 - 09 Oct 2025

Feature:
- Translated RPS card to GLOBAL tab
- Added USERS tab

## 0.1.6 - 07 Oct 2025

Feature:
- Settings redis maxmemory | user alias | danger zone
- API parse logs | user alias | drop logs + files | drop alias

Bugfix:
- Url search didnt worked with protocol
- Url escape

## 0.1.5 - 02 Oct 2025

Feature:
- GET/SET Config redis maxmemory

## 0.1.4 - 30 Sep 2025

Feature:
- Reset button for search field
- Sort columns for access data table

Bugfix:
- Search field escape (for url, remove http protocol)
- Make components for metrics reactive
- Set duration for chart animation 0. After redraw, start animation from zero

## 0.1.3 - 29 Sep 2025

Feature: 
- Adaptive
- New cards for metrics. Content type / Optimization

Bugfix:
- Log dir for env (log rotate)
- Metrics bytes (use only bytes for server response)

## 0.1.1 - 23 Sep 2025

Bugfix:
- Deploy docker by git ci (ghcr.io)

## 0.1.0 - 22 Sep 2025

Feature:
- file offset (BunFile slice)
- log rotate support (read next file, readMultiplyFiles with limit 1000)
- add base charts

Bugfix:
- replace protocol to http:// | https:// into url
- change id for access logs - timestamp + nanoid for unique value