import {
  AppBar,
  Button,
  Grid,
  Hidden,
  Toolbar,
  Typography,
  makeStyles,
} from "@material-ui/core";
import React from "react";
import { Link, NavLink } from "react-router-dom";
import {
  profileRoute,
  messagesRoute,
  requestsRoute,
  logoutRoute,
} from "../../AppRoutes";
import { useTypedSelector } from "../../store";
import SearchBox from "../SearchBox";

const menu = [
  {
    name: "Dashboard",
    route: "/",
  },
  {
    name: "Messages",
    route: messagesRoute,
  },
  {
    name: "Requests",
    route: requestsRoute,
  },
  {
    name: "Profile",
    route: profileRoute,
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
  },
  title: {
    fontWeight: "bold",
  },
  gutters: {
    paddingLeft: 0,
    paddingRight: 0,
    [theme.breakpoints.up("md")]: {
      paddingLeft: "2rem",
      paddingRight: "2rem",
    },
  },
  label: {
    fontSize: "0.7rem",
  },
  flex: {
    flex: 1,
    padding: 0,
    justifyContent: "space-evenly",
    [theme.breakpoints.up("md")]: {
      width: "auto",
      flex: 0,
      padding: "0 3rem",
      justifyContent: "flex-start",
    },
  },
  item: {
    transition: theme.transitions.create(["color", "padding-top"], {
      duration: theme.transitions.duration.short,
    }),
    padding: "6px 12px 8px",
    minWidth: 80,
    maxWidth: 168,
    color: theme.palette.text.secondary,
    flex: "1",
  },
  selected: {
    color: theme.palette.primary.main,
  },
}));

export default function Navigation() {
  const classes = useStyles();

  const authToken = useTypedSelector((state) => state.auth.authToken);

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
            <Button
              activeClassName={classes.selected}
              classes={{
                root: classes.item,
                label: classes.label,
              }}
              component={NavLink}
              exact
              to={item.route}
              key={item.name}
            >
              {item.name}
            </Button>
          ))}
          <Hidden smDown>
            {authToken && (
              <Button
                classes={{
                  root: classes.item,
                  label: classes.label,
                }}
                component={Link}
                to={logoutRoute}
              >
                Logout
              </Button>
            )}
          </Hidden>
        </Grid>
        <Hidden smDown>
          <div className={classes.search}>
            <SearchBox />
          </div>
        </Hidden>
      </Toolbar>
    </AppBar>
  );
}
