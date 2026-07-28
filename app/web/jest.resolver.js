// temporal-polyfill and temporal-utils only publish an "import" export condition, which
// Jest's default CJS module resolution doesn't request, so plain `require()` resolution
// fails with "Cannot find module". Request the "import" condition just for these packages
// instead of globally (globally breaks other node_modules that pick their unbuilt ESM entry
// over a CJS one, e.g. dedent).
const ESM_ONLY_PACKAGES = ["temporal-polyfill", "temporal-utils"];

module.exports = (path, options) => {
  const isEsmOnly = ESM_ONLY_PACKAGES.some(
    (name) => path === name || path.startsWith(`${name}/`),
  );
  if (isEsmOnly) {
    return options.defaultResolver(path, {
      ...options,
      conditions: [...(options.conditions ?? []), "import"],
    });
  }
  return options.defaultResolver(path, options);
};
