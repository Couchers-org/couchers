import {
  Diversity2Outlined,
  LoyaltyOutlined,
  VerifiedUserOutlined,
} from "@mui/icons-material";
import { Box, Grid, Typography } from "@mui/material";
import { useTranslation } from "i18n";
import { LANDING } from "i18n/namespaces";
import { theme } from "theme";

const WhyCouchersSection = () => {
  const { t } = useTranslation([LANDING]);

  return (
    <>
      <Typography
        sx={{
          fontSize: "4rem",
          fontWeight: "bold",

          [theme.breakpoints.down("md")]: { fontSize: "2rem" },
        }}
      >
        {t("why_couchers_title")}
      </Typography>
      <Grid
        container
        gap={2}
        sx={{
          padding: theme.spacing(3, 0),
          width: "100%",
          flexWrap: { xs: "wrap", md: "nowrap" },
        }}
      >
        <Grid
          size={{ xs: 12, md: 4 }}
          display="flex"
          sx={{
            backgroundColor: "var(--mui-palette-grey-50)",
            padding: 3,
            borderRadius: theme.shape.borderRadius,
            flex: { md: 1 },
            minWidth: 0,
            marginLeft: { xs: 0, md: 2 },
          }}
        >
          <Box display="flex" flexDirection="column" width="100%">
            <Diversity2Outlined
              color="primary"
              sx={{ fontSize: "35px", marginBottom: 1 }}
            />
            <Typography
              gutterBottom
              sx={{ fontSize: "1.4rem", fontWeight: "bold" }}
            >
              {t("community_first")}
            </Typography>
            <Typography sx={{ marginTop: 1 }}>
              {t("community_first_description")}
            </Typography>
          </Box>
        </Grid>
        <Grid
          size={{ xs: 12, md: 4 }}
          display="flex"
          sx={{
            backgroundColor: "var(--mui-palette-grey-50)",
            padding: 3,
            borderRadius: theme.shape.borderRadius,
            flex: { md: 1 },
            minWidth: 0,
          }}
        >
          <Box display="flex" flexDirection="column" width="100%">
            <VerifiedUserOutlined
              color="primary"
              sx={{ fontSize: "35px", marginBottom: 1 }}
            />
            <Typography
              gutterBottom
              sx={{ fontSize: "1.4rem", fontWeight: "bold" }}
            >
              {t("safer_stronger")}
            </Typography>
            <Typography sx={{ marginTop: 1 }}>
              {t("safer_stronger_description")}
            </Typography>
          </Box>
        </Grid>
        <Grid
          size={{ xs: 12, md: 4 }}
          display="flex"
          sx={{
            backgroundColor: "var(--mui-palette-grey-50)",
            padding: 3,
            borderRadius: theme.shape.borderRadius,
            flex: { md: 1 },
            minWidth: 0,
            marginRight: { xs: 0, md: 2 },
          }}
        >
          <Box display="flex" flexDirection="column" width="100%">
            <LoyaltyOutlined
              color="primary"
              sx={{ fontSize: "35px", marginBottom: 1 }}
            />
            <Typography
              gutterBottom
              sx={{ fontSize: "1.4rem", fontWeight: "bold" }}
            >
              {t("built_by_travelers")}
            </Typography>
            <Typography sx={{ marginTop: 1 }}>
              {t("built_by_travelers_description")}
            </Typography>
          </Box>
        </Grid>
      </Grid>
    </>
  );
};

export default WhyCouchersSection;
