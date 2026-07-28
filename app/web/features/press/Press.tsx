import { Box, Divider, styled } from "@mui/material";
import { useTranslation } from "i18n";
import { PRESS } from "i18n/namespaces";
import useIsScreenSizeOrSmaller from "utils/useIsScreenSizeOrSmaller";

import SocialMediaLinks from "../../components/SocialMediaLinks";
import { useListVolunteers } from "../communities/hooks";
import TeamSection from "../team/TeamSection";
import About from "./About";
import Facts from "./Facts";
import Hero from "./Hero";
import MediaAssets from "./MediaAssets";
import PressCoverage from "./PressCoverage";
import SectionHeading from "./SectionHeading";
import SectionWrapper from "./SectionWrapper";

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
  gridTemplateColumns: "repeat(6, 2.5rem)",
  gap: "1rem",
  paddingBottom: "1rem",

  [theme.breakpoints.up("md")]: {
    gap: "2.5rem",
  },
}));

export default function Press() {
  const { t } = useTranslation([PRESS]);
  const volunteers = useListVolunteers();
  const isMobile = useIsScreenSizeOrSmaller("mobile");

  return (
    <StyledContainer>
      <Hero />
      <Facts volunteers={volunteers} />
      <Divider />
      <About />
      <MediaAssets />
      <SectionWrapper>
        <SectionHeading>{t("team.subheading")}</SectionHeading>
        <TeamSection
          variant="current"
          volunteers={volunteers.data?.currentVolunteersList}
          boardMembersOnly
          hasExtraCard
          extraCardContent={{
            text: t("team.extra_card_text"),
            link: t("team.extra_card_link"),
          }}
        />
      </SectionWrapper>
      <SectionWrapper sx={{ alignItems: "center" }}>
        <SectionHeading>{t("social_media_subheading")}</SectionHeading>
        <StyledSocialMediaContainer>
          <SocialMediaLinks iconSize={isMobile ? "2rem" : "2.5rem"} />
        </StyledSocialMediaContainer>
      </SectionWrapper>
      <Divider />
      <PressCoverage />
    </StyledContainer>
  );
}
