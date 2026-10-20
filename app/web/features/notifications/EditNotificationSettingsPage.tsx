import { ExpandLess, ExpandMore } from "@mui/icons-material";
import { Button, CircularProgress, styled, Typography } from "@mui/material";
import Snackbar from "components/Snackbar";
import { NOTIFICATIONS } from "i18n/namespaces";
import { useTranslation } from "next-i18next";
import { useEffect, useState } from "react";

import NotificationSettingsListItem from "./NotificationSettingsListItem";
import useNotificationSettings from "./useNotificationSettings";

export type NotificationType =
  | "account_security"
  | "account_settings"
  | "chat"
  | "event"
  | "reference"
  | "friend_request"
  | "host_request"
  | "reply"
  | "general";

export interface GroupAction {
  action: string;
  description: string;
  email: boolean;
  push: boolean;
  topic: string;
  userEditable: boolean;
}

interface GroupsByType {
  [key: string]: GroupAction[];
}

const StyledNotificationSettingsContainer = styled("div")(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  padding: theme.spacing(4),
  margin: "0 auto",
  width: "100%",

  [theme.breakpoints.down("sm")]: {
    padding: theme.spacing(2),
  },

  [theme.breakpoints.up("md")]: {
    width: "50%",
  },
}));

const StyledHeaderContainer = styled("div")(({ theme }) => ({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: theme.spacing(1),

  [theme.breakpoints.down("sm")]: {
    gap: theme.spacing(1),
  },
}));

const StyledTitle = styled(Typography)(({ theme }) => ({
  [theme.breakpoints.down("sm")]: {
    flex: "0 0 50%",
    fontSize: "1.1rem",
  },
}));

const StyledButton = styled(Button)(({ theme }) => ({
  [theme.breakpoints.down("sm")]: {
    fontSize: "0.75rem",
  },
}));

const StyledNotificationDescription = styled(Typography)(({ theme }) => ({
  margin: theme.spacing(1, 0),
  paddingBottom: theme.spacing(3),
}));

const StyledAccordionContainer = styled("div")(({ theme }) => ({
  border: `1px solid ${theme.palette.divider}`,
  marginTop: theme.spacing(1),
  borderRadius: theme.shape.borderRadius,
  overflow: "hidden",
}));

const StyledLoadingSpinner = styled(CircularProgress)({
  position: "absolute",
});

const getGroupKey = (groupHeading: string, subTopicAction: string, topicName: string) => {
  if (groupHeading === "Account Security") return "account_security";
  if (groupHeading === "Account Settings") return "account_settings";
  if (groupHeading === "Other Notifications") return "other_notifications";
  if (subTopicAction === "reply" || subTopicAction === "comment") return "reply";
  return topicName;
};

export default function EditNotificationSettingsPage() {
  const { t } = useTranslation(NOTIFICATIONS, {
    keyPrefix: "notification_settings.edit_preferences",
  });
  const { data, isLoading, isError } = useNotificationSettings();
  const [groups, setGroups] = useState<GroupsByType>({});
  const [areGroupsLoading, setAreGroupsLoading] = useState<boolean>(true);
  const [allExpanded, setAllExpanded] = useState<boolean>(false);

  useEffect(() => {
    if (!data) {
      return;
    }

    const computedGroups = data?.groupsList.reduce<GroupsByType>((acc, group) => {
      group.topicsList.forEach((topic) => {
        const items = topic?.itemsList;
        if (!items) return;

        items.forEach((subTopic) => {
          if (!subTopic?.userEditable) return;

          const key = getGroupKey(group.heading, subTopic.action, topic.topic);
          acc[key] ||= [];
          acc[key].push({ ...subTopic, topic: topic.topic });
        });
      });

      return acc;
    }, {});

    setGroups(computedGroups);
    setAreGroupsLoading(false);
  }, [data]);

  const handleToggleAll = () => {
    setAllExpanded(!allExpanded);
  };

  const renderNotificationListItems = () =>
    Object.keys(groups)
      .filter((key) => groups[key].length > 0)
      .map((key) => (
        <NotificationSettingsListItem
          key={key}
          items={groups[key]}
          type={key as NotificationType}
          isExpanded={allExpanded}
        />
      ));

  return (
    <StyledNotificationSettingsContainer>
      <Typography variant="h2">{t("title")}</Typography>
      <StyledNotificationDescription variant="body1">{t("description")}</StyledNotificationDescription>
      <StyledHeaderContainer>
        <StyledTitle variant="h3">{t("list_heading")}</StyledTitle>
        <StyledButton
          variant="outlined"
          size="small"
          onClick={handleToggleAll}
          startIcon={allExpanded ? <ExpandLess /> : <ExpandMore />}
        >
          {allExpanded ? t("collapse_all") : t("expand_all")}
        </StyledButton>
      </StyledHeaderContainer>
      {isError && (
        <Snackbar severity="error">
          <Typography>{t("error_loading")}</Typography>
        </Snackbar>
      )}
      {!isLoading && !areGroupsLoading ? (
        <StyledAccordionContainer>{renderNotificationListItems()}</StyledAccordionContainer>
      ) : (
        <StyledLoadingSpinner />
      )}
    </StyledNotificationSettingsContainer>
  );
}
