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
import Snackbar from "components/Snackbar";
import { useAuthContext } from "features/auth/AuthProvider";
import { useWeblateStats } from "features/weblate/useWeblateStats";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import { RpcError } from "grpc-web";
import { useTranslation } from "i18n";
import { LANGUAGE_MAP } from "i18n/constants";
import { GLOBAL } from "i18n/namespaces";
import Link from "next/link";
import { useRouter } from "next/router"; // we'll use this to reload the components w/ changed languages
import { useMutation } from "react-query";
import { translateRoute } from "routes";
import { service } from "service";
import { theme } from "theme";

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

  const renderFlag = (flagCode: string, percent?: number) => (
    <img
      alt={`${flagCode} flag`}
      src={`https://cdn.couchers.org/img/language-icons/${flagCode}.svg`}
      style={{
        width: 25,
        filter: percent && percent < 80 ? "grayscale(100%)" : "none",
        opacity: percent && percent < 80 ? 0.4 : 1,
      }}
    />
  );
  // Languages with < 20% translated are hidden
  // Languages with < 80% translated are greyed out
  const availableLanguages = languages
    ?.filter(
      (language) =>
        LANGUAGE_MAP[language.code.replace("_", "-")] &&
        language.translated_percent > 20,
    )
    // sort by translated percent with the >= 80 grouped at the top, then sorted alphabetically by code
    .sort((a, b) => {
      if (a.translated_percent >= 80 && b.translated_percent < 80) return -1;
      if (a.translated_percent < 80 && b.translated_percent >= 80) return 1;
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
                    opacity: language.translated_percent < 80 ? 0.4 : 1,
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
              value={locale || ""}
              displayMode={displayMode}
              onChange={handleChange}
              // Use renderValue to display the selected language in collapsed state
              renderValue={renderValue}
              IconComponent={ExpandMoreOutlinedIcon}
            >
              {menuItems}
              <Link
                href={translateRoute}
                style={{ textDecoration: "none" }}
                onClick={(e) => {
                  e.stopPropagation();
                }}
              >
                <Box
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
                  <Typography color="primary" sx={{ fontWeight: "bold" }}>
                    {t("global:language_preference.translation_progress.title")}
                  </Typography>
                </Box>
              </Link>
            </StyledSelect>
          ) : (
            <StyledSelect
              id="newLanguage"
              displayMode={displayMode}
              value={locale}
              placeholder={t("global:language_preference.select_language")}
              fullWidth={isMobile}
              onChange={handleChange}
            >
              {menuItems}
              <Link
                href={translateRoute}
                style={{ textDecoration: "none" }}
                onClick={(e) => {
                  e.stopPropagation();
                }}
              >
                <Box
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
                  <Typography variant="body2" color="primary">
                    {t("global:language_preference.translation_progress.title")}
                  </Typography>
                </Box>
              </Link>
            </StyledSelect>
          )}
        </FormControl>
      </Box>
    </>
  );
}
