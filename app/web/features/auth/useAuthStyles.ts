import { InputLabel, styled } from "@mui/material";
import Button from "components/Button";
import TextField from "components/TextField";

const StyledForm = styled("form")(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  width: "100%",
  [theme.breakpoints.up("md")]: {
    alignItems: "flex-start",
  },
}));

const StyledInputLabel = styled(InputLabel)(({ theme }) => ({
  color: "var(--mui-palette-text-primary)",
  width: "100%",
  fontSize: "0.875rem",
  marginLeft: theme.spacing(0.5),
  [theme.breakpoints.up("md")]: {
    marginBottom: theme.spacing(1),
  },
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  marginTop: 0,
  width: "100%",

  "& .MuiInputBase-root": {
    backgroundColor: "var(--mui-palette-background-paper)",
    "&.Mui-focused": {
      backgroundColor: "var(--mui-palette-background-paper)",
    },
  },
}));

const StyledButton = styled(Button)(({ theme }) => ({
  color: "var(--mui-palette-secondary-contrastText)",
  fontWeight: 700,
  marginTop: theme.spacing(2),
  fontSize: "1.4rem",

  [theme.breakpoints.up("md")]: {
    borderRadius: theme.shape.borderRadius,
  },
}));

export { StyledButton, StyledForm, StyledInputLabel, StyledTextField };
