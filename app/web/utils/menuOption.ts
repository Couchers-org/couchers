import { SvgIconComponent } from "@mui/icons-material";

// @TODO(FB): Find suitable location
export interface MenuOption {
  icon: SvgIconComponent;
  title: string;
  onClick: () => unknown;
}
