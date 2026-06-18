import { Box, Divider, styled } from "@mui/material";

import SocialMediaLinks from "../../components/SocialMediaLinks";
import { useListVolunteers } from "../communities/hooks";
import TeamSection from "../team/TeamSection";
import About from "./About";
import DownloadableFiles from "./DownloadableFiles";
import Facts from "./Facts";
import Hero from "./Hero";
import PressCoverage from "./PressCoverage";
import StyledBox from "./StyledBox";
import StyledSubheading from "./StyledSubheading";

const StyledContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: "2.5rem",

  [theme.breakpoints.up("md")]: {
    gap: "3rem",
  },
}));

const StyledSocialMediaContainer = styled("div")(({ theme }) => ({
  display: "grid",
  gridTemplateColumns: "repeat(3, 2.5rem)",
  gap: "2.5rem",
  paddingBottom: "1rem",

  [theme.breakpoints.up("sm")]: {
    gridTemplateColumns: "repeat(6, 2.5rem)",
  },
}));

export default function Press() {
  const volunteers = useListVolunteers();

  return (
    <StyledContainer>
      <Hero />
      <Facts />
      <Divider
        sx={{
          backgroundColor: "var(--mui-palette-divider)",
        }}
      />
      <About />
      <DownloadableFiles />
      <StyledBox>
        <StyledSubheading>Meet the team</StyledSubheading>
        <TeamSection
          variant={"current"}
          volunteers={volunteers.data?.currentVolunteersList}
          boardMembersOnly
          hasExtraCard
        />
      </StyledBox>
      <StyledBox sx={{ alignItems: "center" }}>
        <StyledSubheading>Follow us</StyledSubheading>
        <StyledSocialMediaContainer>
          <SocialMediaLinks iconSize="2.5rem" />
        </StyledSocialMediaContainer>
      </StyledBox>
      <Divider
        sx={{
          backgroundColor: "var(--mui-palette-divider)",
        }}
      />
      <PressCoverage />
    </StyledContainer>
  );
}
