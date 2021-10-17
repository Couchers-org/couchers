import "react-i18next";

import donations from "features/donations/locales/en.json";

declare module "react-i18next" {
  interface CustomTypeOptions {
    resources: {
      donations: typeof donations;
    };
  }
}
