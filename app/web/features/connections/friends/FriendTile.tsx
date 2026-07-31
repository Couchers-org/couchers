import { Card, CircularProgress, styled, Typography } from "@mui/material";
import Alert from "components/Alert";
import NotificationBadge from "components/NotificationBadge";
import TextBody from "components/TextBody";
import React from "react";
import { theme } from "theme";

interface FriendTileProps {
  children: React.ReactNode;
  /** Shown as a badge beside the title. Nothing renders when it's 0 or absent. */
  count?: number;
  errorMessage: string | null;
  hasData: boolean;
  isLoading: boolean;
  noDataMessage: string;
  title: string;
}

const StyledContainer = styled("div")(({ theme }) => ({
  margin: theme.spacing(2),
  "& > *": {
    marginBottom: theme.spacing(2),
  },
}));

const StyledHeader = styled(Typography)(({ theme }) => ({
  fontWeight: theme.typography.fontWeightBold,
  marginBottom: theme.spacing(2),
  marginLeft: theme.spacing(1),
  // Sit the count inline after the title and vertically centred, instead of
  // overlapping its top-right corner the way an overlay badge does.
  "& .MuiBadge-root": {
    alignItems: "center",
  },
  "& .MuiBadge-badge": {
    position: "static",
    transform: "none",
    marginInlineStart: theme.spacing(1),
  },
}));

function FriendTile({
  children,
  count,
  errorMessage,
  hasData,
  isLoading,
  noDataMessage,
  title,
}: FriendTileProps) {
  return (
    <Card>
      <StyledContainer>
        <StyledHeader variant="h2">
          {count ? (
            <NotificationBadge count={count}>{title}</NotificationBadge>
          ) : (
            title
          )}
        </StyledHeader>
        {errorMessage ? (
          <Alert severity="error" sx={{ borderRadius: 0 }}>
            {errorMessage}
          </Alert>
        ) : null}
        {isLoading ? (
          <CircularProgress
            sx={{ display: "block", margin: `0 auto ${theme.spacing(1)}` }}
          />
        ) : hasData ? (
          children
        ) : (
          <TextBody sx={{ marginLeft: theme.spacing(1) }}>
            {noDataMessage}
          </TextBody>
        )}
      </StyledContainer>
    </Card>
  );
}

export default FriendTile;
