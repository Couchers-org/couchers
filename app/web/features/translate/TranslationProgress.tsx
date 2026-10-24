import TranslateIcon from "@mui/icons-material/Translate";
import { Box, Card, CardContent, Chip, Link, styled, Typography, useMediaQuery } from "@mui/material";
import { useTranslation } from "i18n";
import { LOCALE_AUTONYMS } from "i18n/locales";
import { GLOBAL } from "i18n/namespaces";
import { classifyTranslationReadiness, TranslationReadiness } from "i18n/translationReadiness";
import { useWeblateLanguages } from "i18n/weblate";
import React from "react";
import { translateJobURL } from "routes";
import { theme } from "theme";

const ProgressBar = styled(Box, {
  shouldForwardProp: (prop) => prop !== "percent" && prop !== "readiness",
})<{ percent: number; readiness: TranslationReadiness }>(({ theme, percent, readiness }) => ({
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
      readiness >= TranslationReadiness.AlmostDone
        ? theme.palette.success.main // Green
        : readiness === TranslationReadiness.Midway
          ? "#FFC107" // Yellow (Material Design amber/yellow)
          : readiness === TranslationReadiness.EarlyStage
            ? theme.palette.error.main // Red
            : theme.palette.grey[500], // Grey
    transition: "width 0.3s ease-in-out",
  },
}));

const LargeLanguageCard = styled(Card, {
  shouldForwardProp: (prop) => prop !== "readiness",
})<{ readiness: TranslationReadiness }>(({ theme, readiness }) => ({
  width: "100%",
  transition: "transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out",
  opacity:
    readiness === TranslationReadiness.JustStarted ? 0.35 : readiness === TranslationReadiness.EarlyStage ? 0.55 : 1,
  marginBottom: theme.spacing(2),

  "&:hover": {
    transform: "translateY(-1px)",
    boxShadow: theme.shadows[2],
  },
}));

const SmallLanguageCard = styled(Card, {
  shouldForwardProp: (prop) => prop !== "readiness",
})<{ readiness: TranslationReadiness }>(({ theme, readiness }) => ({
  width: "100%",
  transition: "transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out",
  opacity:
    readiness === TranslationReadiness.JustStarted ? 0.35 : readiness === TranslationReadiness.EarlyStage ? 0.55 : 1,
  marginBottom: theme.spacing(2),
}));

const getStatusColor = (readiness: TranslationReadiness): "success" | "info" | "warning" | "error" | "default" => {
  if (readiness >= TranslationReadiness.AlmostDone) return "success"; // Green
  if (readiness === TranslationReadiness.Midway) return "warning"; // Orange/Yellow
  if (readiness === TranslationReadiness.EarlyStage) return "error"; // Red
  return "default"; // Grey
};

const getStatusText = (readiness: TranslationReadiness, t: (key: string) => string) => {
  if (readiness === TranslationReadiness.Complete) return t("global:language_preference.translation_progress.complete");
  if (readiness === TranslationReadiness.AlmostDone)
    return t("global:language_preference.translation_progress.almost_there");
  if (readiness === TranslationReadiness.Midway) return t("global:language_preference.translation_progress.midway");
  if (readiness === TranslationReadiness.EarlyStage)
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
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const { t } = useTranslation([GLOBAL]);

  const { data: weblateLanguages, isLoading, error } = useWeblateLanguages();

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

  // Show all locales with any progress, sorted by completion percentage
  const filteredWeblateLanguages = weblateLanguages
    .filter((language) => language.translationProgress > 0)
    .sort((a, b) => b.translationProgress - a.translationProgress);

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ mb: 3, display: "flex", alignItems: "center", gap: 1 }}>
        <TranslateIcon sx={{ fontSize: 28, color: "primary.main" }} />
        <Typography
          variant="h1"
          sx={{
            fontWeight: "bold",
          }}
        >
          {t("global:language_preference.translation_progress.title")}
        </Typography>
      </Box>
      <Box sx={{ mb: 3 }}>
        <Typography sx={{ mb: 2 }}>{t("global:language_preference.translation_progress.description")}</Typography>
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
        <Typography
          sx={{
            color: "text.secondary",
          }}
        >
          {t("global:language_preference.translation_progress.info_text")}
        </Typography>
      </Box>
      {filteredWeblateLanguages.map((weblateLanguage) => {
        const locale = weblateLanguage.locale;
        const nativeName = LOCALE_AUTONYMS[weblateLanguage.locale];
        const percent = weblateLanguage.translationProgress * 100;
        const readiness = classifyTranslationReadiness(weblateLanguage.translationProgress);

        return (
          <React.Fragment key={weblateLanguage.locale}>
            {isMobile && (
              <SmallLanguageCard readiness={readiness}>
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
                      <Typography
                        variant="subtitle2"
                        sx={{
                          fontWeight: "bold",
                        }}
                      >
                        {nativeName}
                      </Typography>
                    </Box>
                    <Chip
                      label={getStatusText(readiness, t)}
                      size="small"
                      color={getStatusColor(readiness)}
                      variant="outlined"
                      sx={{
                        ...(readiness === TranslationReadiness.Midway && {
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
                      sx={{
                        color: readiness === TranslationReadiness.JustStarted ? "text.secondary" : "primary.main",
                        fontWeight: "bold",
                      }}
                    >
                      {percent.toFixed(1)}%
                    </Typography>
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>
                      {locale.toUpperCase()}
                    </Typography>
                  </Box>
                  <Box sx={{ flex: 1, width: "100%" }}>
                    <ProgressBar percent={percent} readiness={readiness} />
                  </Box>
                </StyledCardContent>
              </SmallLanguageCard>
            )}
            {!isMobile && (
              <LargeLanguageCard readiness={readiness}>
                <StyledCardContent>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 2,
                      width: "100%",
                    }}
                  >
                    <Typography
                      variant="subtitle1"
                      noWrap
                      sx={{
                        fontWeight: "bold",
                      }}
                    >
                      {nativeName}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        color: "text.secondary",
                      }}
                    >
                      {locale.toUpperCase()}
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
                        sx={{
                          color: readiness === TranslationReadiness.JustStarted ? "text.secondary" : "primary.main",
                          fontWeight: "bold",
                        }}
                      >
                        {percent.toFixed(1)}%
                      </Typography>
                      <Chip
                        label={getStatusText(readiness, t)}
                        size="small"
                        color={getStatusColor(readiness)}
                        variant="outlined"
                        sx={{
                          ...(readiness === TranslationReadiness.Midway && {
                            borderColor: "#FFC107",
                            color: "#F57C00",
                          }),
                        }}
                      />
                    </Box>

                    <Box sx={{ flex: 1, maxWidth: 200 }}>
                      <ProgressBar percent={percent} readiness={readiness} />
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
