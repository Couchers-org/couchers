import { ExpandLess, ExpandMore } from "@mui/icons-material";
import { IconButton } from "@mui/material";
import makeStyles from "@mui/styles/makeStyles";
import { ReactNode, useState } from "react";

interface Props {
  resultsSnippet: ReactNode[];
}

const useStyles = makeStyles((theme) => ({
  drawer: {
    /*  */
    width: "100%",
    height: "350px",
    overflowY: "auto",
    "&[data-open-state='true']": {
      height: "100%",
      top: "56px",
      position: "fixed",
      bottom: 0,
      left: 0,
      zIndex: theme.zIndex.drawer,
      backgroundColor: theme.palette.background.default,
    },
  },
  singleResult: {
    width: "100%",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    maxHeight: "400px",
    paddingBottom: theme.spacing(2),
    overflowY: "auto",
  },
  verticalList: {
    display: "flex",
    flexDirection: "column",
    gap: theme.spacing(2),
    padding: theme.spacing(2),
    "& .MuiCard-root": {
      height: "auto",
      width: "100%",
      [theme.breakpoints.down("md")]: {
        height: "auto",
        "& .MuiCardContent-root": {
          height: "auto",
        },
        "& .MuiCardActionArea-root": {
          height: "100%",
        },
      },
    },
  },
  openButton: {
    width: "100%",
    marginLeft: 0,
  },
  closeButton: {
    width: "100%",
    marginLeft: 0,
    position: "sticky",
    top: 0,
    backgroundColor: theme.palette.background.default,
    borderRadius: 0,
    zIndex: theme.zIndex.drawer,
  },
  icon: {
    fontSize: "3rem",
  },
}));

export default function SearchResultsMobileVerticalList({
  resultsSnippet,
}: Props) {
  const classes = useStyles();
  const [open, setOpen] = useState(false);

  const toggleDrawer = (newOpen: boolean) => () => {
    setOpen(newOpen);
  };

  return (
    <>
      {!open && (
        <IconButton
          edge="start"
          aria-label="open"
          color="inherit"
          onClick={toggleDrawer(true)}
          className={classes.openButton}
        >
          <ExpandLess className={classes.icon} />
        </IconButton>
      )}
      <div data-open-state={open} className={classes.drawer}>
        {open && (
          <IconButton
            edge="start"
            color="inherit"
            onClick={toggleDrawer(false)}
            aria-label="close"
            className={classes.closeButton}
          >
            <ExpandMore className={classes.icon} />
          </IconButton>
        )}

        <div className={classes.verticalList}>{resultsSnippet}</div>
      </div>
    </>
  );
}
