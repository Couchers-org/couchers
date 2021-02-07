import { makeStyles } from "@material-ui/core";

const useSendFieldStyles = makeStyles((theme) => ({
  root: {},
  container: {
    [theme.breakpoints.up("md")]: {
      display: "flex",
      alignItems: "flex-start",
    },
  },
  buttonContainer: {
    display: "flex",
    justifyContent: "center",
    flexWrap: "wrap",
    marginBottom: theme.spacing(2),
    "& > button": {
      marginInline: theme.spacing(2),
    },
  },
  button: {
    display: "block",
    marginInline: "auto",
    marginTop: theme.spacing(2),
    flexShrink: 0,
    [theme.breakpoints.up("md")]: {
      margin: 0,
      marginTop: theme.spacing(1),
      marginInlineStart: theme.spacing(2),
    },
  },
}));

export default useSendFieldStyles;
