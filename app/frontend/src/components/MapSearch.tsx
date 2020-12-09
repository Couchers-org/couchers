import { Theme } from "@material-ui/core";
import withStyles, { WithStyles } from "@material-ui/core/styles/withStyles";
import React from "react";
import { BaseControl, BaseControlProps } from "react-map-gl";
import Autocomplete, { AutocompleteProps } from "./Autocomplete";

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

interface MapSearchProps<T>
  extends BaseControlProps,
    //T false false true == T Multiple DisableClearable Freesolo
    Omit<AutocompleteProps<T, false, false, true>, "classes">,
    WithStyles<typeof styles> {}

class MapSearch<T> extends BaseControl<MapSearchProps<T>, HTMLDivElement> {
  //value = "";
  _render() {
    return (
      <div ref={this._containerRef}>
        <Autocomplete
          {...this.props}
          options={this.props.options}
          freeSolo={true}
          className={this.props.classes.root}
        />
      </div>
    );
  }
}

type MapSearchWithGenericType = <T>(
  props: Omit<MapSearchProps<T>, "classes">
) => JSX.Element;
export default withStyles(styles)(MapSearch) as MapSearchWithGenericType;
