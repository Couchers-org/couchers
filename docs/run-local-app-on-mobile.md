# How to run the local dev environment on your phone

Run the setup script from the repo root — it auto-detects your local IP and updates all the config files at once:

```bash
python3 app/scripts/dev-mobile-setup.py
```

Or pass your IP explicitly if auto-detection picks the wrong interface:

```bash
python3 app/scripts/dev-mobile-setup.py 192.168.x.x
```

Then restart everything (each in a separate terminal, from the **repo root** unless noted):

```bash
# 1. Restart the backend (requires Docker to be running)
docker compose up --build

# 2. Restart the web frontend
cd app/web && yarn start

# 3. Start Expo
cd app/mobile && npx expo start
```

You can now access `http://<your-ip>:3000/` on your phone and log in to see local changes.

> **Do not commit the `app/proxy/envoy.yaml` change** — it's local-only.

When you're done, restore all files to their defaults:

```bash
python3 app/scripts/dev-mobile-setup.py --restore
```

## What the script changes

| File | Change |
|------|--------|
| `app/proxy/envoy.yaml` | Adds your IP to the CORS allow list |
| `app/backend.dev.env` | Sets `COOKIE_DOMAIN` and media server URLs to your IP |
| `app/web/.env.localdev` | Points API and media URLs at your IP |
| `app/mobile/.env` | Switches from staging to local dev mode |
