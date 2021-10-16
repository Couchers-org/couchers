import { ExpoConfig, ConfigContext } from "@expo/config";

// prettier-ignore
export default ({ config }: ConfigContext): ExpoConfig =>
  <ExpoConfig>({
    ...config,
    version: process.env.MOBILE_APP_VERSION,
    //  before organizing deployment to the app stores, will also want to specify:
    //   - android.versionCode
    //   - ios.buildNumber
  });
