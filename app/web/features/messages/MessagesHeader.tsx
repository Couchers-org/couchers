import { TabContext } from "@mui/lab";
import { styled } from "@mui/material";
import { useRouter } from "next/router";
import { ReactNode } from "react";

import HtmlMeta from "@/components/HtmlMeta";
import NotificationBadge from "@/components/NotificationBadge";
import PageTitle from "@/components/PageTitle";
import TabBar from "@/components/TabBar";
import MarkAllReadButton from "@/features/messages/requests/MarkAllReadButton";
import useNotifications from "@/features/useNotifications";
import { useTranslation } from "@/i18n";
import { MESSAGES } from "@/i18n/namespaces";
import { MESSAGES_ROUTE, MessageType } from "@/routes";

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

export const MessagesNotification = () => {
  const { t } = useTranslation(MESSAGES);
  const { data } = useNotifications();

  return (
    <NotificationBadge count={data?.unseenMessageCount}>
      {t("messages_page.tabs.chats")}
    </NotificationBadge>
  );
};

export const HostRequestsReceivedNotification = () => {
  const { t } = useTranslation(MESSAGES);
  const { data } = useNotifications();

  return (
    <NotificationBadge count={data?.unseenReceivedHostRequestCount}>
      {t("messages_page.tabs.hosting")}
    </NotificationBadge>
  );
};

export const HostRequestsSentNotification = () => {
  const { t } = useTranslation(MESSAGES);
  const { data } = useNotifications();

  return (
    <NotificationBadge count={data?.unseenSentHostRequestCount}>
      {t("messages_page.tabs.surfing")}
    </NotificationBadge>
  );
};

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
};

const MessagesHeader = ({ tab }: { tab: MessageType | undefined }) => {
  const { t } = useTranslation(MESSAGES);
  const router = useRouter();

  return (
    <StyledRoot>
      <HtmlMeta title={t("messages_page.title")} />
      <PageTitle>{t("messages_page.title")}</PageTitle>
      {tab && <MarkAllReadButton type={tab} />}
      <StyledTabBarContainer>
        <TabContext value={tab ?? ""}>
          <TabBar
            ariaLabel={t("messages_page.tabs.aria_label")}
            setValue={(newTab) =>
              void router.push(`${MESSAGES_ROUTE}/${newTab}`)
            }
            labels={labels}
          />
        </TabContext>
      </StyledTabBarContainer>
    </StyledRoot>
  );
};

export default MessagesHeader;
