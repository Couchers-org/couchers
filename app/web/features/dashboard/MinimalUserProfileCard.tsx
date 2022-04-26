import { Box, Card, Link as MuiLink, Typography } from "@material-ui/core";
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
    <Card>
      <Box display="flex" flexDirection="row" py={1} px={2}>
        <Avatar user={user} />

        <Box
          paddingLeft={2}
          overflow="hidden"
          flexGrow={1}
          display="flex"
          justifyContent="flex-end"
        >
          <Box>
            <Typography noWrap align="right">
              {user.city}
            </Typography>
            <Typography noWrap align="right">
              <Link href={routeToProfile()} passHref>
                <MuiLink>{t("dashboard:profile_mobile_summary_view")}</MuiLink>
              </Link>
            </Typography>
          </Box>
        </Box>
      </Box>
    </Card>
  );
}
