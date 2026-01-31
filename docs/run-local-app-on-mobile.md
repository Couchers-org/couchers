# How to run the local dev environment on your phone

It's possible to run your local dev environment on your phone, for example if you need to replicate a bug only affecting mobile. Follow these steps:

1. Find your local IP address:
   - Mac: Click Apple icon menu => System Settings => Network => Wi-Fi => Details button => IP Address
   - Linux: In the terminal type command `hostname -I` and hit Enter.
   - Windows: Click Start Menu => Settings => Network and internet => Properties => IPv4 address
2. In `app/proxy/envoy.yaml`, under the line `envoy.filters.http.cors` add a line after localhost:3000
   - `- exact: http://{YOUR_IP_ADDRESS}:3000`
3. In `app/backend.dev.env` change the value of `COOKIE_DOMAIN` to `COOKIE_DOMAIN={YOUR_IP_ADDRESS}`. No http or slashes here.
4. In `app/web/.env.localdev` and `app/web/.env.development` (or `.env.development.local` depending what you're using), change this value:
   - `NEXT_PUBLIC_API_BASE_URL=http://{YOUR_IP_ADDRESS}:8888`
5. (Optional) If you need to test **photo uploads** from your phone, also update the media server URLs in `app/backend.dev.env`:
   - `MEDIA_SERVER_BASE_URL=http://{YOUR_IP_ADDRESS}:5001`
   - `MEDIA_SERVER_UPLOAD_BASE_URL=http://{YOUR_IP_ADDRESS}:5001`
6. If you're working on the React Native mobile app, update `app/mobile/.env` - comment out the stage env vars and add dev vars:
   ```
   # LOCAL:
   EXPO_PUBLIC_COUCHERS_ENV=dev
   EXPO_PUBLIC_API_BASE_URL="http://{YOUR_IP_ADDRESS}:8888"
   EXPO_PUBLIC_WEB_BASE_URL="http://{YOUR_IP_ADDRESS}:3000"
   ```
7. Restart the backend. Spin your docker containers down, then run:
   - `docker compose up --build`
8. Restart your frontend: `yarn start`
9. Now you should be able to access `http://{YOUR_IP_ADDRESS}:3000/` on your phone and log in to actively see how your local changes affect mobile.
