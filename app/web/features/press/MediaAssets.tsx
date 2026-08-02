import { Box, Button, ButtonProps, styled, Typography } from "@mui/material";
import { CouchersIcon } from "components/Icons";
import { useTranslation } from "i18n";
import { PRESS } from "i18n/namespaces";

import SectionHeading from "./SectionHeading";
import SectionWrapper from "./SectionWrapper";

const StyledContainer = styled("div")(({ theme }) => ({
  display: "grid",
  gap: "1rem",

  [theme.breakpoints.up("sm")]: {
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  },
}));

const StyledSection = styled("section")(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  border: "1px solid var(--mui-palette-primary-main)",
  borderRadius: "4px",
  overflow: "hidden",

  [theme.breakpoints.up("md")]: {
    flexDirection: "row",
  },
}));

const StyledCard = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "space-between",
  height: "100%",
  gap: "1.5rem",
  padding: "1rem",
  marginBottom: "1rem",

  [theme.breakpoints.up("md")]: {
    padding: "1.5rem",
    marginBottom: 0,
  },
}));

const StyledImage = styled("img")(({ theme }) => ({
  width: "100%",
  height: "18rem",
  objectFit: "cover",
  objectPosition: "center top",

  [theme.breakpoints.up("sm")]: {
    height: "17rem",
  },

  [theme.breakpoints.up("md")]: {
    width: "18rem",
    height: "12rem",
  },
}));

const StyledLogo = styled(Box)(({ theme }) => ({
  width: "100%",
  height: "18rem",

  ".svg-logo": {
    width: "100%",
    height: "100%",
  },

  [theme.breakpoints.up("sm")]: {
    width: "100%",
    height: "17rem",
  },

  [theme.breakpoints.up("md")]: {
    width: "18rem",
    height: "12rem",
  },
}));

const StyledButton = styled(Button)<ButtonProps<"a">>(({ theme }) => ({
  minWidth: "8rem",
  textAlign: "center",
  width: "10rem",
}));

export default function MediaAssets() {
  const { t } = useTranslation([PRESS]);

  return (
    <SectionWrapper>
      <SectionHeading>{t("download.subheading")}</SectionHeading>
      <StyledContainer>
        <StyledSection>
          <StyledLogo>
            <CouchersIcon color="secondary" className="svg-logo" />
          </StyledLogo>
          <StyledCard>
            <Typography
              sx={{
                fontSize: "1.25rem",
                textAlign: "center",
              }}
            >
              {t("download.logo_text")}
            </Typography>
            <StyledButton
              component="a"
              href="/img/press/downloads/couchers-logo-assets.zip"
              download="couchers-logo-assets.zip"
              variant="outlined"
              aria-label={t("download.logo_aria_label")}
            >
              {t("download.button")}
            </StyledButton>
          </StyledCard>
        </StyledSection>
        <StyledSection>
          <StyledImage src="/img/press/mobile-image.webp" alt={t("download.mobile_image_alt")} />
          <StyledCard>
            <Typography
              sx={{
                fontSize: "1.25rem",
                textAlign: "center",
              }}
            >
              {t("download.images_text")}
            </Typography>
            <StyledButton
              component="a"
              href="/img/press/downloads/couchers-mobile-images.zip"
              download="couchers-mobile-images.zip"
              variant="outlined"
              aria-label={t("download.mobile_images_aria_label")}
            >
              {t("download.button")}
            </StyledButton>
          </StyledCard>
        </StyledSection>
      </StyledContainer>
    </SectionWrapper>
  );
}
