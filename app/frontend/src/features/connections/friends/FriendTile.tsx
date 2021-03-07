import {
  Box,
  Card,
  CircularProgress,
  makeStyles,
  Typography,
} from "@material-ui/core";
import React from "react";

import Alert from "../../../components/Alert";
import TextBody from "../../../components/TextBody";

const useStyles = makeStyles((theme) => ({
  circularProgress: {
    display: "block",
    margin: `0 auto ${theme.spacing(1)}`,
  },
  container: {
    "& > :last-child": {
      marginBottom: theme.spacing(1),
    },
  },
  errorAlert: {
    borderRadius: 0,
  },
  header: {
    fontWeight: theme.typography.fontWeightBold,
    marginBottom: theme.spacing(2),
    marginLeft: theme.spacing(1),
  },
  noFriendItemText: {
    marginLeft: theme.spacing(1),
  },
}));
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
  const classes = useStyles();

  return (
    <Card>
      <Box className={classes.container}>
        <Typography className={classes.header} variant="h2">
          {title}
        </Typography>
        {errorMessage ? (
          <Alert className={classes.errorAlert} severity="error">
            {errorMessage}
          </Alert>
        ) : null}
        {isLoading ? (
          <CircularProgress className={classes.circularProgress} />
        ) : hasData ? (
          children
        ) : (
          <TextBody className={classes.noFriendItemText}>
            {noDataMessage}
          </TextBody>
        )}
      </Box>
    </Card>
  );
}

export default FriendTile;
