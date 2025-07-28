import { styled } from "@mui/material";
import { theme } from "theme";

const StyledChangeDetailsForm = styled("form")(() => ({
  marginBottom: theme.spacing(2),
  "& > * + *": {
    marginBlockStart: theme.spacing(1),
  },
}));

export default StyledChangeDetailsForm;
