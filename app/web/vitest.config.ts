import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

// const createJestConfig = nextJest({ dir: "./" });

// const envVarPrefix = "NEXT_PUBLIC_";

// const utils = configUtils(envVarPrefix);

// // eslint-disable-next-line n/no-process-env
// const parsedEnv = Value.Parse(utils.schema, process.env);

// const config = {};
// Object.assign(config, utils.getStringReplacements(parsedEnv));

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: "jsdom",
    // globals: {
    //   Config: config,
    // },
  },
});
