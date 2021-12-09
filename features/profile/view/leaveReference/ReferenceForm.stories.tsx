import { Meta, Story } from "@storybook/react";
import { ProfileUserProvider } from "features/profile/hooks/useProfileUser";
import { User } from "proto/api_pb";
import users from "test/fixtures/users.json";

import ReferenceForm from "./ReferenceForm";

export default {
  component: ReferenceForm,
  title: "Profile/References/ReferenceForm",
} as Meta;

const Template: Story<{ user: User.AsObject; type: string }> = (args) => {
  return (
    <ProfileUserProvider {...args}>
      <ReferenceForm referenceType={args.type} userId={args.user.userId} />
    </ProfileUserProvider>
  );
};

export const Friend = Template.bind({});
Friend.args = {
  user: users[4],
  type: "friend",
};
