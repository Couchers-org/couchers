import { makeStyles } from "@material-ui/core";

import DesktopAuthBg from "./resources/desktop-auth-bg.png";
import MobileAuthBg from "./resources/mobile-auth-bg.png";

const useAuthStyles = makeStyles((theme) => ({
  backgroundBlurImage: {
    backgroundColor: "#f3f3f3",
    backgroundImage: `url(${MobileAuthBg})`,
    backgroundPosition: "top center",
    backgroundRepeat: "no-repeat",
    backgroundSize: "contain",
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
      borderRadius: "4px",
      width: "180px",
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
      margin: "0 auto",
      width: "960px",
    },
  },
  /* disabled for beta:
  facebookButton: {
    width: "100%",
    height: "40px",
    borderRadius: `${theme.shape.borderRadius * 2}px`,
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
    borderRadius: `${theme.shape.borderRadius * 2}px`,
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
    borderTop: `1px solid ${theme.palette.text.primary}`,
    marginLeft: "auto",
    marginRight: "auto",
    marginTop: theme.spacing(2),
    width: "100%",
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
      marginBottom: 0,
    },
  },
  formField: {
    marginBottom: theme.spacing(2),
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
      backgroundColor: "#f8f7f4",
      borderRadius: "4px",
      padding: theme.spacing(5, 8),
      width: "547px",
    },
  },
  header: {
    width: "100%",
    display: "flex",
    flexDirection: "row",
    height: "80px",
    justifyContent: "space-between",
    padding: theme.spacing(2, 4),
    marginBottom: theme.spacing(2),
  },
  introduction: {
    color: "#ffffff",
    marginTop: theme.spacing(18),
    textAlign: "left",
    width: "400px",
  },
  logo: {
    color: theme.palette.secondary.main,
    fontFamily: "'Mansalva', cursive",
    fontSize: "32px",
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
      fontSize: "32px",
      lineHeight: "37px",
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
