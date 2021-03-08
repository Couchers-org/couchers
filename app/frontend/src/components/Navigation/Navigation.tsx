import {
  AppBar,
  Grid,
  Hidden,
  makeStyles,
  Toolbar,
  Typography,
} from "@material-ui/core";

import { useAuthContext } from "../../features/auth/AuthProvider";
import BugReport from "../../features/BugReport";
import SearchBox from "../../features/search/SearchBox";
import {
  connectionsRoute,
  logoutRoute,
  mapRoute,
  messagesRoute,
  profileRoute,
} from "../../routes";
import {
  CommunityIcon,
  CrossIcon,
  EmailIcon,
  LocationIcon,
  PeopleIcon,
  PersonIcon,
} from "../Icons";
import NavButton from "./NavButton";

const menu = [
  {
    icon: <CommunityIcon fontSize="inherit" />,
    name: "Dashboard",
    route: "/",
  },
  {
    icon: <EmailIcon fontSize="inherit" />,
    name: "Messages",
    route: messagesRoute,
  },
  {
    icon: <LocationIcon fontSize="inherit" />,
    name: "Map",
    route: mapRoute,
  },
  {
    icon: <PeopleIcon fontSize="inherit" />,
    name: "Profile",
    route: profileRoute,
  },
  {
    icon: <PersonIcon fontSize="inherit" />,
    name: "Connections",
    route: connectionsRoute,
  },
];

const useStyles = makeStyles((theme) => ({
  appBar: {
    [theme.breakpoints.up("md")]: {
      bottom: "auto",
      top: 0,
    },
    bottom: 0,
    top: "auto",
  },
  flex: {
    [theme.breakpoints.up("md")]: {
      flex: 0,
      justifyContent: "flex-start",
      paddingLeft: theme.spacing(3),
      paddingRight: theme.spacing(3),
      width: "auto",
    },
    flex: 1,
    justifyContent: "space-evenly",
    padding: 0,
  },
  gutters: {
    [theme.breakpoints.up("md")]: {
      paddingLeft: theme.spacing(3),
      paddingRight: theme.spacing(3),
    },
    paddingLeft: 0,
    paddingRight: 0,
  },
  search: {
    [theme.breakpoints.down("sm")]: {
      marginInlineEnd: theme.spacing(1),
    },
    alignItems: "center",
    display: "flex",
    flexGrow: 3,
    justifyContent: "flex-end",
  },
  title: {
    fontWeight: "bold",
  },
}));

export default function Navigation() {
  const classes = useStyles();

  const authenticated = useAuthContext().authState.authenticated;

  if (!authenticated) {
    return null;
  }
  return (
    <AppBar
      position="fixed"
      classes={{
        root: classes.appBar,
      }}
      color="inherit"
    >
      <Toolbar
        classes={{
          gutters: classes.gutters,
        }}
      >
        <Hidden smDown>
          <Typography variant="h5" className={classes.title}>
            Couchers
          </Typography>
        </Hidden>
        <Grid
          container
          wrap="nowrap"
          classes={{
            root: classes.flex,
          }}
        >
          {menu.map((item) => (
            <NavButton
              route={item.route}
              label={item.name}
              key={`${item.name}-nav-button`}
            >
              {item.icon}
            </NavButton>
          ))}
          <Hidden smDown>
            <NavButton route={logoutRoute} label="Log out">
              <CrossIcon fontSize="inherit" />
            </NavButton>
          </Hidden>
        </Grid>
        <div className={classes.search}>
          <BugReport />
          <Hidden smDown>
            <SearchBox />
          </Hidden>
        </div>
      </Toolbar>
    </AppBar>
  );
}
