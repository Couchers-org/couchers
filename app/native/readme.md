# Couchers native apps

## Quick start

You need `nodejs` v20. We recommend using `nvm` (the [node version manager](https://github.com/nvm-sh/nvm)) to do this. You can install it with:

```sh
wget -qO- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
```

Now run:

```sh
# Check out the repo and navigate to app/native
git clone https://github.com/Couchers-org/couchers.git
cd couchers

# generate protos
cd app
docker run --rm -w /app -v $(pwd):/app registry.gitlab.com/couchers/grpc ./generate_protos.sh

# Set up node
cd native
nvm install

# install deps
npm i

# start expo
npx expo start
```

This will start the expo server. You now need to run the Couchers-specific expo dev app on your phone and connect to this server.


https://docs.expo.dev/get-started/set-up-your-environment/

## Building a dev client

For these you need the `eas` cli program:

```sh
# install expo cli
npm i --global eas-cli
```

### Create a dev build for a physical iPhone

Register the phone in [Expo](https://expo.dev/accounts/couchers-org/settings/apple-devices).

```sh
# build and pick the right phone, you'll need to log in
eas build --profile development --platform ios
```

### Create a dev build for iOS simulator

```sh
eas build --profile simulator --platform ios
```

### Create a dev build for Android simulator or .apk for manual install

```sh
eas build --profile simulator --platform android
```
