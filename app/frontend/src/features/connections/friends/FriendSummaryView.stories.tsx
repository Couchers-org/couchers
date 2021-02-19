import { Meta, Story } from "@storybook/react";

import { user1 } from "../../../stories/__mocks__/service";
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
  friend: user1,
};
