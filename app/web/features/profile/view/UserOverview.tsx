import { Card, Typography } from "@material-ui/core";
import Avatar from "components/Avatar";
import BarWithHelp from "components/Bar/BarWithHelp";
import Divider from "components/Divider";
import { useTranslation } from "i18n";
import { GLOBAL } from "i18n/namespaces";
import { PropsWithChildren } from "react";
import makeStyles from "utils/makeStyles";

import { useProfileUser } from "../hooks/useProfileUser";
import { LabelsReferencesLastActive } from "./UserTextAndLabel";

const useStyles = makeStyles((theme) => ({
  card: {
    flexShrink: 0,
    borderRadius: theme.shape.borderRadius * 2,
    padding: theme.spacing(3),
    [theme.breakpoints.down("xs")]: {
      marginBottom: theme.spacing(1),
      width: "100%",
    },
  },

  info: {
    marginTop: theme.spacing(0.5),
  },

  intro: {
    display: "flex",
    justifyContent: "center",
  },

  wrapper: {
    marginTop: theme.spacing(2),
    "& h1": {
      textAlign: "center",
      marginBottom: theme.spacing(0.5),
    },
  },
}));

export default function UserOverview({ children }: PropsWithChildren<unknown>) {
  const classes = useStyles();
  const user = useProfileUser();
  const { t } = useTranslation([GLOBAL]);

  return (
    <Card className={classes.card}>
      <Avatar user={user} grow />
      <div className={classes.wrapper}>
        <Typography variant="h1" className={classes.intro}>
          {user.name}
        </Typography>
        <Typography variant="body1" className={classes.intro}>
          {user.city}
        </Typography>
      </div>
      <Divider />
      {children}
      {process.env.NEXT_PUBLIC_IS_VERIFICATION_ENABLED && (
        <>
          <BarWithHelp
            value={user.communityStanding || 0}
            label={t("global:community_standing")}
            description={t("global:community_standing_description")}
          />
          <BarWithHelp
            value={user.verification || 0}
            label={t("global:verification_score")}
            description={t("global:verification_score_description")}
          />
        </>
      )}
      <div className={classes.info}>
        <LabelsReferencesLastActive user={user} />
      </div>
    </Card>
  );
}
