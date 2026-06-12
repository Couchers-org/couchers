import { Box, Link, styled, Typography } from "@mui/material";
import { blogRoute, foundationRoute, missionRoute } from "routes";

import StyledSubheading from "./StyledSubheading";

const aboutUsItems = [
  {
    heading: "Our Mission and Values",
    text: "Couchers.org exists to create genuine real-world connections and community. By engaging with people from different cultures and backgrounds, we push people to grow into being more open, empathetic, and tolerant and to build safe, inclusive community.",
    href: missionRoute,
  },
  {
    heading: "Our Blog",
    text: "Welcome to the Couchers.org blog where we write about latest updates, news, and milestones!",
    href: blogRoute,
  },
  {
    heading: "Couchers, Inc.",
    text: "Couchers, Inc. is a 501(c)(3) non-profit organization incorporated in the State of Florida in the United States and operates the Couchers.org service and project.",
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

const StyledCard = styled("div")({
  display: "grid",
  gridRow: "span 3",
  gridTemplateRows: "subgrid",
  gap: "1rem",
  padding: "1.5rem",
  backgroundColor: "var(--mui-palette-grey-50)",
  borderRadius: "4px",
});

export default function About() {
  return (
    <Box display="flex" flexDirection="column" sx={{ width: "100%" }} gap={4}>
      <StyledSubheading>Get to know more about us</StyledSubheading>
      <StyledContainer>
        {aboutUsItems.map(({ heading, text, href }) => (
          <StyledCard key={heading}>
            <Typography fontSize="1.5rem">{heading}</Typography>
            <Typography>{text}</Typography>
            <Link href={href}>Read more</Link>
          </StyledCard>
        ))}
      </StyledContainer>
    </Box>
  );
}
