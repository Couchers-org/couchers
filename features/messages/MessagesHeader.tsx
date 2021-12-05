import { TabContext } from "@material-ui/lab";
import HtmlMeta from "components/HtmlMeta";
import NotificationBadge from "components/NotificationBadge";
import PageTitle from "components/PageTitle";
import TabBar from "components/TabBar";
import MarkAllReadButton from "features/messages/requests/MarkAllReadButton";
import { useRouter } from "next/router";
import { messagesRoute } from "routes";
import makeStyles from "utils/makeStyles";

import useNotifications from "../useNotifications";
import { MESSAGES } from "./constants";

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

export default function Messages({ tab = "chats" }: { tab: MessageType }) {
  const classes = useStyles();
  const router = useRouter();

  return (
    <>
      <HtmlMeta title={MESSAGES} />
      <PageTitle>{MESSAGES}</PageTitle>
      <div className={classes.tabBarContainer}>
        <TabContext value={tab}>
          <TabBar
            ariaLabel="Tabs for different message types"
            setValue={(newTab) => router.push(`${messagesRoute}/${newTab}`)}
            labels={labels}
          />
        </TabContext>
        <MarkAllReadButton type={tab} />
      </div>
    </>
  );
}
