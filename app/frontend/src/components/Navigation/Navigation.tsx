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
import SearchBox from "../SearchBox";
import NavButton from "./NavButton";

const menu = [
  {
    name: "Dashboard",
    route: "/",
    icon: <CommunityIcon fontSize="inherit" />,
  },
  {
    name: "Messages",
    route: messagesRoute,
    icon: <EmailIcon fontSize="inherit" />,
  },
  {
    name: "Map",
    route: mapRoute,
    icon: <LocationIcon fontSize="inherit" />,
  },
  {
    name: "Profile",
    route: profileRoute,
    icon: <PeopleIcon fontSize="inherit" />,
  },
  {
    name: "Connections",
    route: connectionsRoute,
    icon: <PersonIcon fontSize="inherit" />,
  },
];

const useStyles = makeStyles((theme) => ({
  appBar: {
    bottom: 0,
    top: "auto",
    [theme.breakpoints.up("md")]: {
      top: 0,
      bottom: "auto",
    },
  },
  search: {
    flexGrow: 3,
    display: "flex",
    justifyContent: "flex-end",
    alignItems: "center",
    [theme.breakpoints.down("sm")]: {
      marginInlineEnd: theme.spacing(1),
    },
  },
  title: {
    fontWeight: "bold",
  },
  gutters: {
    paddingLeft: 0,
    paddingRight: 0,
    [theme.breakpoints.up("md")]: {
      paddingRight: theme.spacing(3),
      paddingLeft: theme.spacing(3),
    },
  },
  flex: {
    flex: 1,
    padding: 0,
    justifyContent: "space-evenly",
    [theme.breakpoints.up("md")]: {
      width: "auto",
      flex: 0,
      paddingRight: theme.spacing(3),
      paddingLeft: theme.spacing(3),
      justifyContent: "flex-start",
    },
  },
}));

export default function Navigation() {
  const classes = useStyles();

  const authenticated = useAuthContext().authState.authenticated;

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
            {authenticated && (
              <NavButton route={logoutRoute} label="Log out">
                <CrossIcon fontSize="inherit" />
              </NavButton>
            )}
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
