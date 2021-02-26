import { Container } from "@material-ui/core";
import { Meta, Story } from "@storybook/react";
import { MemoryRouter, Route } from "react-router-dom";

import { useStyles } from "../../AppRoute";
import { GetReferencesRes, ReferenceType } from "../../pb/api_pb";
import { userRoute } from "../../routes";
import { mockedService } from "../../stories/__mocks__/service";
import UserPage from "./UserPage";

export default {
  title: "Profile/UserPage",
  component: UserPage,
  decorators: [
    (Story) => (
      <MemoryRouter initialEntries={[`${userRoute}/funnycat`]}>
        <Route path={`${userRoute}/:username`}>
          <Story />
        </Route>
      </MemoryRouter>
    ),
  ],
} as Meta;

export const UserProfilePage: Story<{ data: GetReferencesRes.AsObject }> = ({
  data,
}) => {
  const classes = useStyles();

  setMocks(data);

  return (
    <Container maxWidth="md" className={classes.fullscreenContainer}>
      <UserPage />
    </Container>
  );
};
UserProfilePage.args = {
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
        referenceType: 1,
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
        referenceType: 1,
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
