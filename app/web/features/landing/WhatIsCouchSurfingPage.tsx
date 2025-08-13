import {
  ChevronRightRounded,
  EventOutlined,
  ForumOutlined,
  GroupOutlined,
  LightbulbOutlined,
  TravelExploreOutlined,
  WeekendOutlined,
} from "@mui/icons-material";
import {
  Box,
  Container,
  Grid,
  List,
  ListItem,
  ListItemIcon,
  Stack,
  Typography,
} from "@mui/material";
import Button from "components/Button";
import HtmlMeta from "components/HtmlMeta";
import { Trans, useTranslation } from "i18n";
import { GLOBAL } from "i18n/namespaces";
import { useRouter } from "next/router";
import { useRef, useState } from "react";
import { signupRoute } from "routes";
import { theme } from "theme";

import CompareTable from "./CompareTable";
import PaperPlaneAnimation from "./PaperPlaneAnimation";

export default function WhatIsCouchSurfingPage() {
  const router = useRouter();
  const { t } = useTranslation([GLOBAL]);
  const timelineRef = useRef<HTMLDivElement | null>(null);
  const [timelineNudge, setTimelineNudge] = useState(true);

  return (
    <>
      <HtmlMeta title={t("what_is_cs.meta_title")} />
      <Container
        component="article"
        maxWidth="lg"
        sx={{ py: { xs: 0, md: 8 } }}
      >
        <Box component="section" sx={{ py: 6 }}>
          <Container maxWidth="lg" sx={{ px: { xs: 0, md: 3 } }}>
            <Grid container spacing={{ xs: 1, md: 4 }} alignItems="center">
              <Grid
                item
                xs={12}
                md={5}
                sx={{ order: { xs: 2, md: 1 }, mt: { xs: 3, md: 0 } }}
              >
                <PaperPlaneAnimation compact />
              </Grid>
              <Grid
                item
                xs={12}
                md={7}
                sx={{
                  order: { xs: 1, md: 2 },
                  display: "flex",
                  justifyContent: { xs: "flex-start", md: "flex-end" },
                }}
              >
                <Box
                  sx={{
                    maxWidth: { xs: "100vw", md: 560 },
                    width: { xs: "100vw", md: "auto" },
                    ml: { xs: -1, md: 0 },
                    mr: { xs: -1, md: 0 },
                    textAlign: { xs: "left", md: "right" },
                  }}
                >
                  <Typography
                    variant="h2"
                    sx={{
                      fontSize: { xs: "1.65rem", md: "2rem" },
                      fontWeight: "bold",
                      textAlign: { xs: "center", md: "right" },
                      mb: { xs: 1, md: 1.5 },
                      position: "relative",
                      "&::after": {
                        content: '""',
                        display: "block",
                        height: 3,
                        width: 56,
                        backgroundColor: theme.palette.primary.main,
                        borderRadius: 2,
                        marginTop: theme.spacing(0.5),
                        marginLeft: { xs: "auto", md: "auto" },
                        marginRight: { xs: "auto", md: 0 },
                        animation:
                          "growBar 2.8s ease-in-out infinite alternate",
                      },
                      "@keyframes growBar": {
                        from: { width: 24, opacity: 0.7 },
                        to: { width: 80, opacity: 1 },
                      },
                    }}
                  >
                    {t("what_is_cs.get_involved_title")}
                  </Typography>
                  <List sx={{ textAlign: { xs: "left", md: "right" } }}>
                    <ListItem
                      sx={{
                        p: 0,
                        mb: 1.25,
                        justifyContent: "flex-end",
                        alignItems: "center",
                        columnGap: 1,
                      }}
                    >
                      <ListItemIcon
                        sx={{
                          minWidth: 36,
                          color: theme.palette.primary.main,
                        }}
                      >
                        <WeekendOutlined
                          sx={{ fontSize: { xs: 22, md: 28 } }}
                        />
                      </ListItemIcon>
                      <Typography
                        component="span"
                        sx={{
                          fontSize: { xs: "1.0625rem", md: "1.2rem" },
                        }}
                      >
                        {t("what_is_cs.actions.host")}
                      </Typography>
                    </ListItem>
                    <ListItem
                      sx={{
                        p: 0,
                        mb: 1.25,
                        justifyContent: "flex-end",
                        alignItems: "center",
                        columnGap: 1,
                      }}
                    >
                      <ListItemIcon
                        sx={{
                          minWidth: 36,
                          color: theme.palette.primary.main,
                        }}
                      >
                        <TravelExploreOutlined
                          sx={{ fontSize: { xs: 22, md: 28 } }}
                        />
                      </ListItemIcon>
                      <Typography
                        component="span"
                        sx={{
                          fontSize: { xs: "1.0625rem", md: "1.2rem" },
                        }}
                      >
                        {t("what_is_cs.actions.surf")}
                      </Typography>
                    </ListItem>
                    <ListItem
                      sx={{
                        p: 0,
                        mb: 1.25,
                        justifyContent: "flex-end",
                        alignItems: "center",
                        columnGap: 1,
                      }}
                    >
                      <ListItemIcon
                        sx={{
                          minWidth: 36,
                          color: theme.palette.primary.main,
                        }}
                      >
                        <EventOutlined sx={{ fontSize: { xs: 22, md: 28 } }} />
                      </ListItemIcon>
                      <Typography
                        component="span"
                        sx={{
                          fontSize: { xs: "1.0625rem", md: "1.2rem" },
                        }}
                      >
                        {t("what_is_cs.actions.attend_events")}
                      </Typography>
                    </ListItem>
                    <ListItem
                      sx={{
                        p: 0,
                        mb: 1.25,
                        justifyContent: "flex-end",
                        alignItems: "center",
                        columnGap: 1,
                      }}
                    >
                      <ListItemIcon
                        sx={{
                          minWidth: 36,
                          color: theme.palette.primary.main,
                        }}
                      >
                        <GroupOutlined sx={{ fontSize: { xs: 22, md: 28 } }} />
                      </ListItemIcon>
                      <Typography
                        component="span"
                        sx={{
                          fontSize: { xs: "1.0625rem", md: "1.2rem" },
                        }}
                      >
                        {t("what_is_cs.actions.find_people")}
                      </Typography>
                    </ListItem>
                    <ListItem
                      sx={{
                        p: 0,
                        mb: 1.25,
                        justifyContent: "flex-end",
                        alignItems: "center",
                        columnGap: 1,
                      }}
                    >
                      <ListItemIcon
                        sx={{
                          minWidth: 36,
                          color: theme.palette.primary.main,
                        }}
                      >
                        <ForumOutlined sx={{ fontSize: { xs: 22, md: 28 } }} />
                      </ListItemIcon>
                      <Typography
                        component="span"
                        sx={{
                          fontSize: { xs: "1.0625rem", md: "1.2rem" },
                        }}
                      >
                        {t("what_is_cs.actions.join_discussions")}
                      </Typography>
                    </ListItem>
                  </List>
                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    spacing={2}
                    sx={{
                      mt: 3,
                      justifyContent: { xs: "flex-start", md: "flex-end" },
                    }}
                  >
                    <Button
                      variant="contained"
                      size="large"
                      onClick={() => router.push(signupRoute)}
                    >
                      {t("what_is_cs.get_started")}
                    </Button>
                  </Stack>
                </Box>
              </Grid>
            </Grid>
          </Container>
        </Box>

        <Box
          component="section"
          sx={{
            py: 6,
            bgcolor: theme.palette.grey[50],
            position: "relative",
            left: "50%",
            right: "50%",
            marginLeft: "-50vw",
            marginRight: "-50vw",
            width: "100vw",
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
                pb: 2,
                "@keyframes pulseDot": {
                  "0%, 100%": { transform: "scale(1)", opacity: 1 },
                  "50%": { transform: "scale(1.08)", opacity: 0.9 },
                },
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
                  background: `linear-gradient(to right, transparent, ${theme.palette.grey[50]})`,
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
                  color: theme.palette.text.secondary,
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
                sx={{ position: "relative", minWidth: 720, px: 2, py: 3 }}
                alignItems="flex-start"
              >
                <Box
                  sx={{
                    position: "absolute",
                    top: 28,
                    left: 0,
                    right: 0,
                    height: 2,
                    bgcolor: theme.palette.grey[200],
                  }}
                />
                {[
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
                ].map((m, i) => (
                  <Stack
                    key={m.year}
                    alignItems="center"
                    sx={{ minWidth: 180 }}
                  >
                    <Box
                      sx={{
                        width: 12,
                        height: 12,
                        borderRadius: 10,
                        bgcolor: theme.palette.primary.main,
                        boxShadow: `${theme.palette.primary.light} 0 0 0 3px`,
                        animation: `pulseDot 3.2s ease-in-out ${i * 0.15}s infinite`,
                      }}
                    />
                    <Typography variant="h3" sx={{ mt: 1 }}>
                      {m.year}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: theme.palette.text.secondary,
                        textAlign: "center",
                        mt: 0.5,
                      }}
                    >
                      {m.text}
                    </Typography>
                  </Stack>
                ))}
              </Stack>
            </Box>
          </Container>
        </Box>

        <Box component="section" sx={{ py: 6 }}>
          <Typography
            variant="h2"
            sx={{
              mb: 2,
              textAlign: "center",
              fontSize: { xs: "1.5rem", md: "2rem" },
            }}
          >
            {t("what_is_cs.looks_like_title")}
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Box
                sx={{
                  border: `1px solid ${theme.palette.grey[200]}`,
                  borderRadius: 3,
                  p: 3,
                }}
              >
                <Stack
                  direction="row"
                  spacing={2}
                  alignItems="center"
                  sx={{ mb: 1 }}
                >
                  <Box sx={{ color: theme.palette.primary.main }}>
                    <TravelExploreOutlined sx={{ fontSize: 36 }} />
                  </Box>
                  <Typography variant="h3">
                    {t("what_is_cs.traveler_title")}
                  </Typography>
                </Stack>
                <List sx={{ listStyle: "disc", pl: 3 }}>
                  <ListItem sx={{ display: "list-item", p: 0, mb: 1 }}>
                    {t("what_is_cs.traveler_points.one")}
                  </ListItem>
                  <ListItem sx={{ display: "list-item", p: 0, mb: 1 }}>
                    {t("what_is_cs.traveler_points.two")}
                  </ListItem>
                  <ListItem sx={{ display: "list-item", p: 0, mb: 1 }}>
                    {t("what_is_cs.traveler_points.three")}
                  </ListItem>
                </List>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box
                sx={{
                  border: `1px solid ${theme.palette.grey[200]}`,
                  borderRadius: 3,
                  p: 3,
                }}
              >
                <Stack
                  direction="row"
                  spacing={2}
                  alignItems="center"
                  sx={{ mb: 1 }}
                >
                  <Box sx={{ color: theme.palette.primary.main }}>
                    <WeekendOutlined sx={{ fontSize: 36 }} />
                  </Box>
                  <Typography variant="h3">
                    {t("what_is_cs.host_title")}
                  </Typography>
                </Stack>
                <List sx={{ listStyle: "disc", pl: 3 }}>
                  <ListItem sx={{ display: "list-item", p: 0, mb: 1 }}>
                    {t("what_is_cs.host_points.one")}
                  </ListItem>
                  <ListItem sx={{ display: "list-item", p: 0, mb: 1 }}>
                    {t("what_is_cs.host_points.two")}
                  </ListItem>
                  <ListItem sx={{ display: "list-item", p: 0, mb: 1 }}>
                    {t("what_is_cs.host_points.three")}
                  </ListItem>
                </List>
              </Box>
            </Grid>
          </Grid>
        </Box>

        <Box
          component="section"
          sx={{
            bgcolor: theme.palette.grey[50],
            py: 6,
            position: "relative",
            left: "50%",
            right: "50%",
            marginLeft: "-50vw",
            marginRight: "-50vw",
            width: "100vw",
          }}
        >
          <Container maxWidth="lg">
            <Grid container spacing={4} alignItems="center">
              <Grid item xs={12} md={6}>
                <Typography
                  variant="h2"
                  sx={{
                    mb: 2,
                    fontSize: { xs: "1.5rem", md: "2rem" },
                    textAlign: { xs: "center", md: "left" },
                  }}
                >
                  {t("what_is_cs.why_people_title")}
                </Typography>
                <List sx={{ listStyle: "disc", pl: 3 }}>
                  <ListItem sx={{ display: "list-item", p: 0, mb: 1 }}>
                    <Trans
                      ns={GLOBAL}
                      i18nKey="what_is_cs.why_people_points.travelers"
                      components={{ bold: <b /> }}
                    />
                  </ListItem>
                  <ListItem sx={{ display: "list-item", p: 0, mb: 1 }}>
                    <Trans
                      ns={GLOBAL}
                      i18nKey="what_is_cs.why_people_points.hosts"
                      components={{ bold: <b /> }}
                    />
                  </ListItem>
                  <ListItem sx={{ display: "list-item", p: 0, mb: 1 }}>
                    <Trans
                      ns={GLOBAL}
                      i18nKey="what_is_cs.why_people_points.everyone"
                      components={{ bold: <b /> }}
                    />
                  </ListItem>
                </List>
              </Grid>
              <Grid item xs={12} md={6}>
                <Box
                  sx={{
                    border: `1px solid ${theme.palette.grey[200]}`,
                    borderRadius: 3,
                    p: 3,
                    bgcolor: theme.palette.background.paper,
                  }}
                >
                  <Stack
                    direction="row"
                    spacing={1}
                    alignItems="center"
                    sx={{ mb: 0.5 }}
                  >
                    <LightbulbOutlined
                      sx={{ fontSize: 18, color: theme.palette.primary.main }}
                    />
                    <Typography sx={{ color: theme.palette.text.secondary }}>
                      {t("what_is_cs.tip_label")}
                    </Typography>
                  </Stack>
                  <Typography variant="body2">
                    {t("what_is_cs.tip_text")}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Container>
        </Box>

        <Box component="section" sx={{ py: 6 }}>
          <Typography
            variant="h2"
            sx={{
              mb: 2,
              fontSize: { xs: "1.5rem", md: "2rem" },
              textAlign: "center",
            }}
          >
            {t("what_is_cs.compare_title")}
          </Typography>
          <CompareTable />
        </Box>
      </Container>
      <Box
        component="section"
        sx={{
          py: 6,
          bgcolor: theme.palette.grey[50],
          position: "relative",
          left: "50%",
          right: "50%",
          marginLeft: "-50vw",
          marginRight: "-50vw",
          width: "100vw",
        }}
      >
        <Container maxWidth="lg">
          <Stack spacing={2} alignItems="center" textAlign="center">
            <Typography
              variant="h2"
              sx={{
                fontSize: { xs: "1.5rem", md: "2rem" },
                fontWeight: "bold",
              }}
            >
              {t("what_is_cs.bottom_cta_title")}
            </Typography>
            <Typography
              variant="body1"
              sx={{ color: theme.palette.text.secondary }}
            >
              {t("what_is_cs.bottom_cta_subtitle")}
            </Typography>
            <Button
              size="large"
              variant="contained"
              onClick={() => router.push(signupRoute)}
            >
              {t("what_is_cs.join_couchers")}
            </Button>
          </Stack>
        </Container>
      </Box>
    </>
  );
}
