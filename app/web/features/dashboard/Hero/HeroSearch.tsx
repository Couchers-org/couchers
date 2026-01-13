import { Favorite, Public, Star } from "@mui/icons-material";
import { Box, styled, Typography } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import LocationAutocomplete from "components/LocationAutocomplete";
import { Coordinates } from "features/search/utils/constants";
import { DASHBOARD, LANDING } from "i18n/namespaces";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";
import { useIsNativeEmbed } from "platform/nativeLink";
import { HostingStatus } from "proto/api_pb";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { routeToSearch } from "routes";
import { getSignupPageInfo } from "service/public";
import dayjs from "utils/dayjs";
import { GeocodeResult } from "utils/hooks";

const StyledSearchBoxContainer = styled("form")(({ theme }) => ({
  width: "100%",
  padding: theme.spacing(4, 3),
  borderRadius: theme.shape.borderRadius * 2,
  backgroundColor: theme.palette.background.paper,
  boxShadow: theme.shadows[2],
}));

const StatsBar = styled(Box)(({ theme }) => ({
  display: "flex",
  flexWrap: "wrap",
  justifyContent: "center",
  width: "fit-content",
  margin: "0 auto",
  marginBottom: theme.spacing(3),
  gap: theme.spacing(2, 4),
  padding: theme.spacing(1.5, 3),
  backgroundColor: "var(--mui-palette-grey-50)",
  borderRadius: theme.shape.borderRadius * 4,
}));

const StatItem = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(0.75),
  color: theme.palette.text.secondary,
  fontSize: "0.875rem",
}));

export default function HeroSearch() {
  const { t } = useTranslation([DASHBOARD, LANDING]);
  const router = useRouter();
  const searchInputId = "hero-search-input";
  const isNativeEmbed = useIsNativeEmbed();
  const [, startTransition] = useTransition();

  const { data: signupPageInfo } = useQuery({
    queryKey: ["signupPageInfo"],
    queryFn: getSignupPageInfo,
  });

  const {
    control,
    formState: { errors },
  } = useForm<{ location: GeocodeResult }>({ mode: "onChange" });

  const formatLastSignup = (timestamp: { seconds: number } | undefined) => {
    if (!timestamp) return null;
    const date = dayjs.unix(timestamp.seconds);
    return date.fromNow();
  };

  return (
    <StyledSearchBoxContainer>
      <Typography
        sx={{
          marginBottom: 2,
          fontSize: "1.25rem",
          fontWeight: 600,
        }}
      >
        {t("find_a_host")}. {t("become_a_host")}.
      </Typography>

      <StatsBar>
        <StatItem>
          <Favorite sx={{ color: "primary.main", fontSize: "1.1rem" }} />
          <span>
            {signupPageInfo?.userCount
              ? t("landing:num_users", {
                  numUsers: signupPageInfo.userCount.toLocaleString(),
                })
              : "..."}
          </span>
        </StatItem>
        <StatItem>
          <Public sx={{ color: "primary.main", fontSize: "1.1rem" }} />
          <span>{t("landing:num_countries", { numCountries: 180 })}</span>
        </StatItem>
        <StatItem>
          <Star sx={{ color: "primary.main", fontSize: "1.1rem" }} />
          <span>
            {signupPageInfo?.lastSignup
              ? t("landing:last_signup", {
                  timeAgo: formatLastSignup(signupPageInfo.lastSignup),
                })
              : "..."}
          </span>
        </StatItem>
      </StatsBar>

      <Typography
        component="label"
        htmlFor={searchInputId}
        sx={{
          fontSize: "1.25rem",
          marginBottom: 2,
          fontWeight: 600,
        }}
      >
        {t("search_input_label")}
      </Typography>

      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          marginTop: 1,
        }}
      >
        <LocationAutocomplete
          control={control}
          name="location"
          id={searchInputId}
          variant="outlined"
          placeholder={t("search_input_placeholder")}
          defaultValue={""}
          onChange={(value) => {
            if (value && value.bbox && value.simplifiedName) {
              const newBbox: Coordinates = [
                value.bbox[2],
                value.bbox[3],
                value.bbox[0],
                value.bbox[1],
              ];
              const searchRouteWithSearchQuery = routeToSearch({
                location: value.simplifiedName,
                hostingStatus: [
                  HostingStatus.HOSTING_STATUS_CAN_HOST,
                  HostingStatus.HOSTING_STATUS_MAYBE,
                ],
                bbox: newBbox,
                showEmptyProfile: false,
              });

              // Use startTransition in WebView to allow autocomplete to complete before navigation
              if (isNativeEmbed) {
                startTransition(() => {
                  router.push(searchRouteWithSearchQuery);
                });
              } else {
                router.push(searchRouteWithSearchQuery);
              }
            }
          }}
          fieldError={errors.location?.message}
          disableRegions
          autocompleteContext="hero-search"
          sx={{
            "& .MuiOutlinedInput-root": {
              maxHeight: "40px",
            },
            width: "100%",
            maxWidth: "650px",
          }}
        />
      </Box>
    </StyledSearchBoxContainer>
  );
}
