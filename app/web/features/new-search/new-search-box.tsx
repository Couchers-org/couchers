import {
  FormControl,
  FormControlLabel,
  IconButton,
  InputAdornment,
  Radio,
  RadioGroup,
  Typography,
  useMediaQuery,
  useTheme,
} from "@material-ui/core";
import LocationAutocomplete from "components/LocationAutocomplete";
import { GLOBAL, SEARCH } from "i18n/namespaces";
import NewFilterModal from "./new-filter-modal";
import { mapContext } from "./new-search-page";
import { useContext, useState } from "react";
import TextField from "components/TextField";
import { CrossIcon } from "components/Icons";
import makeStyles from "utils/makeStyles";
import { useForm } from "react-hook-form";
import Button from "components/Button";
import { useTranslation } from "i18n";
import classNames from "classnames";

const useStyles = makeStyles((theme) => ({
  filterDialogButtonDesktop: {
    marginInlineStart: "auto",
  },
  mobileHide: {
    [theme.breakpoints.down("sm")]: {
      display: "none",
    },
  },
  flexRow: {
    display: "flex",
    width: "100%",
  },
}));

export default function NewSearchBox() {
  const className = ""; // initially were injected by props
  const worldWideViewPort = [-61, -57, 72, 73];
  const { t } = useTranslation([GLOBAL, SEARCH]);
  const classes = useStyles();
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const { searchType, setSearchType, locationResult, setLocationResult, setQueryName, queryName } = useContext(mapContext) //useState<"location" | "keyword">(() => "location");
  const theme = useTheme();
  const isSmDown = useMediaQuery(theme.breakpoints.down("sm"));

  // const queryClient = useQueryClient();
  const { control, setValue, errors, register, handleSubmit } = useForm({ mode: "onChange" });

  const filterDialog = (
    <NewFilterModal
      isOpen={isFiltersOpen}
      onClose={() => setIsFiltersOpen(false)}
    />
  );

  if (isSmDown) {
    return (
      <>
        <Button
          onClick={() => setIsFiltersOpen(true)}
          className={className}
          variant="contained"
          size="medium"
        >
          {t("search:filter_dialog.mobile_title")}
        </Button>

        {filterDialog}
      </>
    );
  }

  return (
    <>
      {searchType === "location" ? (
        <LocationAutocomplete
          control={control}
          name="location"
          defaultValue={""}
          label={t("search:form.location_field_label")}
          onChange={(e: any) => {
            if (e) {

              const firstElem = e["bbox"].shift() as number;
              const lastElem = e["bbox"].pop() as number;
              e["bbox"].push(firstElem);
              e["bbox"].unshift(lastElem);
             
              setLocationResult(e);
            }
          }}
          fieldError={errors.location?.message}
          disableRegions
        />
      ) : (
        <TextField
          fullWidth
          id="query"
          value={queryName}
          label={t("search:form.keywords.field_label")}
          variant="standard"
          helperText=" "
          onChange={(event) => {
            setQueryName(event.target.value);
            setLocationResult({...locationResult, location: undefined, bbox: worldWideViewPort});
          }}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  aria-label={t(
                    "search:form.keywords.clear_field_action_a11y_label"
                  )}
                  onClick={() => {
                    alert('click');
                  }}
                  size="small"
                >
                  <CrossIcon />
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
      )}
      <div className={classes.flexRow}>
        <FormControl component="fieldset">
          <RadioGroup
            row
            onChange={(e, value) => {
              setSearchType(value as "location" | "keyword");
              setLocationResult({...locationResult, bbox: worldWideViewPort, name: "", simplifiedName: "", location: undefined});
              setQueryName(undefined);
            }}
            value={searchType}
          >
            <FormControlLabel
              value="location"
              control={<Radio />}
              label={
                <Typography variant="body2">
                  {t("search:form.by_location_filter_label")}
                </Typography>
              }
            />
            <FormControlLabel
              value="keyword"
              control={<Radio />}
              label={
                <Typography variant="body2">
                  {t("search:form.by_keyword_filter_label")}
                </Typography>
              }
            />
          </RadioGroup>
        </FormControl>

        <Button
          onClick={() => setIsFiltersOpen(true)}
          className={classNames(className, classes.filterDialogButtonDesktop)}
          variant="outlined"
          size="small"
        >
          {t("search:filter_dialog.desktop_title")}
        </Button>

        {filterDialog}
      </div>
    </>
  );
}
