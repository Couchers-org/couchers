import { Meta, Story } from "@storybook/react";
import { User } from "couchers-core/src/proto/api_pb";
import { ReferenceType } from "couchers-core/src/proto/references_pb";
import { ProfileUserProvider } from "features/profile/hooks/useProfileUser";
import { MemoryRouter } from "react-router";
import { leaveReferenceBaseRoute, referenceTypeRoute } from "routes";
import users from "test/fixtures/users.json";

import ReferenceForm from "./ReferenceForm";

export default {
  component: ReferenceForm,
  decorators: [
    (Story) => (
      <MemoryRouter
        initialEntries={[
          `${leaveReferenceBaseRoute}/${
            referenceTypeRoute[ReferenceType.REFERENCE_TYPE_FRIEND]
          }/:userId`,
        ]}
      >
        <Story />
      </MemoryRouter>
    ),
  ],
  title: "Profile/References/ReferenceForm",
} as Meta;

const Template: Story<{ user: User.AsObject }> = (args) => {
  return (
    <ProfileUserProvider {...args}>
      <ReferenceForm />
    </ProfileUserProvider>
  );
};

export const Friend = Template.bind({});
Friend.args = {
  user: users[4],
};
