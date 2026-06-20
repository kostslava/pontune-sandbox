# Pontune Sandbox

A self-hosted code execution sandbox for STEM learning. Write Java or C++ in the browser, compile and run it in real time, with interactive stdin support — all backed by [Piston](https://github.com/engineer-man/piston) running in Docker.

![Pontune](https://img.shields.io/badge/stack-React%20%2B%20Piston%20%2B%20Docker-0891b2)

## Features

- **Multi-file projects** — add helper `.java` / `.cpp` files alongside your main program
- **Interactive stdin** — programs that read from `Scanner` / `cin` work as expected
- **Live output** — stdout, stderr, compile errors, and exit codes streamed over WebSocket
- **Resource monitoring** — session timer plus Docker CPU/RAM stats (when running locally)
- **Java 15 & C++ (GCC 10.2)** — installed automatically on first setup

## Architecture

```
Browser (React + Vite, :5173)
        │
        │  /api/v2/*  (HTTP + WebSocket proxy)
        ▼
Piston API (:2000)  ←  Docker container (piston_api)
        │
        └── compiles & runs code in isolated sandboxes
```

The React dashboard does not compile code itself. It talks to a [Piston](https://github.com/engineer-man/piston) server, which handles compilation and execution inside Docker.

## Requirements

| Tool | Version | Notes |
|------|---------|-------|
| **macOS** | 10.15+ | Tested on Intel Macs including Mac mini (2014) |
| **Docker Desktop** | 4.x+ | Must be running before setup |
| **Node.js** | 20 LTS+ | For the React dev server |
| **Python 3** | 3.x | Used by the setup script (preinstalled on macOS) |
| **curl** | any | Used by the setup script |

### Mac mini (2014) notes

The 2014 Mac mini is Intel (`x86_64`). This project is configured for that out of the box:

- `docker-compose.yml` sets `platform: linux/amd64` — native on Intel Macs, no emulation needed.
- First-time language installs (Java + GCC) download ~200–400 MB and can take several minutes on older hardware.
- Allocate at least **4 GB RAM to Docker Desktop** (Settings → Resources). The machine should have 8 GB total RAM or more.
- If Docker feels slow, close other heavy apps during the initial `npm run piston:setup`.

## Quick start

### 1. Clone and install

```bash
git clone https://github.com/kostslava/pontune-sandbox.git
cd pontune-sandbox

npm install --prefix client
```

### 2. Configure (optional)

For local development the defaults work out of the box. To point at a remote or port-forwarded Piston instance:

```bash
cp client/.env.example client/.env
# Edit client/.env — set PISTON_URL and VITE_PISTON_URL to your host
```

Example for a port-forwarded server:

```env
PISTON_URL=http://142.114.117.104:2000
VITE_PISTON_URL=ws://142.114.117.104:2000
```

### 3. Start Piston (execution backend)

Make sure Docker Desktop is running, then:

```bash
npm run piston:setup
```

This will:

1. Start the `piston_api` container on port **2000**
2. Wait for the API to become healthy
3. Install Java 15.0.2 and GCC 10.2.0 runtimes

Verify Piston is up:

```bash
curl http://localhost:2000/api/v2/runtimes
```

You should see JSON listing `java` and `c++` runtimes.

### 4. Start the dashboard

```bash
npm run dev
```

Open **http://localhost:5173** in your browser.

## npm scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start the React dashboard (Vite on :5173) |
| `npm run piston:setup` | Start Piston + install language runtimes |
| `npm run piston:up` | Start the Piston container only |
| `npm run piston:down` | Stop the Piston container |
| `npm run piston:logs` | Tail Piston container logs |

## Remote access / port forwarding

To expose Piston on your public IP (e.g. `http://YOUR_IP:2000`):

1. Forward **TCP port 2000** on your router to the Mac running Docker.
2. Confirm from outside: `curl http://YOUR_IP:2000/` → `{"message":"Piston v3.1.1"}`
3. Set `PISTON_URL` / `VITE_PISTON_URL` in `client/.env` to that address.
4. Restart the dev server (`npm run dev`).

The dashboard can run on any machine that reaches the Piston API — your laptop, the Mac mini itself, or another device on the network.

## Troubleshooting

### Piston won't start

```bash
docker logs piston_api
npm run piston:down && npm run piston:up
```

Common causes: Docker Desktop not running, port 2000 already in use (`lsof -i :2000`).

### "Piston unreachable" in the dashboard

- Confirm `curl http://localhost:2000/api/v2/runtimes` works.
- If using a remote IP, check `client/.env` matches and restart Vite.
- Ensure nothing else is bound to port 2000 (an old `node server.js` process, etc.).

### Language install fails

Re-run setup — package downloads can timeout on slow connections:

```bash
npm run piston:setup
```

### Docker stats show "unavailable"

Resource monitoring reads `docker stats piston_api` locally. This only works when Docker is on the same machine as the dev server. Remote Piston setups still run code fine; stats just won't appear.

## Project structure

```
├── client/                 React dashboard (Vite + Tailwind)
│   ├── src/
│   │   ├── components/     UI (editor, console, controls)
│   │   ├── services/       Piston WebSocket + health checks
│   │   └── constants/      Language templates & limits
│   └── .env.example        Piston URL configuration
├── scripts/
│   └── setup-piston.sh     One-shot Piston bootstrap
├── docker-compose.yml      Piston container definition
└── piston-data/            Installed language packages (gitignored)
```

## API reference

Piston exposes a REST + WebSocket API. The dashboard uses:

| Endpoint | Purpose |
|----------|---------|
| `GET /api/v2/runtimes` | Health check / list installed runtimes |
| `POST /api/v2/execute` | One-shot compile + run (REST) |
| `WS /api/v2/connect` | Interactive compile + run (used by the dashboard) |

Full docs: [engineer-man/piston](https://github.com/engineer-man/piston)

## License

ISC
