import { ThemeProvider } from "@material-ui/core";
import { QueryClient, QueryClientProvider } from "react-query";
import { MemoryRouter } from "react-router-dom";
import { theme } from "../src/theme";
import "../src/App.css";
import "./reset.css";

export const parameters = {
  actions: { argTypesRegex: "^on[A-Z].*" },
  options: {
    storySort: {
      order: ["Couchers Storybook"],
    }
  }
};

export const decorators = [
  (Story, context) => {
    const client = new QueryClient({
      defaultOptions: { queries: { refetchOnWindowFocus: false } },
    });
    return (
      <ThemeProvider theme={theme}>
        <QueryClientProvider client={client}>
          <MemoryRouter>
            <Story {...context} />
          </MemoryRouter>
        </QueryClientProvider>
      </ThemeProvider>
    );
  },
];
