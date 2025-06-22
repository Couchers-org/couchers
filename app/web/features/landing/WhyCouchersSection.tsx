import { Box, Fade, Grid, Typography } from "@mui/material";
import { useTranslation } from "i18n";
import { LANDING } from "i18n/namespaces";
import { useInView } from "react-intersection-observer";
import { theme } from "theme";

const WhyCouchersSection = () => {
  const { t } = useTranslation([LANDING]);
  const { ref, inView } = useInView({ triggerOnce: true });

  return (
    <>
      <Typography variant="h2">{t("why_couchers_title")}</Typography>
      <Fade timeout={2000} in={inView}>
        <Grid
          container
          gap={2}
          ref={ref}
          sx={{
            marginTop: 2,
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
              backgroundColor: theme.palette.grey[200],
              padding: 2,
              borderRadius: 2,
              flex: { md: 1 },
              minWidth: 0,
              marginLeft: { xs: 0, md: 2 },
            }}
          >
            <Box display="flex" flexDirection="column" width="100%">
              <Typography variant="h6" gutterBottom>
                {t("community_first")}
              </Typography>
              <Typography variant="body2">
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
              backgroundColor: theme.palette.grey[200],
              padding: 2,
              borderRadius: 2,
              flex: { md: 1 },
              minWidth: 0,
            }}
          >
            <Box display="flex" flexDirection="column" width="100%">
              <Typography variant="h6" gutterBottom>
                {t("safer_stronger")}
              </Typography>
              <Typography variant="body2">
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
              backgroundColor: theme.palette.grey[200],
              padding: 2,
              borderRadius: 2,
              flex: { md: 1 },
              minWidth: 0,
              marginRight: { xs: 0, md: 2 },
            }}
          >
            <Box display="flex" flexDirection="column" width="100%">
              <Typography variant="h6" gutterBottom>
                {t("built_by_travelers")}
              </Typography>
              <Typography variant="body2">
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
