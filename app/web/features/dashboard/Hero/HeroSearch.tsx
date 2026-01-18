import { Box, styled, Typography } from "@mui/material";
import LocationAutocomplete from "components/LocationAutocomplete";
import { Coordinates } from "features/search/utils/constants";
import { DASHBOARD } from "i18n/namespaces";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";
import { useIsNativeEmbed } from "platform/nativeLink";
import { HostingStatus } from "proto/api_pb";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { routeToSearch } from "routes";
import { GeocodeResult } from "utils/hooks";

import HeroLinks from "./HeroLinks";

const StyledSearchBoxContainer = styled("form")(({ theme }) => ({
  padding: theme.spacing(4, 2, 6, 2),
  borderRadius: "var(--mui-shape-borderRadius)",
  backgroundColor: "var(--mui-palette-background-paper)",
}));

export default function HeroSearch() {
  const { t } = useTranslation(DASHBOARD);
  const router = useRouter();
  const searchInputId = "hero-search-input";
  const isNativeEmbed = useIsNativeEmbed();
  const [, startTransition] = useTransition();

  const {
    control,
    formState: { errors },
  } = useForm<{ location: GeocodeResult }>({ mode: "onChange" });

  return (
    <StyledSearchBoxContainer>
      <HeroLinks />
      <Typography
        variant="h2"
        component="label"
        display="block"
        htmlFor={searchInputId}
        sx={{
          marginBottom: "16px",
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
