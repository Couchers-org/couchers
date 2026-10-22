import { Pause, PlayArrow } from "@mui/icons-material";
import { Box, Skeleton, styled, Typography } from "@mui/material";
import { useTranslation } from "i18n";
import { LANDING } from "i18n/namespaces";
import { Lottie, LottieHandle, LottieState } from "lottie-react";
import Sentry from "platform/sentry";
import { useEffect, useRef, useState } from "react";
import { theme } from "theme";

import Alert from "./Alert";
import IconButton from "./IconButton";

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

// WCAG 2.2.2: a looping animation that starts by itself needs a way to pause it
const StyledPlayPauseButton = styled(IconButton)(({ theme }) => ({
  position: "absolute",
  bottom: theme.spacing(1),
  left: theme.spacing(1),
  zIndex: 2,
  backgroundColor: "var(--mui-palette-background-paper)",
}));

export default function MapAnimation() {
  const { t } = useTranslation([LANDING]);
  const [animationData, setAnimationData] = useState(null);
  const [error, setError] = useState<Error | null>(null);
  const lottieRef = useRef<LottieHandle>(null);
  // starts false: the library doesn't autoplay when the device asks for reduced motion
  const [isPlaying, setIsPlaying] = useState(false);

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
          <Lottie
            src={animationData}
            autoplay
            loop
            lottieRef={lottieRef}
            subscriptions={{ newState: ({ state }) => setIsPlaying(state === LottieState.playing) }}
          />
          <StyledPlayPauseButton
            size="small"
            aria-label={
              isPlaying ? t("landing:hero_animation_pause_button_a11y") : t("landing:hero_animation_play_button_a11y")
            }
            onClick={() => (isPlaying ? lottieRef.current?.pause() : lottieRef.current?.play())}
          >
            {isPlaying ? <Pause fontSize="small" /> : <PlayArrow fontSize="small" />}
          </StyledPlayPauseButton>
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
