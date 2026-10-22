import { useFeatureValue } from "@growthbook/growthbook-react";
import { styled } from "@mui/material";
import HtmlMeta from "components/HtmlMeta";
import PageTitle from "components/PageTitle";
import MarkAllReadButton from "features/messages/requests/MarkAllReadButton";
import { useTranslation } from "i18n";
import { MESSAGES } from "i18n/namespaces";
import { MessageFilterType } from "routes";
import { assertNever } from "utils/assertNever";

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
  tab: MessageFilterType,
): "chats" | "hosting" | "surfing" | "all" | "public-trips" | null => {
  switch (tab) {
    case "chats":
    case "hosting":
    case "surfing":
    case "public-trips":
      return tab;
    case "all":
    case "unread":
      return "all";
    case "archived":
      return null;
    default:
      return assertNever(tab);
  }
};

export default function MessagesHeader({ tab }: { tab: MessageFilterType }) {
  const { t } = useTranslation(MESSAGES);
  const isPublicTripsEnabled = useFeatureValue("public_trips_enabled", false);
  const markAllReadType = getMarkAllReadType(tab === "public-trips" && !isPublicTripsEnabled ? "all" : tab);

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
