import { ThemeProvider } from "@material-ui/core/styles";
import { Meta, Story } from "@storybook/react";
import { GetNotificationSettingsRes } from "proto/notifications_pb";
import React from "react";
import { I18nextProvider } from "react-i18next";
import { mockedService } from "stories/serviceMocks";
import notifications from "test/fixtures/notifications.json";
import i18n from "test/i18n";
import { theme } from "theme";

import EditNotificationSettingsPage from "./EditNotificationSettingsPage";

export default {
  title: "Features/Auth/Notifications/EditNotificationSettingsPage",
  component: EditNotificationSettingsPage,
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

const Template: Story = () => {
  setMocks();
  return <EditNotificationSettingsPage />;
};

export const Default = Template.bind({});

function setMocks() {
  mockedService.notifications.getNotificationSettings =
    (): Promise<GetNotificationSettingsRes.AsObject> =>
      Promise.resolve(notifications);
}
