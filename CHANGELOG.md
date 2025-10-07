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