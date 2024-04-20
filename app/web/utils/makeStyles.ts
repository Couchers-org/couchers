import {
  makeStyles as muiMakeStyles,
  Theme as DefaultTheme,
} from "@material-ui/core";
import { Styles } from "@material-ui/styles/withStyles";

export default function makeStyles<
  Theme = DefaultTheme,
  Props extends Record<string, any> = {}, // eslint-disable-line
  ClassKey extends string = string
>(styles: Styles<Theme, Props, ClassKey>) {
  return muiMakeStyles(styles, { index: 1 });
}
