import { Meta, Story } from "@storybook/react";
import { ReferenceType } from "pb/references_pb";
import { MemoryRouter } from "react-router";
import { leaveReferenceBaseRoute, referenceTypeRoute } from "routes";
import users from "test/fixtures/users.json";

import ReferenceForm, { ReferenceFormProps } from "./ReferenceForm";

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

const Template: Story<ReferenceFormProps> = (args) => {
  return <ReferenceForm {...args} />;
};

export const Friend = Template.bind({});
Friend.args = {
  user: users[4],
};
