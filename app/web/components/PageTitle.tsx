import { Typography, TypographyProps } from "@mui/material";
import { theme } from "theme";

export default function PageTitle(props: TypographyProps) {
  return (
    <Typography
      {...props}
      className={props.className}
      sx={{ paddingBottom: theme.spacing(2), paddingTop: theme.spacing(2) }}
      variant="h1"
    />
  );
}
