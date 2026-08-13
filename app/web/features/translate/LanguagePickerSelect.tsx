import CheckIcon from "@mui/icons-material/Check";
import ExpandMoreOutlinedIcon from "@mui/icons-material/ExpandMoreOutlined";
import LanguageIcon from "@mui/icons-material/Language";
import {
  Box,
  FormControl,
  ListItemText,
  MenuItem,
  Select,
  SelectChangeEvent,
  Stack,
  styled,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { useMutation } from "@tanstack/react-query";
import Snackbar from "components/Snackbar";
import { useAuthContext } from "features/auth/AuthProvider";
import { useWeblateStats } from "features/weblate/useWeblateStats";
import { useTranslation } from "i18n";
import { LANGUAGE_MAP } from "i18n/constants";
import { GLOBAL } from "i18n/namespaces";
import { useRouter } from "next/router";
import { useState } from "react";
import { translateRoute } from "routes";
import { service } from "service";
import { theme } from "theme";
import { sendLanguageChange } from "utils/nativeLink";

import { ALMOST_DONE_CUTOFF } from "./constants";
import { useShowAllLanguages } from "./useShowAllLanguages";
import { getAvailableLanguages } from "./utils";

interface StyledMuiSelectProps {
  displayMode?: "rounded" | "rect" | "icon";
}

const StyledSelect = styled(Select, {
  shouldForwardProp: (prop) => prop !== "displayMode",
})<StyledMuiSelectProps>(({ theme, displayMode }) => ({
  borderRadius: displayMode === "rect" ? theme.shape.borderRadius : displayMode === "icon" ? "50%" : 999,
  backgroundColor: "var(--mui-palette-grey-200)",
  "& .MuiOutlinedInput-notchedOutline": {
    borderColor: "var(--mui-palette-grey-300)",
  },
  "&:hover .MuiOutlinedInput-notchedOutline": {
    borderColor: "var(--mui-palette-grey-300)",
  },
  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
    borderColor: "var(--mui-palette-grey-300)",
  },
  "& .MuiSelect-icon": {
    color: "var(--mui-palette-text-primary)",
    fontSize: "1.25rem",
    top: "50%",
    transform: "translateY(-50%)",
    right: 10,
    ...(displayMode === "icon" && { display: "none" }),
  },
  height: 41.25,
  ...(displayMode === "icon" && {
    width: 41.25,
    minWidth: 41.25,
    "& .MuiSelect-select": {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      paddingLeft: "0 !important",
      paddingRight: "0 !important",
    },
  }),
}));

type LanguagePickerSelectProps = {
  displayMode?: "rounded" | "rect" | "icon";
  onNavigate?: () => void;
};

export default function LanguagePickerSelect({ displayMode = "rounded", onNavigate }: LanguagePickerSelectProps) {
  const router = useRouter();
  const { asPath, locale, pathname, query } = router;
  const { authState } = useAuthContext();
  const isAuthenticated = authState.authenticated;

  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const { t, i18n } = useTranslation([GLOBAL]);

  const { data: languages, isLoading, error } = useWeblateStats();
  const { showAllLanguages } = useShowAllLanguages();

  const [isOpen, setIsOpen] = useState(false);
  const [isChangingLanguage, setIsChangingLanguage] = useState(false);

  const { mutate: changeLanguageMutation } = useMutation({
    mutationFn: (newLanguage: string) => service.account.changeLanguage(newLanguage),
  });

  const handleChange = (event: SelectChangeEvent<unknown>) => {
    const newLocale = event.target.value as string;

    // Prevent rapid consecutive language changes
    if (isChangingLanguage) {
      return;
    }

    setIsChangingLanguage(true);

    // Notify native app immediately so the tab bar labels update without waiting
    // for onNavigationStateChange to fire (which has a slight delay on Android).
    sendLanguageChange(newLocale);

    // Set cookie client-side immediately for both authenticated and logged-out users
    // This ensures the middleware sees the updated locale before navigation
    document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000; samesite=lax`;

    if (isAuthenticated) {
      // For authenticated users, also update backend's ui_language_preference
      changeLanguageMutation(newLocale);
    }

    router.push({ pathname, query }, asPath, { locale: newLocale });

    setIsChangingLanguage(false);
  };

  const handleTranslationProgressClick = (e: React.MouseEvent) => {
    e.stopPropagation();

    setIsOpen(false);
    onNavigate?.();
    router.push(translateRoute);
  };

  // Languages with < 50% translated are hidden from language selector (unless showAllLanguages is enabled)
  // Languages with < 80% translated are greyed out
  const availableLanguages = getAvailableLanguages(languages, showAllLanguages, i18n.language);

  const menuItems: React.ReactNode[] | undefined = isLoading
    ? []
    : availableLanguages.map((language) => {
        // language.code has underscore, we need to change to hyphen
        const languageCode = language.code.replace("_", "-");

        return (
          <MenuItem
            key={languageCode}
            value={languageCode}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: theme.spacing(1),
              "& .Mui-selected": {
                backgroundColor: "var(--mui-palette-action-selected)",
              },
              "& .Mui-selected:hover": {
                backgroundColor: "var(--mui-palette-action-hover)",
              },
            }}
          >
            <Stack
              direction="row"
              sx={{
                alignItems: "center",
                justifyContent: "space-between",
                width: "100%",
              }}
            >
              <Stack direction="row">
                <ListItemText
                  sx={{
                    opacity: language.translated_percent < ALMOST_DONE_CUTOFF ? 0.4 : 1,
                    fontWeight: "bold",
                    display: "inline",
                  }}
                >
                  {LANGUAGE_MAP[languageCode].nativeName}
                </ListItemText>
              </Stack>
              <div>
                {locale === languageCode && (
                  <CheckIcon fontSize="small" sx={{ color: "var(--mui-palette-primary-main)" }} />
                )}
              </div>
            </Stack>
          </MenuItem>
        );
      });

  // renderValue function for what should be rendered after a selection is made
  const renderRoundedValue = (value: unknown) => {
    const selected = value as string;
    return (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          pl: 1,
          color: "var(--mui-palette-text-secondary)",
          fontWeight: "bold",
        }}
      >
        {LANGUAGE_MAP[selected].nativeName}
      </Box>
    );
  };

  // Icon mode shows a generic language icon instead of the selected language
  const renderIconValue = () => (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "var(--mui-palette-text-primary)",
      }}
    >
      <LanguageIcon fontSize="small" />
    </Box>
  );

  return (
    <>
      {error && <Snackbar severity="error">{t("global:language_preference.error_loading_languages")}</Snackbar>}
      <Box sx={{ minWidth: 40 }}>
        <FormControl
          variant="outlined"
          sx={{
            width: displayMode === "rect" ? (!isMobile ? "241px" : "100%") : "fit-content",
          }}
        >
          {displayMode !== "rect" ? (
            <StyledSelect
              id="language-select"
              value={isLoading ? "" : locale || ""}
              displayMode={displayMode}
              onChange={handleChange}
              // Use renderValue to display the selected language (or, in icon mode, a generic language icon) in collapsed state
              renderValue={displayMode === "icon" ? renderIconValue : renderRoundedValue}
              IconComponent={ExpandMoreOutlinedIcon}
              disabled={isLoading || isChangingLanguage}
              open={isOpen}
              onOpen={() => setIsOpen(true)}
              onClose={() => setIsOpen(false)}
            >
              {menuItems}
              <Box
                key="translation-progress"
                onClick={handleTranslationProgressClick}
                sx={{
                  borderTop: `1px solid var(--mui-palette-divider)`,
                  mt: 1,
                  pt: 1,
                  px: 2,
                  cursor: "pointer",
                  "&:hover": {
                    backgroundColor: "var(--mui-palette-action-hover)",
                  },
                }}
              >
                <Typography
                  onClick={handleTranslationProgressClick}
                  sx={{
                    color: "var(--mui-palette-primary-main)",
                    fontWeight: "bold",
                  }}
                >
                  {t("global:language_preference.translation_progress.title")}
                </Typography>
              </Box>
            </StyledSelect>
          ) : (
            <StyledSelect
              id="newLanguage"
              displayMode={displayMode}
              value={isLoading ? "" : locale}
              fullWidth={isMobile}
              onChange={handleChange}
              disabled={isLoading || isChangingLanguage}
              open={isOpen}
              onOpen={() => setIsOpen(true)}
              onClose={() => setIsOpen(false)}
            >
              {menuItems}
              <Box
                onClick={handleTranslationProgressClick}
                sx={{
                  borderTop: `1px solid var(--mui-palette-divider)`,
                  mt: 1,
                  pt: 1,
                  px: 2,
                  py: 1,
                  cursor: "pointer",
                  "&:hover": {
                    backgroundColor: "var(--mui-palette-action-hover)",
                  },
                }}
              >
                <Typography
                  variant="body2"
                  onClick={handleTranslationProgressClick}
                  sx={{
                    color: "var(--mui-palette-primary-main)",
                  }}
                >
                  {t("global:language_preference.translation_progress.title")}
                </Typography>
              </Box>
            </StyledSelect>
          )}
        </FormControl>
      </Box>
    </>
  );
}
