import { Meta, Story } from "@storybook/react";
import { GetReferencesRes, User } from "pb/api_pb";
import { mockedService } from "stories/__mocks__/service";
import references from "test/fixtures/references.json";
import users from "test/fixtures/users.json";

import References from "./References";

export default {
  component: References,
  title: "Profile/References",
} as Meta;

interface UserReferencesArgs {
  referencesGiven: GetReferencesRes.AsObject;
  referencesReceived: GetReferencesRes.AsObject;
}

export const UserReferences: Story<UserReferencesArgs> = ({
  referencesGiven,
  referencesReceived,
}) => {
  setMocks({ referencesGiven, referencesReceived });

  return <References user={users[0] as User.AsObject} />;
};

UserReferences.args = {
  referencesGiven: {
    referencesList: references.slice(2),
    totalMatches: 1,
  },
  referencesReceived: {
    referencesList: references.slice(0, 2),
    totalMatches: 2,
  },
};

function setMocks({ referencesGiven, referencesReceived }: UserReferencesArgs) {
  mockedService.user.getReferencesReceived = () =>
    Promise.resolve(referencesReceived);
  mockedService.user.getReferencesGiven = () =>
    Promise.resolve(referencesGiven);
}
