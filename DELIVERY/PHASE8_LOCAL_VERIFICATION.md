# Phase 8 local verification

Date: 7 September 2026  
Scope: local code, local SQLite persistence, Chrome browser automation and production web build. This is not deployed-environment proof.

## Passed evidence

| Area | Proof | Result |
|---|---|---|
| API/domain | Node test runner | 44 passed, 1 live-PostgreSQL test skipped |
| Static host | Sites worker contract tests | 4 passed |
| Browser suite | Ten real-browser citizen, authority, account and assisted-channel journeys | 10 passed |
| Browser lifecycle | lookup → evidence → grievance → authority claim → reasoned quash → citizen refresh → session reset | passed |
| Guest lookup integrity | vehicle, challan and licence routes use distinct cases; vehicle evidence and return context are regression-tested | passed |
| Authority evidence presentation | retained media is bounded and contained rather than cropped or enlarged as a hero | passed |
| Mobile inclusion | 390 px, low-data deferral/opt-in, high contrast, native Page Down, no horizontal overflow | passed |
| Account continuity | synthetic OTP, multi-vehicle profile, account switch and refresh persistence | passed |
| Channel continuity | signed WhatsApp fixture → issue guidance → one-time web exchange → same case/dispute | passed |
| Channel pay-all | two selected eligible cases → one review → atomic posting and receipt | passed |
| Channel selected payment | one/few selection → protected review with exact chosen cases | passed |
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

- A managed Neon PostgreSQL database is provisioned and connected to the Vercel project through encrypted Preview/Production variables. The live adapter test, first migration, multi-instance cold-start proof and public serverless durability remain pending until deployment is re-enabled.
- The paused Vercel deployment has not been re-enabled or changed during this local phase.
- Formal WCAG certification, NVDA/VoiceOver testing, real mobile-network testing and deployed HTTPS/security-header checks remain manual release gates.
- The deterministic WhatsApp adapter, Meta payload sender, durable retry cap and delivery-receipt persistence are locally verified. The supplied developer phone resource authenticated successfully, but a public callback, explicit recipient and live inbound/outbound conversation remain pending.
- No government, court, identity, registry, camera, officer, payment or messaging system is live.
