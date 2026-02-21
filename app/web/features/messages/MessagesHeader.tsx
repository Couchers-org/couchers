import { styled } from "@mui/material";
import HtmlMeta from "components/HtmlMeta";
import PageTitle from "components/PageTitle";
import MarkAllReadButton from "features/messages/requests/MarkAllReadButton";
import { useTranslation } from "i18n";
import { MESSAGES } from "i18n/namespaces";
import { MessageType } from "routes";

const StyledRoot = styled("div")(({ theme }) => ({
  paddingLeft: theme.spacing(2),
  paddingRight: theme.spacing(2),
}));

export default function MessagesHeader({
  tab,
}: {
  tab: MessageType | undefined;
}) {
  const { t } = useTranslation(MESSAGES);

  // Map tab to MarkAllReadButton type (excluding archived)
  const getMarkAllReadType = (
    tab: MessageType | undefined,
  ): "chats" | "hosting" | "surfing" | "all" | null => {
    if (!tab || tab === "archived") return null;
    return tab as "chats" | "hosting" | "surfing" | "all";
  };

  const markAllReadType = getMarkAllReadType(tab);

  return (
    <StyledRoot>
      <HtmlMeta title={t("messages_page.title")} />
      <PageTitle>{t("messages_page.title")}</PageTitle>
      {markAllReadType && <MarkAllReadButton type={markAllReadType} />}
    </StyledRoot>
  );
}
