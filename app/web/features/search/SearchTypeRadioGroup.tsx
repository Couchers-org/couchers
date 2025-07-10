import {
  FormControl,
  FormControlLabel,
  Radio,
  RadioGroup,
  Typography,
} from "@mui/material";
import { useTranslation } from "i18n";
import { GLOBAL, SEARCH } from "i18n/namespaces";
import { ChangeEvent } from "react";

import { MapSearchTypes } from "./utils/constants";

const SearchTypeRadioGroup = ({
  onChange,
  searchType,
}: {
  onChange: (searchType: MapSearchTypes) => void;
  searchType: MapSearchTypes;
}) => {
  const { t } = useTranslation([GLOBAL, SEARCH]);

  const handleChange = (
    event: ChangeEvent<HTMLInputElement>,
    value: string,
  ) => {
    onChange(value as MapSearchTypes);
  };

  return (
    <FormControl variant="standard" component="fieldset">
      <RadioGroup row onChange={handleChange} value={searchType}>
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
  );
};

export default SearchTypeRadioGroup;
