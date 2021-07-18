import { Meta, Story } from "@storybook/react";
import UserSummary from "components/UserSummary";
import { User } from "proto/api_pb";
import users from "test/fixtures/users.json";

export default {
  component: UserSummary,
  title: "Components/Composite/UserSummary",
} as Meta;

interface UserSummaryArgs {
  user?: User.AsObject;
}

const Template: Story<UserSummaryArgs> = (args) => <UserSummary {...args} />;

export const userSummary = Template.bind({});
userSummary.args = {
  user: users[0],
};

export const Loading = Template.bind({});
