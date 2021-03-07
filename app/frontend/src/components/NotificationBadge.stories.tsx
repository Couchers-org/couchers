import { Meta, Story } from "@storybook/react";
import React from "react";

import NotificationBadge from "./NotificationBadge";
import TextBody from "./TextBody";

export default {
  component: NotificationBadge,
  title: "Components/Simple/NotificationBadge",
} as Meta;

const Template: Story<any> = (args) => (
  <>
    <NotificationBadge count={22} {...args}>
      <TextBody>Messages</TextBody>
    </NotificationBadge>
  </>
);

export const notificationBadge = Template.bind({});
