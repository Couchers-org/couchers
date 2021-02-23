import { Container } from "@material-ui/core";
import { Meta, Story } from "@storybook/react";
import { MemoryRouter, Route } from "react-router-dom";

import { useStyles } from "../../App";
import { userRoute } from "../../routes";
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

export const UserProfilePage: Story<{}> = () => {
  const classes = useStyles();
  return (
    <Container maxWidth="md" className={classes.padding}>
      <UserPage />
    </Container>
  );
};
