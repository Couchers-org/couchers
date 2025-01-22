import { styled, Typography } from "@mui/material";
import { theme } from "theme";

import TextBody from "./TextBody";

const StyledWrapper = styled("div")(({ theme }) => ({
  display: "flex",
  marginTop: theme.spacing(0.5),
  alignItems: "flex-start", // Ensures the label aligns with the top of multi-line text
}));

const StyledFlexItem = styled("div")(({ theme }) => ({
  flex: "1 1 50%",
  display: "flex",
  alignItems: "center",
}));

export interface LabelAndTextProps {
  label: string;
  text: string | React.ReactNode;
}

export default function LabelAndText({ label, text }: LabelAndTextProps) {
  return (
    <StyledWrapper>
      <Typography
        variant="h3"
        sx={{
          margin: 0,
          marginInlineEnd: theme.spacing(1),
          flex: "1 1 50%",
          display: "flex",
          alignItems: "center",
        }}
      >
        {label}
      </Typography>
      {typeof text === "string" ? (
        <TextBody
          sx={{ flex: "1 1 50%", display: "flex", alignItems: "center" }}
        >
          {text}
        </TextBody>
      ) : (
        <StyledFlexItem>{text}</StyledFlexItem> // AgeAndGenderRenderer is a div not string
      )}
    </StyledWrapper>
  );
}
