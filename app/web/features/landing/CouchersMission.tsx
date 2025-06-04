import { Box, Fade, Grid, styled, Typography } from "@mui/material";
import StyledLink from "components/StyledLink";
import { StyledButton } from "features/auth/useAuthStyles";
import { useTranslation } from "i18n";
import { GLOBAL, LANDING } from "i18n/namespaces";
import Link from "next/link";
import { Fragment,useState } from "react";
import { useInView } from "react-intersection-observer";
import { donationsRoute, missionRoute, roadmapRoute, volunteerRoute } from "routes";
import { theme } from "theme";

const StyledSpacer = styled("div")(({ theme }) => ({
  height: theme.spacing(5),
}));

const StyledButtonContainer = styled("div")({
  display: "flex",
  flexDirection: "row",
  gap: "24px",
});

const TranslationKeys: Record<string, string[]> = {
  non_profit_structure: [
    "non_profit_structure_description_line1",
    "non_profit_structure_description_line2",
    "empty_line",
    "non_profit_structure_description_line3",
    "non_profit_structure_description_line4",
    "empty_line",
    "non_profit_structure_description_line5",
  ],
  community_first: [
    "community_first_description",
  ],
  member_accountability: [
    "member_accountability_description",
  ],
  improved_review_system: [
    "improved_review_system_description",
  ],
}

const CouchersMission = () => {
  const { t } = useTranslation([LANDING, GLOBAL]);
  const { ref, inView } = useInView({ triggerOnce: true });
  const [selectedItem, setSelectedItem] = useState("non_profit_structure");

  const missionBubble = (itemName: string, itemTitle: string) => {
    return (
      <Grid
        item
        xs={3.7}
        md={2}
        display="flex"
        alignItems="center"
        onClick={() => {setSelectedItem(itemName);}}
        sx={{
          backgroundColor: selectedItem === itemName ? theme.palette.primary.main : theme.palette.primary.light,
          padding: 2,
          borderRadius: 2,
          flex: { md: 1 },
          minWidth: 0,
          cursor: "pointer",
          position: "relative",
          "&::after": {
            content: '""',
            position: "absolute",
            bottom: "-8px",
            left: "50%",
            transform: "translateX(-50%)",
            width: 0,
            height: 0,
            borderLeft: "10px solid transparent",
            borderRight: "10px solid transparent",
            borderTop: `10px solid ${selectedItem === itemName ? theme.palette.primary.main : theme.palette.primary.light}`,
            display: selectedItem === itemName ? "block" : "none",
            [theme.breakpoints.down("md")]: {
              display: "none",
            },
          },
        }}
      >
        <Box display="flex" flexDirection="column" width="100%">
          <Typography variant="h6" align="center" gutterBottom>
            {t(itemTitle)}
          </Typography>
        </Box>
      </Grid>
    )
  }
  
  const missionDescription = (selectedItem: string) => {
    return (
      <Box 
        display="flex" flexDirection="column" width="100%">
        <Typography align="justify" variant="body2">
          {(TranslationKeys[selectedItem] || []).map((element, index) => {
            let content
            switch (element) {
              case "empty_line":
                content = <br />
                break
              case "non_profit_structure_description_line5":
                content = (
                  <Fragment>
                    {t("non_profit_structure_description_line5")}
                    <StyledLink href={missionRoute}>
                      {t("read_here")}
                    </StyledLink>
                  </Fragment>
                )
                break
              default:
                content = t(element);
            }
            return <Fragment key={index}>
                {content}
                {(index < TranslationKeys[selectedItem].length - 1) && <br />}
              </Fragment>
          })}
        </Typography>
      </Box>
    )
  }

  return (
    <>
      <Typography variant="h2">{t("couchers_mission_title")}</Typography>
      <Fade timeout={2000} in={inView}>
        <Grid
          container
          ref={ref}
          sx={{
            marginTop: 2,
            width: "100%",
          }}
        >
          <Grid
            container
            gap={2}
            sx={{
              width: "100%",
              flexWrap: { xs: "wrap", md: "nowrap" }
            }}
          >
            {missionBubble("non_profit_structure", "non_profit_structure_title")}
            {missionBubble("community_first", "community_first_title")}
            {missionBubble("member_accountability", "member_accountability_title")}
            {missionBubble("improved_review_system", "improved_review_system_title")}
            {missionBubble("better_host_matching", "better_host_matching_title")}
            {missionBubble("built_it_right", "built_it_right_title")}
          </Grid>
          <Grid
            container
            sx={{
              width: "100%",
            }}
          >
            <Grid
              item
              display="flex"
              sx={{
                marginTop: 1,
                backgroundColor: theme.palette.grey[200],
                padding: 2,
                borderRadius: 2,
                flex: { md: 1 },
                minWidth: 0,
              }}
            >
              {missionDescription(selectedItem)}
            </Grid>
          </Grid>

        </Grid>
      </Fade>
      <StyledSpacer />
      <Typography variant="h6" gutterBottom>
        {t("want_to_help")}
      </Typography>
      <Typography variant="body1">
        {t("want_to_help_description")}
      </Typography>
      <br />
      <Typography variant="body1">
        {t("want_to_help_roadmap")}
        {" "}
        <StyledLink href={roadmapRoute}>
          {t("global:nav.roadmap_updates")}
        </StyledLink>
      </Typography>
      <StyledButtonContainer>
        <Link href={volunteerRoute} passHref legacyBehavior>
          <StyledButton component="a" variant="contained" color="secondary">
            {t("global:nav.volunteer")}
          </StyledButton>
        </Link>
        <Link href={donationsRoute} passHref legacyBehavior>
          <StyledButton component="a" variant="contained">
            {t("global:nav.donate")}
          </StyledButton>
        </Link>
      </StyledButtonContainer>
    </>
  );
};

export default CouchersMission;
