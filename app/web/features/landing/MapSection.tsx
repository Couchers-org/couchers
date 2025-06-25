import { Typography, useMediaQuery } from "@mui/material";
import CenteredSpinner from "components/CenteredSpinner/CenteredSpinner";
import { useTranslation } from "i18n";
import { LANDING } from "i18n/namespaces";
import dynamic from "next/dynamic";
import { theme } from "theme";

const StaticMap = dynamic(() => import("components/StaticMap"), {
  loading: () => <CenteredSpinner />,
  ssr: false,
});

const MapSection = () => {
  const { t } = useTranslation([LANDING]);
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  return (
    <>
      <Typography
        variant="h2"
        sx={{
          fontSize: isMobile ? "2rem !important" : "2.5rem !important",
          marginBottom: 4,
        }}
      >
        {t("map_section_title")}
      </Typography>
      <StaticMap />
    </>
  );
};

export default MapSection;
