import { requireNativeModule } from "expo-modules-core";

type NativeBuildInfoModule = {
  nativeDisplayVersion: string;
  nativeGitHash: string;
  nativeBuiltAt: string;
};

const NativeBuildInfo =
  requireNativeModule<NativeBuildInfoModule>("NativeBuildInfo");

export const nativeDisplayVersion: string =
  NativeBuildInfo.nativeDisplayVersion || "unknown";
export const nativeGitHash: string = NativeBuildInfo.nativeGitHash || "unknown";
export const nativeBuiltAt: string = NativeBuildInfo.nativeBuiltAt || "unknown";
