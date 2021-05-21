import { Meta, Story } from "@storybook/react";
import Overview from "features/profile/view/Overview";
import users from "test/fixtures/users.json";

export default {
  component: Overview,
  title: "Profile/UserOverview",
} as Meta;

const Template: Story<any> = (args) => <Overview {...args} />;

export const profileOverview = Template.bind({});
profileOverview.args = {
  user: users[0],
};
