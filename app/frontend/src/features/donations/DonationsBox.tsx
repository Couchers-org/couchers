import { Divider, makeStyles, Typography } from "@material-ui/core";
import classNames from "classnames";
import Button from "components/Button";
import {
  DONATIONSBOX_CURRENCY,
  DONATIONSBOX_MONTHLY,
  DONATIONSBOX_NEXT,
  DONATIONSBOX_ONETIME,
  DONATIONSBOX_TEXT,
  DONATIONSBOX_TITLE,
  DONATIONSBOX_VALUES,
} from "features/donations/constants";

const useStyles = makeStyles((theme) => ({
  donationsBox: {
    padding: theme.spacing(2),
    border: `2px solid ${theme.palette.grey[200]}`,
    borderRadius: theme.shape.borderRadius * 2,
  },

  donationsBoxRow: {
    gridTemplateColumns: "repeat( auto-fit, minmax(160px, 1fr) )",
    gridAutoRows: "2.75rem",
    display: "grid",
    gridGap: theme.spacing(2),
    marginBottom: theme.spacing(2),
  },

  donationsBoxSubRow: {
    gridTemplateColumns: "repeat( auto-fit, minmax(72px, 1fr) )",
    display: "grid",
    gridGap: theme.spacing(2),
  },

  buttonSecondary: {
    border: `2px solid ${theme.palette.grey[200]}`,
    backgroundColor: theme.palette.grey[200],
    "&&": {
      borderRadius: "0.5rem",
      boxShadow: "initial",
    },
    "&:hover": {
      border: `2px solid ${theme.palette.primary.main}`,
      backgroundColor: theme.palette.background.paper,
    },
    "&:hover > .MuiButton-label": {
      color: theme.palette.primary.main,
      transition: `color ${theme.transitions.duration.short}ms ${theme.transitions.easing.easeInOut}`,
    },
  },

  buttonSecondaryText: {
    color: theme.palette.grey[600],
    fontWeight: 700,
    fontSize: theme.typography.button.fontSize,
    transition: `color ${theme.transitions.duration.short}ms ${theme.transitions.easing.easeInOut}`,
  },

  buttonSecondaryActive: {
    border: `2px solid ${theme.palette.primary.main}`,
    backgroundColor: theme.palette.background.paper,
    "&:hover": {
      border: `2px solid ${theme.palette.grey[200]}`,
      backgroundColor: theme.palette.grey[200],
    },
    "&:hover > .MuiButton-label": {
      color: theme.palette.grey[600],
    },
  },

  buttonSecondaryTextActive: {
    color: theme.palette.primary.main,
  },

  buttonMain: {
    backgroundColor: theme.palette.primary.main,
    "&&": {
      borderRadius: "0.5rem",
      boxShadow: "initial",
    },
    "&:hover": {
      opacity: 0.4,
      backgroundColor: theme.palette.primary.main,
    },
    "& .MuiButton-label": {
      color: theme.palette.background.paper,
      transition: `color ${theme.transitions.duration.short}ms ${theme.transitions.easing.easeInOut}`,
    },
  },

  buttonMainText: {
    color: theme.palette.background.paper,
    fontWeight: 700,
    transition: `color ${theme.transitions.duration.short}ms ${theme.transitions.easing.easeInOut}`,
  },

  marginY2: {
    margin: theme.spacing(2, 0),
  },

  marginBottom2: {
    marginBottom: theme.spacing(2),
  },

  inputWrapper: {
    position: "relative",
    "&::before": {
      content: `'${DONATIONSBOX_CURRENCY}'`,
      position: "absolute",
      top: "50%",
      transform: "translateY(-50%)",
      left: theme.spacing(1),
      color: theme.palette.grey[600],
      fontWeight: 700,
      fontSize: theme.typography.button.fontSize,
    },
  },

  inputNumber: {
    width: "100%",
    height: "100%",
    border: `2px solid ${theme.palette.grey[200]}`,
    paddingLeft: theme.spacing(2),
    color: theme.palette.grey[600],
    fontWeight: 700,
    fontSize: theme.typography.button.fontSize,
    "&&": {
      borderRadius: theme.shape.borderRadius * 2,
      boxShadow: "initial",
    },
    "&:hover": {
      border: `2px solid ${theme.palette.primary.main}`,
    },
    "&:focus-visible": {
      border: `2px solid ${theme.palette.primary.main}`,
      outline: "none",
      boxShadow: "none",
    },
  },
}));

export default function Donations() {
  const classes = useStyles();

  return (
    <section className={classes.donationsBox}>
      <Typography className={classes.marginBottom2} variant="h3">
        {DONATIONSBOX_TITLE}
      </Typography>
      <div className={classes.donationsBoxRow}>
        <Button
          classes={{
            root: classes.buttonSecondary,
            label: classes.buttonSecondaryText,
          }}
        >
          {DONATIONSBOX_MONTHLY}
        </Button>
        <Button
          classes={{
            root: classNames(
              classes.buttonSecondary,
              classes.buttonSecondaryActive
            ),
            label: classNames(
              classes.buttonSecondaryText,
              classes.buttonSecondaryTextActive
            ),
          }}
        >
          {DONATIONSBOX_ONETIME}
        </Button>
      </div>

      <Divider className={classes.marginY2} />

      <div className={classes.donationsBoxRow}>
        <div className={classes.donationsBoxSubRow}>
          {Array.from(DONATIONSBOX_VALUES?.values() ?? [])
            .slice(0, 2)
            .map((value) =>
              value ? (
                <Button
                  classes={{
                    root: classes.buttonSecondary,
                    label: classes.buttonSecondaryText,
                  }}
                >
                  {`${value.currency}${value.amount}`}
                </Button>
              ) : null
            )}
        </div>
        <div className={classes.donationsBoxSubRow}>
          {Array.from(DONATIONSBOX_VALUES?.values() ?? [])
            .slice(2, 4)
            .map((value) =>
              value ? (
                <Button
                  classes={{
                    root: classes.buttonSecondary,
                    label: classes.buttonSecondaryText,
                  }}
                >
                  {`${value.currency}${value.amount}`}
                </Button>
              ) : null
            )}
        </div>
        <div className={classes.donationsBoxSubRow}>
          {Array.from(DONATIONSBOX_VALUES?.values() ?? [])
            .slice(4, 6)
            .map((value) =>
              value ? (
                <Button
                  classes={{
                    root: classes.buttonSecondary,
                    label: classes.buttonSecondaryText,
                  }}
                >
                  {`${value.currency}${value.amount}`}
                </Button>
              ) : null
            )}
        </div>
        <div className={classes.donationsBoxSubRow}>
          {Array.from(DONATIONSBOX_VALUES?.values() ?? [])
            .slice(6, 7)
            .map((value) =>
              value ? (
                <Button
                  classes={{
                    root: classes.buttonSecondary,
                    label: classes.buttonSecondaryText,
                  }}
                >
                  {`${value.currency}${value.amount}`}
                </Button>
              ) : null
            )}
          <div className={classes.inputWrapper}>
            <input type="number" className={classes.inputNumber} />
          </div>
        </div>
      </div>
      <div className={classes.marginBottom2}>
        <Typography>{DONATIONSBOX_TEXT}</Typography>
      </div>
      <div className={classes.donationsBoxRow}>
        <Button
          classes={{
            root: classes.buttonMain,
            label: classes.buttonMainText,
          }}
        >
          {DONATIONSBOX_NEXT}
        </Button>
      </div>
    </section>
  );
}
