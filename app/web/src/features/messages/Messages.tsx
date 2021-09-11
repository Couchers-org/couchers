import { TabContext } from "@material-ui/lab";
import NotificationBadge from "components/NotificationBadge";
import PageTitle from "components/PageTitle";
import TabBar from "components/TabBar";
import { Route, Switch, useHistory, useParams } from "react-router-dom";
import {
  archivedMessagesRoute,
  chatsRoute,
  hostingRequestsRoute,
  hostRequestRoute,
  meetRoute,
  messagesRoute,
  surfingRequestsRoute,
} from "routes";

import useNotifications from "../useNotifications";
import { MESSAGES } from "./constants";
import ChatsTab from "./chats/ChatsTab";
import ChatView from "./chats/ChatView";
import HostRequestView from "./requests/HostRequestView";
import SurfingTab from "./requests/RequestsTab";

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
  const history = useHistory();
  const { type = "chats" } = useParams<{ type: string }>();
  const messageType = type in labels ? (type as MessageType) : "chats";

  const header = (
    <>
      <PageTitle>{MESSAGES}</PageTitle>
      <TabContext value={messageType}>
        <TabBar
          ariaLabel="Tabs for different message types"
          setValue={(newType) => history.push(`${messagesRoute}/${newType}`)}
          labels={labels}
        />
      </TabContext>
    </>
  );

  return (
    <>
      <Switch>
        <Route path={`${chatsRoute}/:chatId`}>
          <ChatView />
        </Route>
        <Route path={chatsRoute}>
          {header}
          <ChatsTab />
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
          <ChatsTab />
        </Route>
      </Switch>
    </>
  );
}
