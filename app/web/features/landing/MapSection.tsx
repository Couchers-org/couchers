import { Typography, useTheme } from "@mui/material";
import CenteredSpinner from "components/CenteredSpinner/CenteredSpinner";
import { useTranslation } from "i18n";
import { LANDING } from "i18n/namespaces";
import dynamic from "next/dynamic";

const StaticMap = dynamic(() => import("components/StaticMap"), {
  loading: () => <CenteredSpinner />,
  ssr: false,
});

const MapSection = () => {
  const { t } = useTranslation([LANDING]);
  const theme = useTheme();

  return (
    <>
      <Typography
        sx={{
          fontSize: "4rem",
          fontWeight: "bold",
          textAlign: "center",
          [theme.breakpoints.down("md")]: { fontSize: "2rem" },
        }}
      >
        {t("map_section_title")}
      </Typography>
      <StaticMap />
    </>
  );
};

export default MapSection;
