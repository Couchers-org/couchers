import { Typography } from "@mui/material";
import LocationAutocomplete from "components/LocationAutocomplete";
import { Coordinates } from "features/search/utils/constants";
import { DASHBOARD } from "i18n/namespaces";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";
import { HostingStatus } from "proto/api_pb";
import { useForm } from "react-hook-form";
import { routeToSearch } from "routes";
import { GeocodeResult } from "utils/hooks";
import makeStyles from "utils/makeStyles";

const useStyles = makeStyles((theme) => ({
  searchBoxContainer: {
    padding: theme.spacing(4, 2, 6, 2),
    borderRadius: theme.shape.borderRadius,
    backgroundColor: theme.palette.background.paper,
  },
}));

export default function HeroSearch() {
  const { t } = useTranslation(DASHBOARD);
  const classes = useStyles();
  const router = useRouter();
  const searchInputId = "hero-search-input";

  const {
    control,

    formState: { errors },
  } = useForm<{ location: GeocodeResult }>({ mode: "onChange" });

  return (
    <form className={classes.searchBoxContainer}>
      <Typography
        variant="h2"
        component="label"
        display="block"
        htmlFor={searchInputId}
        paragraph
      >
        {t("search_input_label")}
      </Typography>

      <LocationAutocomplete
        control={control}
        name="location"
        id={searchInputId}
        variant="outlined"
        placeholder={t("search_input_placeholder")}
        defaultValue={""}
        onChange={(value) => {
          if (value !== "") {
            const newBbox: Coordinates = [
              value.bbox[2],
              value.bbox[3],
              value.bbox[0],
              value.bbox[1],
            ];
            const searchRouteWithSearchQuery = routeToSearch({
              location: value.simplifiedName,
              hostingStatusOptions: [
                HostingStatus.HOSTING_STATUS_CAN_HOST,
                HostingStatus.HOSTING_STATUS_MAYBE,
              ],
              bbox: newBbox,
            });
            router.push(searchRouteWithSearchQuery);
          }
        }}
        fieldError={errors.location?.message}
        disableRegions
      />
    </form>
  );
}
