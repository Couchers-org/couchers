# Mobile app development

We are building the mobile app using react native & expo.

To run locally for development purposes, you will need an Android or iOS phone
with the Expo app installed. The app can also be run in an emulator but emulator
setup is currently outside the scope of this document.

To get started, run the following:

```
$ expo start
```

This will open the Expo developer tools in the browser and produce a QR code
that can be scanned to start the application.


## CI/CD

We have added a pipeline for mobile ci/cd, using the same strategy as for the web front end.

Tagging any branch with a tag that matches `v[0-9]\.[0-9]\.[0-9]-mobile-preview/` (ie `v0.0.1-mobile-preview`)
will cause the version under consideration to be pushed to Expo Go, effectively acting as a 'preview release'.