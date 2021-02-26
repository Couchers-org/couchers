import { Meta, Story } from "@storybook/react";

import { GetReferencesRes, ReferenceType, User } from "../../pb/api_pb";
import { mockedService } from "../../stories/__mocks__/service";
import users from "../../test/fixtures/users.json";
import UserReferences from "./UserReferences";

export default {
  title: "Profile/UserReferences",
  component: UserReferences,
} as Meta;

export const userReferences: Story<{ data: GetReferencesRes.AsObject }> = ({
  data,
}) => {
  setMocks(data);

  return <UserReferences user={users[0] as User.AsObject} />;
};

userReferences.args = {
  data: {
    totalMatches: 2,
    referencesList: [
      {
        fromUserId: 2,
        toUserId: 1,
        referenceType: ReferenceType.FRIEND,
        text: "Funny person with dark sense of humour",
        writtenTime: {
          seconds: 1577900000,
          nanos: 0,
        },
      },
      {
        fromUserId: 3,
        toUserId: 1,
        referenceType: ReferenceType.SURFED,
        text:
          "I had a great time with cat. We talked about similarities between kid and cat food.",
        writtenTime: {
          seconds: 1583020800,
          nanos: 0,
        },
      },
      {
        fromUserId: 3,
        toUserId: 1,
        referenceType: ReferenceType.SURFED,
        text: `Staying with Cat was such an amazing experience!
        They were generous enough to share their time with me and showed me around the city even though
        they were busy revising for a final year exam! Their housemates were also super nice and friendly.
        I highly recommend staying with them if you get the chance!`,
        writtenTime: {
          seconds: 1512344000,
          nanos: 0,
        },
      },
    ],
  },
};

function setMocks(data: GetReferencesRes.AsObject) {
  mockedService.user.getReferencesReceived = () => Promise.resolve(data);
}
