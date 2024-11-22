import { Theme as DefaultTheme } from "@mui/material";
import muiMakeStyles from "@mui/styles/makeStyles";
import { Styles } from "@mui/styles/withStyles";

export default function makeStyles<
  Theme = DefaultTheme,
  Props extends Record<string, any> = {}, // eslint-disable-line
  ClassKey extends string = string
>(styles: Styles<Theme, Props, ClassKey>) {
  return muiMakeStyles(styles, { index: 1 });
}
