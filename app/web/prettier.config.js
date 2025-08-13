const config = {
  importOrder: ["<THIRD_PARTY_MODULES>", "^[./]"],
  importOrderSeparation: true,
  importOrderSortSpecifiers: true,
  printWidth: 79,
  plugins: ["@trivago/prettier-plugin-sort-imports"],
  trailingComma: "all",
  singleQuote: false,
  tabWidth: 2,
  endingPosition: "absolute-with-indent",
};

export default config;
