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
import { CatalanFlagIcon } from "components/Icons";
import { useWeblateStats } from "features/weblate/useWeblateStats";
import { useTranslation } from "i18n";
import { LANGUAGE_MAP } from "i18n/constants";
import { GLOBAL } from "i18n/namespaces";
import React from "react";
import { translateJobURL } from "routes";
import useIsMobile from "utils/useIsMobile";

import {
  ALMOST_DONE_CUTOFF,
  COMPLETE_CUTOFF,
  HIDDEN_CUTOFF,
  SELECTOR_CUTOFF,
} from "./constants";

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
      percent >= ALMOST_DONE_CUTOFF
        ? theme.palette.success.main // 80-100%: Green
        : percent >= SELECTOR_CUTOFF
          ? "#FFC107" // 50-80%: Yellow (Material Design amber/yellow)
          : percent >= HIDDEN_CUTOFF
            ? theme.palette.error.main // 20-50%: Red
            : theme.palette.grey[500], // <20%: Grey
    transition: "width 0.3s ease-in-out",
  },
}));

const LargeLanguageCard = styled(Card)<{ percent: number }>(
  ({ theme, percent }) => ({
    width: "100%",
    transition: "transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out",
    opacity:
      percent < HIDDEN_CUTOFF ? 0.35 : percent < SELECTOR_CUTOFF ? 0.55 : 1,
    marginBottom: theme.spacing(2),

    "&:hover": {
      transform: "translateY(-1px)",
      boxShadow: theme.shadows[2],
    },
  }),
);

const SmallLanguageCard = styled(Card)<{ percent: number }>(
  ({ theme, percent }) => ({
    width: "100%",
    transition: "transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out",
    opacity:
      percent < HIDDEN_CUTOFF ? 0.35 : percent < SELECTOR_CUTOFF ? 0.55 : 1,
    marginBottom: theme.spacing(2),
  }),
);

const FlagImage = styled("img")<{ percent: number }>(({ percent }) => ({
  width: 32,
  height: 24,
  borderRadius: 4,
  filter:
    percent < HIDDEN_CUTOFF
      ? "grayscale(100%)"
      : percent < SELECTOR_CUTOFF
        ? "grayscale(50%)"
        : "none",
  transition: "filter 0.2s ease-in-out",
}));

const CatalanFlag = styled(CatalanFlagIcon)<{ percent: number }>(
  ({ percent }) => ({
    width: 32,
    height: 24,
    borderRadius: 4,
    filter:
      percent < HIDDEN_CUTOFF
        ? "grayscale(100%)"
        : percent < SELECTOR_CUTOFF
          ? "grayscale(50%)"
          : "none",
    transition: "filter 0.2s ease-in-out",
  }),
);

const getStatusColor = (
  percent: number,
): "success" | "info" | "warning" | "error" | "default" => {
  if (percent >= ALMOST_DONE_CUTOFF) return "success"; // 80-100%: Green
  if (percent >= SELECTOR_CUTOFF && percent < ALMOST_DONE_CUTOFF)
    return "warning"; // 50-80%: Orange/Yellow
  if (percent >= HIDDEN_CUTOFF) return "error"; // 20-50%: Red
  return "default"; // <20%: Grey
};

const getStatusText = (percent: number, t: (key: string) => string) => {
  if (percent >= COMPLETE_CUTOFF)
    return t("global:language_preference.translation_progress.complete");
  if (percent >= ALMOST_DONE_CUTOFF && percent < COMPLETE_CUTOFF)
    return t("global:language_preference.translation_progress.almost_there");
  if (percent >= SELECTOR_CUTOFF && percent < ALMOST_DONE_CUTOFF)
    return t("global:language_preference.translation_progress.midway");
  if (percent >= HIDDEN_CUTOFF && percent < SELECTOR_CUTOFF)
    return t("global:language_preference.translation_progress.early_stage");
  return t("global:language_preference.translation_progress.just_started");
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
  const isMobile = useIsMobile();
  const { t } = useTranslation([GLOBAL]);

  const { data: languages, isLoading, error } = useWeblateStats();

  const renderFlag = (flagCode: string, percent: number) => {
    if (flagCode === "CAT") {
      return <CatalanFlag percent={percent} aria-label="Catalan flag" />;
    }
    return (
      <FlagImage
        src={`https://cdn.couchers.org/img/language-icons/${flagCode}.svg`}
        alt={`${flagCode} flag`}
        percent={percent}
      />
    );
  };

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

  // Filter and sort languages - show all with any progress
  const availableLanguages = languages
    .filter(
      (language) =>
        LANGUAGE_MAP[language.code.replace("_", "-")] &&
        language.translated_percent > 0,
    )
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
          {t("global:language_preference.translation_progress.help_translate")}{" "}
          →
        </Link>
      </Box>

      <Box sx={{ mb: 3, p: 2, bgcolor: "grey.50", borderRadius: 2 }}>
        <Typography color="text.secondary">
          {t("global:language_preference.translation_progress.info_text")}
        </Typography>
      </Box>

      {availableLanguages.map((language) => {
        const languageCode = language.code.replace("_", "-");
        const languageInfo = LANGUAGE_MAP[languageCode];
        const percent = language.translated_percent;

        if (!languageInfo) return null;

        return (
          <React.Fragment key={language.code}>
            {isMobile && (
              <SmallLanguageCard percent={percent}>
                <StyledCardContent
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-start",
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      gap: 2,
                      alignItems: "center",
                      justifyContent: "space-between",
                      width: "100%",
                    }}
                  >
                    <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
                      {renderFlag(languageInfo.flagIconCode, percent)}
                      <Typography variant="subtitle2" fontWeight="bold">
                        {t(`global:language_names.${languageCode}`)}
                      </Typography>
                    </Box>
                    <Chip
                      label={getStatusText(percent, t)}
                      size="small"
                      color={getStatusColor(percent)}
                      variant="outlined"
                      sx={{
                        ...(percent >= SELECTOR_CUTOFF &&
                          percent < ALMOST_DONE_CUTOFF && {
                            borderColor: "#FFC107",
                            color: "#F57C00",
                          }),
                      }}
                    />
                  </Box>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginTop: 2,
                      width: "100%",
                    }}
                  >
                    <Typography
                      variant="h5"
                      fontWeight="bold"
                      color={
                        percent < HIDDEN_CUTOFF ? "text.secondary" : "primary"
                      }
                    >
                      {percent.toFixed(1)}%
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {languageCode.toUpperCase()}
                    </Typography>
                  </Box>
                  <Box sx={{ flex: 1, width: "100%" }}>
                    <ProgressBar percent={percent} />
                  </Box>
                </StyledCardContent>
              </SmallLanguageCard>
            )}
            {!isMobile && (
              <LargeLanguageCard percent={percent}>
                <StyledCardContent>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 2,
                      width: "100%",
                    }}
                  >
                    {renderFlag(languageInfo.flagIconCode, percent)}

                    <Typography variant="subtitle1" fontWeight="bold" noWrap>
                      {t(`global:language_names.${languageCode}`)}
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
                      <Typography
                        variant="h5"
                        fontWeight="bold"
                        color={
                          percent < HIDDEN_CUTOFF ? "text.secondary" : "primary"
                        }
                      >
                        {percent.toFixed(1)}%
                      </Typography>
                      <Chip
                        label={getStatusText(percent, t)}
                        size="small"
                        color={getStatusColor(percent)}
                        variant="outlined"
                        sx={{
                          ...(percent >= SELECTOR_CUTOFF &&
                            percent < ALMOST_DONE_CUTOFF && {
                              borderColor: "#FFC107",
                              color: "#F57C00",
                            }),
                        }}
                      />
                    </Box>

                    <Box sx={{ flex: 1, maxWidth: 200 }}>
                      <ProgressBar percent={percent} />
                    </Box>
                  </Box>
                </StyledCardContent>
              </LargeLanguageCard>
            )}
          </React.Fragment>
        );
      })}
    </Box>
  );
}
