import { Card } from "@material-ui/core";
import { TabContext, TabPanel } from "@material-ui/lab";
import TabBar from "components/TabBar";
import { SECTION_LABELS, SECTION_LABELS_A11Y_TEXT } from "features/constants";
import About from "features/profile/view/About";
import Home from "features/profile/view/Home";
import { User } from "pb/api_pb";
import React, { ReactNode } from "react";
import { useParams } from "react-router-dom";
import { UserTab } from "routes";
import makeStyles from "utils/makeStyles";

const REQUEST_ID = "request";

const useStyles = makeStyles((theme) => ({
  detailsCard: {
    [theme.breakpoints.down("sm")]: {
      margin: 0,
      width: "100%",
    },
    flexGrow: 1,
    margin: theme.spacing(2),
    padding: theme.spacing(2),
  },
  tabPanel: {
    padding: 0,
  },
}));

export default function UserCard({
  user,
  top,
  onTabChange,
}: {
  user: User.AsObject;
  top?: ReactNode;
  onTabChange: (tab: UserTab) => void;
}) {
  const classes = useStyles();
  let { tab = "about" } =
    useParams<{
      tab: UserTab;
    }>();

  return (
    <Card className={classes.detailsCard} id={REQUEST_ID}>
      <TabContext value={tab}>
        <TabBar
          setValue={onTabChange}
          labels={SECTION_LABELS}
          ariaLabel={SECTION_LABELS_A11Y_TEXT}
        />
        {top || null}
        <TabPanel classes={{ root: classes.tabPanel }} value="about">
          <About user={user} />
        </TabPanel>
        <TabPanel value="home">
          <Home user={user}></Home>
        </TabPanel>
      </TabContext>
    </Card>
  );
}
