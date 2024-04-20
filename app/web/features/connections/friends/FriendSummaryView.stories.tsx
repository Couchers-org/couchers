import { Meta, Story } from "@storybook/react";
import users from "test/fixtures/users.json";

import FriendSummaryView from "./FriendSummaryView";

export default {
  component: FriendSummaryView,
  title: "Me/Connections/FriendSummaryView",
} as Meta;

const Template: Story<any> = (args) => (
  <FriendSummaryView {...args}>Children</FriendSummaryView>
);

export const friendSummaryView = Template.bind({});
friendSummaryView.args = {
  friend: users[0],
};
