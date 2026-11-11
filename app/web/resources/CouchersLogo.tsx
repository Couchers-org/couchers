import { styled, SvgIcon } from "@mui/material";
import Link from "next/link";
import { useEffect, useState } from "react";
import { baseRoute, dashboardRoute } from "routes";

import { COUCHERS_LOGO_PATHS, COUCHERS_LOGO_VIEWBOX } from "./couchersLogoPaths";

const Logo = styled(SvgIcon)(({ theme }) => ({
  fill: "var(--mui-palette-secondary-main)",
  height: theme.typography.pxToRem(40),
  width: theme.typography.pxToRem(40),
  display: "flex",
  position: "relative",
}));

interface CouchersLogoProps {
  className?: string;
  isLoggedIn?: boolean;
}

export default function CouchersLogo({ className, isLoggedIn }: CouchersLogoProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // During SSR and before hydration, always use baseRoute to prevent mismatch
  const href = isMounted ? (isLoggedIn ? dashboardRoute : baseRoute) : baseRoute;

  return (
    <Link href={href}>
      <Logo className={className} xmlns="http://www.w3.org/2000/svg" viewBox={COUCHERS_LOGO_VIEWBOX}>
        <g>
          {COUCHERS_LOGO_PATHS.map((d) => (
            <path key={d} d={d} />
          ))}
        </g>
      </Logo>
    </Link>
  );
}
