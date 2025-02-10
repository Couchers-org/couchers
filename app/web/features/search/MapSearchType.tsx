import {
  FormControl,
  FormControlLabel,
  Radio,
  RadioGroup,
  styled,
  Typography,
} from "@mui/material";
import { FilterKey, FilterValue } from "./SearchPage";
import { useTranslation } from "i18n";
import { GLOBAL, SEARCH } from "i18n/namespaces";
import { ChangeEvent, SyntheticEvent, useState } from "react";
import { set } from "react-hook-form";

type MapSearchTypes = "location" | "keyword";

const CenteredContainer = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  height: "100%",
  width: "100%",
}));

const MapSearchType = ({
  onChange,
}: {
  onChange: (key: FilterKey, value: FilterValue) => void;
}) => {
  const { t } = useTranslation([GLOBAL, SEARCH]);

  const [searchType, setSearchType] = useState<MapSearchTypes>("location");

  const handleChange = (
    event: ChangeEvent<HTMLInputElement>,
    value: string,
  ) => {
    if (value === "location") {
      setSearchType("location");
      onChange("location", value);
    }

    if (value === "keyword") {
      setSearchType("keyword");
      onChange("query", value);
    }
  };

  return (
    <CenteredContainer>
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
    </CenteredContainer>
  );
};

export default MapSearchType;
