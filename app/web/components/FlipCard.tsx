import { Box, Stack, Typography } from "@mui/material";
import { useTranslation } from "i18n";
import { GLOBAL } from "i18n/namespaces";
import { ReactNode, useCallback, useState } from "react";

export interface FlipCardProps {
  icon: ReactNode;
  title: ReactNode;
  children: ReactNode;
  height?: { xs?: number | string; md?: number | string };
}

/*
 * Flip card: hover (desktop) and click/tap (mobile) to reveal back content.
 * Accessible: focusable + keyboard toggle.
 */
export default function FlipCard({
  icon,
  title,
  children,
  height = { xs: 300, md: 320 },
}: FlipCardProps) {
  const { t } = useTranslation([GLOBAL]);
  const [flipped, setFlipped] = useState(false);
  const toggle = useCallback(() => setFlipped((f) => !f), []);

  return (
    <Box
      sx={{
        perspective: 1200,
        width: "100%",
        position: "relative",
        height,
        cursor: "pointer",
        outline: "none",
        "&:focus-visible .flip-inner": {
          boxShadow: (theme) => `0 0 0 2px ${theme.palette.primary.main}`,
        },
        ["@media (hover: hover) and (pointer: fine)"]: {
          "&:hover .flip-inner": {
            transform: `rotateY(${flipped ? 180 : 180}deg)`,
          },
        },
      }}
      role="button"
      tabIndex={0}
      aria-pressed={flipped}
      aria-label={typeof title === "string" ? title : undefined}
      onClick={toggle}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          toggle();
        }
      }}
    >
      <Box
        className="flip-inner"
        sx={{
          position: "absolute",
          inset: 0,
          transformStyle: "preserve-3d",
          transition: "transform 0.7s cubic-bezier(.65,.05,.36,1)",
          transform: `rotateY(${flipped ? 180 : 0}deg)`,
        }}
      >
        {/* Front */}
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            backfaceVisibility: "hidden",
            border: (theme) => `1px solid ${theme.palette.grey[200]}`,
            borderRadius: 3,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            px: 3,
            py: 4,
            bgcolor: (theme) => theme.palette.background.paper,
            textAlign: "center",
          }}
        >
          <Stack spacing={2} alignItems="center" justifyContent="center">
            <Box sx={{ color: (theme) => theme.palette.primary.main }}>
              {icon}
            </Box>
            <Typography
              variant="h3"
              component="h3"
              sx={{
                fontSize: { xs: "1.35rem", md: "1.6rem" },
                fontWeight: 600,
              }}
            >
              {title}
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.55 }}>
              {t("global:tap_press_to_flip")}
            </Typography>
          </Stack>
        </Box>
        {/* Back */}
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
            border: (theme) => `1px solid ${theme.palette.grey[200]}`,
            borderRadius: 3,
            p: 3,
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            bgcolor: (theme) => theme.palette.background.paper,
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
}
