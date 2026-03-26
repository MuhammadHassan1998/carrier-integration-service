# Carrier Integration Service

Small TypeScript service for fetching shipping rates.

Right now it supports UPS only. The project is set up so another carrier can be added later behind the same interface.

## What It Does

- Accepts a normalized shipping request
- Maps that request to the UPS rate API format
- Returns normalized rate quotes
- Handles validation, auth, retries, and common errors

## Requirements

- Node.js 18+

## Setup

```bash
npm install
cp .env.example .env
```

Add your UPS credentials to `.env`.

You can also change `APP_NAME` or `UPS_RATE_PATH` there if needed.

## Scripts

- `npm test`
- `npm run typecheck`
- `npm run build`

## Notes

- Tests use mocked responses
- The current implementation includes UPS only
