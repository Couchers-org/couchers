import mobileAuthBg from "features/auth/resources/mobile-auth-bg.jpg";
import makeStyles from "utils/makeStyles";

const useAuthStyles = makeStyles((theme) => ({
  button: {
    marginTop: theme.spacing(2),
    [theme.breakpoints.up("md")]: {
      borderRadius: theme.shape.borderRadius,
    },
  },
  buttonText: {
    color: theme.palette.secondary.contrastText,
    fontWeight: 700,
  },
  page: {
    display: "flex",
    flexDirection: "column",
    padding: theme.spacing(1, 4),
    paddingBottom: 0,
    [theme.breakpoints.down("xs")]: {
      padding: theme.spacing(1, 2),
    },
  },
  pageBackground: {
    background: `linear-gradient(rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.2)), url("${mobileAuthBg.src}")`,
    backgroundPosition: "top center",
    backgroundRepeat: "no-repeat",
    backgroundSize: "cover",
    width: "100%",
    height: `calc(100vh - ${theme.shape.navPaddingXs})`,
    [theme.breakpoints.up("sm")]: {
      height: `calc(100vh - ${theme.shape.navPaddingSmUp})`,
    },
  },
  header: {
    width: "100%",
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: theme.spacing(2, 0),
    [theme.breakpoints.up("md")]: {
      marginBottom: theme.spacing(2),
    },
  },
  content: {
    width: "100%",
    margin: "auto",
    [theme.breakpoints.up("md")]: {
      display: "flex",
      flexDirection: "row",
      height: "100%",
      justifyContent: "flex-end",
      alignItems: "center",
      width: "100%",
    },
  },
  errorMessage: {
    width: "100%",
  },
  feedbackMessage: {
    textAlign: "center",
    [theme.breakpoints.up("md")]: {
      textAlign: "left",
    },
  },
  form: {
    display: "flex",
    flexDirection: "column",
    marginBottom: theme.spacing(2),
    width: "100%",
    [theme.breakpoints.up("md")]: {
      alignItems: "flex-start",
    },
  },
  formCenter: {
    [theme.breakpoints.up("md")]: {
      position: "relative",
      zIndex: 2,
      marginBlockStart: "6rem",
      marginBlockEnd: theme.spacing(4),
      display: "flex",
      minHeight: `calc(100vh - 6rem - ${theme.spacing(4)})`,
      alignItems: "center",
      margin: "auto",
      width: theme.breakpoints.values.md,
    },
  },
  formField: {
    marginBottom: theme.spacing(2),
    marginTop: 0,
    width: "100%",
  },
  formLabel: {
    color: theme.palette.text.primary,
    fontWeight: 700,
    [theme.breakpoints.up("md")]: {
      marginBottom: theme.spacing(2),
    },
  },
  formWrapper: {
    flexShrink: 0,
    backgroundColor: "#fff",
    borderRadius: theme.shape.borderRadius,
    [theme.breakpoints.up("md")]: {
      width: "45%",
      padding: theme.spacing(5, 8),
    },
    [theme.breakpoints.down("sm")]: {
      width: "80%",
      padding: theme.spacing(5, 8),
      margin: theme.spacing(2, "auto"),
    },
    [theme.breakpoints.down("xs")]: {
      width: "100%",
      padding: theme.spacing(3, 4),
      margin: theme.spacing(0),
    },
  },
  introduction: {
    flexShrink: 0,
    color: theme.palette.common.white,
    flexDirection: "column",
    display: "flex",
    textAlign: "left",
    width: "45%",
    maxWidth: theme.breakpoints.values.md / 2,
    marginInlineEnd: "10%",
    [theme.breakpoints.down("sm")]: {
      display: "none",
    },
  },
  logo: {
    color: theme.palette.secondary.main,
    fontFamily: "'Mansalva', cursive",
    fontSize: "2rem",
    marginInlineStart: theme.spacing(1.5),
  },
  logoContainer: {
    display: "flex",
  },
  subtitle: {
    [theme.breakpoints.up("md")]: {
      display: "inline-block",
      marginTop: theme.spacing(4),
      position: "relative",
    },
  },
  title: {
    [theme.breakpoints.up("md")]: {
      fontSize: "2rem",
      lineHeight: "1.15",
      textAlign: "left",
    },
  },
  underline: {
    borderTop: `5px solid ${theme.palette.primary.main}`,
    boxShadow: "0px 4px 4px rgba(0, 0, 0, 0.25)",
    left: theme.spacing(1),
    position: "absolute",
    width: "100%",
  },
  vercelLink: {
    [theme.breakpoints.up("md")]: {
      position: "absolute",
      right: theme.spacing(2),
      bottom: theme.spacing(2),
      "& img": { height: "2.5rem" },
    },
    textAlign: "center",
    "& img": { height: "2rem" },
  },
}));

export default useAuthStyles;
