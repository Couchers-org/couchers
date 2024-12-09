import { TabContext } from "@mui/lab";
import HtmlMeta from "components/HtmlMeta";
import NotificationBadge from "components/NotificationBadge";
import PageTitle from "components/PageTitle";
import TabBar from "components/TabBar";
import MarkAllReadButton from "features/messages/requests/MarkAllReadButton";
import { useTranslation } from "i18n";
import { MESSAGES } from "i18n/namespaces";
import { useRouter } from "next/router";
import { ReactNode } from "react";
import { messagesRoute, MessageType } from "routes";
import makeStyles from "utils/makeStyles";

//import RequestsTab from "features/messages/requests/RequestsTab"; // added import statement
import useNotifications from "../useNotifications";

const useStyles = makeStyles((theme) => ({
  root: {
    paddingLeft: theme.spacing(2),
    paddingRight: theme.spacing(2),
  },
  tabBarContainer: {
    display: "flex",
    justifyContent: "flex-start",
  },
}));

export function MessagesNotification() {
  const { t } = useTranslation(MESSAGES);
  const { data } = useNotifications();

  return (
    <NotificationBadge count={data?.unseenMessageCount}>
      {t("messages_page.tabs.chats")}
    </NotificationBadge>
  );
}

export function HostRequestsReceivedNotification() {
  const { t } = useTranslation(MESSAGES);
  const { data } = useNotifications();

  return (
    <NotificationBadge count={data?.unseenReceivedHostRequestCount}>
      {t("messages_page.tabs.hosting")}
    </NotificationBadge>
  );
}

export function HostRequestsSentNotification() {
  const { t } = useTranslation(MESSAGES);
  const { data } = useNotifications();

  return (
    <NotificationBadge count={data?.unseenSentHostRequestCount}>
      {t("messages_page.tabs.surfing")}
    </NotificationBadge>
  );
}

// created new functions to collect all notifications
export function AllNotifications() {  
  const { t } = useTranslation(MESSAGES);
  const { data } = useNotifications();

  // define totalNotifications variable 
  const totalNotifications = (data?.unseenMessageCount || 0) 
    + (data?.unseenSentHostRequestCount || 0) 
    + (data?.unseenReceivedHostRequestCount || 0);

  return (
    <NotificationBadge count={totalNotifications}>
      {t("messages_page.tabs.all")}
    </NotificationBadge>
  );
}

// created new function to collect requests 
export function RequestNotifications() {
  const { t } = useTranslation(MESSAGES);
  const { data } = useNotifications();

  // define totalRequests variable
  const totalRequests =
    (data?.unseenReceivedHostRequestCount || 0) 
    + (data?.unseenSentHostRequestCount || 0);

  return (
    <NotificationBadge count={totalRequests}>
      {t("messages_page.tabs.requests")}
    </NotificationBadge>
  );

}

const labels: Record<MessageType, ReactNode> = {
  all: <AllNotifications />, // added tab 
  chats: <MessagesNotification />,
  requests: <RequestNotifications />, // added tab
  hosting: <HostRequestsReceivedNotification />,
  surfing: <HostRequestsSentNotification />,
  //meet: "Meet",
  //archived: "Archived",
};

export default function MessagesHeader({
  tab,
}: {
  tab: MessageType | undefined;
}) {
  const { t } = useTranslation(MESSAGES);
  const classes = useStyles();
  const router = useRouter();

  // MarkAllReadButton type updated  
  return (
    <div className={classes.root}>
      <HtmlMeta title={t("messages_page.title")} />
      <PageTitle>{t("messages_page.title")}</PageTitle>
      {tab && <MarkAllReadButton type={tab} />} 
      <div className={classes.tabBarContainer}>
        <TabContext value={tab ?? ""}> 
          <TabBar
            ariaLabel={t("messages_page.tabs.aria_label")}
            setValue={(newTab) => router.push(`${messagesRoute}/${newTab}`)}
            labels={labels}
          />
        </TabContext>
      </div>
    </div>
  );
}
