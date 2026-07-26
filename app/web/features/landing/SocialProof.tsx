import { Favorite, Language, Star } from "@mui/icons-material";
import {
  Box,
  Divider,
  Skeleton,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { useTranslation } from "i18n";
import { localizeRelativeTime } from "i18n/datetimes";
import { GLOBAL, LANDING } from "i18n/namespaces";
import { useEffect, useState } from "react";
import { Temporal } from "temporal-polyfill";
import { theme } from "theme";

interface SignupInfo {
  userCount: string;
  /// ISO8601 datetime
  lastSignup: string;
  lastLocation: string;
}

const SocialProof = () => {
  const {
    t,
    i18n: { language: locale },
  } = useTranslation([GLOBAL, LANDING]);
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [signupInfo, setSignupInfo] = useState<SignupInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSignupInfo = async () => {
      try {
        const response = await fetch(
          "https://couchers.org/api/public/signup-page-info",
        );

        if (!response.ok) {
          throw new Error("Failed to fetch signup info");
        }
        const data = await response.json();
        setSignupInfo(data);
      } catch (error) {
        console.error("Error fetching signup info:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSignupInfo();
  }, []);

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
        display="flex"
        flexDirection={isMobile ? "column" : "row"}
        alignItems="center"
        justifyContent="center"
        sx={{ marginTop: 4, width: "100%" }}
        gap={3}
      >
        <Box display="flex" alignItems="center">
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
              {t("landing:num_users2", {
                // Number(...) returns NaN on bad input, and || treats it as false
                count: Number(signupInfo?.userCount) || 56000,
              })}
            </Typography>
          )}
        </Box>
        <Box display="flex" alignItems="center">
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
        <Box display="flex" alignItems={isMobile ? "flex-start" : "center"}>
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
            signupInfo.lastSignup && (
              <Typography
                sx={{
                  fontSize: "1.5rem",
                  fontWeight: 500,
                }}
              >
                {t("landing:last_signup", {
                  timeAgo: localizeRelativeTime(
                    Temporal.Instant.from(signupInfo.lastSignup),
                    locale,
                  ),
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
