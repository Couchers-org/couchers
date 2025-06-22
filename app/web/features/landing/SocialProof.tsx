import { Create, Favorite, Language } from "@mui/icons-material";
import { Box, Typography } from "@mui/material";
import Divider from "components/Divider";
import useSignupInfo from "features/auth/useSignupInfo";
import { useTranslation } from "i18n";
import { GLOBAL, LANDING } from "i18n/namespaces";
import { theme } from "theme";
import { timestamp2Date } from "utils/date";
import { timeAgoI18n } from "utils/timeAgo";

const SocialProof = () => {
  const { t } = useTranslation([GLOBAL, LANDING]);

  const { data: signupInfo, isLoading } = useSignupInfo();

  return (
    <Box
      sx={{
        textAlign: "center",
        padding: theme.spacing(6, 20),
        width: "100%",
      }}
    >
      <Typography variant="h2" sx={{ fontSize: "3rem !important" }}>
        {t("landing:what_couchsurfing_title")}
      </Typography>
      <Typography paragraph sx={{ marginTop: 2, fontSize: "1.2rem" }}>
        {t("landing:what_couchsurfing_description_1")}
      </Typography>
      <Typography paragraph sx={{ fontSize: "1.2rem" }}>
        {t("landing:what_couchsurfing_description_2")}
      </Typography>
      <Divider
        sx={{ backgroundColor: theme.palette.common.black, marginTop: 4 }}
      />
      <Box
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        sx={{ marginTop: 4, width: "100%" }}
      >
        <Box display="flex" alignItems="center" minWidth={theme.spacing(25)}>
          <Favorite
            sx={{
              marginRight: 1,
              fontSize: "30px",
              color: theme.palette.primary.main,
            }}
          />
          <Typography sx={{ fontSize: "1.5rem" }}>
            {t("landing:num_users", {
              numUsers: signupInfo?.userCount || 56000,
            })}
          </Typography>
        </Box>
        <Box display="flex" alignItems="center" minWidth={theme.spacing(30)}>
          <Language
            sx={{
              marginRight: 1,
              fontSize: "30px",
              color: theme.palette.primary.main,
            }}
          />
          <Typography sx={{ fontSize: "1.5rem" }}>
            {t("landing:num_countries", { numCountries: 180 })}
          </Typography>
        </Box>
        <Box display="flex" alignItems="center" maxWidth={theme.spacing(60)}>
          <Create
            sx={{
              marginRight: 1,
              fontSize: "30px",
              color: theme.palette.primary.main,
            }}
          />
          {!isLoading &&
            signupInfo &&
            signupInfo.lastSignup &&
            signupInfo.lastLocation && (
              <Typography sx={{ fontSize: "1.5rem" }}>
                {t("landing:last_signup", {
                  timeAgo: timeAgoI18n({
                    input: timestamp2Date(signupInfo.lastSignup),
                    t: t,
                  }),
                  location: signupInfo.lastLocation,
                })}
              </Typography>
            )}
        </Box>
      </Box>
    </Box>
  );
};

export default SocialProof;
