import { Meta, Story } from "@storybook/react";

import NotificationBadge from "./NotificationBadge";

export default {
  title: "Components/Small/NotificationBadge",
  component: NotificationBadge,
} as Meta;

const Template: Story<any> = (args) => (
  <>
    <NotificationBadge count={22} {...args}>
      Messages
    </NotificationBadge>
  </>
);

export const notificationBadge = Template.bind({});
