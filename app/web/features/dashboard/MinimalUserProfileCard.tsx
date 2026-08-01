import { Box, Card, Link as MuiLink, Typography } from "@mui/material";
import Avatar from "components/Avatar";
import { User } from "couchers/proto/api_pb";
import { DASHBOARD } from "i18n/namespaces";
import Link from "next/link";
import { useTranslation } from "next-i18next";
import { routeToProfile } from "routes";
import { theme } from "theme";

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
        padding: theme.spacing(1, 2),
      }}
    >
      <Avatar user={user} highRes />
      <Box
        sx={{
          display: "flex",
          justifyContent: "flex-end",
          flexGrow: 1,
          paddingLeft: theme.spacing(2),
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
