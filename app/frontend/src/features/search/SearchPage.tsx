import { makeStyles } from "@material-ui/core";
import Alert from "components/Alert";
import CircularProgress from "components/CircularProgress";
import TextBody from "components/TextBody";
import addCommunitiesToMap from "features/map/communities";
import addGuidesToMap from "features/map/guides";
import addPlacesToMap from "features/map/places";
import { addUsersToMap } from "features/map/users";
import { SearchQuery } from "features/search/constants";
import SearchResult from "features/search/SearchResult";
import { LngLat, Map as MaplibreMap } from "maplibre-gl";
import { User } from "pb/api_pb";
import React, { useEffect, useState } from "react";
import { useHistory, useLocation, useParams } from "react-router-dom";
import { routeToGuide, routeToPlace, routeToUser } from "routes";
import { service } from "service";

import Map from "../../components/Map";

const useStyles = makeStyles((theme) => ({
  container: {
    display: "flex",
    flexDirection: "column",
    height: `calc(100vh - ${theme.shape.navPaddingMobile})`,
    paddingBlockEnd: theme.spacing(2),
    position: "relative",
    [theme.breakpoints.up("md")]: {
      height: `calc(100vh - ${theme.shape.navPaddingDesktop})`,
    },
  },
  map: {
    border: "1px solid black",
  },
  mapResults: {
    alignItems: "flex-end",
    backgroundColor: theme.palette.common.white,
    borderRadius: "12px",
    boxShadow: "0px 0px 5px 1px rgba(0, 0, 0, 0.2)",
    bottom: "0",
    display: "flex",
    flexDirection: "row",
    left: "0",
    overflowX: "scroll",
    padding: theme.spacing(3, 3),
    position: "absolute",
    width: "100%",
    [theme.breakpoints.up("md")]: {
      alignItems: "flex-start",
      bottom: "auto",
      flexDirection: "column",
      height: `calc(100vh - ${theme.shape.navPaddingDesktop})`,
      paddingTop: theme.shape.navPaddingDesktop,
      overflowY: "scroll",
      top: 0,
      width: "auto",
    },
  },
}));

export default function SearchPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState([] as User.AsObject[]);

  const { query } = useParams<SearchQuery>();

  const classes = useStyles();
  const history = useHistory();
  const location = useLocation();

  useEffect(() => {
    if (!query) return;
    (async () => {
      setLoading(true);
      try {
        setResults(await service.search.search(query));
      } catch (e) {
        setError(e.message);
      }
      setLoading(false);
    })();
  }, [query]);

  const handlePlaceClick = (ev: any) => {
    const properties = ev.features[0].properties as {
      id: number;
      slug: string;
    };
    history.push(routeToPlace(properties.id, properties.slug), location.state);
  };

  const handleGuideClick = (ev: any) => {
    const properties = ev.features[0].properties as {
      id: number;
      slug: string;
    };
    history.push(routeToGuide(properties.id, properties.slug), location.state);
  };

  const handleClick = (ev: any) => {
    const username = ev.features[0].properties.username;
    history.push(routeToUser(username), location.state);
  };

  const initializeMap = (map: MaplibreMap) => {
    map.on("load", () => {
      if (process.env.REACT_APP_IS_COMMUNITIES_ENABLED === "true") {
        addCommunitiesToMap(map);
        addPlacesToMap(map, handlePlaceClick);
        addGuidesToMap(map, handleGuideClick);
      }
      addUsersToMap(map, handleClick);

      const resultIds = results.map((result) => {
        return result.userId;
      });

      map.setFilter("users", ["in", ["get", "id"], ["literal", resultIds]]);
    });
  };

  return (
    <>
      {error && <Alert severity="error">{error}</Alert>}
      {loading ? (
        <CircularProgress />
      ) : results.length ? (
        <div className={classes.container}>
          <Map
            className={classes.map}
            grow
            initialCenter={new LngLat(0, 0)}
            initialZoom={1}
            postMapInitialize={initializeMap}
          />
          <div className={classes.mapResults}>
            {results.map((user) => (
              <SearchResult key={user.userId} user={user} />
            ))}
          </div>
        </div>
      ) : (
        <TextBody>No users found.</TextBody>
      )}
    </>
  );
}
