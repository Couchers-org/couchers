import { Link as MuiLink, LinkProps } from "@material-ui/core";
import Link from "next/link";
import { forwardRef } from "react";

const StyledLink = forwardRef<HTMLAnchorElement, { href: string } & LinkProps>(
  ({ href, ...props }, ref) => (
    <Link href={href} passHref>
      <MuiLink ref={ref} {...props} />
    </Link>
  )
);

StyledLink.displayName = "StyledLink";

export default StyledLink;
