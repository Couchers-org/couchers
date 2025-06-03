import { Box, Button, ButtonProps, Fade, Grid, styled, Typography } from "@mui/material";
import Link from "next/link";
import StyledLink from "components/StyledLink";
import { StyledButton } from "features/auth/useAuthStyles";
import { useTranslation } from "i18n";
import { GLOBAL, LANDING } from "i18n/namespaces";
import { useInView } from "react-intersection-observer";
import { donationsRoute, roadmapRoute, volunteerRoute } from "routes";
import { theme } from "theme";
import { useState } from "react";

const StyledSpacer = styled("div")(({ theme }) => ({
  height: theme.spacing(5),
}));

const StyledButtonContainer = styled("div")({
  display: "flex",
  flexDirection: "row",
  gap: "24px",
});

const CouchersMission = () => {
  const { t } = useTranslation([LANDING, GLOBAL]);
  const { ref, inView } = useInView({ triggerOnce: true });

  const [selectedItem, setSelectedItem] = useState("non_profit_structure");

  const renderGridItem = (itemName: string, itemTitle: string) => {
    return (
      <Grid
        item
        xs={4}
        md={2}
        display="flex"
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
            bottom: "-10px",
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
          <Typography variant="h6" gutterBottom>
            {t(itemTitle)}
          </Typography>
        </Box>
      </Grid>
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
              flexWrap: { xs: "wrap", md: "nowrap" },
            }}
          >
            {renderGridItem("non_profit_structure", "non_profit_structure_title")}
            {renderGridItem("community_first", "community_first_title")}
            {renderGridItem("member_accountability", "member_accountability_title")}
            {renderGridItem("improved_review_system", "improved_review_system_title")}
            {renderGridItem("better_host_matching", "better_host_matching_title")}
            {renderGridItem("built_it_right", "built_it_right_title")}
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
              <Box display="flex" flexDirection="column" width="100%">
                <Typography variant="body2">
                  {t(`${selectedItem}_description`)}
                </Typography>
              </Box>
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
