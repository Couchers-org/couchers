import { Card, Link as MuiLink, Typography } from "@material-ui/core";
import Avatar from "components/Avatar";
import { DASHBOARD } from "i18n/namespaces";
import Link from "next/link";
import { useTranslation } from "next-i18next";
import { User } from "proto/api_pb";
import { routeToProfile } from "routes";
import makeStyles from "utils/makeStyles";

const useStyles = makeStyles((theme) => ({
  container: {
    display: "flex",
    flexDirection: "row",
    paddingTop: theme.spacing(1),
    paddingBottom: theme.spacing(1),
    paddingLeft: theme.spacing(2),
    paddingRight: theme.spacing(2),
  },
  textFieldsContainer: {
    display: "flex",
    justifyContent: "flex-end",
    flexGrow: 1,
    paddingLeft: theme.spacing(2),
    overflow: "hidden",
  },
}));

export default function MinimalUserProfileCard({
  user,
}: {
  user: User.AsObject;
}) {
  const { t } = useTranslation([DASHBOARD]);
  const classes = useStyles();
  return (
    <Card className={classes.container}>
      <Avatar user={user} />

      <div className={classes.textFieldsContainer}>
        <div>
          <Typography noWrap align="right">
            {user.city}
          </Typography>
          <Typography noWrap align="right">
            <Link href={routeToProfile()} passHref>
              <MuiLink>{t("dashboard:profile_mobile_summary_view")}</MuiLink>
            </Link>
          </Typography>
        </div>
      </div>
    </Card>
  );
}
