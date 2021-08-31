import { Meta, Story } from "@storybook/react";
import UserSummary, { UserSummaryProps } from "components/UserSummary";
import users from "test/fixtures/users.json";

export default {
  component: UserSummary,
  title: "Components/Composite/UserSummary",
} as Meta;

const Template: Story<UserSummaryProps> = (args) => <UserSummary {...args} />;

export const userSummary = Template.bind({});
userSummary.args = {
  avatarIsLink: true,
  titleIsLink: false,
  user: users[0],
  nameOnly: false,
  smallAvatar: false,
};

export const Loading = Template.bind({});
