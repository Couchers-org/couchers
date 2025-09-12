import { Typography, TypographyProps } from "@mui/material";

import { theme } from "@/theme";

const PageTitle = (props: TypographyProps) => {
  return (
    <Typography
      {...props}
      className={props.className}
      sx={{ paddingBottom: theme.spacing(2), paddingTop: theme.spacing(2) }}
      variant="h1"
    />
  );
};

export default PageTitle;
