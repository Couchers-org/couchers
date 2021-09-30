import { Collapse } from "@material-ui/core";
import { action } from "@storybook/addon-actions";
import { Meta, Story } from "@storybook/react";
import { ProfileUserProvider } from "features/profile/hooks/useProfileUser";
import NewHostRequest from "features/profile/view/NewHostRequest";
import { useState } from "react";
import { MemoryRouter as Router, Route } from "react-router-dom";
import { profileRoute, routeToProfile, UserTab } from "routes";
import defaultUser from "test/fixtures/defaultUser.json";

import UserCard from "./UserCard";

export default {
  title: "Profile/UserCard",
} as Meta;

const Template: Story<{ tab: UserTab; isRequesting: boolean }> = ({
  isRequesting,
  tab,
}) => {
  const [request, setRequest] = useState(isRequesting);
  return (
    <Router initialEntries={[routeToProfile(tab)]}>
      <Route path={profileRoute}>
        <ProfileUserProvider user={defaultUser}>
          <UserCard
            onTabChange={action("change tab with story controls")}
            top={
              isRequesting ? (
                <>
                  <Collapse in={request}>
                    <NewHostRequest
                      setIsRequesting={setRequest}
                      setIsRequestSuccess={action("set is request success")}
                    />
                  </Collapse>
                </>
              ) : null
            }
          />
        </ProfileUserProvider>
      </Route>
    </Router>
  );
};

export const Default = Template.bind({});
Default.args = {
  isRequesting: false,
  tab: "about",
};
