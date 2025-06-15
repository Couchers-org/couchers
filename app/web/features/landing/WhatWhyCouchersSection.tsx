import { Loyalty, People } from "@mui/icons-material";
import { Box, Fade, Grid, Typography } from "@mui/material";
import { VerifiedUser } from "components/Icons";
import { useTranslation } from "i18n";
import { LANDING } from "i18n/namespaces";
import { useInView } from "react-intersection-observer";
import { theme } from "theme";

const WhatWhyCouchersSection = () => {
  const { t } = useTranslation([LANDING]);
  const { ref, inView } = useInView({ triggerOnce: true });

  return (
    <>
      {/* <Typography variant="h2">{t("what_couchsurfing_title")}</Typography>
      <Typography variant="body1" paragraph sx={{ marginTop: 2 }}>
        {t("what_couchsurfing_description")}
      </Typography>
      <Typography
        variant="body1"
        paragraph
        sx={{ fontWeight: "bold", marginTop: 2 }}
      >
        {t("sign_up_ready")}
      </Typography>
      <StyledSpacer /> */}
      <Typography variant="h2" sx={{fontSize: "2.5rem !important"}}>{t("why_couchers_title")}</Typography>
      <Fade timeout={2000} in={inView}>
        <Grid
          container
          gap={2}
          ref={ref}
          sx={{
            marginTop: 4,
            width: "100%",
            flexWrap: { xs: "wrap", md: "nowrap" },
          }}
        >
          <Grid
            item
            xs={12}
            md={4}
            display="flex"
            sx={{
              backgroundColor: theme.palette.grey[50],
              padding: 2,
              borderRadius: 2,
              flex: { md: 1 },
              minWidth: 0,
              marginLeft: { xs: 0, md: 2 },
            }}
          >
            <Box
              display="flex"
              flexDirection="column"
              width="100%"
              alignItems={"center"}
            >
              <People color="primary" sx={{ fontSize: "40px" }} />
              <Typography variant="h3" gutterBottom>
                {t("community_first")}
              </Typography>
              <Typography
                fontWeight={200}
                sx={{ marginTop: 1, textAlign: "center" }}
              >
                {t("community_first_description")}
              </Typography>
            </Box>
          </Grid>
          <Grid
            item
            xs={12}
            md={4}
            display="flex"
            sx={{
              backgroundColor: theme.palette.grey[50],
              padding: 2,
              borderRadius: 2,
              flex: { md: 1 },
              minWidth: 0,
            }}
          >
            <Box
              display="flex"
              flexDirection="column"
              width="100%"
              alignItems="center"
            >
              <VerifiedUser color="primary" sx={{ fontSize: "40px" }} />
              <Typography variant="h3" gutterBottom>
                {t("safer_stronger")}
              </Typography>
              <Typography
                fontWeight={200}
                sx={{ marginTop: 1, textAlign: "center" }}
              >
                {t("safer_stronger_description")}
              </Typography>
            </Box>
          </Grid>
          <Grid
            item
            xs={12}
            md={4}
            display="flex"
            sx={{
              backgroundColor: theme.palette.grey[50],
              padding: 2,
              borderRadius: 2,
              flex: { md: 1 },
              minWidth: 0,
              marginRight: { xs: 0, md: 2 },
            }}
          >
            <Box
              display="flex"
              flexDirection="column"
              width="100%"
              alignItems="center"
            >
              <Loyalty color="primary" sx={{ fontSize: "40px" }} />
              <Typography variant="h3" gutterBottom>
                {t("built_by_travelers")}
              </Typography>
              <Typography
                fontWeight={200}
                sx={{ marginTop: 1, textAlign: "center" }}
              >
                {t("built_by_travelers_description")}
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Fade>
    </>
  );
};

export default WhatWhyCouchersSection;
