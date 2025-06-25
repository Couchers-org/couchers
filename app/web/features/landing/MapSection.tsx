import { Typography } from "@mui/material";
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

  return (
    <>
      <Typography
        variant="h2"
        sx={{
          marginBottom: 4,
          textAlign: "center",
        }}
      >
        {t("map_section_title")}
      </Typography>
      <StaticMap />
    </>
  );
};

export default MapSection;
