import { Card } from "@material-ui/core";
import { TabPanel } from "@material-ui/lab";
import TabBar from "components/TabBar";
import { SECTION_LABELS, SECTION_LABELS_A11Y_TEXT } from "features/constants";
import { useProfileUser } from "features/profile/hooks/useProfileUser";
import About from "features/profile/view/About";
import Home from "features/profile/view/Home";
import References from "features/profile/view/References";
import { ReactNode } from "react";
import { UserTab } from "routes";
import makeStyles from "utils/makeStyles";

import UserTabContext from "./UserTabContext";

const REQUEST_ID = "request";

const useStyles = makeStyles((theme) => ({
  detailsCard: {
    [theme.breakpoints.down("sm")]: {
      margin: 0,
      width: "100%",
    },
    flexGrow: 1,
    padding: theme.spacing(2),
  },
  tabPanel: {
    padding: 0,
  },
}));

export default function UserCard({
  top,
  onTabChange,
}: {
  top?: ReactNode;
  onTabChange: (tab: UserTab) => void;
}) {
  const classes = useStyles();
  const user = useProfileUser();
  return (
    <Card className={classes.detailsCard} id={REQUEST_ID}>
      <UserTabContext>
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
        <TabPanel value="references">
          <References />
        </TabPanel>
      </UserTabContext>
    </Card>
  );
}
