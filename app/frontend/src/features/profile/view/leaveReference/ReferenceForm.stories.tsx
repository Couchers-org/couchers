import { Meta, Story } from "@storybook/react";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import { ReferenceType } from "pb/references_pb";
import { MemoryRouter } from "react-router";
import { leaveReferenceBaseRoute, referenceTypeRoute } from "routes";
import { mockedService } from "stories/serviceMocks";
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
  argTypes: {
    user: users[4],
  },
} as Meta;

interface ReferenceFormArgs {
  isLoading?: boolean;
  shouldSucceed?: boolean;
}

const Template: Story<ReferenceFormArgs> = ({
  isLoading = false,
  shouldSucceed = true,
} = {}) => {
  setMocks({ isLoading, shouldSucceed });
  return <ReferenceForm user={users[4]} />;
};

export const Loading = Template.bind({});
Loading.args = {
  isLoading: true,
};

export const Success = Template.bind({});

export const Failed = Template.bind({});
Failed.args = {
  shouldSucceed: false,
};

function setMocks({ isLoading, shouldSucceed }: Required<ReferenceFormArgs>) {
  mockedService.account.completeChangeEmail = () =>
    isLoading
      ? new Promise(() => void 0)
      : shouldSucceed
      ? Promise.resolve(new Empty())
      : Promise.reject(new Error("Invalid token"));
}
