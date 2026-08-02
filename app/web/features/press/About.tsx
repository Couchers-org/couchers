import { styled, Typography } from "@mui/material";
import StyledLink from "components/StyledLink";
import { useTranslation } from "i18n";
import { PRESS } from "i18n/namespaces";
import { blogRoute, foundationRoute, missionRoute } from "routes";

import SectionHeading from "./SectionHeading";
import SectionWrapper from "./SectionWrapper";

const aboutUsItems = [
  {
    heading: "about.mission_heading",
    text: "about.mission_text",
    href: missionRoute,
  },
  {
    heading: "about.blog_heading",
    text: "about.blog_text",
    href: blogRoute,
  },
  {
    heading: "about.foundation_heading",
    text: "about.foundation_text",
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

const StyledHeading = styled("h3")(({ theme }) => ({
  fontSize: "1.25rem",
  fontWeight: "500",
  marginTop: 0,
  marginBottom: 0,

  [theme.breakpoints.up("md")]: {
    fontSize: "1.5rem",
  },
}));

const StyledReadMoreLink = styled(StyledLink)(({ theme }) => ({
  justifySelf: "center",

  [theme.breakpoints.up("sm")]: {
    justifySelf: "start",
  },
}));

export default function About() {
  const { t } = useTranslation([PRESS]);

  return (
    <SectionWrapper>
      <SectionHeading>{t("about.subheading")}</SectionHeading>
      <StyledContainer>
        {aboutUsItems.map(({ heading, text, href }) => (
          <StyledCard key={heading}>
            <StyledHeading>{t(heading)}</StyledHeading>
            <Typography>{t(text)}</Typography>
            <StyledReadMoreLink href={href} aria-label={t("read_more_link_aria", { headline: t(heading) })}>
              {t("read_more")}
            </StyledReadMoreLink>
          </StyledCard>
        ))}
      </StyledContainer>
    </SectionWrapper>
  );
}
