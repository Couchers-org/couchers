import { Card, CardContent, makeStyles, Typography } from "@material-ui/core";
import Divider from "components/Divider";
import { Community } from "pb/communities_pb";
import React from "react";

import NavButtons from "./NavButtons";

const useStyles = makeStyles((theme) => ({
  root: {
    flexShrink: 0,
    //balance for button padding on non-button side
    paddingInlineEnd: 12,
  },
  statContainer: {
    alignItems: "center",
    display: "flex",
    justifyContent: "space-around",
  },
  number: theme.typography.h1Large,
}));

export default function NavDesktop({
  community,
}: {
  community: Community.AsObject;
}) {
  const classes = useStyles();
  return (
    <Card className={classes.root}>
      <CardContent>
        <NavButtons community={community} />
        <Divider />
        <div className={classes.statContainer}>
          <Typography variant="body1" className={classes.number}>
            {community.memberCount}
          </Typography>
          <Typography variant="body1">Members</Typography>
        </div>
      </CardContent>
    </Card>
  );
}
