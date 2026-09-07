# Phase 8 local verification

Date: 7 September 2026  
Scope: local code, SQLite persistence, Chromium automation and production web build, supplemented by separately recorded Vercel/Neon and Meta developer-pilot checks.

## Passed evidence

| Area | Proof | Result |
|---|---|---|
| API/domain | Node test runner | 49 passed, 1 separate-PostgreSQL integration test skipped |
| Static host | Sites worker contract tests | 4 passed |
| Browser suite | Twelve real-browser citizen, authority, account and assisted-channel journeys | 12 passed |
| Browser lifecycle | lookup → evidence → grievance → authority claim → reasoned quash → citizen refresh → session reset | passed |
| Guest lookup integrity | vehicle, challan and licence routes use distinct cases; vehicle evidence and return context are regression-tested | passed |
| Authority evidence presentation | retained media is bounded and contained rather than cropped or enlarged as a hero | passed |
| Mobile inclusion | 390 px, low-data deferral/opt-in, high contrast, native Page Down, no horizontal overflow | passed |
| Account continuity | synthetic OTP, multi-vehicle profile, account switch and refresh persistence | passed |
| Channel continuity | signed WhatsApp fixture → issue guidance → one-time web exchange → same case/dispute | passed |
| Channel pay-all | two eligible cases → mock UPI-app selection → protected review → atomic posting and downloaded receipt | passed |
| Channel selected payment | one/few selection → visible review checkpoint → chosen mock UPI route → exact protected review | passed |
| Authority production identifier | reviewer session → UUID work batch compatible with PostgreSQL | passed |
| Automated accessibility | representative landing, mobile high-contrast and reviewer sign-in scans | no serious or critical axe violations |
| Restart isolation | two differently mutated citizen sessions across application close/reopen | passed with file-backed SQLite |
| Race safety | two decisions against one displayed version | one commit, one `409` conflict |
| Build | Vite production build and Sites package | passed |
| Release audit | claims, required files, common secret signatures, asset names and budgets | passed |

## Commands

```powershell
npm test
npm run build
npm run test:e2e
npm run audit:release
```

`npm run verify` runs the complete sequence. Playwright reports, failure traces and the JSON release audit are written under ignored `output/` so verification evidence cannot accidentally become application payload.

## Evidence boundary and remaining gates

- A managed Neon PostgreSQL database is provisioned and selected by the public Vercel deployment. Public citizen/account reads and serverless startup have been checked; a deliberate multi-region stress test is not claimed.
- The public deployment is active at `https://challan-nyay.vercel.app/`; this document does not replace a final signed-out browser pass after each deployment.
- Formal WCAG certification, NVDA/VoiceOver testing, real mobile-network testing and deployed HTTPS/security-header checks remain manual release gates.
- The deterministic WhatsApp adapter, Meta payload sender, durable retry cap and delivery-receipt persistence are automated. The public callback and live `Hi` → language-selection reply are user-confirmed on the developer test number; the final post-deployment payment-button walkthrough remains a manual check.
- No government, court, identity, registry, camera, officer or payment system is live. Meta messaging is a bounded developer-number pilot, not a production public channel.
