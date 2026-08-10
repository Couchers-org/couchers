import { Box, Skeleton, styled, Typography } from "@mui/material";
import { useTranslation } from "i18n";
import { LANDING } from "i18n/namespaces";
import Lottie from "lottie-react";
import Sentry from "platform/sentry";
import { useEffect, useState } from "react";
import { theme } from "theme";

import Alert from "./Alert";

const AnimationContainer = styled("div")(({ theme }) => ({
  width: "595px",
  height: "524px",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",

  [theme.breakpoints.down("md")]: {
    width: "100%",
    height: "auto",
    minHeight: "300px",
  },
}));

const Attribution = styled(Typography)(({ theme }) => ({
  position: "absolute",
  bottom: 8,
  right: 10,
  background: "rgba(255,255,255,0.8)",
  padding: "2px 8px",
  borderRadius: 4,
  pointerEvents: "none",
  zIndex: 2,
}));

export default function MapAnimation() {
  const { t } = useTranslation([LANDING]);
  const [animationData, setAnimationData] = useState(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    fetch("https://cdn.couchers.org/img/hero/hero-animation.json")
      .then((res) => {
        if (!res.ok) {
          Sentry.captureException(`Failed to load map animation: ${res.statusText}`, {
            tags: {
              component: "auth/useAuthStore",
              action: "logout",
              status: res.status,
            },
          });
        }
        return res.json();
      })
      .then(setAnimationData)
      .catch(setError);
  }, []);

  if (error) {
    return (
      <Alert severity="error" sx={{ width: "100%" }}>
        {t("landing:animation_error")}
      </Alert>
    );
  }

  return (
    <AnimationContainer>
      {animationData ? (
        <Box
          sx={{
            position: "relative",
            width: 595,
            height: 524,
            [theme.breakpoints.down("md")]: {
              width: "100%",
              height: "auto",
              minHeight: "300px",
              marginTop: theme.spacing(4),
            },
          }}
        >
          <Lottie animationData={animationData} loop={true} />
          <Attribution variant="caption">Map data © 2025 Google</Attribution>
        </Box>
      ) : (
        <Box
          sx={{
            position: "relative",
            height: 524,
            width: 595,
            [theme.breakpoints.down("md")]: {
              width: "100%",
              height: "auto",
              minHeight: "300px",
              marginTop: theme.spacing(4),
            },
          }}
        >
          <Skeleton
            variant="rectangular"
            sx={{
              width: 595,
              height: 524,
              borderRadius: "10px",
              flexShrink: 0,
            }}
          />
          <Attribution variant="caption">Map data © 2025 Google</Attribution>
        </Box>
      )}
    </AnimationContainer>
  );
}
