import { Link as MuiLink, LinkProps } from "@material-ui/core";
import { forwardRef } from "react";
import { Link } from "react-router-dom";

const StyledLink = forwardRef<HTMLAnchorElement, { to: string } & LinkProps>(
  (props, ref) => <MuiLink component={Link} {...props} ref={ref} />
);

export default StyledLink;
