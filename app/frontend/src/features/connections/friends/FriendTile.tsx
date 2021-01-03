import { Card, Box, Typography, CircularProgress } from "@material-ui/core";
import React from "react";
import Alert from "../../../components/Alert";
import TextBody from "../../../components/TextBody";
import useFriendsBaseStyles from "./useFriendsBaseStyles";

interface FriendTileProps {
  children: React.ReactNode;
  errorMessage: string | null;
  hasData: boolean;
  isLoading: boolean;
  noDataMessage: string;
  title: string;
}

function FriendTile({
  children,
  errorMessage,
  hasData,
  isLoading,
  noDataMessage,
  title,
}: FriendTileProps) {
  const baseClasses = useFriendsBaseStyles();

  return (
    <Card>
      <Box className={baseClasses.container}>
        <Typography className={baseClasses.header} variant="h2">
          {title}
        </Typography>
        {errorMessage ? (
          <Alert className={baseClasses.errorAlert} severity="error">
            {errorMessage}
          </Alert>
        ) : null}
        {isLoading ? (
          <CircularProgress className={baseClasses.circularProgress} />
        ) : hasData ? (
          children
        ) : (
          <TextBody className={baseClasses.noFriendItemText}>
            {noDataMessage}
          </TextBody>
        )}
      </Box>
    </Card>
  );
}

export default FriendTile;
