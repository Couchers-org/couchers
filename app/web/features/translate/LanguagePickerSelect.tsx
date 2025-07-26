import CheckIcon from "@mui/icons-material/Check";
import ExpandMoreOutlinedIcon from "@mui/icons-material/ExpandMoreOutlined";
import {
  Box,
  FormControl,
  ListItemIcon,
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
import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import { RpcError } from "grpc-web";
import { useTranslation } from "i18n";
import { LANGUAGE_MAP } from "i18n/constants";
import { GLOBAL } from "i18n/namespaces";
import { useRouter } from "next/router"; // we'll use this to reload the components w/ changed languages
import { useState } from "react";
import { translateRoute } from "routes";
import { service } from "service";
import { theme } from "theme";

import { ALMOST_DONE_CUTOFF, HIDDEN_CUTOFF } from "./constants";

interface StyledMuiSelectProps {
  displayMode?: "round" | "rect";
}

const StyledSelect = styled(Select, {
  shouldForwardProp: (prop) => prop !== "displayMode",
})<StyledMuiSelectProps>(({ theme, displayMode }) => ({
  borderRadius: displayMode === "round" ? 999 : theme.shape.borderRadius,
  "& .MuiSelect-icon": {
    color: theme.palette.text.primary,
    fontSize: "1.25rem",
    top: "50%",
    transform: "translateY(-50%)",
    right: 10,
  },
  height: 41.25,
}));

type LanguagePickerSelectProps = {
  displayMode?: "round" | "rect";
};

export default function LanguagePickerSelect({
  displayMode = "round",
}: LanguagePickerSelectProps) {
  const router = useRouter();
  const { asPath, locale, pathname } = router;
  const { authState } = useAuthContext();
  const isAuthenticated = authState.authenticated;

  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const { t } = useTranslation([GLOBAL]);

  const { data: languages, isLoading, error } = useWeblateStats();

  const [isOpen, setIsOpen] = useState(false);

  const { mutate: changeLanguageMutation } = useMutation<
    Empty,
    RpcError,
    string
  >((newLanguage: string) => service.account.changeLanguage(newLanguage));

  const handleChange = async (event: SelectChangeEvent<unknown>) => {
    const newLocale = event.target.value as string;

    if (isAuthenticated) {
      await changeLanguageMutation(newLocale);
    }

    // Push new route with updated locale, keep the current asPath for display
    router.push({ pathname }, asPath, { locale: newLocale });
  };

  const handleTranslationProgressClick = (e: React.MouseEvent) => {
    e.stopPropagation();

    setIsOpen(false);
    router.push(translateRoute);
  };

  const renderFlag = (flagCode: string, percent?: number) => (
    <img
      alt={`${flagCode} flag`}
      src={`https://cdn.couchers.org/img/language-icons/${flagCode}.svg`}
      style={{
        width: 25,
        filter:
          percent && percent < ALMOST_DONE_CUTOFF ? "grayscale(100%)" : "none",
        opacity: percent && percent < ALMOST_DONE_CUTOFF ? 0.4 : 1,
      }}
    />
  );
  // Languages with < 20% translated are hidden
  // Languages with < 80% translated are greyed out
  const availableLanguages = languages
    ?.filter(
      (language) =>
        LANGUAGE_MAP[language.code.replace("_", "-")] &&
        language.translated_percent > HIDDEN_CUTOFF,
    )
    // sort by translated percent with the >= 80 grouped at the top, then sorted alphabetically by code
    .sort((a, b) => {
      if (
        a.translated_percent >= ALMOST_DONE_CUTOFF &&
        b.translated_percent < ALMOST_DONE_CUTOFF
      )
        return -1;
      if (
        a.translated_percent < ALMOST_DONE_CUTOFF &&
        b.translated_percent >= ALMOST_DONE_CUTOFF
      )
        return 1;
      return a.code.localeCompare(b.code);
    });

  const menuItems: React.ReactNode[] | undefined = isLoading
    ? []
    : availableLanguages?.map((language) => {
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
                backgroundColor: theme.palette.action.selected,
              },
              "& .Mui-selected:hover": {
                backgroundColor: theme.palette.action.hover,
              },
            }}
          >
            <Stack
              sx={{ width: "100%" }}
              direction="row"
              alignItems="center"
              justifyContent="space-between"
            >
              <Stack direction="row">
                <ListItemIcon>
                  {renderFlag(
                    LANGUAGE_MAP[languageCode].flagIconCode,
                    language.translated_percent,
                  )}
                </ListItemIcon>
                <ListItemText
                  sx={{
                    opacity:
                      language.translated_percent < ALMOST_DONE_CUTOFF
                        ? 0.4
                        : 1,
                    fontWeight: "bold",
                    display: "inline",
                  }}
                >
                  {languageCode.toUpperCase()}
                </ListItemText>
              </Stack>
              <div>
                {locale === languageCode && (
                  <CheckIcon fontSize="small" sx={{ color: "#00a69a" }} />
                )}
              </div>
            </Stack>
          </MenuItem>
        );
      });

  // renderValue function for what should be rendered after a selection is made
  const renderValue = (value: unknown) => {
    const selected = value as string;
    const selectedDisplay = (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          pl: 1,
          color: "#666666",
          fontWeight: "bold",
        }}
      >
        {renderFlag(LANGUAGE_MAP[selected].flagIconCode)}
        {selected.toUpperCase()}
      </Box>
    );
    return selectedDisplay;
  };

  return (
    <>
      {error && (
        <Snackbar severity="error">
          {t("global:language_preference.error_loading_languages")}
        </Snackbar>
      )}
      <Box sx={{ minWidth: 40 }}>
        <FormControl
          variant="outlined"
          sx={{
            width:
              displayMode === "round"
                ? "fit-content"
                : !isMobile
                  ? "241px"
                  : "100%",
          }}
        >
          {displayMode === "round" ? (
            <StyledSelect
              id="language-select"
              value={isLoading ? "" : locale || ""}
              displayMode={displayMode}
              onChange={handleChange}
              // Use renderValue to display the selected language in collapsed state
              renderValue={renderValue}
              IconComponent={ExpandMoreOutlinedIcon}
              disabled={isLoading}
              open={isOpen}
              onOpen={() => setIsOpen(true)}
              onClose={() => setIsOpen(false)}
            >
              {menuItems}
              <Box
                key="translation-progress"
                onClick={handleTranslationProgressClick}
                sx={{
                  borderTop: `1px solid ${theme.palette.divider}`,
                  mt: 1,
                  pt: 1,
                  px: 2,
                  cursor: "pointer",
                  "&:hover": {
                    backgroundColor: "action.hover",
                  },
                }}
              >
                <Typography
                  color="primary"
                  sx={{ fontWeight: "bold" }}
                  onClick={handleTranslationProgressClick}
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
              placeholder={t("global:language_preference.select_language")}
              fullWidth={isMobile}
              onChange={handleChange}
              disabled={isLoading}
              open={isOpen}
              onOpen={() => setIsOpen(true)}
              onClose={() => setIsOpen(false)}
            >
              {menuItems}
              <Box
                onClick={handleTranslationProgressClick}
                sx={{
                  borderTop: `1px solid ${theme.palette.divider}`,
                  mt: 1,
                  pt: 1,
                  px: 2,
                  py: 1,
                  cursor: "pointer",
                  "&:hover": {
                    backgroundColor: "action.hover",
                  },
                }}
              >
                <Typography
                  variant="body2"
                  color="primary"
                  onClick={handleTranslationProgressClick}
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
