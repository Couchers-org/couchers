import { TabContext } from "@material-ui/lab";
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

import useNotifications from "../useNotifications";

const useStyles = makeStyles((theme) => ({
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

const labels: Record<MessageType, ReactNode> = {
  //all: "All",
  chats: <MessagesNotification />,
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

  return (
    <>
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
    </>
  );
}
