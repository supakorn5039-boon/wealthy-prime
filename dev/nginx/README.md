# Local dev: `wealthy.local` via nginx

Serve the full app at `http://wealthy.local` instead of `localhost:3000` / `localhost:8080`. No CORS headaches — frontend and API share an origin.

## One-time setup

### 1. Add hosts entry
```bash
echo "127.0.0.1 wealthy.local" | sudo tee -a /etc/hosts
```

### 2. Install nginx (macOS)
```bash
brew install nginx
```

### 3. Symlink this config into nginx
**Apple Silicon (M1/M2/M3):**
```bash
ln -s "$(pwd)/wealthy.local.conf" /opt/homebrew/etc/nginx/servers/wealthy.local.conf
```

**Intel Mac:**
```bash
ln -s "$(pwd)/wealthy.local.conf" /usr/local/etc/nginx/servers/wealthy.local.conf
```

### 4. Start nginx (requires sudo for port 80)
```bash
sudo brew services start nginx
```

### 5. Tell the frontend to use the new host
Create `frontend/.env.development.local` (gitignored):
```
VITE_API_BASE_URL=http://wealthy.local/api
```

## Daily use

```bash
# Terminal 1 — backend
cd backend && make dev

# Terminal 2 — frontend
cd frontend && npm run dev

# Browser
open http://wealthy.local
```

## Troubleshooting

- **502 Bad Gateway** → Vite or backend isn't running. Check ports 3000 / 8080.
- **Permission denied on port 80** → use `sudo brew services start nginx`, or change `listen 80` → `listen 8000` in the conf and visit `http://wealthy.local:8000`.
- **HMR not connecting** → make sure the `Upgrade`/`Connection` headers in the config are present (they are).
- **CORS error** → confirm `backend/config.ini` `allowed_origins` includes `http://wealthy.local`.
