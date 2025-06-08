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
  useMediaQuery,
} from "@mui/material";
import { useAuthContext } from "features/auth/AuthProvider";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import { RpcError } from "grpc-web";
import { useTranslation } from "i18n";
import { LANGUAGE_MAP } from "i18n/constants";
import { GLOBAL } from "i18n/namespaces";
import { useRouter } from "next/router"; // we'll use this to reload the components w/ changed languages
import { useMutation } from "react-query";
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
  const { asPath, locale, pathname, query } = router;
  const { authState } = useAuthContext();
  const isAuthenticated = authState.authenticated;

  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const { t } = useTranslation([GLOBAL]);

  const { mutate: changeLanguageMutation } = useMutation<
    Empty,
    RpcError,
    string
  >((newLanguage: string) => service.account.changeLanguage(newLanguage));

  const handleChange = async (event: SelectChangeEvent<unknown>) => {
    const newLocale = event.target.value as string;

    if (!isAuthenticated) {
      // set NEXT_LOCALE cookie for unauthenticated users since backend cannot handle unauthenticated language changes
      document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000`; // 1 year expiration
    } else {
      await changeLanguageMutation(newLocale);
    }

    // Add 'lang-changed=true' to the query params so middleware knows this was a user-initiated language switch
    const newQuery = { ...query, "lang-changed": "true" };

    // Push new route with updated locale and query params, keep the current asPath for display
    router.push({ pathname, query: newQuery }, asPath, { locale: newLocale });
  };

  const renderFlag = (flagCode: string) => (
    <img
      alt={`${flagCode} flag`}
      src={`http://purecatamphetamine.github.io/country-flag-icons/3x2/${flagCode}.svg`}
      style={{ width: 25 }}
    />
  );

  const menuItems: React.ReactNode[] = Object.entries(LANGUAGE_MAP).map(
    ([languageCode, { flagIconCode }]) => {
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
              <ListItemIcon>{renderFlag(flagIconCode)}</ListItemIcon>
              <ListItemText
                sx={{
                  color: "#666666",
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
    },
  );

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
            value={locale}
            displayMode={displayMode}
            onChange={handleChange}
            // Use renderValue to display the selected language in collapsed state
            renderValue={renderValue}
            IconComponent={ExpandMoreOutlinedIcon}
          >
            {menuItems}
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
          </StyledSelect>
        )}
      </FormControl>
    </Box>
  );
}
