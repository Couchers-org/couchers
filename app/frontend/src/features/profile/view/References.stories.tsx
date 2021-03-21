import { Meta, Story } from "@storybook/react";
import { User } from "pb/api_pb";
import { ListReferencesRes } from "pb/references_pb";
import { mockedService } from "stories/__mocks__/service";
import references from "test/fixtures/references.json";
import users from "test/fixtures/users.json";

import References from "./References";

export default {
  component: References,
  title: "Profile/References",
} as Meta;

interface UserReferencesArgs {
  referencesGiven: ListReferencesRes.AsObject;
  referencesReceived: ListReferencesRes.AsObject;
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
    nextPageToken: "",
  },
  referencesReceived: {
    referencesList: references.slice(0, 2),
    nextPageToken: "",
  },
};

function setMocks({ referencesGiven, referencesReceived }: UserReferencesArgs) {
  mockedService.references.getReferencesReceivedForUser = () =>
    Promise.resolve(referencesReceived);
  mockedService.references.getReferencesGivenByUser = () =>
    Promise.resolve(referencesGiven);
}
