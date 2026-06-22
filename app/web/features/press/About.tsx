import { styled, Typography } from "@mui/material";
import StyledLink from "components/StyledLink";
import { useTranslation } from "i18n";
import { PRESS } from "i18n/namespaces";
import { blogRoute, foundationRoute, missionRoute } from "routes";

import StyledBox from "./StyledBox";
import StyledSubheading from "./StyledSubheading";

const aboutUsItems = [
  {
    heading: "about_mission_heading",
    text: "about_mission_text",
    href: missionRoute,
  },
  {
    heading: "about_blog_heading",
    text: "about_blog_text",
    href: blogRoute,
  },
  {
    heading: "about_foundation_heading",
    text: "about_foundation_text",
    href: foundationRoute,
  },
];

const StyledContainer = styled("div")(({ theme }) => ({
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: "1rem",

  [theme.breakpoints.up("md")]: {
    gridTemplateColumns: "1fr 1fr",
  },

  [theme.breakpoints.up("lg")]: {
    gridTemplateColumns: "1fr 1fr 1fr",
  },
}));

const StyledCard = styled("div")(({ theme }) => ({
  display: "grid",
  gridRow: "span 3",
  gridTemplateRows: "subgrid",
  gap: "1rem",
  padding: "1rem",
  backgroundColor: "var(--mui-palette-grey-50)",
  borderRadius: "4px",

  [theme.breakpoints.up("md")]: {
    padding: "1.5rem",
  },
}));

const StyledHeading = styled(Typography)(({ theme }) => ({
  fontSize: "1.25rem",

  [theme.breakpoints.up("md")]: {
    fontSize: "1.5rem",
  },
}));

export default function About() {
  const { t } = useTranslation([PRESS]);

  return (
    <StyledBox>
      <StyledSubheading>{t("about_subheading")}</StyledSubheading>
      <StyledContainer>
        {aboutUsItems.map(({ heading, text, href }) => (
          <StyledCard key={heading}>
            <StyledHeading fontSize="1.5rem">{t(heading)}</StyledHeading>
            <Typography>{t(text)}</Typography>
            <StyledLink href={href}>{t("read_more")}</StyledLink>
          </StyledCard>
        ))}
      </StyledContainer>
    </StyledBox>
  );
}
