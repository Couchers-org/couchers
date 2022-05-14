import { Typography } from "@material-ui/core";
import LocationAutocomplete from "components/LocationAutocomplete";
import { DASHBOARD } from "i18n/namespaces";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";
import { useForm } from "react-hook-form";
import { routeToSearch } from "routes";
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
  const searchInputId = "hero-search-input"; // @todo: replace with React 18's useId

  const { control, errors } = useForm({ mode: "onChange" });

  return (
    <div className={classes.searchBoxContainer}>
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
            const searchRouteWithSearchQuery = routeToSearch({
              location: value.simplifiedName,
              lat: value.location.lat,
              lng: value.location.lng,
            });
            router.push(searchRouteWithSearchQuery);
          }
        }}
        fieldError={errors.location?.message}
        disableRegions
      />
    </div>
  );
}
