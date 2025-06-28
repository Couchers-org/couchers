import { Create, Favorite, Language } from "@mui/icons-material";
import { Box, Skeleton, Typography, useMediaQuery } from "@mui/material";
import Divider from "components/Divider";
import useSignupInfo from "features/auth/useSignupInfo";
import { useTranslation } from "i18n";
import { GLOBAL, LANDING } from "i18n/namespaces";
import { theme } from "theme";
import { timestamp2Date } from "utils/date";
import { timeAgoI18n } from "utils/timeAgo";

const SocialProof = () => {
  const { t } = useTranslation([GLOBAL, LANDING]);
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const { data: signupInfo, error, isLoading } = useSignupInfo();

  console.log(
    "GET SIGNUPPAGEINFO RESPONSE SocialProof.tsx:",
    signupInfo,
    "isLoading:",
    isLoading,
    "error:",
    error,
  );

  return (
    <Box
      sx={{
        padding: theme.spacing(8, 4),
        textAlign: "center",
      }}
      maxWidth="lg"
    >
      <Typography
        sx={{
          fontSize: "3rem",
          fontWeight: "bold",

          [theme.breakpoints.down("md")]: {
            fontSize: "1.8rem",
          },
        }}
      >
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
        flexDirection={isMobile ? "column" : "row"}
        alignItems="center"
        justifyContent="space-between"
        sx={{ marginTop: 4, width: "100%" }}
        gap={isMobile ? 2 : 0}
      >
        <Box
          display="flex"
          alignItems="center"
          minWidth={isMobile ? undefined : theme.spacing(25)}
        >
          <Favorite
            sx={{
              marginRight: 1,
              fontSize: "30px",
              color: theme.palette.primary.main,
            }}
          />
          {isLoading ? (
            <Box sx={{ width: 120 }}>
              <Typography sx={{ fontSize: "1.5rem", fontWeight: 500 }}>
                <Box
                  component="span"
                  sx={{ display: "inline-block", width: "100%" }}
                >
                  <Skeleton variant="text" width="100%" height={36} />
                </Box>
              </Typography>
            </Box>
          ) : (
            <Typography sx={{ fontSize: "1.5rem", fontWeight: 500 }}>
              {t("landing:num_users", {
                numUsers: signupInfo?.userCount || "56k",
              })}
            </Typography>
          )}
        </Box>
        <Box
          display="flex"
          alignItems="center"
          minWidth={isMobile ? undefined : theme.spacing(30)}
        >
          <Language
            sx={{
              marginRight: 1,
              fontSize: "30px",
              color: theme.palette.primary.main,
            }}
          />
          <Typography sx={{ fontSize: "1.5rem", fontWeight: 500 }}>
            {t("landing:num_countries", { numCountries: 180 })}
          </Typography>
        </Box>
        <Box
          display="flex"
          alignItems="center"
          maxWidth={isMobile ? undefined : theme.spacing(60)}
        >
          <Create
            sx={{
              marginRight: 1,
              fontSize: "30px",
              color: theme.palette.primary.main,
            }}
          />
          {isLoading ? (
            <Box sx={{ width: 220 }}>
              <Typography sx={{ fontSize: "1.5rem", fontWeight: 500 }}>
                <Box
                  component="span"
                  sx={{ display: "inline-block", width: "100%" }}
                >
                  <Skeleton variant="text" width="100%" height={36} />
                </Box>
              </Typography>
            </Box>
          ) : (
            signupInfo &&
            signupInfo.lastSignup &&
            signupInfo.lastLocation && (
              <Typography
                sx={{
                  fontSize: "1.5rem",
                  fontWeight: 500,
                }}
              >
                {t("landing:last_signup", {
                  timeAgo: timeAgoI18n({
                    input: timestamp2Date(signupInfo.lastSignup),
                    t: t,
                  }),
                  location: signupInfo.lastLocation,
                })}
              </Typography>
            )
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default SocialProof;
