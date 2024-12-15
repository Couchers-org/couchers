# How to run then local dev environment on your phone

It's possible to run your local dev environment on your phone, for example if you need to replicate a bug only on affecting mobile. Follow these steps:

1. Find your local IP address:
   - Mac: Click Apple icon menu => System Settings => Network => Wi-Fi => Details button => IP Address
   - Linux: In the terminal type command `hostname -I` and hit Enter.
   - Windows: Click Start Menu => Settings => Network and internet => Properties => IPv4 address
2. In `envoy.yaml`, under the line `envoy.filters.http.cors` add a line after localhost:3000
   - `- exact: http://{YOUR_IP_ADDRESS}:3000`
3. In `backend.dev.env` change the value of `COOKIE_DOMAIN` to `COOKIE_DOMAIN={YOUR_IP_ADDRESS}`. No http or slashes here.
4. In both `.env.localdev` and in `env.development` (or `.env.development.local` depending what you're using), change this value:
   - `NEXT_PUBLIC_API_BASE_URL=http://{YOUR_IP_ADDRESS}:8888`
5. You'll need to run the backend locally. Spin your docker containers down, then run:
   - `docker-compose up --build`
6. Restart your frontend `yarn start`.
7. Now you should be able to access `http://{YOUR_IP_ADDRESS}:3000/` on your phone and log in to actively see how you local changes effect mobile.
