import { Link as MuiLink, LinkProps } from "@mui/material";
import Link from "next/link";
import { forwardRef } from "react";

const StyledLink = forwardRef<HTMLAnchorElement, { href: string } & LinkProps>(
  ({ href, ...props }, ref) => (
    <Link href={href} passHref>
      <MuiLink ref={ref} {...props} underline={props.underline || "hover"} />
    </Link>
  )
);

StyledLink.displayName = "StyledLink";

export default StyledLink;
