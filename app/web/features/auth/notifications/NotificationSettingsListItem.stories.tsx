import {
  StyledEngineProvider,
  Theme,
  ThemeProvider,
} from "@mui/material/styles";
import { Meta, Story } from "@storybook/react";
import React from "react";
import { I18nextProvider } from "react-i18next";
import i18n from "test/i18n";
import { theme } from "theme";

import NotificationSettingsListItem, {
  NotificationSettingsListItemProps,
} from "./NotificationSettingsListItem";

declare module "@mui/styles/defaultTheme" {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface DefaultTheme extends Theme {}
}

const mockItems = [
  {
    action: "create",
    description: "Someone sends you a host request",
    userEditable: true,
    push: false,
    digest: false,
    email: true,
    topic: "host_request",
  },

  {
    action: "accept",
    description: "Someone accepts your host request",
    userEditable: true,
    push: true,
    digest: false,
    email: true,
    topic: "host_request",
  },
  {
    action: "confirm",
    description: "Someone confirms their host request",
    userEditable: true,
    push: true,
    digest: false,
    email: true,
    topic: "host_request",
  },
  {
    action: "reject",
    description: "Someone declines your host request",
    userEditable: true,
    push: true,
    digest: false,
    email: true,
    topic: "host_request",
  },
  {
    action: "cancel",
    description: "Someone cancels their host request",
    userEditable: true,
    push: true,
    digest: false,
    email: true,
    topic: "host_request",
  },
  {
    action: "message",
    description: "Someone sends a message in a host request",
    userEditable: true,
    push: true,
    digest: false,
    email: false,
    topic: "host_request",
  },
  {
    action: "missed_messages",
    description: "You miss messages in a host request",
    digest: false,
    email: true,
    push: false,
    topic: "host_request",
    userEditable: true,
  },
];

export default {
  title: "Features/Auth/Notifications/NotificationSettingsListItem",
  component: NotificationSettingsListItem,
  decorators: [
    (Story) => (
      <I18nextProvider i18n={i18n}>
        <StyledEngineProvider injectFirst>
          <ThemeProvider theme={theme}>
            <Story />
          </ThemeProvider>
        </StyledEngineProvider>
      </I18nextProvider>
    ),
  ],
} as Meta;

const Template: Story<NotificationSettingsListItemProps> = (args) => (
  <NotificationSettingsListItem {...args} />
);

export const Default = Template.bind({});
Default.args = {
  items: mockItems,
  type: "host_request",
};

export const WithAllUserEditableFalse = Template.bind({});
WithAllUserEditableFalse.args = {
  items: mockItems.map((item) => ({ ...item, userEditable: false })),
  type: "host_request",
};
