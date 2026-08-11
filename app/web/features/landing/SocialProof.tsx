import { Favorite, Language, Star } from "@mui/icons-material";
import { Box, Divider, Skeleton, Typography, useMediaQuery } from "@mui/material";
import { useTranslation } from "i18n";
import { GLOBAL, LANDING } from "i18n/namespaces";
import { Trans } from "react-i18next";
import { Temporal } from "temporal-polyfill";
import { theme } from "theme";
import useSignupPageInfo from "utils/useSignupPageInfo";

import RelativeTime from "../../components/RelativeTime";

const SocialProof = () => {
  const { t } = useTranslation([GLOBAL, LANDING]);
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const { signupInfo, isLoading } = useSignupPageInfo();

  return (
    <Box
      sx={{
        maxWidth: "lg",
        padding: theme.spacing(8, 4),
        textAlign: "center",
      }}
    >
      <Typography
        sx={{
          fontSize: "4rem",
          fontWeight: "bold",

          [theme.breakpoints.down("md")]: {
            fontSize: "2rem",
          },
        }}
      >
        {t("landing:what_couchsurfing_title")}
      </Typography>
      <Typography
        sx={{
          marginTop: 2,
          fontSize: "1.2rem",
          padding: isMobile ? undefined : theme.spacing(0, 20),
          marginBottom: "16px",
        }}
      >
        {t("landing:what_couchsurfing_description")}
      </Typography>
      <Divider
        sx={{
          backgroundColor: "var(--mui-palette-divider)",
          marginTop: 4,
        }}
      />
      <Box
        sx={{
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 3,
          marginTop: 4,
          width: "100%",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
          }}
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
                <Box component="span" sx={{ display: "inline-block", width: "100%" }}>
                  <Skeleton variant="text" width="100%" height={36} />
                </Box>
              </Typography>
            </Box>
          ) : (
            <Typography sx={{ fontSize: "1.5rem", fontWeight: 500 }}>
              {t("landing:num_users2", {
                // Number(...) returns NaN on bad input, and || treats it as false
                count: Number(signupInfo?.userCount) || 56000,
              })}
            </Typography>
          )}
        </Box>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
          }}
        >
          <Language
            sx={{
              marginRight: 1,
              fontSize: "30px",
              color: theme.palette.primary.main,
            }}
          />
          <Typography sx={{ fontSize: "1.5rem", fontWeight: 500 }}>
            {t("landing:num_countries2", { count: 180 })}
          </Typography>
        </Box>
        <Box
          sx={{
            display: "flex",
            alignItems: isMobile ? "flex-start" : "center",
          }}
        >
          <Star
            sx={{
              marginRight: 1,
              fontSize: "30px",
              color: theme.palette.primary.main,
            }}
          />
          {isLoading ? (
            <Box sx={{ width: 220 }}>
              <Typography sx={{ fontSize: "1.5rem", fontWeight: 500 }}>
                <Box component="span" sx={{ display: "inline-block", width: "100%" }}>
                  <Skeleton variant="text" width="100%" height={36} />
                </Box>
              </Typography>
            </Box>
          ) : (
            signupInfo &&
            signupInfo.lastSignup && (
              <Typography
                sx={{
                  fontSize: "1.5rem",
                  fontWeight: 500,
                }}
              >
                <Trans
                  t={t}
                  i18nKey="landing:last_signup2"
                  components={{
                    timeAgo: <RelativeTime instant={Temporal.Instant.from(signupInfo.lastSignup)} />,
                  }}
                />
              </Typography>
            )
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default SocialProof;
