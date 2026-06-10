# Mobile app Over-the-Air (OTA) updates

## Why OTA and what it does.

Over-the-Air (OTA) updates are a way to update most of the mobile app by shipping a new bundle of code to the native app, without going through the app store.

We have traditionally controlled our entire stack: when users visit the website, we can at any time replace the backend and frontend code in order to fix bugs or add new features. We can go from identifying a bug to having it fixed in minutes. We are very comfortable with this and it allows us to also be a bit aggressive (aka "test in prod").

Mobile apps on the other hand work in the complete opposite way. After we wrap up some code changes, we have to release it into the app stores (Apple App Store and Google Play Store) followed by a review, which is a long and arduous process (review can often take a week, in particular with Apple). Additionally, even though modern smartphones will auto-update in the background, we cannot force users to update the app. This means that the time between code being pushed to `develop`, and it actually being applied to mobile apps can be anywhere from days to weeks.

The OTA updates system sidesteps this hassle, and allows us a lot more flexibility in shipping updates to users quicker, much more like what we are comfortable with. It still comes at a cost (each user must download the bundle and restart), but we can use it for the majority of updates going forward, in particular for fixing bugs in new versions.

## Anatomy of our mobile app

Our mobile app is currently mostly a "web view wrapper", this means we basically load the website inside a web view, and the native part is a somewhat thin wrapper around the website (we do want to move functionality into native screens over time though).

We use React Native through the Expo framework. React Native basically uses JavaScript to manipulate a virtual DOM like normal react, but instead of web React, you don't manipulate `<div>`s, etc instead you manipulate `<ThemedText>`s and `<View>`s that map to actual native iOS/android components.

This means we have three layers:

1. The actual "native base/module": Objective-C (iOS) or Java (Android) code that runs a JavaScript engine (called Hermes) and does things like goes from a `<ThemedText>` cross-platform abstraction to true native components in an appropriate UI framework on the given mobile operating system. This also includes things like providing a unified API to push notifications, and other Expo modules we pull in for common use cases. By and large we do not have to touch this, other than pulling in existing dependencies or tiny bits of code. Expo provides most of this.
2. Our "native shell" code: the JavaScript code that defines where WebViews are, where ThemedText goes, etc. This is interpreted by the native base layer via Hermes and manipulates that code.
3. Our web app: this is loaded within the WebViews from our servers every time the user uses the platform.

We have full control at all times over (3), and OTA updates give us relatively flexible control over (2). We cannot change (1) without going through the app stores. But this pyramid is inverted when it comes to frequency of changes: we only need to touch (1) in very rare cases where we either fully upgrade Expo, or where we add a new native Expo module (like geolocation, etc). We'll sometimes want to touch (2) or if we start moving towards native screens, we'll want to do it with higher frequency. More than half the time though, our changes touch (3), as this is the shared layer used by all clients across web and the apps. This means that OTA updates give us the ability to do something north of 95% of our work without going through the app stores.

### On compatibility: fingerprints and runtimeVersion

It would be a beautiful world if Expo provided a stable ABI between the native base and the native shell (parts (1) and (2) above). However, this is not the case. You need to be very careful to make sure that you only ship code to clients that actually matches the app downloaded from the app stores.

In order to do this, Expo has a "runtimeVersion", that it compares before applying an OTA update to the running app. By default, this runtime version is a hash of a bunch of different data, that is supposed to catch you making breaking changes. This is called a fingerprint. You can actually just make it whatever, if you want to YOLO it, and I believe Expo has a rollback mechanism so it won't brick the app. Still, we need to be very careful with only shipping OTA updates with code that is compatible with the native base.

Currently we use fingerprints as our runtime version. You can decide what stuff to include in the fingerprint (which information to watch for changes with). We use some tiny bit unsafe options, which *may* cause OTA update issues. This is so that we have some more freedom to make safe changes. But in order to catch any potential issues, we also have a "full" fingerprint that we track, which includes everything.

So basically, fingerprints tell you: "here's a unique value that captures all the stuff about the native code that may break OTA updates".

Don't change/regenerate the fingerprints without consulting mobile dev leads. Even the pedantic full ones.

## How OTA updates work

### On the client

I keep saying OTA updates give us "flexibility", but not full control.

In order to update the app, the app needs to download a signed bundle of Hermes compiled JavaScript code. It then needs to **restart the app** in order to apply that code update. In practice you want to always apply a new code bundle at startup, not interrupt a session. You could feasibly download the bundle on app load, then apply it immediately. The Expo default will try to download bundles in the background, then apply them the next moment the user puts the app away and/or restarts it in the foreground.

### Finding out about a new update

In order to find out about a new update, Expo uses the "Expo Updates Protocol v1". This is a relatively straightforward protocol that includes some special headers, and where the backend basically tells the client one of three things: (1) there's no update for you right now, (2) there's a new bundle, and here's where you can find it, or (3) sorry we messed it up, revert to whatever code you shipped with from the app store.

### Our backend implementation

Our backend serves the update protocol in `Bugs.GetNativeUpdateManifest`, which the client loads from `https://api.couchers.org/native/ota/manifest`. This endpoint decides which update to serve, depending on various logic.

### Publishing new updates

The publishing flow involes basically taking a full Expo bundle, signing it, producing a manifest file, and telling the backend about it.

You can see how this works by tracing the staging OTA update flow, where we build a new update on every push to `develop`. For prod the flow is the same, but we have a magic button in a magic place to control when we do it.
