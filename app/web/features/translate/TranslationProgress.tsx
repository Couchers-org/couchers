import TranslateIcon from "@mui/icons-material/Translate";
import {
  Box,
  Card,
  CardContent,
  Chip,
  Link,
  styled,
  Typography,
} from "@mui/material";
import { useWeblateStats } from "features/weblate/useWeblateStats";
import { useTranslation } from "i18n";
import { LANGUAGE_MAP } from "i18n/constants";
import { GLOBAL } from "i18n/namespaces";
import { translateJobURL } from "routes";

const ProgressBar = styled(Box)<{ percent: number }>(({ theme, percent }) => ({
  width: "100%",
  height: 8,
  backgroundColor: theme.palette.grey[200],
  borderRadius: 4,
  overflow: "hidden",
  position: "relative",
  "&::after": {
    content: '""',
    position: "absolute",
    top: 0,
    left: 0,
    height: "100%",
    width: `${percent}%`,
    backgroundColor:
      percent >= 80
        ? theme.palette.success.main
        : percent >= 20
          ? theme.palette.warning.main
          : theme.palette.error.main,
    transition: "width 0.3s ease-in-out",
  },
}));

const LanguageCard = styled(Card)<{ percent: number }>(
  ({ theme, percent }) => ({
    width: "100%",
    transition: "transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out",
    opacity: percent < 20 ? 0.5 : 1,
    marginBottom: theme.spacing(2),

    "&:hover": {
      transform: "translateY(-1px)",
      boxShadow: theme.shadows[2],
    },
  }),
);

const FlagImage = styled("img")<{ percent: number }>(({ percent }) => ({
  width: 32,
  height: 24,
  borderRadius: 4,
  filter: percent < 80 ? "grayscale(50%)" : "none",
  transition: "filter 0.2s ease-in-out",
}));

const getStatusColor = (percent: number): "success" | "warning" | "error" => {
  if (percent >= 80) return "success";
  if (percent >= 20) return "warning";
  return "error";
};

const getStatusText = (percent: number, t: (key: string) => string) => {
  if (percent >= 80)
    return t("global:language_preference.translation_progress.complete");
  if (percent >= 20)
    return t("global:language_preference.translation_progress.in_progress");
  return t("global:language_preference.translation_progress.early_stage");
};

const StyledCardContent = styled(CardContent)(({ theme }) => ({
  padding: theme.spacing(1.5),
  display: "flex",
  alignItems: "center",
  "&:last-child": {
    paddingBottom: theme.spacing(1.5),
  },
}));

export default function TranslationProgress() {
  const { data: languages, isLoading, error } = useWeblateStats();
  const { t } = useTranslation([GLOBAL]);

  if (isLoading) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          {t("global:language_preference.translation_progress.loading")}
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" color="error" gutterBottom>
          {t("global:language_preference.translation_progress.error_loading")}
        </Typography>
      </Box>
    );
  }

  if (!languages || languages.length === 0) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          {t("global:language_preference.translation_progress.no_data")}
        </Typography>
      </Box>
    );
  }

  // Filter and sort languages
  const availableLanguages = languages
    .filter((language) => LANGUAGE_MAP[language.code.replace("_", "-")])
    .sort((a, b) => b.translated_percent - a.translated_percent); // Sort by completion percentage

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ mb: 3, display: "flex", alignItems: "center", gap: 1 }}>
        <TranslateIcon sx={{ fontSize: 28, color: "primary.main" }} />
        <Typography variant="h1" fontWeight="bold">
          {t("global:language_preference.translation_progress.title")}
        </Typography>
      </Box>

      <Box sx={{ mb: 3 }}>
        <Typography sx={{ mb: 2 }}>
          {t("global:language_preference.translation_progress.description")}
        </Typography>
        <Link
          href={translateJobURL}
          target="_blank"
          rel="noreferrer noopener"
          underline="hover"
          sx={{ fontWeight: "bold" }}
        >
          {t("global:language_preference.translation_progress.help_translate")} →
        </Link>
      </Box>

      <Box sx={{ mb: 3, p: 2, bgcolor: "grey.50", borderRadius: 2 }}>
        <Typography variant="body2" color="text.secondary">
          {t("global:language_preference.translation_progress.info_text")}
        </Typography>
      </Box>

      {availableLanguages.map((language) => {
        const languageCode = language.code.replace("_", "-");
        const languageInfo = LANGUAGE_MAP[languageCode];
        const percent = language.translated_percent;

        if (!languageInfo) return null;

        return (
          <LanguageCard percent={percent} key={language.code}>
            <StyledCardContent>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                  width: "100%",
                }}
              >
                <FlagImage
                  src={`https://cdn.couchers.org/img/language-icons/${languageInfo.flagIconCode}.svg`}
                  alt={`${languageInfo.flagIconCode} flag`}
                  percent={percent}
                />
                <Typography variant="subtitle1" fontWeight="bold" noWrap>
                  {languageInfo.name || languageCode.toUpperCase()}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {languageCode.toUpperCase()}
                </Typography>

                <Box sx={{ flex: 1, minWidth: 0 }} />

                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                    minWidth: 180,
                  }}
                >
                  <Typography variant="h5" fontWeight="bold" color="primary">
                    {percent.toFixed(1)}%
                  </Typography>
                  <Chip
                    label={getStatusText(percent, t)}
                    size="small"
                    color={getStatusColor(percent)}
                    variant="outlined"
                  />
                </Box>

                <Box sx={{ flex: 1, maxWidth: 200 }}>
                  <ProgressBar percent={percent} />
                </Box>
              </Box>
            </StyledCardContent>
          </LanguageCard>
        );
      })}
    </Box>
  );
}
