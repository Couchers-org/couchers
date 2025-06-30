import { Skeleton, styled, Typography } from "@mui/material";
import { useTranslation } from "i18n";
import { LANDING } from "i18n/namespaces";
import Lottie from "lottie-react";
import Sentry from "platform/sentry";
import { useEffect, useState } from "react";

import Alert from "./Alert";

const Wrapper = styled("div")({
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  position: "relative",

  width: "100%",
  height: "100%",
});

const Attribution = styled(Typography)({
  position: "absolute",
  bottom: 8,
  right: 10,
  background: "rgba(255,255,255,0.8)",
  padding: "2px 8px",
  borderRadius: 4,
  pointerEvents: "none",
  zIndex: 2,
});

export default function MapAnimation() {
  const { t } = useTranslation([LANDING]);
  const [animationData, setAnimationData] = useState(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    fetch("https://cdn.couchers.org/img/hero/hero-animation.json")
      .then((res) => {
        if (!res.ok) {
          Sentry.captureException(
            `Failed to load map animation: ${res.statusText}`,
            {
              tags: {
                component: "auth/useAuthStore",
                action: "logout",
                status: res.status,
              },
            },
          );
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
    <Wrapper>
      {animationData ? (
        <>
          <Lottie
            animationData={animationData}
            loop={true}
            height="600px"
            width="600px"
          />
          <Attribution variant="caption">Map data ©2025 Google</Attribution>
        </>
      ) : (
        <Skeleton variant="rectangular" width="100%" height="100%" />
      )}
    </Wrapper>
  );
}
