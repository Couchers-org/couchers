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

interface SearchBoxProps {
  searchType: string;
  setSearchType: Dispatch<SetStateAction<string>>;
  locationResult: any;
  setLocationResult: Dispatch<SetStateAction<any>>;
  setQueryName: Dispatch<SetStateAction<any>>;
  queryName: undefined | string;
  setIsFiltersOpen: Dispatch<SetStateAction<boolean>>;
}

export default function SearchBox({
  searchType,
  setSearchType,
  locationResult,
  setLocationResult,
  setQueryName,
  queryName,
  setIsFiltersOpen,
}: SearchBoxProps) {
  const worldWideViewPort = [-61, -57, 72, 73];

  const { t } = useTranslation([GLOBAL, SEARCH]);
  const classes = useStyles();
  // const theme = useTheme();
  // const isSmDown = useMediaQuery(theme.breakpoints.down("sm"));
  const className = ""; // initially were injected by props, check this later

  const { control, setValue, errors, register, handleSubmit } = useForm({
    mode: "onChange",
  });

  return (
    <>
      {searchType === "location" ? (
        <LocationAutocomplete
          control={control}
          name="location"
          defaultValue={locationResult.name}
          label={t("search:form.location_field_label")}
          onChange={(event) => {
            if (event) {
              setLocationResult(event);
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
          onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
            setQueryName(event.target.value);
            setLocationResult({
              ...locationResult,
              location: undefined,
              bbox: worldWideViewPort,
            });
          }}
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
                      bbox: worldWideViewPort,
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
        <FormControl component="fieldset">
          <RadioGroup
            row
            onChange={(event: React.ChangeEvent, value: string) => {
              setSearchType(value as "location" | "keyword");
              setLocationResult({
                ...locationResult,
                bbox: worldWideViewPort,
                name: "",
                simplifiedName: "",
                location: undefined,
              });
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
      </div>
    </>
  );
}
