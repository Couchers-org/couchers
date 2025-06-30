import { Diversity3, Loyalty } from "@mui/icons-material";
import { Box, Fade, Grid, Typography } from "@mui/material";
import { VerifiedUser } from "components/Icons";
import { useTranslation } from "i18n";
import { LANDING } from "i18n/namespaces";
import { useInView } from "react-intersection-observer";
import { theme } from "theme";

const WhyCouchersSection = () => {
  const { t } = useTranslation([LANDING]);
  const { ref, inView } = useInView({ triggerOnce: true });

  return (
    <>
      <Typography
        sx={{
          fontSize: "3rem",
          fontWeight: "bold",

          [theme.breakpoints.down("md")]: { fontSize: "1.8rem" },
        }}
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
              padding: 3,
              borderRadius: 2,
              flex: { md: 1 },
              minWidth: 0,
              marginLeft: { xs: 0, md: 2 },
            }}
          >
            <Box display="flex" flexDirection="column" width="100%">
              <Diversity3
                color="primary"
                sx={{ fontSize: "40px", marginBottom: 1 }}
              />
              <Typography
                gutterBottom
                sx={{ fontSize: "1.4rem", fontWeight: "bold" }}
              >
                {t("community_first")}
              </Typography>
              <Typography sx={{ marginTop: 1 }}>
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
              padding: 3,
              borderRadius: 2,
              flex: { md: 1 },
              minWidth: 0,
            }}
          >
            <Box display="flex" flexDirection="column" width="100%">
              <VerifiedUser
                color="primary"
                sx={{ fontSize: "40px", marginBottom: 1 }}
              />
              <Typography
                gutterBottom
                sx={{ fontSize: "1.4rem", fontWeight: "bold" }}
              >
                {t("safer_stronger")}
              </Typography>
              <Typography sx={{ marginTop: 1 }}>
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
              padding: 3,
              borderRadius: 2,
              flex: { md: 1 },
              minWidth: 0,
              marginRight: { xs: 0, md: 2 },
            }}
          >
            <Box display="flex" flexDirection="column" width="100%">
              <Loyalty
                color="primary"
                sx={{ fontSize: "40px", marginBottom: 1 }}
              />
              <Typography
                gutterBottom
                sx={{ fontSize: "1.4rem", fontWeight: "bold" }}
              >
                {t("built_by_travelers")}
              </Typography>
              <Typography sx={{ marginTop: 1 }}>
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
