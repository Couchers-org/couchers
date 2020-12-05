import React from "react";
import Map, { MapProps } from "./Map";
import classNames from "classnames";
import { Box, makeStyles } from "@material-ui/core";
import TextField from "./TextField";

const useStyles = makeStyles((theme) => ({
  root: {
    position: "relative",
    height: 200,
    width: 400,
  },
  grow: {
    height: 0,
    width: "100%",
    paddingTop: "100%",
  },
  map: {
    position: "absolute",
    top: 0,
    width: "100%",
    height: "100%",
  },
  search: {
    position: "absolute",
    top: theme.spacing(2),
    left: `calc(30px + ${theme.spacing(4)}px)`,
    ///TODO: remove px due to upstream rem spacing
    width: `calc(100% - ${theme.spacing(6)}px - 30px)`,
    zIndex: 3000,
    backgroundColor: "#fff",
  },
}));

export interface SearchableMapProps extends MapProps {}

export default function SearchableMap({
  children,
  className,
  grow,
  ...otherProps
}: SearchableMapProps) {
  const classes = useStyles();

  return (
    <Box
      className={classNames(classes.root, { [classes.grow]: grow }, className)}
    >
      <Map className={classes.map} {...otherProps}>
        {children}
      </Map>
      <TextField className={classes.search} fullWidth variant="outlined" />
    </Box>
  );
}
