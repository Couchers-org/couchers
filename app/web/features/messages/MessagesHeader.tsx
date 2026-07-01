import { styled } from "@mui/material";
import HtmlMeta from "components/HtmlMeta";
import PageTitle from "components/PageTitle";
import MarkAllReadButton, {
  MarkAllReadType,
} from "features/messages/requests/MarkAllReadButton";
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

// Map tab to MarkAllReadButton type (archived has no mark-all action)
const getMarkAllReadType = (tab: MessageType): MarkAllReadType | null =>
  tab === "archived" ? null : tab;

export default function MessagesHeader({ tab }: { tab: MessageType }) {
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
