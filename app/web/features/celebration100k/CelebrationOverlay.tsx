import { alpha, Button, keyframes, Modal, styled, Typography, useMediaQuery } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import IconButton from "components/IconButton";
import { CloseIcon } from "components/Icons";
import StyledLink from "components/StyledLink";
import { useAuthContext } from "features/auth/AuthProvider";
import { useTranslation } from "i18n";
import { DASHBOARD } from "i18n/namespaces";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { COUCHERS_LOGO_PATHS } from "resources/couchersLogoPaths";

import { drawFinalMap, startConfetti, startMapAnimation } from "./animation";
import {
  CELEBRATION_100K_BLOG_URL,
  CELEBRATION_100K_DONATE_URL,
  CLUSTERED_MEMBERS_PATH,
  MEMBER_MILESTONE,
  PUBLIC_MEMBERS_PATH,
} from "./constants";
import { clusterMembers, fetchMemberLocations, STAYS } from "./mapData";

type Phase = "burst" | "map";

interface CelebrationOverlayProps {
  open: boolean;
  onClose: () => void;
}

// Plain env read, so this doesn't pull in the full map library just for the URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
const BURST_FOR_MS = 2600;
const POP_AT_MS = 450;

const wobble = keyframes`
  0%, 100% { transform: rotate(0); }
  25% { transform: rotate(-8deg) scale(0.96, 1.04); }
  50% { transform: rotate(7deg); }
  75% { transform: rotate(-4deg) scale(0.92, 1.08); }
`;

const pop = keyframes`
  0% { transform: scale(0.85, 1.15); }
  50% { transform: scale(1.22); }
  100% { transform: scale(1); }
`;

const StyledStage = styled("div")({
  position: "fixed",
  inset: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  overflow: "hidden",
  outline: "none",
});

const StyledCloseButton = styled(IconButton)(({ theme }) => ({
  position: "absolute",
  zIndex: 3,
  top: `calc(${theme.spacing(1.5)} + env(safe-area-inset-top, 0px))`,
  right: `calc(${theme.spacing(1.5)} + env(safe-area-inset-right, 0px))`,
  width: 52,
  height: 52,
  color: "var(--mui-palette-text-primary)",
  backgroundColor: "var(--mui-palette-background-paper)",
  boxShadow: theme.shadows[4],
  "&:hover": {
    backgroundColor: "var(--mui-palette-background-paper)",
  },
}));

const StyledCanvas = styled("canvas")({
  position: "absolute",
  inset: 0,
  width: "100%",
  height: "100%",
  pointerEvents: "none",
});

const StyledBurst = styled("div", {
  shouldForwardProp: (prop) => prop !== "isVisible",
})<{ isVisible: boolean }>(({ theme, isVisible }) => ({
  position: "absolute",
  inset: 0,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: theme.spacing(2),
  pointerEvents: "none",
  opacity: isVisible ? 1 : 0,
  transition: "opacity 0.45s ease",
}));

const StyledBurstCouch = styled("svg", {
  shouldForwardProp: (prop) => prop !== "isPopped",
})<{ isPopped: boolean }>(({ isPopped }) => ({
  width: "clamp(110px, 22vw, 190px)",
  aspectRatio: "432 / 293",
  overflow: "visible",
  fill: "var(--mui-palette-secondary-light)",
  transformOrigin: "50% 90%",
  animation: isPopped ? `${pop} 0.4s cubic-bezier(.3,1.7,.5,1)` : `${wobble} 0.45s ease-in-out`,
}));

const StyledBurstHeading = styled("p", {
  shouldForwardProp: (prop) => prop !== "isVisible",
})<{ isVisible: boolean }>(({ theme, isVisible }) => ({
  margin: 0,
  color: theme.palette.common.white,
  fontSize: "clamp(1.75rem, 6vw, 3.25rem)",
  fontWeight: 700,
  textShadow: "0 2px 12px rgba(0, 0, 0, 0.25)",
  opacity: isVisible ? 1 : 0,
  transform: isVisible ? "none" : "translateY(10px) scale(0.96)",
  transition: "opacity 0.4s ease, transform 0.4s cubic-bezier(.3,1.5,.5,1)",
}));

const StyledMapPanel = styled("div", {
  shouldForwardProp: (prop) => prop !== "isVisible",
})<{ isVisible: boolean }>(({ theme, isVisible }) => ({
  position: "relative",
  width: "min(92vw, 900px)",
  aspectRatio: "16 / 9",
  borderRadius: 18,
  overflow: "hidden",
  // A teal wash over the paper colour gives a soft ocean in both light and dark mode
  background: `linear-gradient(${alpha(theme.palette.primary.light, 0.25)}, ${alpha(theme.palette.primary.light, 0.25)}), var(--mui-palette-background-paper)`,
  boxShadow: theme.shadows[16],
  opacity: isVisible ? 1 : 0,
  transform: isVisible ? "none" : "translateY(4%) scale(0.96)",
  transition: "opacity 0.5s ease, transform 0.5s cubic-bezier(.3,1.3,.5,1)",
  [theme.breakpoints.down("sm")]: {
    width: "94vw",
    aspectRatio: "4 / 5",
  },
}));

const StyledCounter = styled("div")(({ theme }) => ({
  position: "absolute",
  zIndex: 1,
  left: "3%",
  top: "4%",
  padding: theme.spacing(1, 1.75),
  backgroundColor: "var(--mui-palette-background-paper)",
  borderRadius: 14,
  boxShadow: theme.shadows[2],
}));

const StyledCount = styled("span")(({ theme }) => ({
  display: "block",
  fontSize: "clamp(1.25rem, 4.4vw, 2.6rem)",
  fontWeight: 700,
  lineHeight: 1,
  fontVariantNumeric: "tabular-nums",
  color: "var(--mui-palette-secondary-main)",
  marginBottom: theme.spacing(0.25),
}));

const StyledMessage = styled("div", {
  shouldForwardProp: (prop) => prop !== "isVisible",
})<{ isVisible: boolean }>(({ theme, isVisible }) => ({
  position: "absolute",
  zIndex: 1,
  left: "50%",
  bottom: "5%",
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1.5),
  maxWidth: `calc(100% - ${theme.spacing(3)})`,
  boxSizing: "border-box",
  padding: theme.spacing(1.25, 2.5),
  backgroundColor: "var(--mui-palette-background-paper)",
  borderRadius: 999,
  boxShadow: theme.shadows[2],
  opacity: isVisible ? 1 : 0,
  transform: isVisible ? "translateX(-50%)" : "translate(-50%, 8px)",
  transition: "opacity 0.8s ease, transform 0.8s ease",
  [theme.breakpoints.down("sm")]: {
    flexDirection: "column",
    textAlign: "center",
    gap: theme.spacing(1),
    width: `calc(100% - ${theme.spacing(2.5)})`,
    padding: theme.spacing(1.25, 1.75),
    borderRadius: 14,
  },
}));

const StyledMessageCouch = styled("svg")({
  height: "1.6em",
  flexShrink: 0,
  fill: "var(--mui-palette-secondary-main)",
});

const StyledMessageText = styled("div")(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  whiteSpace: "nowrap",
  [theme.breakpoints.down("sm")]: {
    alignItems: "center",
  },
}));

const couchPaths = COUCHERS_LOGO_PATHS.map((d) => <path key={d} d={d} />);

/** Full-screen 100k celebration: couch confetti that turns into the member map. Closable at any time. */
export default function CelebrationOverlay({ open, onClose }: CelebrationOverlayProps) {
  const { t, i18n } = useTranslation(DASHBOARD);
  const { authState } = useAuthContext();
  const reduceMotion = useMediaQuery("(prefers-reduced-motion: reduce)");

  const [burstPhase, setBurstPhase] = useState<Phase>("burst");
  const [isPopped, setIsPopped] = useState(false);
  const [hasMapFinished, setHasMapFinished] = useState(false);
  // Reduced motion skips straight to the finished map
  const phase: Phase = reduceMotion ? "map" : burstPhase;
  const isMapDone = reduceMotion || hasMapFinished;
  const confettiRef = useRef<HTMLCanvasElement>(null);
  const couchRef = useRef<SVGSVGElement>(null);
  const mapRef = useRef<HTMLCanvasElement>(null);
  const countRef = useRef<HTMLSpanElement>(null);

  const numberFormat = useMemo(() => new Intl.NumberFormat(i18n.language), [i18n.language]);
  const milestone = numberFormat.format(MEMBER_MILESTONE);

  const membersPath = authState.authenticated ? CLUSTERED_MEMBERS_PATH : PUBLIC_MEMBERS_PATH;
  const { data: members, isError } = useQuery({
    queryKey: ["celebration100kMembers", membersPath],
    queryFn: () => fetchMemberLocations(`${API_BASE_URL}${membersPath}`),
    enabled: open,
    staleTime: Infinity,
  });
  // Without member data the map still plays, just without clusters
  const mapData = useMemo(
    () => (members ? clusterMembers(members) : isError ? { cities: [], regions: [] } : undefined),
    [members, isError],
  );

  // Reset once closed, so the next opening (a replay) starts from the beginning
  useEffect(() => {
    if (open) return;
    setBurstPhase("burst");
    setIsPopped(false);
    setHasMapFinished(false);
  }, [open]);

  // 1. Couch confetti, then hand over to the map
  useEffect(() => {
    if (!open || reduceMotion || phase !== "burst") return;
    let stopConfetti = () => {};
    const popTimer = window.setTimeout(() => {
      setIsPopped(true);
      const canvas = confettiRef.current;
      const couch = couchRef.current;
      if (!canvas || !couch) return;
      const c = canvas.getBoundingClientRect();
      const l = couch.getBoundingClientRect();
      stopConfetti = startConfetti(canvas, { x: l.left - c.left + l.width / 2, y: l.top - c.top + l.height / 2 });
    }, POP_AT_MS);
    const mapTimer = window.setTimeout(() => setBurstPhase("map"), BURST_FOR_MS);
    return () => {
      clearTimeout(popTimer);
      clearTimeout(mapTimer);
      stopConfetti();
    };
  }, [open, reduceMotion, phase]);

  // Read through a ref so re-renders of the page underneath don't restart the map
  const counterText = useRef({ format: (n: number) => String(n), total: "" });
  counterText.current = {
    format: (n) => numberFormat.format(n),
    total: t("celebration_100k.map_counter_total", { member_count: milestone }),
  };

  // 2. The member map, once its data is in
  useEffect(() => {
    const canvas = mapRef.current;
    if (!open || phase !== "map" || !canvas || !mapData) return;
    const setCount = (text: string) => {
      if (countRef.current) countRef.current.textContent = text;
    };
    if (reduceMotion) {
      drawFinalMap(canvas, mapData.cities, mapData.regions, STAYS);
      setCount(counterText.current.total);
      return;
    }
    let stop = () => {};
    // Let the panel fade in before the map starts
    const startTimer = window.setTimeout(() => {
      stop = startMapAnimation(canvas, {
        ...mapData,
        stays: STAYS,
        onProgress: (progress) => setCount(counterText.current.format(Math.round(progress * MEMBER_MILESTONE))),
        onDone: () => {
          setCount(counterText.current.total);
          setHasMapFinished(true);
        },
      });
    }, 350);
    return () => {
      clearTimeout(startTimer);
      stop();
    };
  }, [open, phase, mapData, reduceMotion]);

  // Keep the finished map sharp if the window is resized or rotated
  useEffect(() => {
    const canvas = mapRef.current;
    if (!open || !isMapDone || !canvas || !mapData) return;
    const observer = new ResizeObserver(() => drawFinalMap(canvas, mapData.cities, mapData.regions, STAYS));
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [open, isMapDone, mapData]);

  return (
    <Modal open={open} onClose={onClose} aria-label={t("celebration_100k.dialog_a11y")}>
      <StyledStage
        onClick={(event) => {
          // Clicking the dimmed background (not the map card) closes it too
          if (event.target === event.currentTarget) onClose();
        }}
      >
        <StyledCloseButton aria-label={t("celebration_100k.close_button_a11y")} onClick={onClose}>
          <CloseIcon />
        </StyledCloseButton>

        {!reduceMotion && (
          <>
            <StyledCanvas ref={confettiRef} sx={{ zIndex: 2 }} aria-hidden="true" />
            <StyledBurst isVisible={phase === "burst"} aria-hidden={phase !== "burst"}>
              <StyledBurstCouch ref={couchRef} viewBox="-12 -20 456 333" isPopped={isPopped} aria-hidden="true">
                {couchPaths}
              </StyledBurstCouch>
              <StyledBurstHeading isVisible={isPopped}>
                {t("celebration_100k.burst_heading", { member_count: milestone })}
              </StyledBurstHeading>
            </StyledBurst>
          </>
        )}

        <StyledMapPanel isVisible={phase === "map"} aria-hidden={phase !== "map"}>
          <StyledCanvas ref={mapRef} role="img" aria-label={t("celebration_100k.map_a11y")} />
          <StyledCounter>
            <StyledCount ref={countRef} aria-live="polite">
              {numberFormat.format(0)}
            </StyledCount>
            <Typography variant="body2" color="textSecondary" sx={{ fontWeight: 500 }}>
              {t("celebration_100k.map_counter_label")}
            </Typography>
          </StyledCounter>
          <StyledMessage isVisible={isMapDone}>
            <StyledMessageCouch viewBox="0 0 432 293" aria-hidden="true">
              {couchPaths}
            </StyledMessageCouch>
            <StyledMessageText>
              <Typography variant="body1" component="span" sx={{ fontWeight: 500, lineHeight: 1.3 }}>
                {t("celebration_100k.map_message_everywhere")}
              </Typography>
              <Typography variant="body1" component="span" sx={{ fontWeight: 500, lineHeight: 1.3 }}>
                {t("celebration_100k.map_message_thanks")}
              </Typography>
              <StyledLink href={CELEBRATION_100K_BLOG_URL} variant="body2" underline="always" sx={{ mt: 0.25 }}>
                {t("celebration_100k.map_read_more_link")}
              </StyledLink>
            </StyledMessageText>
            <Button
              variant="contained"
              disableElevation
              component={Link}
              href={CELEBRATION_100K_DONATE_URL}
              sx={{
                flexShrink: 0,
                borderRadius: 999,
                whiteSpace: "nowrap",
              }}
            >
              {t("celebration_100k.help_us_grow_button")}
            </Button>
          </StyledMessage>
        </StyledMapPanel>
      </StyledStage>
    </Modal>
  );
}
