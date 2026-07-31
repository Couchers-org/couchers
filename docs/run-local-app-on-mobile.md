# How to run the local dev environment on your phone

Run the setup script — it auto-detects your local IP and updates all the config files at once. From `app/mobile`:

```bash
npm run setup:local
```

Or pass your IP explicitly if auto-detection picks the wrong interface:

```bash
npm run setup:local -- [[YOUR_IP_ADDRESS_HERE]]
```

(The npm script just runs `app/scripts/dev-mobile-setup.py`, which you can also invoke directly from the repo root.)

Then restart everything (each in a separate terminal, from the **repo root** unless noted):

```bash
# 1. Restart the backend (requires Docker to be running)
docker compose up --build

# 2. Restart the web frontend
cd app/web && yarn start

# 3. Start Expo
cd app/mobile && npm run start:devtool
```

You can now access `http://<your-ip>:3000/` on your phone and log in to see local changes.

> **Do not commit the `app/proxy/envoy.yaml` change** — it's local-only.

When you're done, restore all files to their defaults:

```bash
npm run setup:local:restore
```

## What the script changes

| File | Change |
|------|--------|
| `app/proxy/envoy.yaml` | Adds your IP to the CORS allow list |
| `app/backend.dev.env` | Sets `COOKIE_DOMAIN`, `MEDIA_SERVER_BASE_URL`, and `MEDIA_SERVER_UPLOAD_BASE_URL` |
| `app/media.dev.env` | Sets `MEDIA_SERVER_BASE_URL` (needed for image upload response URLs) |
| `app/web/.env.localdev` | Points API and media URLs at your IP |
| `app/web/.env.development` | Points API and media URLs at your IP |
| `app/mobile/.env` | Switches from staging to local dev mode |
