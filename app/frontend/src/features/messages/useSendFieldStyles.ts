import { makeStyles } from "@material-ui/core";

const useSendFieldStyles = makeStyles((theme) => ({
  button: {
    [theme.breakpoints.up("md")]: {
      margin: 0,
      marginInlineStart: theme.spacing(2),
      marginTop: theme.spacing(1),
    },
    display: "block",
    flexShrink: 0,
    marginInline: "auto",
    marginTop: theme.spacing(2),
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
    [theme.breakpoints.up("md")]: {
      alignItems: "flex-start",
      display: "flex",
    },
  },
}));

export default useSendFieldStyles;
