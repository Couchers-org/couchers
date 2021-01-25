import { Meta, Story } from "@storybook/react/types-6-0";
import React from "react";

import FriendList from "./FriendList";

export default {
  title: "FriendList",
  component: FriendList,
} as Meta;

const Template: Story<{}> = () => (
  <div style={{ width: "50%" }}>
    <FriendList />
  </div>
);

export const WithFriends = Template.bind({});
WithFriends.args = {};
