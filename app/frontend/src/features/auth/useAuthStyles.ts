import { makeStyles } from "@material-ui/core";

import AuthBg from "./resources/auth-bg.png";

const useAuthStyles = makeStyles((theme) => ({
  page: {
    boxSizing: "border-box",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    height: "100vh",
    padding: `${theme.spacing(1)} ${theme.spacing(6)}`,
  },
  backgroundBlurImage: {
    position: "fixed",
    left: 0,
    right: 0,
    zIndex: -1,
    display: "block",
    backgroundImage: `url(${AuthBg})`,
    backgroundColor: "#f3f3f3",
    backgroundPosition: "top center",
    backgroundRepeat: "no-repeat",
    backgroundSize: "contain",
    height: "100vh",
    filter: "blur(5px)",
    opacity: "0.5",
  },
  divider: {
    width: "100%",
    marginTop: theme.spacing(2),
    marginLeft: "auto",
    marginRight: "auto",
    borderTop: `1px solid ${theme.palette.text.primary}`,
  },
  feedbackMessage: {
    textAlign: "center",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    marginBottom: theme.spacing(5),
    width: "100%",
  },
  formField: {},
  formLabel: {
    color: theme.palette.text.primary,
    fontWeight: 700,
  },
  button: {
    marginTop: theme.spacing(4),
  },
  buttonText: {
    color: theme.palette.secondary.contrastText,
    fontWeight: 700,
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
}));

export default useAuthStyles;
