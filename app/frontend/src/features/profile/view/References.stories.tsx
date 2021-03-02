import { Meta, Story } from "@storybook/react";

import { GetReferencesRes, User } from "../../../pb/api_pb";
import { mockedService } from "../../../stories/__mocks__/service";
import references from "../../../test/fixtures/references.json";
import users from "../../../test/fixtures/users.json";
import References from "./References";

export default {
  title: "Profile/References",
  component: References,
} as Meta;

export const UserReferences: Story<{ data: GetReferencesRes.AsObject }> = ({
  data,
}) => {
  setMocks(data);

  return <References user={users[0] as User.AsObject} />;
};

UserReferences.args = {
  data: {
    totalMatches: 3,
    referencesList: references,
  },
};

function setMocks(data: GetReferencesRes.AsObject) {
  mockedService.user.getReferencesReceived = () => Promise.resolve(data);
  mockedService.user.getReferencesGiven = () =>
    Promise.resolve({
      totalMatches: 0,
      referencesList: [],
    });
}
