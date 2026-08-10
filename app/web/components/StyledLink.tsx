import MuiLink, { LinkProps as MuiLinkProps } from "@mui/material/Link";
import NextLink, { LinkProps as NextLinkProps } from "next/link";
import { forwardRef } from "react";

// Combine Next.js and MUI Link props
type StyledLinkProps = Omit<MuiLinkProps, "href"> & NextLinkProps & { href: string };

const StyledLink = forwardRef<HTMLAnchorElement, StyledLinkProps>(({ href, ...props }, ref) => (
  <MuiLink component={NextLink} ref={ref} href={href} underline={props.underline || "hover"} {...props} />
));

StyledLink.displayName = "StyledLink";

export default StyledLink;
