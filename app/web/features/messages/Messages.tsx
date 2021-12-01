import { TabContext } from "@material-ui/lab";
import HtmlMeta from "components/HtmlMeta";
import NotificationBadge from "components/NotificationBadge";
import PageTitle from "components/PageTitle";
import TabBar from "components/TabBar";
import MarkAllReadButton from "features/messages/requests/MarkAllReadButton";
import { Route, Switch, useHistory, useParams } from "react-router-dom";
import {
  archivedMessagesRoute,
  groupChatsRoute,
  hostingRequestsRoute,
  hostRequestRoute,
  meetRoute,
  messagesRoute,
  surfingRequestsRoute,
} from "routes";
import makeStyles from "utils/makeStyles";

import useNotifications from "../useNotifications";
import { MESSAGES } from "./constants";
import GroupChatsTab from "./groupchats/GroupChatsTab";
import GroupChatView from "./groupchats/GroupChatView";
import HostRequestView from "./requests/HostRequestView";
import SurfingTab from "./requests/RequestsTab";

const useStyles = makeStyles((theme) => ({
  tabBarContainer: {
    display: "flex",
    justifyContent: "flex-start",
  },
}));

export function MessagesNotification() {
  const { data } = useNotifications();

  return (
    <NotificationBadge count={data?.unseenMessageCount}>
      Chats
    </NotificationBadge>
  );
}

export function HostRequestsReceivedNotification() {
  const { data } = useNotifications();

  return (
    <NotificationBadge count={data?.unseenReceivedHostRequestCount}>
      Hosting
    </NotificationBadge>
  );
}

export function HostRequestsSentNotification() {
  const { data } = useNotifications();

  return (
    <NotificationBadge count={data?.unseenSentHostRequestCount}>
      Surfing
    </NotificationBadge>
  );
}

const labels = {
  //all: "All",
  chats: <MessagesNotification />,
  hosting: <HostRequestsReceivedNotification />,
  surfing: <HostRequestsSentNotification />,
  //meet: "Meet",
  //archived: "Archived",
};

type MessageType = keyof typeof labels;

export default function Messages() {
  const classes = useStyles();
  const history = useHistory();
  const { type = "chats" } = useParams<{ type: string }>();
  const messageType = type in labels ? (type as MessageType) : "chats";

  const header = (
    <>
      <HtmlMeta title={MESSAGES} />
      <PageTitle>{MESSAGES}</PageTitle>
      <div className={classes.tabBarContainer}>
        <TabContext value={messageType}>
          <TabBar
            ariaLabel="Tabs for different message types"
            setValue={(newType) => history.push(`${messagesRoute}/${newType}`)}
            labels={labels}
          />
        </TabContext>
        <MarkAllReadButton type={messageType} />
      </div>
    </>
  );

  return (
    <>
      <Switch>
        <Route path={`${groupChatsRoute}/:groupChatId`}>
          <GroupChatView />
        </Route>
        <Route path={groupChatsRoute}>
          {header}
          <GroupChatsTab />
        </Route>
        <Route path={`${hostRequestRoute}/:hostRequestId`}>
          <HostRequestView />
        </Route>
        <Route path={hostingRequestsRoute}>
          {header}
          <SurfingTab type="hosting" />
        </Route>
        <Route path={surfingRequestsRoute}>
          {header}
          <SurfingTab type="surfing" />
        </Route>
        <Route path={meetRoute}>
          {header}
          MEET
        </Route>
        <Route path={archivedMessagesRoute}>
          {header}
          ARCHIVED
        </Route>
        <Route path={`${messagesRoute}`}>
          {header}
          <GroupChatsTab />
        </Route>
      </Switch>
    </>
  );
}
