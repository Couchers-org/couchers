import { makeStyles } from "@material-ui/core";
import { LngLat, Map as MaplibreMap } from "maplibre-gl";
import { useHistory, useLocation } from "react-router-dom";

import Map from "../../components/Map";
import PageTitle from "../../components/PageTitle";
import { routeToUser } from "../../routes";
import { addClusteredUsersToMap } from "./clusteredUsers";
import { MAP_PAGE } from "./constants";

const useStyles = makeStyles((theme) => ({
  container: {
    display: "flex",
    flexDirection: "column",
    height: `calc(100vh - ${theme.shape.navPaddingMobile})`,
    paddingBlockEnd: theme.spacing(2),
    [theme.breakpoints.up("md")]: {
      height: `calc(100vh - ${theme.shape.navPaddingDesktop})`,
    },
  },
  root: {
    border: "1px solid black",
  },
}));

export default function MapPage() {
  const history = useHistory();

  const location = useLocation();

  const classes = useStyles();

/*   Disabling for soft beta:
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
  }; */

  const handleClick = (ev: any) => {
    const username = ev.features[0].properties.username;
    history.push(routeToUser(username), location.state);
  };

  const initializeMap = (map: MaplibreMap) => {
    map.on("load", () => {
      // addCommunitiesToMap(map);
      // addPlacesToMap(map, handlePlaceClick);
      // addGuidesToMap(map, handleGuideClick);
      addClusteredUsersToMap(map, handleClick);
    });
  };

  return (
    <div className={classes.container}>
      <PageTitle>{MAP_PAGE}</PageTitle>
      <Map
        initialZoom={1}
        initialCenter={new LngLat(0, 0)}
        grow
        postMapInitialize={initializeMap}
        className={classes.root}
      />
    </div>
  );
}
