import { TabPanel } from "@mui/lab";
import { Box, Card, styled, Typography } from "@mui/material";
import TabBar from "components/TabBar";
import { useProfileUser } from "features/profile/hooks/useProfileUser";
import About from "features/profile/view/About";
import Home from "features/profile/view/Home";
import References from "features/profile/view/References";
import { useTranslation } from "i18n";
import { PROFILE } from "i18n/namespaces";
import { TFunction } from "i18next";
import { User } from "proto/api_pb";
import { ReactNode } from "react";
import { UserTab } from "routes";

import UserTabContext from "./UserTabContext";

const REQUEST_ID = "request";

export const sectionLabels = (t: TFunction, user?: User.AsObject) => ({
  about: t("profile:heading.about_me"),
  home: t("profile:heading.home"),
  references: (
    <Box display="flex" alignItems="center" gap={1}>
      <Typography component="span">
        {t("profile:heading.references")}
      </Typography>
      <StyledNumReferences>{user?.numReferences}</StyledNumReferences>
    </Box>
  ),
});

const StyledDetailsCard = styled(Card)(({ theme }) => ({
  [theme.breakpoints.down("md")]: {
    margin: 0,
    width: "100%",
  },
  flexGrow: 1,
  padding: theme.spacing(2),
}));

const StyledNumReferences = styled("div")(({ theme }) => ({
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.common.white,
  fontWeight: "bold",
  fontSize: "0.65rem",
  width: "15px",
  height: "15px",
  borderRadius: "50%",
  padding: theme.spacing(1),
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
  const user = useProfileUser();

  return (
    <StyledDetailsCard id={REQUEST_ID}>
      <UserTabContext tab={tab}>
        <TabBar
          setValue={onTabChange}
          labels={sectionLabels(t, user)}
          ariaLabel={t("profile:section_tabs_a11y_label")}
        />
        {top || null}
        <TabPanel value="about" sx={{ padding: 0 }}>
          <About user={user} />
        </TabPanel>
        <TabPanel value="home">
          <Home user={user}></Home>
        </TabPanel>
        <TabPanel value="references">
          <References />
        </TabPanel>
      </UserTabContext>
    </StyledDetailsCard>
  );
}
