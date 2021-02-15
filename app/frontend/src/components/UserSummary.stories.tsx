import { Meta, Story } from "@storybook/react";

import { user1 } from "../stories/__mocks__/service";
import UserSummary from "./UserSummary";

export default {
  title: "Components/Large/UserSummary",
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
  ...user1,
};
