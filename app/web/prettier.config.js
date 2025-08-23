const config = {
  // Third-party modules are moved to top by default
  importOrder: ["^@/(.*)$", "^[.]"],
  importOrderSeparation: true,
  importOrderSortSpecifiers: true,
  plugins: ["@trivago/prettier-plugin-sort-imports"],
  trailingComma: "all",
  singleQuote: false,
  tabWidth: 2,
  endingPosition: "absolute-with-indent",
};

export default config;
