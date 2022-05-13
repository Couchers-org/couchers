import { Typography } from "@material-ui/core";
import LocationAutocomplete from "features/search/LocationAutocomplete";
import { useRouter } from "next/router";
import { useForm } from "react-hook-form";
import { searchRoute } from "routes";
import makeStyles from "utils/makeStyles";

const useStyles = makeStyles((theme) => ({
  searchBoxContainer: {
    padding: theme.spacing(4, 2, 6, 2),
    borderRadius: theme.shape.borderRadius,
    backgroundColor: theme.palette.background.paper,
  },
}));

export default function CoverBlockSearch() {
  const classes = useStyles();
  const router = useRouter();
  const searchInputId = "cover-block-search-input"; // @todo: replace with React 18's useId

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
        Where are you going?
      </Typography>

      <LocationAutocomplete
        control={control}
        name="location"
        id={searchInputId}
        variant="outlined"
        placeholder="Search a location"
        defaultValue={""}
        onChange={
          (/* value: "" | GeocodeResult */) => {
            const searchQuery = ""; // @todo: get URL with search query here
            router.push(`${searchRoute}?${searchQuery}`);
          }
        }
        fieldError={errors.location?.message}
        disableRegions
      />
    </div>
  );
}
