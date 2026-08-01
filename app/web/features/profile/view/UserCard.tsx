import { TabPanel } from "@mui/lab";
import { Box, Card, styled } from "@mui/material";
import TabBar from "components/TabBar";
import { GetAccountInfoRes } from "couchers/proto/account_pb";
import { User } from "couchers/proto/api_pb";
import useAccountInfo from "features/auth/useAccountInfo";
import { useProfileUser } from "features/profile/hooks/useProfileUser";
import About from "features/profile/view/About";
import Home from "features/profile/view/Home";
import References from "features/profile/view/References";
import { useTranslation } from "i18n";
import { GLOBAL, PROFILE } from "i18n/namespaces";
import { TFunction } from "i18next";
import { ReactNode } from "react";
import { UserTab } from "routes";

import UserTabContext from "./UserTabContext";

const REQUEST_ID = "request";

export const sectionLabels = (
  t: TFunction,
  user?: User.AsObject,
  isSuperuser?: GetAccountInfoRes.AsObject["isSuperuser"],
) => {
  return {
    about: t("profile:heading.about_me"),
    home: t("profile:heading.home"),
    references: (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
        }}
      >
        {t("profile:heading.references")}
        {!!user?.numReferences && (
          <StyledNumReferences>{user?.numReferences}</StyledNumReferences>
        )}
      </Box>
    ),
    ...(isSuperuser ? { mod: t("global:mod") } : {}),
  };
};

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
  backgroundColor: "var(--mui-palette-primary-main)",
  color: "var(--mui-palette-background-paper)",
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
  modPanel,
}: {
  top?: ReactNode;
  onTabChange: (tab: UserTab) => void;
  tab: UserTab;
  modPanel?: ReactNode;
}) {
  const { t } = useTranslation([PROFILE, GLOBAL]);
  const user = useProfileUser();
  const { data: accountInfo } = useAccountInfo();

  return (
    <StyledDetailsCard id={REQUEST_ID}>
      <UserTabContext tab={tab}>
        <TabBar
          setValue={onTabChange}
          labels={sectionLabels(t, user, accountInfo?.isSuperuser)}
          ariaLabel={t("profile:section_tabs_a11y_label")}
          tabListSx={{
            mx: { xs: -2, md: 0 },
            mt: { xs: -1, md: 0 },
            "& .MuiTabs-scrollButtons": {
              "&.Mui-disabled": { opacity: 0.3 },
              width: { xs: 24, md: 40 },
            },
          }}
        />
        {top || null}
        <TabPanel value="about" sx={{ padding: 0 }}>
          <About user={user} />
        </TabPanel>
        {modPanel}
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
