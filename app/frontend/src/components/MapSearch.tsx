import { Theme } from "@material-ui/core";
import withStyles, { WithStyles } from "@material-ui/core/styles/withStyles";
import React from "react";
import { BaseControl, BaseControlProps } from "react-map-gl";
import TextField from "./TextField";

const styles = (theme: Theme) => ({
  root: {
    backgroundColor: "gray",
    marginLeft: theme.spacing(2),
    marginRight: theme.spacing(2),
    top: theme.spacing(2),
    ///TODO: Remove px before merge
    width: `calc(100% - ${theme.spacing(4)}px)`,
  },
});

interface MapSearchProps extends BaseControlProps, WithStyles<typeof styles> {
  //onChange: (value: string) => void;
}

class MapSearch extends BaseControl<MapSearchProps, HTMLDivElement> {
  //value = "";
  _render() {
    return (
      <div ref={this._containerRef}>
        <TextField
          variant="outlined"
          fullWidth
          className={this.props.classes.root}
          //onChange={(event) => this.props.onChange(event.target.value)}
          //value={this.value}
        />
      </div>
    );
  }
}

export default withStyles(styles)(MapSearch);
