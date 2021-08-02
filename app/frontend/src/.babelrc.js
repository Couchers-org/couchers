const path = require('path');

absoluteRuntimePath = path.dirname(
  require.resolve("@babel/runtime/package.json")
);

const presets = [
  [
    "@babel/preset-env",
    {
      targets: {
        node: "current"
      }
    }
  ],
  [
    "@babel/preset-react",
    {
      throwIfNamespace: false, // defaults to true
      runtime: "automatic" // defaults to classic
    }
  ],
  "@babel/preset-typescript"
]

const plugins = [
  [
    "module-resolver", {
      "root": ["./src/"],
      "alias": {
        "components": "./src/components",
        "features": "./src/features",
        "proto": "./src/proto",
        "resources": "./src/resources",
        "server": "./src/server",
        "service": "./src/service",
        "stories": "./src/stories",
        "test": "./src/test",
        "utils": "./src/utils"
      }
    }
  ],
  [
    "@babel/plugin-transform-runtime",
    {
      corejs: false,
      version: require("@babel/runtime/package.json").version,
      regenerator: true,
      absoluteRuntime: absoluteRuntimePath
    }
  ]
]

module.exports = { presets, plugins };
