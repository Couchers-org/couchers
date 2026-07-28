import { styled, Typography } from "@mui/material";
import { useTranslation } from "i18n";
import { PRESS } from "i18n/namespaces";

import HeroImageAttribution from "../dashboard/Hero/HeroImageAttribution";

const StyledContainer = styled("div")({
  display: "flex",
  alignItems: "center",
  height: "14rem",
  position: "relative",
  overflow: "hidden",
  backgroundColor: "var(--mui-palette-primary-main)",
});

const StyledImage = styled("img")({
  position: "absolute",
  top: 0,
  left: 0,
  width: "100%",
  height: "100%",
  objectFit: "cover",
  objectPosition: "center",
});

const StyledOverlay = styled("div")({
  position: "absolute",
  top: 0,
  left: 0,
  width: "100%",
  height: "100%",
  background: "linear-gradient(#00000066, #000000da)",
});

const StyledHeading = styled("h1")(({ theme }) => ({
  color: "var(--mui-palette-common-white)",
  fontSize: "2rem",
  fontWeight: "500",
  margin: 0,

  [theme.breakpoints.up("sm")]: {
    fontSize: "2.5rem",
  },

  [theme.breakpoints.up("md")]: {
    fontSize: "3rem",
  },
}));

const StyledContentContainer = styled("div")(({ theme }) => ({
  position: "absolute",
  padding: "2rem",
  width: "100%",
  height: "100%",
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
  textAlign: "center",

  [theme.breakpoints.up("sm")]: {
    textAlign: "left",
  },
}));

export default function Hero() {
  const { t } = useTranslation([PRESS]);
  const email = "press@couchers.org";

  return (
    <StyledContainer>
      <StyledImage
        src="https://cdn.couchers.org/img/hero/2048.jpeg"
        srcSet={[
          "https://cdn.couchers.org/img/hero/1024.jpeg 1024w",
          "https://cdn.couchers.org/img/hero/2048.jpeg 2048w",
          "https://cdn.couchers.org/img/hero/4096.jpeg 4096w",
        ].join(", ")}
        sizes="100vw"
        alt=""
      />
      <StyledOverlay />
      <HeroImageAttribution />
      <StyledContentContainer>
        <StyledHeading>{t("hero.title")}</StyledHeading>
        <Typography color="var(--mui-palette-common-white)" fontSize="1.25rem">
          {t("hero.description", { email })}
        </Typography>
      </StyledContentContainer>
    </StyledContainer>
  );
}
