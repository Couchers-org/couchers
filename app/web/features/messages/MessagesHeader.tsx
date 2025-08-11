import { TabContext } from "@mui/lab";
import { styled } from "@mui/material";
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
import { theme } from "theme";

import useNotifications from "../useNotifications";

const StyledWrapper = styled("div")(() => ({
  padding: theme.spacing(0, 2),
}));

const StyledTabBarContainer = styled("div")(() => ({
  display: "flex",
  justifyContent: "flex-start",
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
  chats: <MessagesNotification />,
  hosting: <HostRequestsReceivedNotification />,
  surfing: <HostRequestsSentNotification />,
};

export default function MessagesHeader({
  tab,
}: {
  tab: MessageType | undefined;
}) {
  const { t } = useTranslation(MESSAGES);
  const router = useRouter();

  return (
    <StyledWrapper>
      <HtmlMeta title={t("messages_page.title")} />
      <PageTitle>{t("messages_page.title")}</PageTitle>
      {tab && <MarkAllReadButton type={tab} />}
      <StyledTabBarContainer>
        <TabContext value={tab ?? ""}>
          <TabBar
            ariaLabel={t("messages_page.tabs.aria_label")}
            setValue={(newTab) => router.push(`${messagesRoute}/${newTab}`)}
            labels={labels}
          />
        </TabContext>
      </StyledTabBarContainer>
    </StyledWrapper>
  );
}
