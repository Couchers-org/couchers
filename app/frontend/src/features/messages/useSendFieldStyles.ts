import { makeStyles } from "@material-ui/core";

const useSendFieldStyles = makeStyles((theme) => ({
  button: {
    [theme.breakpoints.up("md")]: {
      marginInlineStart: theme.spacing(2),
    },
    display: "block",
    flexShrink: 0,
    marginInlineEnd: "auto",
    marginBottom: theme.spacing(1),
    marginTop: theme.spacing(1),
    marginLeft: theme.spacing(1),
  },
  buttonContainer: {
    "& > button": {
      marginInline: theme.spacing(2),
    },
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "center",
  },
  container: {
    alignItems: "flex-start",
    display: "flex",
  },
  requestClosedLabel: {
    transform: "none",
    padding: theme.spacing(2, 2),
  },
}));

export default useSendFieldStyles;
