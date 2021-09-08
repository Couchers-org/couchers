import { Meta, Story } from "@storybook/react";
import { User } from "couchers-core/src/proto/api_pb";
import Overview, { OverviewProps } from "features/profile/view/Overview";
import users from "test/fixtures/users.json";

import { ProfileUserProvider } from "../hooks/useProfileUser";

export default {
  component: Overview,
  title: "Profile/Overview",
} as Meta;

const Template: Story<{ user: User.AsObject } & OverviewProps> = ({
  user,
  ...overviewProps
}) => (
  <ProfileUserProvider user={user}>
    <Overview {...overviewProps} />
  </ProfileUserProvider>
);

export const profileOverview = Template.bind({});
profileOverview.args = {
  user: users[0],
};
