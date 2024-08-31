import React from "react";
import { Meta, Story } from "@storybook/react";
import NotificationSettingsListItem from "./NotificationSettingsListItem";
import { NotificationSettingsListItemProps } from "./NotificationSettingsListItem";

import { ThemeProvider } from "@material-ui/core/styles";
import { theme } from "theme";
import { I18nextProvider } from "react-i18next";
import i18n from "test/i18n";

const mockItems = [
  {
    action: "create",
    description: "Someone sends you a host request",
    userEditable: true,
    push: false,
    email: true,
    topic: "host_request",
  },

  {
    action: "accept",
    description: "Someone accepts your host request",
    userEditable: true,
    push: true,
    email: true,
    topic: "host_request",
  },
  {
    action: "confirm",
    description: "Someone confirms their host request",
    userEditable: true,
    push: true,
    email: true,
    topic: "host_request",
  },
  {
    action: "reject",
    description: "Someone declines your host request",
    userEditable: true,
    push: true,
    email: true,
    topic: "host_request",
  },
  {
    action: "cancel",
    description: "Someone cancels their host request",
    userEditable: true,
    push: true,
    email: true,
    topic: "host_request",
  },
  {
    action: "message",
    description: "Someone sends a message in a host request",
    userEditable: true,
    push: true,
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
        <ThemeProvider theme={theme}>
          <Story />
        </ThemeProvider>
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

export const WithMultipleEditableItems = Template.bind({});
WithMultipleEditableItems.args = {
  items: [
    ...mockItems,
    {
      action: "two_factor_authentication",
      description: "Enable two-factor authentication",
      email: false,
      push: true,
      topic: "host_request",
      userEditable: true,
    },
  ],
  type: "host_request",
};

export const WithAllItemsDisabled = Template.bind({});
WithAllItemsDisabled.args = {
  items: mockItems.map((item) => ({ ...item, userEditable: false })),
  type: "host_request",
};
