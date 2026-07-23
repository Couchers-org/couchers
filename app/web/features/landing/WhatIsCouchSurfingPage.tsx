import {
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
  Grid,
  List,
  ListItem,
  ListItemIcon,
  Stack,
  Typography,
} from "@mui/material";
import Button from "components/Button";
import HtmlMeta from "components/HtmlMeta";
import PageContainer from "components/PageContainer";
import { Trans, useTranslation } from "i18n";
import { GLOBAL } from "i18n/namespaces";
import { useRouter } from "next/router";
import { communityGuidelinesURL, signupRoute } from "routes";
import { theme } from "theme";

import StyledLink from "../../components/StyledLink";
import CompareTable from "./CompareTable";
import HistoryTimeline from "./HistoryTimeline";

export default function WhatIsCouchSurfingPage() {
  const router = useRouter();
  const { t } = useTranslation([GLOBAL]);

  return (
    <>
      <HtmlMeta title={t("what_is_cs.title")} />
      <PageContainer component="article" sx={{ py: { xs: 0, md: 8 } }}>
        <Box component="section" sx={{ py: 6 }}>
          <PageContainer sx={{ px: { xs: 0, md: 3 } }}>
            <Grid
              container
              spacing={{ xs: 1, md: 4 }}
              sx={{
                alignItems: { xs: "flex-start", md: "flex-start" },
              }}
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
          </PageContainer>
        </Box>
        <HistoryTimeline />
        <Box component="section" sx={{ py: 6 }}>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Box
                sx={{
                  border: `1px solid var(--mui-palette-grey-200)`,
                  borderRadius: 3,
                  p: 3,
                  height: "100%",
                  // background: theme.palette.background.paper,
                }}
              >
                <Stack
                  direction="row"
                  spacing={1}
                  sx={{
                    alignItems: "center",
                    mb: 2,
                  }}
                >
                  <SecurityOutlined
                    sx={{ fontSize: 36, color: theme.palette.primary.main }}
                  />
                  <Typography
                    variant="h3"
                    sx={{
                      fontSize: { xs: "1.25rem", md: "1.4rem" },
                      fontWeight: 600,
                    }}
                  >
                    {t("what_is_cs.is_it_safe.title")}
                  </Typography>
                </Stack>
                <Typography sx={{ mb: 2 }}>
                  {t("what_is_cs.is_it_safe.description_1")}
                </Typography>
                <Typography sx={{ mb: 2 }}>
                  <Trans
                    ns={GLOBAL}
                    i18nKey="what_is_cs.is_it_safe.description_2"
                    components={{
                      guidelines: (
                        <StyledLink
                          href={communityGuidelinesURL}
                          target="_blank"
                        />
                      ),
                    }}
                  />
                </Typography>
                <Typography>
                  {t("what_is_cs.is_it_safe.description_3")}
                </Typography>
              </Box>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Box
                sx={{
                  border: `1px solid var(--mui-palette-grey-200)`,
                  borderRadius: 3,
                  p: 3,
                  height: "100%",
                }}
              >
                <Stack
                  direction="row"
                  spacing={1}
                  sx={{
                    alignItems: "center",
                    mb: 2,
                  }}
                >
                  <GroupAddOutlined
                    sx={{
                      fontSize: 36,
                      color: "var(--mui-palette-primary-main)",
                    }}
                  />
                  <Typography
                    variant="h3"
                    sx={{
                      fontSize: { xs: "1.25rem", md: "1.4rem" },
                      fontWeight: 600,
                    }}
                  >
                    {t("what_is_cs.get_involved_title")}
                  </Typography>
                </Stack>
                <List>
                  <ListItem
                    sx={{ p: 0, mb: 2, columnGap: 1, alignItems: "center" }}
                  >
                    <ListItemIcon
                      sx={{
                        minWidth: 36,
                        color: "var(--mui-palette-primary-main)",
                      }}
                    >
                      <WeekendOutlined sx={{ fontSize: { xs: 22, md: 28 } }} />
                    </ListItemIcon>
                    <Typography
                      component="span"
                      sx={{ fontSize: { xs: "1.0625rem", md: "1.15rem" } }}
                    >
                      {t("what_is_cs.actions.host")}
                    </Typography>
                  </ListItem>
                  <ListItem
                    sx={{ p: 0, mb: 2, columnGap: 1, alignItems: "center" }}
                  >
                    <ListItemIcon
                      sx={{
                        minWidth: 36,
                        color: "var(--mui-palette-primary-main)",
                      }}
                    >
                      <TravelExploreOutlined
                        sx={{ fontSize: { xs: 22, md: 28 } }}
                      />
                    </ListItemIcon>
                    <Typography
                      component="span"
                      sx={{ fontSize: { xs: "1.0625rem", md: "1.15rem" } }}
                    >
                      {t("what_is_cs.actions.surf")}
                    </Typography>
                  </ListItem>
                  <ListItem
                    sx={{ p: 0, mb: 2, columnGap: 1, alignItems: "center" }}
                  >
                    <ListItemIcon
                      sx={{
                        minWidth: 36,
                        color: "var(--mui-palette-primary-main)",
                      }}
                    >
                      <EventOutlined sx={{ fontSize: { xs: 22, md: 28 } }} />
                    </ListItemIcon>
                    <Typography
                      component="span"
                      sx={{ fontSize: { xs: "1.0625rem", md: "1.15rem" } }}
                    >
                      {t("what_is_cs.actions.attend_events")}
                    </Typography>
                  </ListItem>
                  <ListItem
                    sx={{ p: 0, mb: 2, columnGap: 1, alignItems: "center" }}
                  >
                    <ListItemIcon
                      sx={{
                        minWidth: 36,
                        color: "var(--mui-palette-primary-main)",
                      }}
                    >
                      <GroupOutlined sx={{ fontSize: { xs: 22, md: 28 } }} />
                    </ListItemIcon>
                    <Typography
                      component="span"
                      sx={{ fontSize: { xs: "1.0625rem", md: "1.15rem" } }}
                    >
                      {t("what_is_cs.actions.find_people")}
                    </Typography>
                  </ListItem>
                  <ListItem
                    sx={{ p: 0, mb: 0, columnGap: 1, alignItems: "center" }}
                  >
                    <ListItemIcon
                      sx={{
                        minWidth: 36,
                        color: "var(--mui-palette-primary-main)",
                      }}
                    >
                      <ForumOutlined sx={{ fontSize: { xs: 22, md: 28 } }} />
                    </ListItemIcon>
                    <Typography
                      component="span"
                      sx={{ fontSize: { xs: "1.0625rem", md: "1.15rem" } }}
                    >
                      {t("what_is_cs.actions.join_discussions")}
                    </Typography>
                  </ListItem>
                </List>
              </Box>
            </Grid>
          </Grid>
        </Box>

        <Box
          component="section"
          sx={{
            bgcolor: "var(--mui-palette-grey-50)",
            py: 6,
            position: "relative",
            left: "50%",
            right: "50%",
            marginLeft: "-50vw",
            marginRight: "-50vw",
            width: "100vw",
          }}
        >
          <PageContainer>
            <Grid
              container
              spacing={4}
              sx={{
                alignItems: "center",
              }}
            >
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
                    border: `1px solid var(--mui-palette-grey-200)`,
                    borderRadius: 3,
                    p: 3,
                  }}
                >
                  <Stack
                    direction="row"
                    spacing={1}
                    sx={{
                      alignItems: "center",
                      mb: 0.5,
                    }}
                  >
                    <LightbulbOutlined
                      className="tip-lightbulb"
                      sx={{
                        fontSize: 20,
                        color: "var(--mui-palette-primary-main)",
                        transition:
                          "color .3s, filter .3s, transform .35s cubic-bezier(.4,1.6,.4,1)",
                        transformOrigin: "60% 40%",
                        "&:hover, &:focus-visible": {
                          color: theme.palette.warning.main,
                          filter:
                            "drop-shadow(0 0 4px rgba(255,193,7,.65)) drop-shadow(0 0 8px rgba(255,193,7,.35))",
                          transform: "scale(1.15) rotate(-5deg)",
                          outline: "none",
                        },
                      }}
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
                    border: `1px solid var(--mui-palette-grey-200)`,
                    borderRadius: 3,
                    overflow: "hidden",
                    mb: 3,
                  }}
                >
                  <Box
                    component="img"
                    src="/what-is-cs-scrapbook.png"
                    alt="Why people love couch surfing"
                    decoding="async"
                    loading="lazy"
                    sx={{
                      display: "block",
                      width: "100%",
                      height: "auto",
                    }}
                  />
                </Box>
              </Grid>
            </Grid>
          </PageContainer>
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
      </PageContainer>
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
        }}
      >
        <PageContainer>
          <Stack
            spacing={2}
            sx={{
              alignItems: "center",
              textAlign: "center",
            }}
          >
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
              sx={{ color: "var(--mui-palette-text-secondary)" }}
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
        </PageContainer>
      </Box>
    </>
  );
}
