import { Meta, Story } from "@storybook/react";
import React from "react";

import FriendList from "./FriendList";

export default {
  component: FriendList,
  title: "Me/Connections/FriendList",
} as Meta;

const Template: Story<{}> = () => (
  <div style={{ width: "50%" }}>
    <FriendList />
  </div>
);

export const WithFriends = Template.bind({});
WithFriends.args = {};
