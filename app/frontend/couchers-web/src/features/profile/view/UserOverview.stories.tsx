import { Meta, Story } from "@storybook/react";
import { User } from "couchers-core/src/proto/api_pb";
import React from "react";
import users from "test/fixtures/users.json";

import { ProfileUserProvider } from "../hooks/useProfileUser";
import UserOverview from "./UserOverview";

export default {
  component: UserOverview,
  title: "Profile/UserOverview",
} as Meta;

const Template: Story<{ user: User.AsObject }> = (args) => (
  <ProfileUserProvider {...args}>
    <UserOverview />
  </ProfileUserProvider>
);

export const basicOverview = Template.bind({});
basicOverview.args = {
  user: users[0],
};
