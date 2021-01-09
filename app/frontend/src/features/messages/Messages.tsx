import { TabContext, TabPanel } from "@material-ui/lab";
import * as React from "react";
import PageTitle from "../../components/PageTitle";
import GroupChatsTab from "./groupchats/GroupChatsTab";
import SurfingTab from "./surfing/SurfingTab";
import TabBar from "../../components/TabBar";
import { useHistory, useParams } from "react-router-dom";
import { messagesRoute } from "../../AppRoutes";

const labels = {
  all: "All",
  groupchats: "Group Chats",
  hosting: "Hosting",
  surfing: "Surfing",
  meet: "Meet",
  archived: "Archived",
};

export default function Messages() {
  const history = useHistory();
  const { type = "all" } = useParams<{ type: keyof typeof labels }>();

  return (
    <>
      <PageTitle>Messages</PageTitle>
      <TabContext value={type}>
        <TabBar
          value={type}
          setValue={(newType) =>
            history.push(`${messagesRoute}/${newType !== "all" ? newType : ""}`)
          }
          labels={labels}
        />
        <TabPanel value="all">ALL</TabPanel>
        <TabPanel value="groupchats">
          <GroupChatsTab />
        </TabPanel>
        <TabPanel value="hosting">HOSTING</TabPanel>
        <TabPanel value="surfing">
          <SurfingTab />
        </TabPanel>
        <TabPanel value="meet">MEET</TabPanel>
        <TabPanel value="archived">ARCHIVED</TabPanel>
      </TabContext>
    </>
  );
}
