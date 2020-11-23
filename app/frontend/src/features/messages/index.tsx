import { TabContext, TabPanel } from "@material-ui/lab";
import * as React from "react";
import PageTitle from "../../components/PageTitle";
import TabBar from "./TabBar";

export default function Messages() {
  const [value, setValue] = React.useState("ALL");
  return (
    <>
      <PageTitle>Messages</PageTitle>
      <TabContext value={value}>
        <TabBar value={value} setValue={setValue} />
        <TabPanel value={"ALL"}>ALL</TabPanel>
        <TabPanel value={"GROUPCHATS"}>GROUPCHATS</TabPanel>
        <TabPanel value={"HOSTING"}>HOSTING</TabPanel>
        <TabPanel value={"SURFING"}>SURFING</TabPanel>
        <TabPanel value={"MEET"}>MEET</TabPanel>
        <TabPanel value={"ARCHIVED"}>ARCHIVED</TabPanel>
      </TabContext>
    </>
  );
}
