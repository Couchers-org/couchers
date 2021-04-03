import { makeStyles } from "@material-ui/core";

import DesktopAuthBg from "./resources/desktop-auth-bg.jpg";
import MobileAuthBg from "./resources/mobile-auth-bg.jpg";

const useAuthStyles = makeStyles((theme) => ({
  backgroundBlurImage: {
    backgroundColor: theme.palette.grey[50],
    backgroundImage: `url(${MobileAuthBg})`,
    backgroundPosition: "top center",
    backgroundRepeat: "no-repeat",
    backgroundSize: "cover",
    display: "block",
    filter: "blur(5px)",
    height: "100vh",
    left: 0,
    opacity: "0.5",
    position: "fixed",
    right: 0,
    zIndex: -1,
  },
  button: {
    marginTop: theme.spacing(4),
    [theme.breakpoints.up("md")]: {
      borderRadius: theme.shape.borderRadius / 3,
    },
  },
  buttonText: {
    color: theme.palette.secondary.contrastText,
    fontWeight: 700,
  },
  content: {
    [theme.breakpoints.up("md")]: {
      display: "flex",
      flexDirection: "row",
      height: "100%",
      justifyContent: "space-between",
      margin: "auto",
      width: theme.breakpoints.values.md,
    },
  },
  /* disabled for beta:
  facebookButton: {
    width: "100%",
    height: "40px",
    borderRadius: theme.shape.borderRadius * 2,
    boxShadow: "0px 0px 5px rgba(0, 0, 0, 0.25)",
    minHeight: `calc(calc(${theme.typography.button.lineHeight} * ${
      theme.typography.button.fontSize
    }) + ${theme.typography.pxToRem(12)})`, // from padding
    color: theme.palette.secondary.contrastText,
    fontWeight: 700,
    backgroundColor: "#2d4486",
    marginTop: theme.spacing(6),
    marginBottom: theme.spacing(2),
  },
  googleButton: {
    width: "100%",
    height: "40px",
    borderRadius: theme.shape.borderRadius * 2,
    boxShadow: "0px 0px 5px rgba(0, 0, 0, 0.25)",
    minHeight: `calc(calc(${theme.typography.button.lineHeight} * ${
      theme.typography.button.fontSize
    }) + ${theme.typography.pxToRem(12)})`, // from padding
    color: theme.palette.secondary.contrastText,
    fontWeight: 700,
    backgroundColor: "#d9472e",
  },
  */
  divider: {
    borderTop: `1px solid ${theme.palette.common.white}`,
    marginLeft: "auto",
    marginRight: "auto",
    marginTop: theme.spacing(2),
    width: "100%",
    [theme.breakpoints.up("md")]: {
      borderTop: `1px solid ${theme.palette.text.primary}`,
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
    marginBottom: theme.spacing(5),
    width: "100%",
    [theme.breakpoints.up("md")]: {
      alignItems: "flex-start",
      marginBottom: 0,
    },
  },
  formField: {
    marginBottom: theme.spacing(2),
    width: "100%",
    [theme.breakpoints.up("md")]: {
      marginBottom: theme.spacing(4),
    },
  },
  formLabel: {
    color: theme.palette.text.primary,
    fontWeight: 700,
    [theme.breakpoints.up("md")]: {
      marginBottom: theme.spacing(2),
    },
  },
  formWrapper: {
    [theme.breakpoints.up("md")]: {
      backgroundColor: theme.palette.background.default,
      borderRadius: theme.shape.borderRadius / 3,
      padding: theme.spacing(5, 8),
      width: "53%",
    },
  },
  header: {
    width: "100%",
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    padding: theme.spacing(2, 4),
    marginBottom: theme.spacing(2),
  },
  introduction: {
    color: theme.palette.common.white,
    textAlign: "left",
    width: "40%",
    [theme.breakpoints.up("md")]: {
      marginTop: theme.spacing(10),
    },
  },
  logo: {
    color: theme.palette.secondary.main,
    fontFamily: "'Mansalva', cursive",
    fontSize: "2rem",
  },
  page: {
    alignItems: "center",
    boxSizing: "border-box",
    display: "flex",
    flexDirection: "column",
    minHeight: "100vh",
    padding: `${theme.spacing(1, 6)}`,
    [theme.breakpoints.up("md")]: {
      alignItems: "flex-start",
      backgroundImage: `url(${DesktopAuthBg})`,
      backgroundPosition: "top center",
      backgroundRepeat: "no-repeat",
      backgroundSize: "cover",
      flexDirection: "column",
      padding: `0 0 ${theme.spacing(6)} 0`,
      width: "100%",
    },
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
}));

export default useAuthStyles;
