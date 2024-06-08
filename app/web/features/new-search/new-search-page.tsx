import useRouteWithSearchFilters from "features/search/useRouteWithSearchFilters";
import maplibregl, { EventData, LngLat, Map as MaplibreMap } from "maplibre-gl";
import { Collapse, Hidden, makeStyles, useTheme } from "@material-ui/core";
import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { addClusteredUsersToMap, layers } from "../search/users";
import { GLOBAL, SEARCH } from "i18n/namespaces";
import NewSearchList from "./new-search-list";
import NewSearchBox from "./new-search-box";
import HtmlMeta from "components/HtmlMeta";
import { usePrevious } from "utils/hooks";
import { useTranslation } from "i18n";
import { searchRoute } from "routes";
import { User } from "proto/api_pb";
import Map from "components/Map";
import { Point } from "geojson";
import NewMapWrapper from "./new-map-wrapper";

import { mapContext } from "./new-search-page-controller";

const useStyles = makeStyles((theme) => ({
  container: {
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
  },
  mapContainer: {
    flexGrow: 1,
    position: "relative",
  },
  mobileCollapse: {
    flexShrink: 0,
    overflowY: "hidden",
  },
  searchMobile: {
    position: "absolute",
    top: theme.spacing(1.5),
    left: "auto",
    right: 52,
    display: "flex",
    "& .MuiInputBase-root": {
      backgroundColor: "rgba(255, 255, 255, 0.8)",
    },
  },
}));

export default function NewSearchPage() {
  const { t } = useTranslation([GLOBAL, SEARCH]);
  const classes = useStyles();
  const theme = useTheme();

  const map = useRef<MaplibreMap>();
  const [selectedResult, setSelectedResult] = useState<Pick<User.AsObject, "username" | "userId" | "lng" | "lat"> | undefined>(undefined);

  const previousResult = usePrevious(selectedResult);

  const [areClustersLoaded, setAreClustersLoaded] = useState(false);

  const showResults = useRef(false);

  // const searchFilters = useRouteWithSearchFilters(searchRoute);

  // const updateMapBoundingBox = alert("updated map bounding box");

  /*
  useEffect(() => {
    if (showResults.current !== searchFilters.any) {
      showResults.current = searchFilters.any;
      setTimeout(() => {
        map.current?.resize();
      }, theme.transitions.duration.standard);
    }
  }, [searchFilters.any, selectedResult, theme.transitions.duration.standard]);
  */

  const flyToUser = () => { alert("pending to implement :)") };

  return (
    <>
      <HtmlMeta title={t("global:nav.map_search")} />
      <div className={classes.container}>
        <Hidden smDown>
          <NewSearchList /> {/* lista con resultados */}
        </Hidden>
        <Hidden mdUp>
          <Collapse
            in={true}
            timeout={theme.transitions.duration.standard}
            className={classes.mobileCollapse}
          >
            <NewSearchList /> {/* lista con resultados (mobil) */}
          </Collapse>
          <NewSearchBox />
        </Hidden>
        <div className={classes.mapContainer}>
          <NewMapWrapper />
        </div>
      </div>
    </>
  );
}
