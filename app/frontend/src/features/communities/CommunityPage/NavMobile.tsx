import { makeStyles } from "@material-ui/core";
import { Community } from "pb/communities_pb";
import React from "react";

import NavButtons from "./NavButtons";

const useStyles = makeStyles((theme) => ({
  navButtonContainer: {
    display: "flex",
    justifyContent: "space-around",
    marginBottom: theme.spacing(1),
    [theme.breakpoints.only("sm")]: {
      justifyContent: "center",
      "& > * + *": {
        marginInlineStart: theme.spacing(4),
      },
    },
    [theme.breakpoints.up("md")]: {
      width: "30%",
    },
  },
}));

export default function NavMobile({
  community,
}: {
  community: Community.AsObject;
}) {
  const classes = useStyles();

  return (
    <div className={classes.navButtonContainer}>
      <NavButtons community={community} />
    </div>
  );
}
