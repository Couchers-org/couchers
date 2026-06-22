import { Box, Button, ButtonProps, styled, Typography } from "@mui/material";
import { CouchersIcon } from "components/Icons";

import StyledBox from "./StyledBox";
import StyledSubheading from "./StyledSubheading";

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

  [theme.breakpoints.up("sm")]: {
    flexDirection: "column",
  },

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
    width: "100%",
    height: "17rem",
    objectPosition: "center top",
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
  marginBlockEnd: theme.spacing(2),
  width: "10rem",
  margin: 0,
}));

export default function DownloadableFiles() {
  return (
    <StyledBox>
      <StyledSubheading>Download media assets</StyledSubheading>
      <StyledContainer>
        <StyledSection>
          <StyledLogo>
            <CouchersIcon color="secondary" className="svg-logo" />
          </StyledLogo>
          <StyledCard>
            <Typography fontSize="1.25rem" textAlign="center">
              Download our logo in SVG and PNG format
            </Typography>
            <StyledButton
              component="a"
              href="/img/press/downloads/couchers-logo-assets.zip"
              download="couchers-logo-assets.zip"
              variant="outlined"
            >
              Download
            </StyledButton>
          </StyledCard>
        </StyledSection>
        <StyledSection>
          <StyledImage src="/img/press/mobile-image.png" />
          <StyledCard>
            <Typography fontSize="1.25rem" textAlign="center">
              Download mobile app images
            </Typography>
            <StyledButton
              component="a"
              href="/img/press/downloads/couchers-mobile-images.zip"
              download="couchers-mobile-images.zip"
              variant="outlined"
            >
              Download
            </StyledButton>
          </StyledCard>
        </StyledSection>
      </StyledContainer>
    </StyledBox>
  );
}
