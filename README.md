# ITFin Helper Chrome Extension

## Overview

ITFin Helper is a Chrome extension that helps users fetch project income data from ITFin. It provides an easy-to-use popup interface where users can authenticate, select a date range, and retrieve income details.

## Features

- Authenticate with ITFin
- Select date range for project income
- Fetch and display project income data
- Show working day progress for the current month

## Installation

Since this extension is not published on the Chrome Web Store, it needs to be installed manually as an unpacked extension.

### Steps to Install:

1. **Build the Extension**

   - Run `npm install` to install dependencies.
   - Run `npm run build` to generate the `dist` folder.

2. **Load the Extension in Chrome**
   - Open Google Chrome and navigate to `chrome://extensions/`.
   - Enable **Developer mode** (toggle in the top right corner).
   - Click **Load unpacked** and select the `dist` folder.
   - The extension should now be installed and visible in the extensions bar.

## Development

To modify the extension, follow these steps:

1. Clone the repository:
   ```sh
   git clone https://github.com/your-repo/itfin-helper.git
   cd itfin-helper
   ```
2. Install dependencies:
   ```sh
   npm install
   ```
3. Start development:
   ```sh
   npm run start
   ```
4. Make changes and rebuild:
   ```sh
   npm run build
   ```

## License

MIT License
