import {
  Link as MuiLink,
  Snackbar,
  SnackbarCloseReason,
  Typography,
} from "@material-ui/core";
import { COOKIE_MESSAGE } from "components/constants";
import IconButton from "components/IconButton";
import { CloseIcon } from "components/Icons";
import { useAuthContext } from "features/auth/AuthProvider";
import { usePersistedState } from "features/auth/useAuthStore";
import { CLOSE } from "features/constants";
import { Link } from "react-router-dom";
import { tosRoute } from "routes";
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
  const classes = useStyles();
  const [hasSeen, setHasSeen] = usePersistedState("hasSeenCookieBanner", false);
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
  return (
    <Snackbar
      message={
        <Typography variant="body1">
          {COOKIE_MESSAGE[0]}
          <MuiLink component={Link} to={tosRoute} className={classes.link}>
            {COOKIE_MESSAGE[1]}
          </MuiLink>
          {COOKIE_MESSAGE[2]}
        </Typography>
      }
      open={!hasSeen}
      onClose={handleClose}
      className={classes.root}
      aria-live="polite"
      action={
        <IconButton
          aria-label={CLOSE}
          onClick={(e) => handleClose(e, "button")}
        >
          <CloseIcon />
        </IconButton>
      }
    />
  );
}
