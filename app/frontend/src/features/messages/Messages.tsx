import * as React from "react";
import { Route, Switch, useHistory, useParams } from "react-router-dom";

import NotificationBadge from "../../components/NotificationBadge";
import PageTitle from "../../components/PageTitle";
import TabBar from "../../components/TabBar";
import {
  archivedMessagesRoute,
  groupChatsRoute,
  hostingRequestsRoute,
  hostRequestRoute,
  meetRoute,
  messagesRoute,
  newHostRequestRoute,
  surfingRequestsRoute,
} from "../../routes";
import useNotifications from "../useNotifications";
import GroupChatsTab from "./groupchats/GroupChatsTab";
import GroupChatView from "./groupchats/GroupChatView";
import HostRequestView from "./surfing/HostRequestView";
import NewHostRequest from "./surfing/NewHostRequest";
import SurfingTab from "./surfing/SurfingTab";

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
  const { type = "chats" } = useParams<{ type: keyof typeof labels }>();
  const messageType = type in labels ? (type as MessageType) : "chats";

  const header = (
    <>
      <PageTitle>Messages</PageTitle>
      <TabBar
        value={messageType}
        setValue={(newType) => history.push(`${messagesRoute}/${newType}`)}
        labels={labels}
      />
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
        <Route path={`${newHostRequestRoute}/:userId`}>
          <NewHostRequest />
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
