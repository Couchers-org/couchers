import { InputLabel, styled } from "@mui/material";
import Button from "components/Button";
import TextField from "components/TextField";

const StyledForm = styled("form")(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  marginBottom: theme.spacing(2),
  width: "100%",
  [theme.breakpoints.up("md")]: {
    alignItems: "flex-start",
  },
}));

const StyledInputLabel = styled(InputLabel)(({ theme }) => ({
  color: theme.palette.text.primary,
  fontWeight: 700,
  [theme.breakpoints.up("md")]: {
    marginBottom: theme.spacing(2),
  },
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  marginTop: 0,
  width: "100%",
}));

const StyledButton = styled(Button)(({ theme }) => ({
  color: theme.palette.secondary.contrastText,
  fontWeight: 700,
  marginTop: theme.spacing(2),

  [theme.breakpoints.up("md")]: {
    borderRadius: theme.shape.borderRadius,
  },
}));

export { StyledButton, StyledForm, StyledInputLabel, StyledTextField };
