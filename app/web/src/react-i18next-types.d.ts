import "react-i18next";

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
