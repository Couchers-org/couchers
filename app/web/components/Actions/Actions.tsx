import { styled } from "@mui/material";
import { ReactNode } from "react";

const StyledWrapper = styled("div")(({ theme }) => ({
  display: "flex",
  marginTop: theme.spacing(2),
  justifyContent: "flex-end",
  padding: theme.spacing(1),
  "& :not(:first-of-type)": {
    marginInlineStart: theme.spacing(1),
  },
}));

const Actions = ({ children }: { children: ReactNode }) => {
  return <StyledWrapper>{children}</StyledWrapper>;
};

export default Actions;
