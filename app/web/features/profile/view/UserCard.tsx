import { Card } from "@material-ui/core";
import { TabPanel } from "@material-ui/lab";
import TabBar from "components/TabBar";
import { useProfileUser } from "features/profile/hooks/useProfileUser";
import About from "features/profile/view/About";
import Home from "features/profile/view/Home";
import References from "features/profile/view/References";
import { useTranslation } from "i18n";
import { GLOBAL } from "i18n/namespaces";
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
  const classes = useStyles();
  const user = useProfileUser();
  const { t } = useTranslation([GLOBAL]);

  const sectionLabels = {
    about: t("global:about_me"),
    home: t("global:home"),
    references: t("global:references"),
  }
  return (
    <Card className={classes.detailsCard} id={REQUEST_ID}>
      <UserTabContext tab={tab}>
        <TabBar
          setValue={onTabChange}
          labels={sectionLabels}
          ariaLabel={t("global:section_labels_a11y_text")}
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
