import { Diversity3, Loyalty } from "@mui/icons-material";
import { Box, Fade, Grid, Typography, useMediaQuery } from "@mui/material";
import { VerifiedUser } from "components/Icons";
import { useTranslation } from "i18n";
import { LANDING } from "i18n/namespaces";
import { useInView } from "react-intersection-observer";
import { theme } from "theme";

const WhyCouchersSection = () => {
  const { t } = useTranslation([LANDING]);
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const { ref, inView } = useInView({ triggerOnce: true });

  return (
    <>
      <Typography
        variant="h2"
        sx={{ fontSize: isMobile ? "2rem !important" : "2.5rem !important" }}
      >
        {t("why_couchers_title")}
      </Typography>
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
              padding: 4,
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
              <Diversity3
                color="primary"
                sx={{ fontSize: "40px", marginBottom: 2 }}
              />
              <Typography
                variant="h3"
                gutterBottom
                sx={{ fontSize: "1.2rem !important" }}
              >
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
              padding: 4,
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
              <VerifiedUser
                color="primary"
                sx={{ fontSize: "40px", marginBottom: 2 }}
              />
              <Typography
                variant="h3"
                gutterBottom
                sx={{ fontSize: "1.2rem !important", textAlign: "center" }}
              >
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
              padding: 4,
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
              <Loyalty
                color="primary"
                sx={{ fontSize: "40px", marginBottom: 2 }}
              />
              <Typography
                variant="h3"
                gutterBottom
                sx={{ fontSize: "1.2rem !important", textAlign: "center" }}
              >
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

export default WhyCouchersSection;
