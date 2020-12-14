import { TabContext, TabPanel } from "@material-ui/lab";
import React, { useState } from "react";
import PageTitle from "../../components/PageTitle";
import FriendsTab from "./friends/FriendsTab";
import TabBar from "../../components/TabBar";

const labels = {
  TAB_ALL: "All",
  TAB_FRIENDS: "Friends",
};

function ConnectionsPage() {
  const [value, setValue] = useState<keyof typeof labels>("TAB_ALL");
  return (
    <>
      <PageTitle>My Connections</PageTitle>
      <TabContext value={value}>
        <TabBar value={value} setValue={setValue} labels={labels} />
        <TabPanel value="TAB_ALL">ALL</TabPanel>
        <TabPanel value="TAB_FRIENDS">
          <FriendsTab />
        </TabPanel>
      </TabContext>
    </>
  );
}

export default ConnectionsPage;
