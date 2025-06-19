import { Favorite, Language } from "@mui/icons-material";
import { Box, Grid, Typography } from "@mui/material";
import Divider from "components/Divider";
import { useTranslation } from "i18n";
import { LANDING } from "i18n/namespaces";
import { theme } from "theme";

const SocialProof = () => {
  const { t } = useTranslation([LANDING]);

  return (
    <Box
      sx={{
        textAlign: "center",
        padding: theme.spacing(6, 20),
        width: "100%",
      }}
    >
      <Typography variant="h2" sx={{ fontSize: "3rem !important" }}>
        {t("what_couchsurfing_title")}
      </Typography>
      <Typography paragraph sx={{ marginTop: 2, fontSize: "1.2rem" }}>
        {t("what_couchsurfing_description_1")}
      </Typography>
      <Typography paragraph sx={{ fontSize: "1.2rem" }}>
        {t("what_couchsurfing_description_2")}
      </Typography>
      <Divider
        sx={{ backgroundColor: theme.palette.common.black, marginTop: 4 }}
      />
      <Grid
        container
        justifyContent="center"
        sx={{ marginTop: 4, width: "100%" }}
      >
        <Grid item xs={12} md={4} display="flex" alignItems="center">
          <Favorite
            sx={{
              marginRight: 1,
              fontSize: "30px",
              color: theme.palette.primary.main,
            }}
          />
          <Typography variant="h3">{"56,000+ users"}</Typography>
        </Grid>
        <Grid item xs={12} md={4} display="flex" alignItems="center">
          <Language
            sx={{
              marginRight: 1,
              fontSize: "30px",
              color: theme.palette.primary.main,
            }}
          />
          <Typography variant="h3">{"180+ countries"}</Typography>
        </Grid>
        <Grid item xs={12} md={4} display="flex" alignItems="center">
          <Typography variant="h3">{"last signed up goes here"}</Typography>
        </Grid>
      </Grid>
    </Box>
  );
};

export default SocialProof;
