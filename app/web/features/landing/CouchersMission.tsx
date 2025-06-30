import { Box, Fade, Grid, styled, Typography } from "@mui/material";
import { useTranslation } from "i18n";
import { GLOBAL, LANDING } from "i18n/namespaces";
import { useState } from "react";
import { useInView } from "react-intersection-observer";
import { theme } from "theme";

interface StyledGridBubbleProps extends React.ComponentProps<typeof Grid> {
  selected?: boolean;
}

const StyledGridBubble = styled(Grid, {
  shouldForwardProp: (prop) => prop !== "selected",
})<StyledGridBubbleProps>(({ theme, selected }) => ({
  color: selected ? theme.palette.common.white : theme.palette.text.primary,
  backgroundColor: selected
    ? theme.palette.primary.main
    : theme.palette.primary.light,
  padding: theme.spacing(1),
  borderRadius: theme.spacing(1),
  display: "flex",
  alignItems: "center",
  height: theme.spacing(14),
  cursor: "pointer",
  position: "relative",

  [theme.breakpoints.down("md")]: {
    height: theme.spacing(12),
    minWidth: theme.spacing(22),
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
  const { ref, inView } = useInView({ triggerOnce: true });
  const [selectedItem, setSelectedItem] = useState("nonprofit");

  const missionBubble = (itemName: string) => {
    return (
      <StyledGridBubble
        item
        xs={5.7}
        sm={3.8}
        md={1.8}
        selected={selectedItem === itemName}
        onClick={() => {
          setSelectedItem(itemName);
        }}
      >
        <Box display="flex" flexDirection="column" width="100%">
          <Typography
            align="center"
            gutterBottom
            sx={{
              color: theme.palette.common.black,
              fontSize: "1.2rem",
              fontWeight: 500,
            }}
          >
            {t(`landing:${itemName}_title`)}
          </Typography>
        </Box>
      </StyledGridBubble>
    );
  };

  return (
    <>
      <Typography
        sx={{
          fontSize: "3rem",
          fontWeight: "bold",
          marginBottom: 4,

          [theme.breakpoints.down("md")]: {
            fontSize: "1.8rem",
          },
        }}
      >
        {t("couchers_mission_title")}
      </Typography>
      <Grid
        container
        ref={ref}
        sx={{
          marginTop: 2,
          marginBottom: 4,
        }}
      >
        <Fade timeout={2000} in={inView}>
          <Box
            sx={{
              display: "flex",
              gap: 2,
              justifyContent: { xs: "flex-start", md: "center" },
              overflowX: { xs: "auto", md: "visible" },
              flexWrap: { xs: "nowrap", md: "wrap" },
              paddingX: { xs: 1, md: 0 },
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
        </Fade>
        <Fade key={selectedItem} timeout={1000} in={true}>
          <Grid
            item
            sx={{
              marginTop: 2,
              backgroundColor: theme.palette.grey[50],
              padding: 5,
              borderRadius: 2,
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
        </Fade>
      </Grid>
    </>
  );
};

export default CouchersMission;
