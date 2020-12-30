import { TabContext, TabPanel } from "@material-ui/lab";
import React from "react";
import { useHistory, useParams } from "react-router";
import { connectionsRoute } from "../../AppRoutes";
import PageTitle from "../../components/PageTitle";
import FriendsTab from "./friends/FriendsTab";
import TabBar from "../../components/TabBar";

const labels = {
  all: "All",
  friends: "Friends",
};

function ConnectionsPage() {
  const history = useHistory();
  const { type = "all" } = useParams<{ type: keyof typeof labels }>();

  return (
    <>
      <PageTitle>My Connections</PageTitle>
      <TabContext value={type}>
        <TabBar
          value={type}
          setValue={(newType) =>
            history.push(
              `${connectionsRoute}/${newType !== "all" ? newType : ""}`
            )
          }
          labels={labels}
        />
        <TabPanel value="all">ALL</TabPanel>
        <TabPanel value="friends">
          <FriendsTab />
        </TabPanel>
      </TabContext>
    </>
  );
}

export default ConnectionsPage;
