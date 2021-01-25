import { TabContext, TabPanel } from "@material-ui/lab";
import React from "react";
import { useHistory, useParams } from "react-router";

import { connectionsRoute } from "../../AppRoutes";
import PageTitle from "../../components/PageTitle";
import TabBar from "../../components/TabBar";
import { FriendsTab } from "./friends";

const labels = {
  all: "All",
  friends: "Friends",
};

type ConnectionType = keyof typeof labels;

function ConnectionsPage() {
  const history = useHistory();
  const { type = "all" } = useParams<{ type: string }>();
  const connectionType = type in labels ? (type as ConnectionType) : "all";

  return (
    <>
      <PageTitle>My Connections</PageTitle>
      <TabContext value={connectionType}>
        <TabBar
          value={connectionType}
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
