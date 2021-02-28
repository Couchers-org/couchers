import { Meta, Story } from "@storybook/react";

import users from "../../../test/fixtures/users.json";
import FriendSummaryView from "./FriendSummaryView";

export default {
  title: "Me/Connections/FriendSummaryView",
  component: FriendSummaryView,
} as Meta;

const Template: Story<any> = (args) => (
  <>
    <FriendSummaryView {...args}>Children</FriendSummaryView>
  </>
);

export const friendSummaryView = Template.bind({});
friendSummaryView.args = {
  friend: users[0],
};
