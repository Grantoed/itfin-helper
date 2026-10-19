# ITFin Helper Chrome Extension

## Overview

ITFin Helper is a Chrome extension that pulls everyday numbers out of ITFin into a single popup. It uses your existing ITFin session: log in to ITFin in a tab, then open the popup.

## Features

- **Project income**: total income across all projects for a date range, with the working-day progress for the current month
- **Work log checker**: team members who logged less than 8h per working day, worst first, with a copy-ready Markdown list
- **Vacations**: company or team vacations and unpaid leave in a date range, with a copy-ready Markdown list

Requests run in the background service worker, so you can close the popup while data loads. Results, the selected team and filters are remembered between popup opens.

## Installation

The extension isn't published on the Chrome Web Store, so install it as an unpacked extension:

1. Run `npm install`, then `npm run build` to generate the `dist` folder.
2. Open `chrome://extensions/` and enable **Developer mode**.
3. Click **Load unpacked** and select the `dist` folder.

## Development

```sh
npm install
npm run watch      # rebuild on change
npm run typecheck  # TypeScript checks
npm test           # unit tests
npm run build      # production build into dist/
```

After rebuilding, click the reload icon for the extension on `chrome://extensions/`.

### Architecture

- `src/app/background/`: the service worker. `task-runner.ts` runs the fetch tasks in `tasks/` and writes their progress, errors and results to `chrome.storage.local`.
- `src/app/popup/`, `src/components/`, `src/hooks/`: the React popup. It reads storage once before the first render and then follows `chrome.storage.onChanged` (`utils/store.util.ts`), so storage is the single source of truth.
- `src/shared/`: the popup–background contract, API client and constants.

## License

MIT License
