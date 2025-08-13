import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import CloseIcon from "@mui/icons-material/Close";
import EventOutlinedIcon from "@mui/icons-material/EventOutlined";
import ForumOutlinedIcon from "@mui/icons-material/ForumOutlined";
import GroupOutlinedIcon from "@mui/icons-material/GroupOutlined";
import LightbulbOutlinedIcon from "@mui/icons-material/LightbulbOutlined";
import TravelExploreOutlinedIcon from "@mui/icons-material/TravelExploreOutlined";
import WeekendOutlinedIcon from "@mui/icons-material/WeekendOutlined";
import {
  Box,
  Container,
  Grid,
  List,
  ListItem,
  ListItemIcon,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
  useMediaQuery,
} from "@mui/material";
import Button from "components/Button";
import HtmlMeta from "components/HtmlMeta";
import { useRouter } from "next/router";
import { useRef, useState } from "react";
import { signupRoute } from "routes";
import { theme } from "theme";

export default function WhatIsCouchSurfingPage() {
  const router = useRouter();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const timelineRef = useRef<HTMLDivElement | null>(null);
  const tableRef = useRef<HTMLDivElement | null>(null);
  const [timelineNudge, setTimelineNudge] = useState(true);
  const [tableNudge, setTableNudge] = useState(true);

  const MapBanner = ({ compact = false }: { compact?: boolean }) => (
    <Box
      sx={{
        position: "relative",
        borderRadius: 3,
        aspectRatio: { xs: "1 / 1", sm: "1 / 1", md: "1 / 1" },
        width: "100%",
        mb: compact ? 0 : 5,
        overflow: "hidden",
        border: "none",
        background: `linear-gradient(135deg, ${theme.palette.primary.light}22, ${theme.palette.secondary.light}22)`,
        // minimalist animations
        "& .dashPrimary": {
          stroke: theme.palette.primary.main,
          animation: "dash 12s linear infinite",
        },
        "& .dashSecondary": {
          stroke: theme.palette.secondary.light,
          animation: "dash 16s linear infinite",
          opacity: 0.85,
        },
        "& .pin": {
          transformOrigin: "center bottom",
          animation: "pulse 3.2s ease-in-out infinite",
        },
        "& .planeFloat": {
          animation: "float 4s ease-in-out infinite",
        },
        "@keyframes dash": {
          to: { strokeDashoffset: -120 },
        },
        "@keyframes pulse": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-3px)" },
        },
        "@keyframes float": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-4px)" },
        },
      }}
    >
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 800 260"
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label="Stylized travel map with paths and pins"
      >
        {/* Paths */}
        <path
          className="dashPrimary"
          d="M70,200 C220,120 400,160 580,100 C700,70 740,90 730,80"
          fill="none"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray="8 10"
        />
        <path
          className="dashSecondary"
          d="M70,140 C230,90 360,110 520,60 C640,30 720,40 760,30"
          fill="none"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray="6 12"
        />
        {/* Pins (responsive sizes) */}
        <g transform="translate(170,150)">
          <g className="pin">
            <circle r={isMobile ? 16 : 12} fill={theme.palette.primary.main} />
            <path
              d={`M0,${isMobile ? 16 : 12} L${isMobile ? 9 : 7},${(isMobile ? 16 : 12) + (isMobile ? 36 : 28)} L-${isMobile ? 9 : 7},${(isMobile ? 16 : 12) + (isMobile ? 36 : 28)} Z`}
              fill={theme.palette.primary.main}
            />
          </g>
        </g>
        <g transform="translate(600,85)">
          <g className="pin">
            <circle
              r={isMobile ? 14 : 11}
              fill={theme.palette.secondary.main}
            />
            <path
              d={`M0,${isMobile ? 14 : 11} L${isMobile ? 8 : 6},${(isMobile ? 14 : 11) + (isMobile ? 32 : 24)} L-${isMobile ? 8 : 6},${(isMobile ? 14 : 11) + (isMobile ? 32 : 24)} Z`}
              fill={theme.palette.secondary.main}
            />
          </g>
        </g>
        {/* Plane (responsive scale) */}
        <g
          transform={`translate(390,105) rotate(-12) scale(${isMobile ? 2.0 : 1.6})`}
        >
          <g className="planeFloat">
            <path
              d="M-16,0 L16,0 L6,6 L6,14 L0,9 L-6,14 L-6,6 Z"
              fill={theme.palette.primary.dark}
              opacity="0.9"
            />
          </g>
        </g>
      </svg>
    </Box>
  );

  // (unused component removed)

  // Simplified typographic layout, no repeated icon grids

  return (
    <>
      <HtmlMeta title="What is couch surfing?" />
      <Container
        component="article"
        maxWidth="lg"
        sx={{ py: { xs: 0, md: 8 } }}
      >
        <Box component="section" sx={{ py: 6 }}>
          <Container
            maxWidth="lg"
            sx={{ position: "relative", px: { xs: 0, md: 3 } }}
          >
            <Grid container spacing={{ xs: 1, md: 4 }} alignItems="center">
              {/* Left: Visual (smaller) */}
              <Grid
                item
                xs={12}
                md={5}
                sx={{ order: { xs: 2, md: 1 }, mt: { xs: 3, md: 0 } }}
              >
                <Box
                  sx={{
                    border: "none",
                    borderRadius: 0,
                    p: 0,
                    overflow: "hidden",
                    bgcolor: "transparent",
                  }}
                >
                  <MapBanner compact />
                </Box>
              </Grid>
              {/* Right: Key actions (larger) */}
              <Grid item xs={12} md={7} sx={{ order: { xs: 1, md: 2 } }}>
                <Box
                  sx={{
                    p: { xs: 0, md: 3 },
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
                        mt: { xs: 0, md: 0 },
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
                      How can I get involved in Couchers.org?
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
                          <WeekendOutlinedIcon
                            sx={{ fontSize: { xs: 22, md: 28 } }}
                          />
                        </ListItemIcon>
                        <Typography
                          component="span"
                          sx={{
                            fontSize: { xs: "1.0625rem", md: "1.2rem" },
                          }}
                        >
                          Host a traveler visiting your city
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
                          <TravelExploreOutlinedIcon
                            sx={{ fontSize: { xs: 22, md: 28 } }}
                          />
                        </ListItemIcon>
                        <Typography
                          component="span"
                          sx={{
                            fontSize: { xs: "1.0625rem", md: "1.2rem" },
                          }}
                        >
                          Surf with a local while traveling
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
                          <EventOutlinedIcon
                            sx={{ fontSize: { xs: 22, md: 28 } }}
                          />
                        </ListItemIcon>
                        <Typography
                          component="span"
                          sx={{
                            fontSize: { xs: "1.0625rem", md: "1.2rem" },
                          }}
                        >
                          Attend events with locals and travelers
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
                          <GroupOutlinedIcon
                            sx={{ fontSize: { xs: 22, md: 28 } }}
                          />
                        </ListItemIcon>
                        <Typography
                          component="span"
                          sx={{
                            fontSize: { xs: "1.0625rem", md: "1.2rem" },
                          }}
                        >
                          Find like‑minded people in your city and meet up
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
                          <ForumOutlinedIcon
                            sx={{ fontSize: { xs: 22, md: 28 } }}
                          />
                        </ListItemIcon>
                        <Typography
                          component="span"
                          sx={{
                            fontSize: { xs: "1.0625rem", md: "1.2rem" },
                          }}
                        >
                          Join or start discussions in your local community
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
                        Get started
                      </Button>
                      {/* Secondary CTA removed for cohesion */}
                    </Stack>
                  </Box>
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
              A quick history of couch surfing
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
              {/* Mobile scroll affordance */}
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
                  fontSize: "0.875rem",
                  zIndex: 2,
                }}
              >
                <ChevronRightRoundedIcon
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
                    year: "Early 2000s",
                    text: "Concept drops: stay with locals, share culture — the movement goes online.",
                  },
                  {
                    year: "2010s",
                    text: "Communities and events flourish; references build trust — the world starts to feel like one friendly neighborhood.",
                  },
                  {
                    year: "2020",
                    text: "A major platform goes for‑profit; Couchers.org launches as the nonprofit, community‑run alternative.",
                  },
                  {
                    year: "Today",
                    text: "The next chapter: modern, safer, nonprofit couch surfing — built by and for the community.",
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
            What couch surfing looks like
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
                    <TravelExploreOutlinedIcon sx={{ fontSize: 36 }} />
                  </Box>
                  <Typography variant="h3">As a traveler</Typography>
                </Stack>
                <List sx={{ listStyle: "disc", pl: 3 }}>
                  <ListItem sx={{ display: "list-item", p: 0, mb: 1 }}>
                    Stay with a local instead of a hotel or hostel
                  </ListItem>
                  <ListItem sx={{ display: "list-item", p: 0, mb: 1 }}>
                    See favorite neighborhood spots, not just the highlights
                  </ListItem>
                  <ListItem sx={{ display: "list-item", p: 0, mb: 1 }}>
                    Share a meal or story and make real friends
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
                    <WeekendOutlinedIcon sx={{ fontSize: 36 }} />
                  </Box>
                  <Typography variant="h3">As a host</Typography>
                </Stack>
                <List sx={{ listStyle: "disc", pl: 3 }}>
                  <ListItem sx={{ display: "list-item", p: 0, mb: 1 }}>
                    Welcome travelers into your home or your time
                  </ListItem>
                  <ListItem sx={{ display: "list-item", p: 0, mb: 1 }}>
                    Show off hidden gems and share your culture
                  </ListItem>
                  <ListItem sx={{ display: "list-item", p: 0, mb: 1 }}>
                    Bring the world to your doorstep — no suitcase required
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
                  Why people love couch surfing
                </Typography>
                <List sx={{ listStyle: "disc", pl: 3 }}>
                  <ListItem sx={{ display: "list-item", p: 0, mb: 1 }}>
                    <b>For travelers</b>: deeper, more human experiences beyond
                    tourist trails
                  </ListItem>
                  <ListItem sx={{ display: "list-item", p: 0, mb: 1 }}>
                    <b>For hosts</b>: meet people from around the world and
                    share your city
                  </ListItem>
                  <ListItem sx={{ display: "list-item", p: 0, mb: 1 }}>
                    <b>For everyone</b>: community, culture, and connection —
                    not transactions
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
                    <LightbulbOutlinedIcon
                      sx={{ fontSize: 18, color: theme.palette.primary.main }}
                    />
                    <Typography sx={{ color: theme.palette.text.secondary }}>
                      TIP
                    </Typography>
                  </Stack>
                  <Typography variant="body2">
                    New here? Attend a local event to get a feel for the
                    community — low commitment, high connection.
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
            How does Couchers.org compare?
          </Typography>
          {/* Mobile nudge above the table (fixed height to avoid layout shift) */}
          <Box
            sx={{
              display: { xs: "flex", md: "none" },
              justifyContent: "flex-end",
              alignItems: "center",
              pr: 0.5,
              pb: 0.5,
              minHeight: 24,
              height: 24,
              pointerEvents: "none",
              color: theme.palette.text.secondary,
              "@keyframes nudgeRightTop": {
                "0%": { transform: "translateX(0)" },
                "50%": { transform: "translateX(6px)" },
                "100%": { transform: "translateX(0)" },
              },
            }}
          >
            <ChevronRightRoundedIcon
              sx={{
                fontSize: 18,
                animation: "nudgeRightTop 1.4s ease-in-out infinite",
                visibility: tableNudge ? "visible" : "hidden",
              }}
            />
          </Box>
          <Box
            sx={{
              overflowX: "auto",
              position: "relative",
              border: `1px solid ${theme.palette.grey[200]}`,
              borderRadius: 2,
              p: 1.5,
              bgcolor: theme.palette.background.paper,
              "@keyframes nudgeRightTbl": {
                "0%": { transform: "translateX(0)" },
                "50%": { transform: "translateX(6px)" },
                "100%": { transform: "translateX(0)" },
              },
            }}
            ref={tableRef}
            onScroll={(e) =>
              setTableNudge(
                (e.currentTarget as HTMLDivElement).scrollLeft === 0,
              )
            }
          >
            <Table
              size="small"
              sx={{
                minWidth: 450,
                "& th, & td": { px: { xs: 0.75, md: 1 }, py: 0.75 },
                "& thead th": { fontWeight: 700 },
                "& thead th:first-of-type": {
                  pl: { xs: 0.5, md: 1 },
                  pr: { xs: 0.25, md: 1 },
                },
                "& tbody td:first-of-type": {
                  fontWeight: 500,
                  pl: { xs: 0.5, md: 1 },
                  pr: { xs: 0.125, md: 1 },
                  whiteSpace: { xs: "normal", md: "nowrap" },
                  wordBreak: { xs: "break-word", md: "normal" },
                },
                "& td:not(:first-of-type), & th:not(:first-of-type)": {
                  textAlign: "center",
                  whiteSpace: "nowrap",
                  width: { xs: 60, md: 120 },
                  px: { xs: 0.5, md: 1 },
                },
                "& tbody tr:nth-of-type(odd)": {
                  backgroundColor: theme.palette.grey[50],
                },
              }}
            >
              <TableHead>
                <TableRow>
                  <TableCell />
                  <TableCell>Couchers.org</TableCell>
                  <TableCell>Hostel</TableCell>
                  <TableCell>Hotel</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell>People‑first nonprofit</TableCell>
                  <TableCell>
                    <CheckCircleOutlineIcon color="primary" fontSize="small" />
                  </TableCell>
                  <TableCell>
                    <CloseIcon color="disabled" fontSize="small" />
                  </TableCell>
                  <TableCell>
                    <CloseIcon color="disabled" fontSize="small" />
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Cost to stay</TableCell>
                  <TableCell>Free to stay</TableCell>
                  <TableCell>$</TableCell>
                  <TableCell>$$–$$$</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Stay with locals</TableCell>
                  <TableCell>
                    <CheckCircleOutlineIcon color="primary" fontSize="small" />
                  </TableCell>
                  <TableCell>
                    <CloseIcon color="disabled" fontSize="small" />
                  </TableCell>
                  <TableCell>
                    <CloseIcon color="disabled" fontSize="small" />
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>References & community moderation</TableCell>
                  <TableCell>
                    <CheckCircleOutlineIcon color="primary" fontSize="small" />
                  </TableCell>
                  <TableCell>
                    <CloseIcon color="disabled" fontSize="small" />
                  </TableCell>
                  <TableCell>
                    <CloseIcon color="disabled" fontSize="small" />
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Meetups & local communities</TableCell>
                  <TableCell>
                    <CheckCircleOutlineIcon color="primary" fontSize="small" />
                  </TableCell>
                  <TableCell>
                    <CheckCircleOutlineIcon color="primary" fontSize="small" />
                  </TableCell>
                  <TableCell>
                    <CloseIcon color="disabled" fontSize="small" />
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Cultural exchange focus</TableCell>
                  <TableCell>
                    <CheckCircleOutlineIcon color="primary" fontSize="small" />
                  </TableCell>
                  <TableCell>
                    <CheckCircleOutlineIcon color="primary" fontSize="small" />
                  </TableCell>
                  <TableCell>
                    <CloseIcon color="disabled" fontSize="small" />
                  </TableCell>
                </TableRow>
                {/* Consolidated into 'Stay with locals' */}
                {/* Consolidated into 'Cost to stay' */}
                <TableRow>
                  <TableCell>Non‑transactional community model</TableCell>
                  <TableCell>
                    <CheckCircleOutlineIcon color="primary" fontSize="small" />
                  </TableCell>
                  <TableCell>
                    <CloseIcon color="disabled" fontSize="small" />
                  </TableCell>
                  <TableCell>
                    <CloseIcon color="disabled" fontSize="small" />
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>No investor pressure</TableCell>
                  <TableCell>
                    <CheckCircleOutlineIcon color="primary" fontSize="small" />
                  </TableCell>
                  <TableCell>
                    <CloseIcon color="disabled" fontSize="small" />
                  </TableCell>
                  <TableCell>
                    <CloseIcon color="disabled" fontSize="small" />
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
            {/* Mobile scroll hint (bottom duplicate removed) */}
          </Box>
        </Box>

        {/* Differentiators section removed in favor of "Made for community" above */}

        {/* Removed duplicate get-involved section to avoid repetition */}
      </Container>
      {/* Bottom CTA */}
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
              Ready to try couch surfing?
            </Typography>
            <Typography
              variant="body1"
              sx={{ color: theme.palette.text.secondary }}
            >
              Join Couchers.org and be part of a global community built on
              hospitality and connection.
            </Typography>
            <Button
              size="large"
              variant="contained"
              onClick={() => router.push(signupRoute)}
            >
              Join Couchers.org
            </Button>
          </Stack>
        </Container>
      </Box>
    </>
  );
}
