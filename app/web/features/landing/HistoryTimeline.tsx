import { ChevronRightRounded } from "@mui/icons-material";
import { Box, Container, Stack, Typography } from "@mui/material";
import { useTranslation } from "i18n";
import { GLOBAL } from "i18n/namespaces";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";

type TimelineDataItem = { year: string; text: string };

interface TimelineTabProps {
  index: number;
  year: string;
  active: boolean;
  total: number;
  onActivate: (index: number) => void;
  registerRef: (el: HTMLButtonElement | null) => void;
}

// Single tab (dot + label)
const TimelineTab = memo(function TimelineTab({
  index,
  year,
  active,
  total,
  onActivate,
  registerRef,
}: TimelineTabProps) {
  return (
    <Stack alignItems="center" sx={{ minWidth: 180, position: "relative" }}>
      <Box
        aria-hidden
        sx={{
          position: "absolute",
          top: 27,
          left: "50%",
          transform: "translateX(-50%)",
          width: 32,
          height: 2,
          bgcolor: "var(--mui-palette-grey-50)",
          zIndex: 0,
          pointerEvents: "none",
        }}
      />
      <Box
        component="button"
        id={`timeline-tab-${index}`}
        type="button"
        role="tab"
        aria-selected={active}
        aria-controls={`timeline-panel-${index}`}
        aria-posinset={index + 1}
        aria-setsize={total}
        ref={registerRef}
        onFocus={() => onActivate(index)}
        onClick={() => onActivate(index)}
        onMouseEnter={() => onActivate(index)}
        tabIndex={active ? 0 : -1}
        sx={{
          cursor: "pointer",
          width: active ? 20 : 14,
          height: active ? 20 : 14,
          border: "none",
          background: active
            ? "var(--mui-palette-secondary-main)"
            : "var(--mui-palette-grey-300)",
          borderRadius: "50%",
          boxShadow: active
            ? `${"var(--mui-palette-secondary-light)"} 0 0 0 4px`
            : `transparent 0 0 0 4px`,
          transition: "all .25s ease",
          position: "relative",
          zIndex: 1,
          outline: "none",
          "&:hover": {
            background: active
              ? "var(--mui-palette-secondary-main)"
              : "var(--mui-palette-grey-400)",
          },
          "&:focus-visible": {
            boxShadow: `${"var(--mui-palette-secondary-main)"} 0 0 0 3px, ${"var(--mui-palette-secondary-light)"} 0 0 0 5px`,
          },
        }}
      />
      <Typography
        variant="h3"
        sx={{
          mt: active ? 1 : 1.375,
          fontSize: { xs: "1rem", md: "1.1rem" },
          fontWeight: active ? 700 : 500,
          color: active
            ? "var(--mui-palette-secondary-main)"
            : "var(--mui-palette-text-primary)",
          transition: "color .25s, margin-top .25s",
        }}
      >
        {year}
      </Typography>
    </Stack>
  );
});

export default function HistoryTimeline() {
  const { t } = useTranslation([GLOBAL]);
  const timelineRef = useRef<HTMLDivElement | null>(null);
  const [timelineNudge, setTimelineNudge] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const tabRefs = useRef<HTMLButtonElement[]>([]);

  const items: TimelineDataItem[] = useMemo(
    () => [
      {
        year: t("what_is_cs.timeline.early_2000s_year"),
        text: t("what_is_cs.timeline.early_2000s_text"),
      },
      {
        year: t("what_is_cs.timeline.2010s_year"),
        text: t("what_is_cs.timeline.2010s_text"),
      },
      {
        year: t("what_is_cs.timeline.2020_year"),
        text: t("what_is_cs.timeline.2020_text"),
      },
      {
        year: t("what_is_cs.timeline.today_year"),
        text: t("what_is_cs.timeline.today_text"),
      },
    ],
    [t],
  );

  const handleKeyNav = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((i) => (i + 1) % items.length);
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((i) => (i - 1 + items.length) % items.length);
      } else if (e.key === "Home") {
        e.preventDefault();
        setActiveIndex(0);
      } else if (e.key === "End") {
        e.preventDefault();
        setActiveIndex(items.length - 1);
      }
    },
    [items.length],
  );

  useEffect(() => {
    const el = tabRefs.current[activeIndex];
    if (el) {
      requestAnimationFrame(() => el.focus());
      const container = timelineRef.current;
      if (container) {
        const btnRect = el.getBoundingClientRect();
        const contRect = container.getBoundingClientRect();
        if (btnRect.left < contRect.left || btnRect.right > contRect.right) {
          el.scrollIntoView({
            behavior: "smooth",
            inline: "center",
            block: "nearest",
          });
        }
      }
    }
  }, [activeIndex]);

  return (
    <Box
      component="section"
      sx={{
        py: 6,
        bgcolor: "var(--mui-palette-grey-50)",
        position: "relative",
        left: "50%",
        right: "50%",
        marginLeft: "-50vw",
        marginRight: "-50vw",
        width: "100vw",
        minHeight: 450,
      }}
    >
      <Container maxWidth="lg">
        <Typography
          variant="h2"
          sx={{
            mb: 2,
            textAlign: "center",
            fontSize: { xs: "1.5rem", md: "2rem" },
          }}
        >
          {t("what_is_cs.timeline_title")}
        </Typography>
        <Box
          sx={{
            position: "relative",
            overflowX: "auto",
            pb: 3,
            display: "block",
            "@keyframes nudgeRight": {
              "0%": { transform: "translateX(0)" },
              "50%": { transform: "translateX(6px)" },
              "100%": { transform: "translateX(0)" },
            },
          }}
          ref={timelineRef}
          onScroll={(e) =>
            setTimelineNudge(
              (e.currentTarget as HTMLDivElement).scrollLeft === 0,
            )
          }
        >
          <Box
            sx={{
              display: { xs: timelineNudge ? "block" : "none", md: "none" },
              pointerEvents: "none",
              position: "absolute",
              top: 0,
              right: 0,
              bottom: 0,
              width: 48,
              background: `linear-gradient(to right, transparent, var(--mui-palette-grey-50))`,
              zIndex: 1,
            }}
          />
          <Box
            sx={{
              display: { xs: timelineNudge ? "flex" : "none", md: "none" },
              position: "absolute",
              right: 8,
              bottom: 6,
              alignItems: "center",
              gap: 0.5,
              color: "var(--mui-palette-text-secondary)",
              zIndex: 2,
            }}
          >
            <ChevronRightRounded
              sx={{
                fontSize: 18,
                animation: "nudgeRight 1.4s ease-in-out infinite",
              }}
            />
          </Box>
          <Stack
            direction="row"
            spacing={4}
            sx={{
              position: "relative",
              px: 2,
              py: 3,
              width: "fit-content",
              mx: "auto",
            }}
            alignItems="flex-start"
            role="tablist"
            aria-label={t("what_is_cs.timeline_title")}
            aria-orientation="horizontal"
            onKeyDown={handleKeyNav}
          >
            <Box
              sx={{
                position: "absolute",
                top: 28,
                left: 0,
                right: 0,
                height: 2,
                bgcolor: "var(--mui-palette-grey-200)",
                zIndex: 0,
              }}
            />
            {items.map((m, i) => (
              <TimelineTab
                key={m.year}
                index={i}
                year={m.year}
                active={i === activeIndex}
                total={items.length}
                onActivate={setActiveIndex}
                registerRef={(el) => {
                  if (el) tabRefs.current[i] = el;
                }}
              />
            ))}
          </Stack>
        </Box>
        <Box
          id={`timeline-panel-${activeIndex}`}
          role="tabpanel"
          aria-live="polite"
          aria-labelledby={`timeline-tab-${activeIndex}`}
          aria-label={items[activeIndex].year}
          sx={{
            mx: "auto",
            p: { xs: 2, md: 3 },
            border: `1px solid var(--mui-palette-grey-200)`,
            borderRadius: 3,
            background: "var(--mui-palette-background-paper)",
            maxWidth: 640,
            textAlign: "center",
          }}
        >
          <Typography
            variant="h3"
            sx={{
              fontSize: { xs: "1.15rem", md: "1.3rem" },
              mb: 1,
              color: "var(--mui-palette-primary-main)",
            }}
          >
            {items[activeIndex].year}
          </Typography>
          <Typography
            variant="body1"
            sx={{
              color: "var(--mui-palette-text-secondary)",
              lineHeight: 1.55,
            }}
          >
            {items[activeIndex].text}
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}
