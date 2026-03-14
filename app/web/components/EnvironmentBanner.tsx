import { Chip, keyframes, styled } from "@mui/material";
import React, { useState } from "react";
import useIsScreenSmallerThan from "utils/useIsScreenSmallerThan";

// Define the keyframes animation
const attention = keyframes`
  from {
    opacity: 0.5;
  }
  to {
    opacity: 0.9;
  }
`;

const Banner = styled(Chip)(({ theme }) => ({
  animation: `${attention} 2s infinite alternate`,
  position: "fixed",
  bottom: theme.spacing(12),
  right: theme.spacing(1),
  zIndex: 5000,
  backgroundColor: theme.palette.error.main,
  color: theme.palette.common.white,
}));

export function EnvironmentBanner() {
  const isMobile = useIsScreenSmallerThan("MOBILE");
  const [isShown, setIsShown] = useState(
    process.env.NEXT_PUBLIC_COUCHERS_ENV !== "prod",
  );

  return isShown ? (
    <Banner
      label={`This is a preview build of the app.${
        !isMobile ? " It uses a separate database to the production app." : ""
      }`}
      onDelete={() => setIsShown(false)}
    />
  ) : null;
}
