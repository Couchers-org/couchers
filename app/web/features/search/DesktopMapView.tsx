import { styled } from "@mui/material";
import LocationAutocompleteOutlined from "components/LocationAutocomplete/LocationAutocompleteOutlined";
import ResizeableDrawer from "components/ResizeableDrawer";
import { useTranslation } from "i18n";
import { GLOBAL, SEARCH } from "i18n/namespaces";

const StyledMapContainer = styled("div")(({ theme }) => ({}) => ({
  display: "flex",
  alignContent: "stretch",
  flexDirection: "column-reverse",
  position: "fixed",
  top: theme.shape.navPaddingXs,
  left: 0,
  right: 0,
  bottom: 0,
  [theme.breakpoints.up("sm")]: {
    top: theme.shape.navPaddingSmUp,
  },
  [theme.breakpoints.up("md")]: {
    flexDirection: "row",
  },
  zIndex: 100,
}));

const CenteredContainer = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  height: "100%",
  width: "100%",
}));

const DesktopMapView = () => {
  const { t } = useTranslation([GLOBAL, SEARCH]);

  const handleChange = (value: string) => {};

  return (
    <StyledMapContainer>
      <ResizeableDrawer>
        <CenteredContainer>
          <LocationAutocompleteOutlined
            fieldError=""
            fullWidth={false}
            placeholder={t("search:form.location_field_label")}
            name="location"
            onChange={handleChange}
          />
        </CenteredContainer>
      </ResizeableDrawer>
    </StyledMapContainer>
  );
};

export default DesktopMapView;
