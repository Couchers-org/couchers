import { ChevronLeft, ChevronRight } from "@mui/icons-material";
import { Box, Grid, IconButton, styled, Typography } from "@mui/material";
import { useTranslation } from "i18n";
import { GLOBAL, LANDING } from "i18n/namespaces";
import { useEffect, useRef, useState } from "react";
import { theme } from "theme";
import useIsScreenSmallerThan from "utils/useIsScreenSmallerThan";

interface StyledBubbleProps extends React.ComponentProps<typeof Box> {
  selected?: boolean;
}

const StyledBubble = styled(Box, {
  shouldForwardProp: (prop) => prop !== "selected",
})<StyledBubbleProps>(({ theme, selected }) => ({
  color: selected
    ? "var(--mui-palette-common-white)"
    : "var(--mui-palette-text-primary)",
  backgroundColor: selected
    ? theme.palette.primary.main
    : "var(--mui-palette-grey-50)",
  padding: theme.spacing(1),
  borderRadius: theme.shape.borderRadius,
  display: "flex",
  alignItems: "center",
  height: theme.spacing(14),
  cursor: "pointer",
  position: "relative",
  width: 170,
  flexShrink: 0,

  [theme.breakpoints.down("md")]: {
    height: theme.spacing(12),
  },

  "&::after": {
    content: '""',
    position: "absolute",
    bottom: "-15px",
    left: "50%",
    transform: "translateX(-50%)",
    width: 0,
    height: 0,
    borderLeft: "20px solid transparent",
    borderRight: "20px solid transparent",
    borderTop: `20px solid ${selected ? theme.palette.primary.main : theme.palette.primary.light}`,
    display: selected ? "block" : "none",
    [theme.breakpoints.down("md")]: {
      display: "none",
    },
  },
}));

const CouchersMission = () => {
  const { t } = useTranslation([LANDING, GLOBAL]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsScreenSmallerThan("MOBILE");

  const [selectedItem, setSelectedItem] = useState("nonprofit");
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  useEffect(() => {
    if (!isMobile) return;

    const container = scrollRef.current;

    if (!container) return;
    handleScroll(); // Initial check
    container.addEventListener("scroll", handleScroll);
    window.addEventListener("resize", handleScroll);
    return () => {
      container.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, [isMobile]);

  const handleScroll = () => {
    const container = scrollRef.current;
    if (!container) return;
    setCanScrollLeft(container.scrollLeft > 0);
    setCanScrollRight(
      container.scrollLeft + container.clientWidth < container.scrollWidth,
    );
  };

  const missionBubble = (itemName: string) => {
    return (
      <StyledBubble
        selected={selectedItem === itemName}
        onClick={() => {
          setSelectedItem(itemName);
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            width: "100%",
          }}
        >
          <Typography
            gutterBottom
            sx={{
              fontSize: "1.2rem",
              fontWeight: 500,
              marginBottom: 0,
            }}
          >
            {t(`landing:${itemName}_title`)}
          </Typography>
        </Box>
      </StyledBubble>
    );
  };

  return (
    <>
      <Typography
        sx={{
          fontSize: "4rem",
          fontWeight: "bold",

          [theme.breakpoints.down("md")]: {
            fontSize: "2rem",
          },
        }}
      >
        {t("couchers_mission_title")}
      </Typography>
      <Box
        sx={{
          position: "relative",
          width: "100%",
          padding: theme.spacing(3, 0),
        }}
      >
        {canScrollLeft && (
          <IconButton
            size="small"
            sx={{
              position: "absolute",
              left: 0,
              top: "50%",
              transform: "translateY(-50%)",
              zIndex: 1,
              display: { xs: "flex", md: "none" },
              color: "var(--mui-palette-common-white)",
            }}
            onClick={() => {
              scrollRef.current?.scrollBy({
                left: -200,
                behavior: "smooth",
              });
            }}
          >
            <ChevronLeft sx={{ fontSize: "40px" }} />
          </IconButton>
        )}
        <Box
          ref={scrollRef}
          sx={{
            display: "flex",
            gap: 2,
            justifyContent: { xs: "flex-start", md: "center" },
            overflowX: { xs: "auto", md: "visible" },
            flexWrap: { xs: "nowrap", md: "wrap" },
            WebkitOverflowScrolling: "touch",
            width: "100%",
          }}
        >
          {missionBubble("nonprofit")}
          {missionBubble("free_forever")}
          {missionBubble("authentic")}
          {missionBubble("community_led")}
          {missionBubble("open_source")}
          {missionBubble("non_transactional")}
        </Box>
        {canScrollRight && (
          <IconButton
            sx={{
              position: "absolute",
              right: 0,
              top: "50%",
              transform: "translateY(-50%)",
              zIndex: 2,
              display: { xs: "flex", md: "none" },
              color: "var(--mui-palette-common-white)",
            }}
            onClick={() => {
              scrollRef.current?.scrollBy({
                left: 200,
                behavior: "smooth",
              });
            }}
          >
            <ChevronRight sx={{ fontSize: "40px" }} />
          </IconButton>
        )}
      </Box>
      <Grid
        sx={{
          marginTop: 2,
          backgroundColor: "var(--mui-palette-grey-50)",
          padding: 5,
          borderRadius: theme.shape.borderRadius,
          width: "100%",
        }}
      >
        <Typography gutterBottom>
          {t(`landing:${selectedItem}_description`)}
        </Typography>
        <Typography sx={{ marginTop: 2 }}>
          <b>{t("landing:why")}</b> {t(`landing:${selectedItem}_why`)}
        </Typography>
      </Grid>
    </>
  );
};

export default CouchersMission;
