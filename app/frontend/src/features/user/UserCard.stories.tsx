import { Collapse } from "@material-ui/core";
import { action } from "@storybook/addon-actions";
import { Meta, Story } from "@storybook/react";
import NewHostRequest from "features/messages/requests/NewHostRequest";
import UserCard from "features/user/UserCard";
import React, { useState } from "react";
import { MemoryRouter as Router, Route } from "react-router-dom";
import { profileRoute, routeToProfile, UserTab } from "routes";
import defaultUser from "test/fixtures/defaultUser.json";

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
        <UserCard
          user={defaultUser}
          onTabChange={action("change tab with story controls")}
          top={
            isRequesting ? (
              <>
                <Collapse in={request}>
                  <NewHostRequest
                    user={defaultUser}
                    setIsRequesting={setRequest}
                    setIsRequestSuccess={action("set is request success")}
                  />
                </Collapse>
              </>
            ) : null
          }
        />
      </Route>
    </Router>
  );
};

export const Default = Template.bind({});
Default.args = {
  isRequesting: false,
  tab: "about",
};
