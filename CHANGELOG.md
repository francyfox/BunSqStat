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