import { Box, Card, Link as MuiLink, Typography } from "@mui/material";
import Avatar from "components/Avatar";
import { DASHBOARD } from "i18n/namespaces";
import Link from "next/link";
import { useTranslation } from "next-i18next";
import { User } from "proto/api_pb";
import { routeToProfile } from "routes";

export default function MinimalUserProfileCard({
  user,
}: {
  user: User.AsObject;
}) {
  const { t } = useTranslation([DASHBOARD]);
  return (
    <Card
      sx={{
        display: "flex",
        flexDirection: "row",
        padding: "8px 16px",
      }}
    >
      <Avatar user={user} highRes />
      <Box
        sx={{
          display: "flex",
          justifyContent: "flex-end",
          flexGrow: 1,
          paddingLeft: 2,
          overflow: "hidden",
        }}
      >
        <div>
          <Typography align="right">{user.city}</Typography>
          <Typography noWrap align="right">
            <MuiLink component={Link} underline="hover" href={routeToProfile()}>
              {t("dashboard:profile_mobile_summary_view")}
            </MuiLink>
          </Typography>
        </div>
      </Box>
    </Card>
  );
}
