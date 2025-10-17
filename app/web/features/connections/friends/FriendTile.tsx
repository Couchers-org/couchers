import { Card, CircularProgress, Typography, styled } from "@mui/material";
import React from "react";

import Alert from "@/components/Alert";
import TextBody from "@/components/TextBody";
import { theme } from "@/theme";

interface FriendTileProps {
  children: React.ReactNode;
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
}));

const FriendTile = ({
  children,
  errorMessage,
  hasData,
  isLoading,
  noDataMessage,
  title,
}: FriendTileProps) => {
  return (
    <Card>
      <StyledContainer>
        <StyledHeader variant="h2">{title}</StyledHeader>
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
};

export default FriendTile;
