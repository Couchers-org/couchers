import makeStyles from "utils/makeStyles";

const useStyles = makeStyles((theme) => ({
  avatar: {
    width: 120,
    height: 120,
  },
  topFormContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    [theme.breakpoints.up("md")]: {
      flexDirection: "row",
      margin: theme.spacing(1, 10),
    },
    "& .MuiTextField-root": {
      width: "100%",
    },
  },
  buttonContainer: {
    position: "fixed",
    bottom: 0,
    left: 0,
    width: "100%",
    display: "flex",
    zIndex: 105,
    backgroundColor: theme.palette.background.paper,
    borderTop: `1px solid ${theme.palette.divider}`,
    justifyContent: "center",
    paddingBottom: theme.spacing(1),
    paddingTop: theme.spacing(1),
  },
  // Everything under the mapbox
  bottomFormContainer: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    [theme.breakpoints.up("md")]: {
      margin: theme.spacing(0, 10),
    },
    // to make space for floating save button
    paddingBottom: theme.spacing(5),
  },
  radioButtons: {
    display: "flex",
    flexDirection: "column",
    [theme.breakpoints.up("sm")]: {
      display: "grid",
      gridTemplateColumns: "repeat(3, 1fr)",
    },
  },
  alert: {
    marginBottom: theme.spacing(3),
  },
  field: {
    [theme.breakpoints.up("md")]: {
      "& > .MuiInputBase-root": {
        width: 400,
      },
    },
    "& > .MuiInputBase-root": {
      width: "100%",
    },
  },
  form: {
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(2),
    // to make space for floating save button
    paddingBottom: theme.spacing(5),
  },
  formControl: {
    display: "block",
  },
  preferenceSection: {
    paddingTop: theme.spacing(3),
  },
  checkboxContainer: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, auto))",
    columnGap: theme.spacing(2),
  },
}));

export default useStyles;
