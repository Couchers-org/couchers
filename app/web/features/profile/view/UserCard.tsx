import { Card } from "@material-ui/core";
import { TabPanel } from "@material-ui/lab";
import TabBar from "components/TabBar";
import { sectionLabels } from "features/profile/constants";
import { useProfileUser } from "features/profile/hooks/useProfileUser";
import About from "features/profile/view/About";
import Home from "features/profile/view/Home";
import References from "features/profile/view/References";
import { useTranslation } from "i18n";
import { PROFILE } from "i18n/namespaces";
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
  tab,
}: {
  top?: ReactNode;
  onTabChange: (tab: UserTab) => void;
  tab: UserTab;
}) {
  const { t } = useTranslation([PROFILE]);
  const classes = useStyles();
  const user = useProfileUser();
  return (
    <Card className={classes.detailsCard} id={REQUEST_ID}>
      <UserTabContext tab={tab}>
        <TabBar
          setValue={onTabChange}
          labels={sectionLabels(t)}
          ariaLabel={t("profile:section_tabs_a11y_label")}
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
