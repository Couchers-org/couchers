import { Container, styled } from "@mui/material";
import { DASHBOARD } from "i18n/namespaces";
import { useTranslation } from "next-i18next";

import HeroImage from "./HeroImage";
import HeroImageAttribution from "./HeroImageAttribution";
import HeroSearch from "./HeroSearch";
// Photo by Mesut Kaya on Unsplash - https://unsplash.com/photos/eOcyhe5-9sQ

const StyledContainer = styled(Container)(({ theme }) => ({
  zIndex: 1,
  position: "relative",
  display: "flex",
  flexDirection: "column",
  padding: theme.spacing(4, 0),

  [theme.breakpoints.up("sm")]: {
    padding: theme.spacing(6, 0),
  },

  [theme.breakpoints.up("md")]: {
    padding: theme.spacing(8, 0),
  },
}));

const StyledOuterContainer = styled("div")({
  position: "relative",
  display: "flex",
  justifyContent: "center",
});

export default function Hero() {
  const { t } = useTranslation(DASHBOARD);

  return (
    <StyledOuterContainer>
      <StyledContainer maxWidth="sm" disableGutters>
        <HeroSearch />
      </StyledContainer>
      <HeroImageAttribution />
      <HeroImage
        alt={t("hero_image_alt")}
        // export as tiny PNG (a few px by a few px), then
        // echo "data:image/png;base64,$(cat 5.png | base64 -w 0)"
        placeHolderSrc="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAADCAIAAADUVFKvAAAAO0lEQVQI1wEwAM//AZqxot4B/d78+d38/N/8+wRIDRH9AQHu+vnD1NQQHhsBUWNNFQ0N+/n39fT3/Q8PwSsbXi/QOgYAAAAASUVORK5CYII="
        imageWidths={[
          {
            width: 1024,
            fileName: "https://cdn.couchers.org/img/hero/1024.jpeg",
          },
          {
            width: 2048,
            fileName: "https://cdn.couchers.org/img/hero/2048.jpeg",
          },
          {
            width: 4096,
            fileName: "https://cdn.couchers.org/img/hero/4096.jpeg",
          },
        ]}
      />
    </StyledOuterContainer>
  );
}
