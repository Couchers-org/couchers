import "react-i18next";

import resources from "./resources";

declare module "react-i18next" {
  interface CustomTypeOptions {
    resources: typeof resources;
  }
}
