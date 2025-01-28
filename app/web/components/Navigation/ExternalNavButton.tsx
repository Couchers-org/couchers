import { styled, Typography, TypographyProps } from "@mui/material";

interface ExternalNavButtonProps {
  route: string;
  label: string;
  labelVariant: Exclude<TypographyProps["variant"], undefined>;
}

const StyledLink = styled("a")(({ theme }) => ({
  color: theme.palette.text.secondary,
  display: "flex",
  flex: "1",
  fontSize: "2rem",
  maxWidth: "10.5rem",
  padding: theme.spacing(1, 1.5),
}));

const StyledTypography = styled(Typography)(() => ({
  alignSelf: "center",
  marginTop: 0,
}));

export default function ExternalNavButton({
  route,
  label,
  labelVariant,
}: ExternalNavButtonProps) {
  return (
    <StyledLink href={route} target="_blank" rel="noreferrer noopener">
      <StyledTypography variant={labelVariant} noWrap>
        {label}
      </StyledTypography>
    </StyledLink>
  );
}
