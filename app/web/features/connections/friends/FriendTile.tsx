import { Card, CircularProgress, Typography } from "@material-ui/core";
import { CSSProperties } from "@material-ui/styles";
import Alert from "components/Alert";
import TextBody from "components/TextBody";
import React from "react";
import makeStyles from "utils/makeStyles";

const useStyles = makeStyles((theme) => ({
  circularProgress: {
    display: "block",
    margin: `0 auto ${theme.spacing(1)}`,
  },
  container: {
    "& > *": {
      marginBottom: theme.spacing(2),
    },
  },
  errorAlert: {
    borderRadius: 0,
  },
  header: {
    fontWeight: theme.typography.fontWeightBold,
    marginBottom: theme.spacing(2),
    marginLeft: theme.spacing(1),
  } as CSSProperties,
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
      <div className={classes.container}>
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
      </div>
    </Card>
  );
}

export default FriendTile;
