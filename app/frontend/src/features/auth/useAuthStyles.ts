import { makeStyles } from "@material-ui/core";

import AuthBg from "./resources/auth-bg.png";

const useAuthStyles = makeStyles((theme) => ({
  backgroundBlurImage: {
    backgroundColor: "#f3f3f3",
    backgroundImage: `url(${AuthBg})`,
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
  },
  form: {
    display: "flex",
    flexDirection: "column",
    marginBottom: theme.spacing(5),
    width: "100%",
  },
  formField: {
    marginBottom: theme.spacing(2),
  },
  formLabel: {
    color: theme.palette.text.primary,
    fontWeight: 700,
  },
  page: {
    alignItems: "center",
    boxSizing: "border-box",
    display: "flex",
    flexDirection: "column",
    minHeight: "100vh",
    padding: `${theme.spacing(1, 6)}`,
  },
}));

export default useAuthStyles;
