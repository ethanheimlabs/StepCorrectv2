# StepCorrect Mobile

React Native mobile app for StepCorrect, built with Expo Router.

## Stack

- Expo
- React Native
- Expo Router
- TypeScript
- Shared StepCorrect recovery types and deterministic fallback logic via `../packages/core`

## Local setup

```bash
cd mobile
npm install
npm run dev
```

Optional native runs:

```bash
npm run ios
npm run android
```

## Notes

- The mobile app ships with seeded local demo data so the dashboard, pattern cards, and weekly reflection all work on first launch.
- Safety copy remains in place: the app supports recovery routines but does not replace a sponsor, meetings, therapy, medical care, or emergency services.
