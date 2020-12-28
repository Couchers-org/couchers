import { ThemeProvider } from "@material-ui/core";
import { theme } from "../src/theme";
import "../src/App.css";
import "./reset.css";

export const parameters = {
  actions: { argTypesRegex: "^on[A-Z].*" },
};

export const decorators = [
  (Story, context) => (
    <ThemeProvider theme={theme}>
      <Story {...context} />
    </ThemeProvider>
  ),
];
