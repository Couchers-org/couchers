import { Snackbar, SnackbarCloseReason, Typography } from "@material-ui/core";
import IconButton from "components/IconButton";
import { CloseIcon } from "components/Icons";
import StyledLink from "components/StyledLink";
import { useAuthContext } from "features/auth/AuthProvider";
import { usePersistedState } from "platform/usePersistedState";
import { Trans, useTranslation } from "i18n";
import { tosRoute } from "routes";
import { useIsMounted } from "utils/hooks";
import makeStyles from "utils/makeStyles";

const useStyles = makeStyles((theme) => ({
  root: {
    "&.MuiSnackbar-root": {
      left: theme.spacing(1),
      right: theme.spacing(1),
      transform: "unset",
    },
    "& .MuiSnackbarContent-root": {
      flexGrow: "1",
      flexWrap: "nowrap",
      backgroundColor: theme.palette.primary.main,
      color: theme.palette.primary.contrastText,
    },
  },
  link: {
    color: theme.palette.secondary.light,
  },
}));

export default function CookieBanner() {
  const { t } = useTranslation();
  const classes = useStyles();
  const [hasSeen, setHasSeen] = usePersistedState("hasSeenCookieBanner", false);
  // since we are using localStorage, make sure don't render unless mounted
  // or there will be hydration mismatches
  const isMounted = useIsMounted().current;
  const auth = useAuthContext();

  if (auth.authState.authenticated) return null;

  const handleClose = (
    event: unknown,
    reason: SnackbarCloseReason | "button"
  ) => {
    if (reason !== "button") return;
    setHasSeen(true);
  };

  //specifically not using our snackbar, which is designed for alerts
  return isMounted ? (
    <Snackbar
      message={
        <Typography variant="body1">
          <Trans t={t} i18nKey="cookie_message">
            We use cookies to ensure that we give you the best experience on our
            website. If you continue to use this site, we will assume that you
            are happy with it. You can read more about our
            <StyledLink href={tosRoute} className={classes.link}>
              Terms of Service
            </StyledLink>
            .
          </Trans>
        </Typography>
      }
      open={!hasSeen}
      onClose={handleClose}
      className={classes.root}
      aria-live="polite"
      action={
        <IconButton
          aria-label={t("close")}
          onClick={(e) => handleClose(e, "button")}
        >
          <CloseIcon />
        </IconButton>
      }
    />
  ) : null;
}
