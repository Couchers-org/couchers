import { Meta, Story } from "@storybook/react";
import UserToReference from "features/profile/view/leaveReference/UserToReference";
import users from "test/fixtures/users.json";

export default {
  component: UserToReference,
  title: "Connections/LeaveReference/UserToReference",
} as Meta;

const Template: Story<any> = (args) => <UserToReference {...args} />;

export const userToReference = Template.bind({});
userToReference.args = {
  user: users[0],
};
