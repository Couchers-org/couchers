import { UserConfig } from "next-i18next";

declare module "next-i18next.config" {
  export default { returnNull: false } as UserConfig;
}
