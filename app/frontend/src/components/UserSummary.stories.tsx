import { Meta, Story } from "@storybook/react";
import UserSummary from "components/UserSummary";
import users from "test/fixtures/users.json";

export default {
  component: UserSummary,
  title: "Components/Composite/UserSummary",
} as Meta;

const Template: Story<any> = (args) => (
  <>
    <UserSummary
      user={{
        ...args,
      }}
    />
  </>
);

export const userSummary = Template.bind({});
userSummary.args = {
  ...users[0],
};
