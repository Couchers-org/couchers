import React from "react";
import { Meta, Story } from "@storybook/react";
import NotificationSettingsSubListItem, {
  NotificationSettingsSubListItemProps,
} from "./NotificationSettingsSubListItem";
import { ThemeProvider } from "@material-ui/core/styles";
import { theme } from "theme";
import { I18nextProvider } from "react-i18next";
import i18n from "test/i18n";

export default {
  title: "Features/Auth/Notifications/NotificationSettingsSubListItem",
  component: NotificationSettingsSubListItem,
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

const Template: Story<NotificationSettingsSubListItemProps> = (args) => (
  <NotificationSettingsSubListItem {...args} />
);

export const Default = Template.bind({});
Default.args = {
  topic: "host_request",
  action: "create",
  email: true,
  push: false,
};

export const EmailAndPushEnabled = Template.bind({});
EmailAndPushEnabled.args = {
  topic: "host_request",
  action: "create",
  email: true,
  push: true,
};

export const EmailDisabledPushEnabled = Template.bind({});
EmailDisabledPushEnabled.args = {
  topic: "host_request",
  action: "create",
  email: false,
  push: true,
};
