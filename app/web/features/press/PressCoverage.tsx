import { Box, Card, Link, styled, Typography } from "@mui/material";

import StyledBox from "./StyledBox";
import StyledSubheading from "./StyledSubheading";

const articlesData = [
  {
    imgPath: "/img/press/travel-noir-logo.png",
    altText: "Travel Noir",
    bgColor: "#001d2e",
    padding: "1rem",
    publishedDate: "April 1, 2025",
    headline:
      "Couchsurfing vs. house sitting: how to stay for free around the world",
    href: "https://travelnoire.com/couchsurfing-house-sitting-travel",
  },
  {
    imgPath: "/img/press/adventure-uncovered.svg",
    altText: "Adventure Uncovered",
    bgColor: "#1d1d1d",
    padding: "1rem",
    publishedDate: "October 6, 2022",
    headline: "The couchsurfing crossroads",
    href: "https://adventureuncovered.com/stories/the-couchsurfing-crossroads/",
  },
  {
    imgPath: "/img/press/input-logo.svg",
    altText: "Input",
    bgColor: undefined,
    padding: undefined,
    publishedDate: "September 15, 2021",
    headline: "Paradise lost: The rise and ruin of Couchsurfing.com",
    href: "https://www.inverse.com/input/features/rise-and-ruin-of-couchsurfing",
  },
];

interface StyledImageProps {
  bgColor?: string;
  padding?: string;
}

const StyledImage = styled("img", {
  shouldForwardProp: (prop) => prop !== "bgColor",
})<StyledImageProps>(({ bgColor, padding }) => ({
  width: "100%",
  height: "4rem",
  objectFit: "cover",
  backgroundColor: bgColor,
  padding: padding,
  borderRadius: "4px",
}));

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

const StyledCard = styled(Card)(({ theme }) => ({
  display: "grid",
  gridRow: "span 4",
  gridTemplateRows: "subgrid",
  padding: "1rem",

  [theme.breakpoints.up("md")]: {
    padding: "1.5rem",
  },
}));

export default function PressCoverage() {
  return (
    <StyledBox>
      <StyledSubheading>Featured Coverage</StyledSubheading>
      <StyledContainer>
        {articlesData.map(
          ({
            imgPath,
            altText,
            bgColor,
            padding,
            publishedDate,
            headline,
            href,
          }) => (
            <StyledCard key={altText}>
              <Box
                sx={{
                  margin: "0 auto",
                }}
              >
                <StyledImage
                  src={imgPath}
                  alt={altText}
                  loading="lazy"
                  bgColor={bgColor}
                  padding={padding}
                />
              </Box>
              <Typography>{publishedDate}</Typography>
              <Typography fontSize="1.25rem">"{headline}"</Typography>
              <Link href={href} target="_blank" rel="noopener noreferrer">
                Read More
              </Link>
            </StyledCard>
          ),
        )}
      </StyledContainer>
    </StyledBox>
  );
}
