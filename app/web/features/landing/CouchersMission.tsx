import { Box, Fade, Grid, styled, Typography } from "@mui/material";
import StyledLink from "components/StyledLink";
import { StyledButton } from "features/auth/useAuthStyles";
import { Trans, useTranslation } from "i18n";
import { GLOBAL, LANDING } from "i18n/namespaces";
import Link from "next/link";
import { useState } from "react";
import { useInView } from "react-intersection-observer";
import {
  donationsRoute,
  missionRoute,
  roadmapRoute,
  volunteerRoute,
} from "routes";
import { theme } from "theme";

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

  const missionBubble = (itemName: string) => {
    return (
      <Grid
        item
        xs={3.7}
        md={2}
        display="flex"
        alignItems="center"
        onClick={() => {
          setSelectedItem(itemName);
        }}
        sx={{
          backgroundColor:
            selectedItem === itemName
              ? theme.palette.primary.main
              : theme.palette.primary.light,
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
            {t(`${LANDING}:${itemName}_title`)}
          </Typography>
        </Box>
      </Grid>
    );
  };

  const missionDescription = (selectedItem: string) => {
    const localeKey = `${LANDING}:${selectedItem}_description`;
    return (
      <Box display="flex" flexDirection="column" width="100%">
        <Typography align="justify" variant="body2">
          {descriptionContent(localeKey)}
        </Typography>
      </Box>
    );
  };

  const descriptionContent = (localeKey: string) => {
    switch (localeKey) {
      case `${LANDING}:non_profit_structure_description`:
        return (
          <Trans i18nKey={localeKey}>
            Couchers.org is built as a non-profit to keep our mission aligned
            with our community - not investors. <br />
            Unlike Couchsurfing™, which became a for-profit and compromised its
            values, we're committed to staying community-first, forever. <br />
            We've put strong legal, community, and technical safeguards in place
            to prevent future sell-outs. Our open-source code, distributed
            volunteer model, and non-profit legal structure ensure transparency
            and long-term accountability. <br />
            Founded by donations, not profit, Couchers.org is here to serve
            travelers - not monetize them. Want to know more?
            <StyledLink href={missionRoute}>Read here</StyledLink>
          </Trans>
        );
      default:
        return t(localeKey);
    }
  };

  return (
    <>
      <Typography variant="h2">{t("couchers_mission_title")}</Typography>
      <Grid
        container
        ref={ref}
        sx={{
          marginTop: 2,
          width: "100%",
        }}
      >
        <Fade timeout={2000} in={inView}>
          <Grid
            container
            gap={2}
            sx={{
              width: "100%",
              flexWrap: { xs: "wrap", md: "nowrap" },
            }}
          >
            {missionBubble("non_profit_structure")}
            {missionBubble("community_first")}
            {missionBubble("member_accountability")}
            {missionBubble("improved_review_system")}
            {missionBubble("better_host_matching")}
            {missionBubble("built_it_right")}
          </Grid>
        </Fade>
        <Fade key={selectedItem} timeout={1000} in={true}>
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
        </Fade>
      </Grid>
      <StyledSpacer />
      <Typography variant="h6" gutterBottom>
        {t("want_to_help")}
      </Typography>
      <Typography variant="body1">{t("want_to_help_description")}</Typography>
      <br />
      <Typography variant="body1">
        {t("want_to_help_roadmap")}{" "}
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
