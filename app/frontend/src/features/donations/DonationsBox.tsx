import { Divider, makeStyles, Typography } from "@material-ui/core";
import Button from "components/Button";

import {
  DONATIONSBOX_MONTHLY,
  DONATIONSBOX_ONETIME,
  DONATIONSBOX_NEXT,
  DONATIONSBOX_VALUES,
  DONATIONSBOX_CURRENCY,
  DONATIONSBOX_TITLE,
  DONATIONSBOX_TEXT,
} from "features/donations/constants";

const useStyles = makeStyles((theme) => ({
  donationsBox: {
    padding: theme.spacing(2),
    border: `2px solid ${theme.palette.grey[200]}`,
    borderRadius: theme.shape.borderRadius * 2,
  },

  donationsBoxRow: {
    gridTemplateColumns: "repeat( auto-fit, minmax(72px, 1fr) )",
    gridTemplateRows: "2.75rem",
    display: "grid",
    gridGap: theme.spacing(2),
    marginBottom: theme.spacing(2),
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
      transition: "color 250ms cubic-bezier(0.4, 0, 0.2, 1)",
    },
  },

  buttonSecondaryText: {
    color: theme.palette.grey[600],
    fontWeight: 700,
    transition: "color 250ms cubic-bezier(0.4, 0, 0.2, 1)",
  },

  buttonSecondaryActive: {
    border: `2px solid ${theme.palette.primary.main}`,
    backgroundColor: theme.palette.background.paper,
    "&&": {
      borderRadius: "0.5rem",
      boxShadow: "initial",
    },
    "&:hover": {
      border: `2px solid ${theme.palette.grey[200]}`,
      backgroundColor: theme.palette.grey[200],
    },
    "&:hover > .MuiButton-label": {
      color: theme.palette.grey[600],
      transition: "color 250ms cubic-bezier(0.4, 0, 0.2, 1)",
    },
  },

  buttonSecondaryTextActive: {
    color: theme.palette.primary.main,
    fontWeight: 700,
    transition: "color 250ms cubic-bezier(0.4, 0, 0.2, 1)",
  },

  buttonMain: {
    backgroundColor: theme.palette.primary.main,
    "&&": {
      borderRadius: "0.5rem",
      boxShadow: "initial",
    },
    "&:hover": {
      opacity: "0.4",
      backgroundColor: theme.palette.primary.main,
    },
    "& .MuiButton-label": {
      color: theme.palette.background.paper,
      transition: "color 250ms cubic-bezier(0.4, 0, 0.2, 1)",
    },
  },

  buttonMainText: {
    color: theme.palette.background.paper,
    fontWeight: 700,
    transition: "color 250ms cubic-bezier(0.4, 0, 0.2, 1)",
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
      fontSize: theme.typography.body1.fontSize,
    },
  },

  inputNumber: {
    width: "100%",
    height: "100%",
    borderRadius: theme.shape.borderRadius,
    border: `2px solid ${theme.palette.grey[200]}`,
    paddingLeft: theme.spacing(2),
    color: theme.palette.grey[600],
    fontWeight: 700,
    fontSize: theme.typography.body1.fontSize,
    "&&": {
      borderRadius: "0.5rem",
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
            root: classes.buttonSecondaryActive,
            label: classes.buttonSecondaryTextActive,
          }}
        >
          {DONATIONSBOX_ONETIME}
        </Button>
      </div>

      <Divider className={classes.marginY2} />

      <div className={classes.donationsBoxRow}>
        {Array.from(DONATIONSBOX_VALUES?.values() ?? []).map((value) =>
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
      <div className={classes.marginBottom2}>
        <Typography variant="subtitle1">{DONATIONSBOX_TEXT}</Typography>
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
