import { Typography, TypographyProps } from "@mui/material";

export default function PageTitle(props: TypographyProps) {
  return (
    <Typography
      {...props}
      className={props.className}
      sx={{ paddingBottom: 2, paddingTop: 2 }}
      variant="h1"
    />
  );
}
