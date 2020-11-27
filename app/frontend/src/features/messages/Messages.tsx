import { TabContext, TabPanel } from "@material-ui/lab";
import * as React from "react";
import PageTitle from "../../components/PageTitle";
import GroupChatsTab from "./groupchats/GroupChatsTab";
import SurfingTab from "./surfing/SurfingTab";
import TabBar from "./TabBar";
import { labels } from "./constants";

export default function Messages() {
  const [value, setValue] = React.useState<keyof typeof labels>("TAB_ALL");
  return (
    <>
      <PageTitle>Messages</PageTitle>
      <TabContext value={value}>
        <TabBar value={value} setValue={setValue} labels={labels} />
        <TabPanel value={"TAB_ALL"}>ALL</TabPanel>
        <TabPanel value={"TAB_GROUPCHATS"}>
          <GroupChatsTab />
        </TabPanel>
        <TabPanel value={"TAB_HOSTING"}>HOSTING</TabPanel>
        <TabPanel value={"TAB_SURFING"}>SURFING</TabPanel>
        <TabPanel value={"TAB_MEET"}>MEET</TabPanel>
        <TabPanel value={"TAB_ARCHIVED"}>ARCHIVED</TabPanel>
      </TabContext>
    </>
  );
}
