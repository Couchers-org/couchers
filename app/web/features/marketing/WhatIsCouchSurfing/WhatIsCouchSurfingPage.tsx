import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import CloseIcon from "@mui/icons-material/Close";
import LightbulbOutlinedIcon from "@mui/icons-material/LightbulbOutlined";
import TravelExploreOutlinedIcon from "@mui/icons-material/TravelExploreOutlined";
import WeekendOutlinedIcon from "@mui/icons-material/WeekendOutlined";
import {
  Box,
  Container,
  Grid,
  List,
  ListItem,
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
import PageTitle from "components/PageTitle";
import { useRouter } from "next/router";
import { missionRoute, signupRoute } from "routes";
import { theme } from "theme";

export default function WhatIsCouchSurfingPage() {
  const router = useRouter();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const MapBanner = ({ compact = false }: { compact?: boolean }) => (
    <Box
      sx={{
        position: "relative",
        borderRadius: 3,
        height: { xs: 180, sm: 220, md: 260 },
        mb: compact ? 0 : 5,
        overflow: "hidden",
        border: `1px solid ${theme.palette.grey[200]}`,
        background: `linear-gradient(135deg, ${theme.palette.primary.light}22, ${theme.palette.secondary.light}22)`,
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
          d="M70,200 C220,120 400,160 580,100 C700,70 740,90 730,80"
          fill="none"
          stroke={theme.palette.primary.light}
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray="6 8"
        />
        <path
          d="M70,140 C230,90 360,110 520,60 C640,30 720,40 760,30"
          fill="none"
          stroke={theme.palette.secondary.light}
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray="4 10"
          opacity="0.8"
        />
        {/* Pins (responsive sizes) */}
        <g transform="translate(170,150)">
          <circle r={isMobile ? 12 : 9} fill={theme.palette.primary.main} />
          <path
            d={`M0,${isMobile ? 12 : 9} L${isMobile ? 7 : 5},${(isMobile ? 12 : 9) + (isMobile ? 28 : 22)} L-${isMobile ? 7 : 5},${(isMobile ? 12 : 9) + (isMobile ? 28 : 22)} Z`}
            fill={theme.palette.primary.main}
          />
        </g>
        <g transform="translate(600,85)">
          <circle r={isMobile ? 11 : 8} fill={theme.palette.secondary.main} />
          <path
            d={`M0,${isMobile ? 11 : 8} L${isMobile ? 6 : 4},${(isMobile ? 11 : 8) + (isMobile ? 24 : 18)} L-${isMobile ? 6 : 4},${(isMobile ? 11 : 8) + (isMobile ? 24 : 18)} Z`}
            fill={theme.palette.secondary.main}
          />
        </g>
        {/* Plane (responsive scale) */}
        <g
          transform={`translate(390,105) rotate(-12) scale(${isMobile ? 1.6 : 1.2})`}
        >
          <path
            d="M-16,0 L16,0 L6,6 L6,14 L0,9 L-6,14 L-6,6 Z"
            fill={theme.palette.primary.dark}
            opacity="0.9"
          />
        </g>
      </svg>
    </Box>
  );

  const Section = ({
    title,
    children,
  }: {
    title: string;
    children: React.ReactNode;
  }) => (
    <Box component="section" sx={{ py: 6 }}>
      <Typography
        variant="h2"
        sx={{ fontSize: "2rem", fontWeight: 700, mb: 2 }}
      >
        {title}
      </Typography>
      <Typography
        variant="body1"
        sx={{ fontSize: "1.125rem", color: theme.palette.text.primary }}
      >
        {children}
      </Typography>
    </Box>
  );

  // Simplified typographic layout, no repeated icon grids

  return (
    <>
      <HtmlMeta title="What is couch surfing?" />
      <Container
        component="article"
        maxWidth="lg"
        sx={{ py: { xs: 4, md: 8 } }}
      >
        <PageTitle>What is couch surfing?</PageTitle>

        <Typography variant="body1" sx={{ fontSize: "1.125rem", mb: 2 }}>
          Couch surfing is people opening their homes and time to travelers — to
          share stories, culture, and real life. It’s about connection, not
          transactions.
        </Typography>

        <Box component="section" sx={{ py: 6 }}>
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography
                variant="h2"
                sx={{ fontSize: "2rem", fontWeight: 700, mb: 2 }}
              >
                How can I get involved?
              </Typography>
              <List sx={{ listStyle: "disc", pl: 3 }}>
                <ListItem sx={{ display: "list-item", p: 0, mb: 1 }}>
                  Host a traveler visiting your city
                </ListItem>
                <ListItem sx={{ display: "list-item", p: 0, mb: 1 }}>
                  Surf with a local while traveling
                </ListItem>
                <ListItem sx={{ display: "list-item", p: 0, mb: 1 }}>
                  Attend events with locals and travelers
                </ListItem>
                <ListItem sx={{ display: "list-item", p: 0, mb: 1 }}>
                  Find like‑minded people in your city and meet up
                </ListItem>
                <ListItem sx={{ display: "list-item", p: 0, mb: 1 }}>
                  Join or start discussions in your local community
                </ListItem>
              </List>
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={2}
                sx={{ mt: 3 }}
              >
                <Button
                  variant="contained"
                  size="large"
                  onClick={() => router.push(signupRoute)}
                >
                  Get started
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  onClick={() => router.push(missionRoute)}
                >
                  Mission & values
                </Button>
              </Stack>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box
                sx={{
                  border: `1px solid ${theme.palette.grey[200]}`,
                  borderRadius: 3,
                  p: 2,
                  overflow: "hidden",
                }}
              >
                <MapBanner compact />
              </Box>
            </Grid>
          </Grid>
        </Box>

        <Section title="A quick history of couch surfing">
          Couch surfing isn’t new. But as a movement, hospitality exchange took
          off in the early 2000s when websites started connecting travelers and
          hosts all over the world. The idea was simple but revolutionary:
          instead of booking a hotel, you’d stay with someone local — usually
          for free — and in return, you’d share stories, cook a meal, maybe go
          on an adventure together. At its best, couch surfing made the world
          feel like one big, friendly neighborhood.
        </Section>

        <Box component="section" sx={{ py: 6 }}>
          <Typography
            variant="h2"
            sx={{ fontSize: "2rem", fontWeight: 700, mb: 2 }}
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
                  <Typography
                    variant="h3"
                    sx={{ fontSize: "1.15rem", fontWeight: 700 }}
                  >
                    As a traveler
                  </Typography>
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
                  <Typography
                    variant="h3"
                    sx={{ fontSize: "1.15rem", fontWeight: 700 }}
                  >
                    As a host
                  </Typography>
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

        <Container
          component="section"
          disableGutters
          maxWidth={false}
          sx={{ bgcolor: theme.palette.grey[50], py: 6 }}
        >
          <Container maxWidth="lg">
            <Grid container spacing={4} alignItems="center">
              <Grid item xs={12} md={6}>
                <Typography
                  variant="h2"
                  sx={{ fontSize: "2rem", fontWeight: 700, mb: 2 }}
                >
                  Why people love couch surfing
                </Typography>
                <List sx={{ listStyle: "disc", pl: 3 }}>
                  <ListItem sx={{ display: "list-item", p: 0, mb: 1 }}>
                    For travelers: deeper, more human experiences beyond tourist
                    trails
                  </ListItem>
                  <ListItem sx={{ display: "list-item", p: 0, mb: 1 }}>
                    For hosts: meet people from around the world and share your
                    city
                  </ListItem>
                  <ListItem sx={{ display: "list-item", p: 0, mb: 1 }}>
                    For everyone: community, culture, and connection — not
                    transactions
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
        </Container>

        <Box component="section" sx={{ py: 6 }}>
          <Typography
            variant="h2"
            sx={{ fontSize: "2rem", fontWeight: 700, mb: 2 }}
          >
            How is Couchers.org different?
          </Typography>
          <Box sx={{ overflowX: "auto", position: "relative" }}>
            {/* Mobile scroll hint on top */}
            <Box
              sx={{
                display: { xs: "block", md: "none" },
                textAlign: "right",
                mb: 1,
                color: theme.palette.text.secondary,
                fontSize: "0.8rem",
              }}
            >
              Swipe to see more →
            </Box>
            <Table size="medium" sx={{ minWidth: 720 }}>
              <TableHead>
                <TableRow>
                  <TableCell />
                  <TableCell sx={{ fontWeight: 700 }}>Couchers.org</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Hostel</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Hotel</TableCell>
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
                  <TableCell>Local tips from real people</TableCell>
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
                <TableRow>
                  <TableCell>Standardized amenities</TableCell>
                  <TableCell>
                    <CloseIcon color="disabled" fontSize="small" />
                  </TableCell>
                  <TableCell>
                    <CheckCircleOutlineIcon color="primary" fontSize="small" />
                  </TableCell>
                  <TableCell>
                    <CheckCircleOutlineIcon color="primary" fontSize="small" />
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Privacy (own room)</TableCell>
                  <TableCell>Varies</TableCell>
                  <TableCell>Varies</TableCell>
                  <TableCell>
                    <CheckCircleOutlineIcon color="primary" fontSize="small" />
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Transactional model</TableCell>
                  <TableCell>
                    <CloseIcon color="disabled" fontSize="small" />
                  </TableCell>
                  <TableCell>
                    <CheckCircleOutlineIcon color="primary" fontSize="small" />
                  </TableCell>
                  <TableCell>
                    <CheckCircleOutlineIcon color="primary" fontSize="small" />
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
      <Box component="section" sx={{ py: 6, bgcolor: theme.palette.grey[50] }}>
        <Container maxWidth="lg">
          <Stack spacing={2} alignItems="center" textAlign="center">
            <Typography
              variant="h2"
              sx={{ fontSize: { xs: "1.5rem", md: "2rem" }, fontWeight: 700 }}
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
