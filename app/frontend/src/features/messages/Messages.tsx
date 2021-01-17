import { TabContext, TabPanel } from "@material-ui/lab";
import * as React from "react";
import PageTitle from "../../components/PageTitle";
import GroupChatsTab from "./groupchats/GroupChatsTab";
import SurfingTab from "./surfing/SurfingTab";
import TabBar from "../../components/TabBar";
import { useHistory, useParams } from "react-router-dom";
import { messagesRoute } from "../../AppRoutes";
import { makeStyles } from "@material-ui/core";

const useStyles = makeStyles((theme) => ({
  panel: {
    paddingInline: 0,
  },
}));

const labels = {
  all: "All",
  groupchats: "Group Chats",
  hosting: "Hosting",
  surfing: "Surfing",
  meet: "Meet",
  archived: "Archived",
};

type MessageType = keyof typeof labels;

export default function Messages() {
  const classes = useStyles();
  const history = useHistory();
  const { type = "all" } = useParams<{ type: keyof typeof labels }>();
  const messageType = type in labels ? (type as MessageType) : "all";

  return (
    <>
      <PageTitle>Messages</PageTitle>
      <TabContext value={messageType}>
        <TabBar
          value={messageType}
          setValue={(newType) =>
            history.push(`${messagesRoute}/${newType !== "all" ? newType : ""}`)
          }
          labels={labels}
        />
        <TabPanel value="all" className={classes.panel}>
          ALL
        </TabPanel>
        <TabPanel value="groupchats" className={classes.panel}>
          <GroupChatsTab />
        </TabPanel>
        <TabPanel value="hosting" className={classes.panel}>
          <SurfingTab type="hosting" />
        </TabPanel>
        <TabPanel value="surfing" className={classes.panel}>
          <SurfingTab type="surfing" />
        </TabPanel>
        <TabPanel value="meet" className={classes.panel}>
          MEET
        </TabPanel>
        <TabPanel value="archived" className={classes.panel}>
          ARCHIVED
        </TabPanel>
      </TabContext>
    </>
  );
}
