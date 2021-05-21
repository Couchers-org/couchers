import { Meta, Story } from "@storybook/react";
import UserOverview from "features/profile/view/UserOverview";
import users from "test/fixtures/users.json";

export default {
  component: UserOverview,
  title: "Profile/UserOverview",
} as Meta;

const Template: Story<any> = (args) => <UserOverview {...args} />;

export const basicOverview = Template.bind({});
basicOverview.args = {
  user: users[0],
};
