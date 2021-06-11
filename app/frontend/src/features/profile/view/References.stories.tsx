import { Meta, Story } from "@storybook/react";
import { ListReferencesRes, ReferenceType } from "proto/references_pb";
import { mockedService } from "stories/serviceMocks";
import references from "test/fixtures/references.json";
import users from "test/fixtures/users.json";

import { ProfileUserProvider } from "../hooks/useProfileUser";
import References from "./References";

const [friendReference, guestReference1, guestReference2, givenReference] =
  references;

export default {
  component: References,
  decorators: [
    (Story) => (
      <ProfileUserProvider user={users[0]}>
        <Story />
      </ProfileUserProvider>
    ),
  ],
  title: "Profile/References",
} as Meta;

export const UserReferences: Story<{}> = () => {
  setMocks();

  return <References />;
};

function setMocks() {
  mockedService.references.getReferencesReceivedForUser = async ({
    referenceType,
    pageToken,
  }) => {
    const referencesReceived: ListReferencesRes.AsObject = {
      nextPageToken: "",
      referencesList: [],
    };
    switch (referenceType) {
      case ReferenceType.REFERENCE_TYPE_HOSTED:
        return referencesReceived;
      case ReferenceType.REFERENCE_TYPE_FRIEND:
        referencesReceived.referencesList = [friendReference];
        return referencesReceived;
      case ReferenceType.REFERENCE_TYPE_SURFED:
        referencesReceived.referencesList = pageToken
          ? [guestReference2]
          : [guestReference1];
        referencesReceived.nextPageToken = pageToken ? "" : "1";
        return referencesReceived;
      case "all":
        referencesReceived.referencesList = [
          friendReference,
          guestReference1,
          guestReference2,
        ];
        return referencesReceived;
    }
  };
  mockedService.references.getReferencesGivenByUser = () =>
    Promise.resolve({
      referencesList: [givenReference],
      nextPageToken: "",
    });
}
