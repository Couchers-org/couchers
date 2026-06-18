import { styled, Typography } from "@mui/material";

import HeroImageAttribution from "../dashboard/Hero/HeroImageAttribution";

const StyledContainer = styled("div")({
  display: "flex",
  alignItems: "center",
  height: "14rem",
  position: "relative",
  backgroundColor: "var(--mui-palette-primary-main)",
  backgroundImage:
    "linear-gradient(#00000066, #000000da), url(https://cdn.couchers.org/img/hero/2048.jpeg)",
  backgroundSize: "cover",
  backgroundPosition: "center",
});

const StyledHeading = styled("h1")(({ theme }) => ({
  color: "#fff",
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
  return (
    <StyledContainer>
      <HeroImageAttribution />
      <StyledContentContainer>
        <StyledHeading>Press & Media</StyledHeading>
        <Typography color="#fff" fontSize="1.25rem">
          For press and media inquiries, contact press@couchers.org
        </Typography>
      </StyledContentContainer>
    </StyledContainer>
  );
}
