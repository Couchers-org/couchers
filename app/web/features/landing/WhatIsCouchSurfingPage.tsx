import {
  ChevronRightRounded,
  EventOutlined,
  ForumOutlined,
  GroupAddOutlined,
  GroupOutlined,
  LightbulbOutlined,
  SecurityOutlined,
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
import FlipCard from "components/FlipCard";
import HtmlMeta from "components/HtmlMeta";
import { Trans, useTranslation } from "i18n";
import { GLOBAL } from "i18n/namespaces";
import { useRouter } from "next/router";
import { useRef, useState } from "react";
import { signupRoute } from "routes";
import { theme } from "theme";

import CompareTable from "./CompareTable";

export default function WhatIsCouchSurfingPage() {
  const router = useRouter();
  const { t } = useTranslation([GLOBAL]);
  const timelineRef = useRef<HTMLDivElement | null>(null);
  const [timelineNudge, setTimelineNudge] = useState(true);

  return (
    <>
      <HtmlMeta title={t("what_is_cs.title")} />
      <Container
        component="article"
        maxWidth="lg"
        sx={{ py: { xs: 0, md: 8 } }}
      >
        <Box component="section" sx={{ py: 6 }}>
          <Container maxWidth="lg" sx={{ px: { xs: 0, md: 3 } }}>
            <Grid
              container
              spacing={{ xs: 1, md: 4 }}
              alignItems={{ xs: "flex-start", md: "flex-start" }}
            >
              <Grid
                size={{ xs: 12, md: 5 }}
                sx={{
                  order: { xs: 2, md: 1 },
                  mt: { xs: 3, md: 0 },
                }}
              >
                <Box
                  component="img"
                  src="/emily-group.jpg"
                  alt="Group of Couchers"
                  sx={{
                    display: "block",
                    width: "100%",
                    aspectRatio: "4 / 3",
                    objectFit: "cover",
                  }}
                />
              </Grid>

              <Grid
                size={{ xs: 12, md: 7 }}
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
                    }}
                  >
                    {t("what_is_cs.title")}
                  </Typography>
                  <Typography sx={{ fontSize: { xs: "1rem", md: "1.25rem" } }}>
                    {t("what_is_cs.description_1")}
                  </Typography>
                  <Typography
                    sx={{ mt: 1, fontSize: { xs: "1rem", md: "1.25rem" } }}
                  >
                    {t("what_is_cs.description_2")}
                  </Typography>
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
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 6 }}>
              <FlipCard
                icon={<SecurityOutlined sx={{ fontSize: 40 }} />}
                title={t("what_is_cs.is_it_safe.title")}
              >
                <Typography sx={{ mb: 2 }}>
                  {t("what_is_cs.is_it_safe.description_1")}
                </Typography>
                <Typography sx={{ mb: 2 }}>
                  {t("what_is_cs.is_it_safe.description_2")}
                </Typography>
                <Typography>
                  {t("what_is_cs.is_it_safe.description_3")}
                </Typography>
              </FlipCard>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <FlipCard
                icon={<GroupAddOutlined sx={{ fontSize: 40 }} />}
                title={t("what_is_cs.get_involved_title")}
              >
                <List>
                  <ListItem
                    sx={{
                      p: 0,
                      mb: 3,
                      justifyContent: "center",
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
                      <WeekendOutlined sx={{ fontSize: { xs: 22, md: 28 } }} />
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
                      mb: 3,
                      justifyContent: "center",
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
                      mb: 3,
                      justifyContent: "center",
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
                      mb: 3,
                      justifyContent: "center",
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
                      mb: 3,
                      justifyContent: "center",
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
              </FlipCard>
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
              <Grid size={{ xs: 12, md: 6 }}>
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
              <Grid size={{ xs: 12, md: 6 }}>
                <Box
                  sx={{
                    border: `1px solid ${theme.palette.grey[200]}`,
                    borderRadius: 3,
                    overflow: "hidden",
                    mb: 3,
                  }}
                >
                  <Box
                    component="img"
                    src="/yannic-group.jpg"
                    alt="Why people love couch surfing"
                    sx={{
                      display: "block",
                      width: "100%",
                      aspectRatio: "1.5 / 1",
                      objectFit: "cover",
                    }}
                  />
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
