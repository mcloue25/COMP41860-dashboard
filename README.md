# COMP41860 Dashboard

A stuident helpdesk styled dashboard application for COMP41860.

---

## Getting Started

Follow the steps below to run the dashboard locally.

---

## Prerequisites

This project requires **Node.js** and **npm (Node Package Manager)**.

### Install Node.js

Download and install Node.js from the official website:  
[[Node Download Link](https://nodejs.org/en/download)]

After installation, verify everything is working:

```bash
node -v
npm -v
```

Both commands should return a version number.

**Recommended:** Use the latest LTS version of Node.js.

---

## Installation

After youve cloned this repo cd into the ''dashboard'' folder and install project dependencies:

```bash
npm install
```

This installs all packages listed in `package.json`.

---

## Running the Dashboard

Once all project dependencies have been installed now you can start the dev server:

```bash
npm run dev
```

The terminal will display a local development URL (typically something like `http://localhost:5173`).

Open that URL in your browser to view the dashboard.

The server supports **hot reloading**, so changes to the code will automatically refresh the browser.

If youre trying to test SQL to frontend integration make sure you have the SQL server initialised.
To do this cd Phils repo and run the following:

Using Powershell:
```bash
$env:DEV_MODE="true"
uvicorn app.main:app --reload
```


Using CMD:
```bash
set DEV_MODE=true
set DEV_USER_ID="dev-user"
uvicorn app.main:app --reload
```

macOS/Linux
```bash
DEV_MODE=true
uvicorn app.main:app --reload
```

Commands also change for Mac/linux but refer to Cian for guidance on those.
---

## Project Structure

```
COMP41860-dashboard/
├── src/              # Application source code (Pages / Components / API routes etc)
├── public/           # Static assets
├── package.json      # Project configuration and dependencies
├── package-lock.json
└── README.md
```

---

## Available Scripts

| Command | Description |
|---|---|
| `npm install` | Install project dependencies |
| `npm run dev` | Start local development server |
| `npm run build` | Build the app for production (not yet configured) |
| `npm run preview` | Preview the production build (not yet configured) |

---

## Requirements

- Node.js (latest LTS recommended)
- npm (included with Node.js)

---

## Troubleshooting

### Node or npm not recognised
Restart your terminal after installing Node.js.

---

### Dependency installation errors

Try clearing and reinstalling:

```bash
rm -rf node_modules package-lock.json
npm install
```

---

### Port already in use

Stop any running dev servers or restart your machine.

---

## Development Notes

- Runs locally using a development server.
- Supports automatic browser reload on file changes.
- Ensure dependencies are installed before starting the server.

---

## License

For academic use.
