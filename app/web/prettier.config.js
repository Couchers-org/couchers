const config = {
  // Third-party modules are moved to top by default
  importOrder: ["^@/(.*)$", "^[.]"],
  importOrderSeparation: true,
  importOrderSortSpecifiers: true,
  plugins: ["@trivago/prettier-plugin-sort-imports"],
};

export default config;
