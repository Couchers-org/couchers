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
  import classNames from "classnames";
  import Button from "components/Button";
  import { CrossIcon } from "components/Icons";
  import LocationAutocomplete from "components/LocationAutocomplete";
  import TextField from "components/TextField";
  import FilterDialog from "features/search/FilterDialog";
  import { useTranslation } from "i18n";
  import { GLOBAL, SEARCH } from "i18n/namespaces";
  import { LngLat } from "maplibre-gl";
  import { Controller, useForm } from "react-hook-form";
  import { useQueryClient } from "react-query";
  import makeStyles from "utils/makeStyles";
  import { useState } from "react";
  import NewFilterModal from "./new-filter-modal";

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
    const { t } = useTranslation([GLOBAL, SEARCH]);
    const classes = useStyles();
    const [isFiltersOpen, setIsFiltersOpen] = useState(false);
    const [searchType, setSearchType] = useState<"location" | "keyword">(() => "location");
    const theme = useTheme();
    const isSmDown = useMediaQuery(theme.breakpoints.down("sm"));
    const queryClient = useQueryClient();
  
    const { control, setValue, errors } = useForm({ mode: "onChange" });
  
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
            onChange={() => {alert("cliiiick")}}
            fieldError={errors.location?.message}
            disableRegions
          />
        ) : (
          <Controller
            control={control}
            name="query"
            defaultValue={""}
            render={({ value, onChange }) => (
              <TextField
                fullWidth
                id="query"
                value={value}
                label={t("search:form.keywords.field_label")}
                variant="standard"
                helperText=" "
                onChange={(event) => {
                    alert('cliick');
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
          />
        )}
        <div className={classes.flexRow}>
          <FormControl component="fieldset">
            <RadioGroup
              row
              onChange={(e, value) =>
                setSearchType(value as "location" | "keyword")
              }
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
  