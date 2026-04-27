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

const StyledHeader = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(2),
}));

// Map tab to MarkAllReadButton type (excluding archived)
const getMarkAllReadType = (
  tab: MessageType | undefined,
): "chats" | "hosting" | "surfing" | "all" | null => {
  switch (tab) {
    case "chats":
    case "hosting":
    case "surfing":
      return tab;
    case "all":
    case "unread":
      return "all";
    default:
      return null;
  }
};

export default function MessagesHeader({
  tab,
}: {
  tab: MessageType | undefined;
}) {
  const { t } = useTranslation(MESSAGES);
  const markAllReadType = getMarkAllReadType(tab);

  return (
    <StyledRoot>
      <HtmlMeta title={t("messages_page.title")} />
      <StyledHeader>
        <PageTitle>{t("messages_page.title")}</PageTitle>
        {markAllReadType && <MarkAllReadButton type={markAllReadType} />}
      </StyledHeader>
    </StyledRoot>
  );
}
