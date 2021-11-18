# Web - React implementation

We use the [i18next](https://www.i18next.com/) framework for translations.

## Translation namespaces per feature

Each feature contains a set of translations json files. They must be registered at initialization in order to be used.

Procedure:

1. In **app/web/src/i18n.ts** file, add features to the ns (namespaces) array:

```
  .init({
    fallbackLng: "en",
	(...)
    ns: ["donations", "auth"],
  });

```

2. In **app/web/src/react-i18next-types.d.ts** file, declare custom types. In the example below, auth and donations are imported (only english locale is needed here):

```
import auth from "features/auth/locales/en.json";
import donations from "features/donations/locales/en.json";

declare module "react-i18next" {
  interface CustomTypeOptions {
    resources: {
      auth: typeof auth;
      donations: typeof donations;
    };
  }
}
```

3.  Create JSON files

Each feature folder "features/{feature}/" contains a set of "locales/{language}.json files. e.g.:
features/donations/locales/en.json
features/donations/locales/pt.json

## How are translations loaded?

We use [i18next-resources-to-backend](https://github.com/i18next/i18next-resources-to-backend) package that enables integration with translation services.

### Hint

Just in case you want to try some translation out on your browser, during development, you can change the **i18n.ts** file in the init parameters like this:

```
  .init({
    fallbackLng: "pt",
    compatibilityJSON: "v3",
	(...)
    ns: ["donations"],
  });

```
