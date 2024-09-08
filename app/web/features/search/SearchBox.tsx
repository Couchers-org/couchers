import {
  FormControl,
  FormControlLabel,
  IconButton,
  InputAdornment,
  Radio,
  RadioGroup,
  Typography,
} from "@material-ui/core";
import LocationAutocomplete from "components/LocationAutocomplete";
import { GLOBAL, SEARCH } from "i18n/namespaces";
import { SetStateAction, Dispatch } from "react";
import TextField from "components/TextField";
import { CrossIcon } from "components/Icons";
import { GeocodeResult } from "utils/hooks";
import makeStyles from "utils/makeStyles";
import { useForm } from "react-hook-form";
import { useTranslation } from "i18n";

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
  justifyContent: {
    justifyContent: "space-around",
  },
}));

interface SearchBoxProps {
  searchType: string;
  setSearchType: Dispatch<SetStateAction<string>>;
  locationResult: any;
  setLocationResult: Dispatch<SetStateAction<any>>;
  setQueryName: Dispatch<SetStateAction<any>>;
  queryName: undefined | string;
}

export default function SearchBox({
  searchType,
  setSearchType,
  locationResult,
  setLocationResult,
  setQueryName,
  queryName,
}: SearchBoxProps) {
  const { t } = useTranslation([GLOBAL, SEARCH]);
  const classes = useStyles();

  const { control, setValue, errors, register, handleSubmit } = useForm({
    mode: "onChange",
  });

  function handleOnChangeAutocomplete(event: "" | GeocodeResult) {
    if (event) {
      setLocationResult(event);
    }
  }

  function handleOnChangeKeyword(event: React.ChangeEvent<HTMLInputElement>) {
    setQueryName(event.target.value);
    setLocationResult({
      ...locationResult,
      location: undefined,
    });
  }

  function handleOnChangeRadioButton(event: React.ChangeEvent, value: string) {
    setSearchType(value as "location" | "keyword");
    setLocationResult({
      ...locationResult,
      name: "",
      simplifiedName: "",
      location: undefined,
    });
    setQueryName(undefined);
  }

  return (
    <>
      {searchType === "location" ? (
        <LocationAutocomplete
          control={control}
          name="location"
          defaultValue={locationResult.name}
          label={t("search:form.location_field_label")}
          onChange={handleOnChangeAutocomplete}
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
          onChange={handleOnChangeKeyword}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  aria-label={t(
                    "search:form.keywords.clear_field_action_a11y_label"
                  )}
                  onClick={() => {
                    setQueryName("");
                    setLocationResult({
                      ...locationResult,
                      location: undefined,
                    });
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
        <FormControl className={classes.flexRow} component="fieldset">
          <RadioGroup
            className={classes.justifyContent}
            row
            onChange={handleOnChangeRadioButton}
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
      </div>
    </>
  );
}
