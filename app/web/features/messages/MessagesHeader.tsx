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

import useNotifications from "../useNotifications";

const StyledRoot = styled("div")(({ theme }) => ({
  paddingLeft: theme.spacing(2),
  paddingRight: theme.spacing(2),
}));

const StyledTabBarContainer = styled("div")({
  display: "flex",
  justifyContent: "flex-start",
});

const StyledLabelWrapper = styled("span")({
  paddingRight: "1.8rem", // visually compensate for NotificationBadge's right offset
});

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

export function ArchivedNotification() {
  const { t } = useTranslation(MESSAGES);

  return <>{t("messages_page.tabs.archived")}</>;
}

const labels: Record<MessageType, ReactNode> = {
  chats: (
    <StyledLabelWrapper>
      <MessagesNotification />
    </StyledLabelWrapper>
  ),
  hosting: (
    <StyledLabelWrapper>
      <HostRequestsReceivedNotification />
    </StyledLabelWrapper>
  ),
  surfing: (
    <StyledLabelWrapper>
      <HostRequestsSentNotification />
    </StyledLabelWrapper>
  ),
  archived: (
    <StyledLabelWrapper>
      <ArchivedNotification />
    </StyledLabelWrapper>
  ),
};

export default function MessagesHeader({
  tab,
}: {
  tab: MessageType | undefined;
}) {
  const { t } = useTranslation(MESSAGES);
  const router = useRouter();

  return (
    <StyledRoot>
      <HtmlMeta title={t("messages_page.title")} />
      <PageTitle>{t("messages_page.title")}</PageTitle>
      {tab && tab !== "archived" && <MarkAllReadButton type={tab} />}
      <StyledTabBarContainer>
        <TabContext value={tab ?? ""}>
          <TabBar
            ariaLabel={t("messages_page.tabs.aria_label")}
            setValue={(newTab) => router.push(`${messagesRoute}/${newTab}`)}
            labels={labels}
          />
        </TabContext>
      </StyledTabBarContainer>
    </StyledRoot>
  );
}
