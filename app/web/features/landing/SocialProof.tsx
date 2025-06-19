import { Create, Favorite, Language } from "@mui/icons-material";
import { Box, Grid, Typography } from "@mui/material";
import Divider from "components/Divider";
import useSignupInfo from "features/auth/useSignupInfo";
import { useTranslation } from "i18n";
import { LANDING } from "i18n/namespaces";
import { theme } from "theme";
import { timestamp2Date } from "utils/date";
import { timeAgoI18n } from "utils/timeAgo";

const SocialProof = () => {
  const { t } = useTranslation([LANDING]);

  const { data: signupInfo } = useSignupInfo();

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
        <Grid item xs={12} md={3} display="flex" alignItems="center">
          <Favorite
            sx={{
              marginRight: 1,
              fontSize: "30px",
              color: theme.palette.primary.main,
            }}
          />
          <Typography variant="h3">
            {t("num_users", { numUsers: signupInfo?.userCount || 56000 })}
          </Typography>
        </Grid>
        <Grid item xs={12} md={3} display="flex" alignItems="center">
          <Language
            sx={{
              marginRight: 1,
              fontSize: "30px",
              color: theme.palette.primary.main,
            }}
          />
          <Typography variant="h3">
            {t("num_countries", { numCountries: 180 })}
          </Typography>
        </Grid>
        <Grid item xs={12} md={6} display="flex" alignItems="center">
          <Create
            sx={{
              marginRight: 1,
              fontSize: "30px",
              color: theme.palette.primary.main,
            }}
          />
          {signupInfo && signupInfo.lastSignup && signupInfo.lastLocation && (
            <Typography variant="h3" paragraph gutterBottom>
              {t("last_signup", {
                timeAgo: timeAgoI18n({
                  input: timestamp2Date(signupInfo.lastSignup),
                  t: t,
                }),
                location: signupInfo.lastLocation,
              })}
            </Typography>
          )}
        </Grid>
      </Grid>
    </Box>
  );
};

export default SocialProof;
