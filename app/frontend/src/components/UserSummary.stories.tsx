import { Meta, Story } from "@storybook/react";

import users from "../test/fixtures/users.json";
import UserSummary from "./UserSummary";

export default {
  title: "Components/Composite/UserSummary",
  component: UserSummary,
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
