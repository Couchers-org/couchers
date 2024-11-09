# How to develop locally with the new frontend repo

1. You can use the old backend as usual:

```sh
cd ./app
docker-compose up --build
```

2. Clone the new frontend repo somewhere

```sh
git clone git@github.com:Couchers-org/web-frontend.git
```

3. Replace the `.env.development` with one that points to the local backend:

```
NEXT_PUBLIC_COUCHERS_ENV=dev
NEXT_PUBLIC_API_BASE_URL=http://localhost:8888
NEXT_PUBLIC_MEDIA_BASE_URL="http://localhost:5001"
NEXT_PUBLIC_CONSOLE_BASE_URL="http://localhost:10027"
NEXT_PUBLIC_IS_POST_BETA_ENABLED=true
NEXT_PUBLIC_NOMINATIM_URL="https://nominatim.openstreetmap.org/"
NEXT_PUBLIC_IS_VERIFICATION_ENABLED=true
NEXT_PUBLIC_IS_COMMUNITIES_PART2_ENABLED=true
NEXT_PUBLIC_STRIPE_KEY="pk_test_51KEzByIfR5z29g5khFE5samD8XKOGLcCrM1lhCkfOomGPUFAEYOw8uAqI2Nkv33wYdPM2FgTQNTC07IiNfHY1kLJ00Jqm8Ppai"
```

4. Run the new frontend

```sh
docker-compose up --build
```

5. It should now work

## How to regenerate protos and use them in frontend

1. Compile the protos as usual

2. Copy `app/web-frontend/protos/` to the `web-frontend` repo you cloned as `web-frontend/protos` (if you just clone into `./app` then you can skip this)

3. Make the following change in `web-frontend/dockerfile.stage`:

```diff
diff --git a/Dockerfile.stage b/Dockerfile.stage
index 3c2a0bf..833ede8 100644
--- a/Dockerfile.stage
+++ b/Dockerfile.stage
@@ -36,9 +36,7 @@ COPY . .
 # ADD http://couchers-dev-assets.s3.amazonaws.com/proto_may_27_2022.tar.gz /app/

 # Expand our protos into place, set the right env vars into place, then build our static assets
-RUN tar -xf proto_may_27_2022.tar.gz && \
-    rm -f proto_may_27_2022.tar.gz && \
-    cp .env.${BUILD_FOR_ENVIRONMENT} /tmp/saved-temporarily && \
+RUN cp .env.${BUILD_FOR_ENVIRONMENT} /tmp/saved-temporarily && \
     rm .env.* && \
     mv /tmp/saved-temporarily .env.local && \
     yarn build
```
