# Agent Notes

## Quick start

- `npm run dev` (Vite dev server)
- `npm run build`
- `npm run preview`
- No test script in package.json.

## Configuration

- Google Sheets webhook: set `VITE_SHEETS_URL` in `.env`. See [SHEETS_SETUP.md](SHEETS_SETUP.md).
- If `VITE_SHEETS_URL` is empty, the app switches to demo mode (localStorage + console logging) per [SHEETS_SETUP.md](SHEETS_SETUP.md).

## Architecture

- Entry point: [index.html](index.html) → [src/main.js](src/main.js)
- State store: [src/state.js](src/state.js)
- Survey schema + copy: [src/surveySchema.js](src/surveySchema.js)
- UI components: [src/ui/screens.js](src/ui/screens.js), [src/ui/dialogue.js](src/ui/dialogue.js), [src/ui/menu.js](src/ui/menu.js)
- Submission logic: [src/sheets.js](src/sheets.js) reads env in [src/config.js](src/config.js)
- Styling: [src/styles/tokens.css](src/styles/tokens.css), [src/styles/pixel.css](src/styles/pixel.css), [src/styles/animations.css](src/styles/animations.css)

## Conventions / gotchas

- Arabic RTL UI: check layout changes with directionality in mind.
- Sheets integration relies on `Content-Type: text/plain` when posting (see [SHEETS_SETUP.md](SHEETS_SETUP.md)).
- Plain JS DOM manipulation; no framework layer.
