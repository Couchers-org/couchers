import { makeStyles as muiMakeStyles } from "@material-ui/core";
import { Theme as DefaultTheme } from "@material-ui/core/styles/createMuiTheme";
import { Styles } from "@material-ui/styles/withStyles";

export default function makeStyles<
  Theme = DefaultTheme,
  Props extends object = {},
  ClassKey extends string = string
>(styles: Styles<Theme, Props, ClassKey>) {
  return muiMakeStyles(styles, { index: 1 });
}
