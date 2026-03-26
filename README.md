# Carrier Integration Service

Small TypeScript service for fetching shipping rates.

This version supports UPS and is structured so another carrier can be added later without changing the core service flow.

## Design

- `domain` holds the normalized request and response models
- `carriers` contains the carrier interface and UPS-specific implementation
- `services/RateService` validates input and collects quotes from available carriers
- `auth/TokenManager` handles OAuth token fetching and caching

I kept the carrier-specific mapping and API logic separate from the shared service layer so the code stays easier to extend and test.

## Setup

Install dependencies:

```bash
npm install
```

Create `.env` from `.env.example`.

macOS and Linux:

```bash
cp .env.example .env
```

Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Windows Command Prompt:

```cmd
copy .env.example .env
```

Then add your UPS credentials to `.env`.

## Run

```bash
npm run build
```

## Tests

```bash
npm test
```

The tests use mocked UPS responses, so they do not require live credentials.

## If I Had More Time

- add another carrier implementation
- expand test coverage for failure cases
- add a small HTTP route example
- add CI for build and test checks
