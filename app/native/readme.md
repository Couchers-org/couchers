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
cd couchers/app/native

# Set up node
nvm install

# Download & extract the latest protos
wget -qO- https://develop--protos.preview.couchershq.org/ts.tar.gz | tar xz

# install deps
npm i

# start expo
npx expo start
```

This will start the expo server. You now need to run the Couchers-specific expo dev app on your phone and connect to this server.

todo(aapeli): instructions

## Random

### Create a dev build for a physical iPhone

Register the phone in [Expo](https://expo.dev/accounts/couchers-org/settings/apple-devices).

```sh
# install expo cli
npm i --global eas-cli

# build and pick the right phone, you'll need to log in
eas build --profile development --platform ios
```
