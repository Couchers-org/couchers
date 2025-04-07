import CheckIcon from "@mui/icons-material/Check";
import ExpandMoreOutlinedIcon from "@mui/icons-material/ExpandMoreOutlined";
import {
  Box,
  FormControl,
  ListItemIcon,
  ListItemText,
  MenuItem,
  Select as MuiSelect,
  SelectChangeEvent,
  Stack,
  styled,
  TextField,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { useTranslation } from "i18n";
import { LANGUAGE_MAP } from "i18n/constants";
import { GLOBAL } from "i18n/namespaces";
import { useState } from "react";

const StyledMuiSelect = styled(MuiSelect)(({ theme, displayMode }) => ({
  borderRadius: displayMode === "round" ? 999 : theme.shape.borderRadius,
  "& .MuiSelect-icon": {
    color: theme.palette.text.primary,
    fontSize: "1.25rem",
    top: "50%",
    transform: "translateY(-50%)",
    right: 10,
  },
}));

type LanguagePickerSelectProps = {
  defaultValue?: string;
  value?: string;
  onSelect?: (value: string) => void;
  displayMode?: "round" | "rect";
};

// note: manually add a non-secure cookie in development to test this functionality
// TODO: this function lives in two places... where should it live?
function getLangCookie() {
  const name = "couchers-preferred-language=";

  // split multiple cookies from cookie string
  // "couchers-preferred-language=es; some-other-cookie=some value" --> ['couchers-preferred-language=es', ' some-other-cookie=some value']")
  const allCookies = document.cookie.split("; ");

  // find the cookie with key "couchers-preferred-language" and extract its value
  for (let i = 0; i < allCookies.length; i++) {
    const cookie = allCookies[i];

    // if cookie key is couchers-preferred-language
    if (cookie.indexOf(name) == 0) {
      // cookie val will start at the length of the cookie's name
      return cookie.substring(name.length);
    }
  }
  // if not cookie is found, return an empty string
  return "";
}

export default function LanguagePickerSelect({
  defaultValue,
  value,
  onSelect,
  displayMode = "round", // default to round if not specified
}: LanguagePickerSelectProps) {
  const [language, setLanguage] = useState(getLangCookie());
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const { t } = useTranslation([GLOBAL]);

  const handleChange = (event: SelectChangeEvent) => {
    const newLang = event.target.value as string;
    setLanguage(newLang);
    onSelect?.(newLang); // sends request to update language preference on backend?
  };

  // Helper function to render a flag icon from country flag icons collection
  const renderFlag = (flagCode: string) => {
    return (
      <img
        alt={`${flagCode} flag`}
        src={`http://purecatamphetamine.github.io/country-flag-icons/3x2/${flagCode}.svg`}
        style={{ width: 30 }}
      />
    );
  };

  // Build list of menu items based on LANGUAGE_MAP
  const menuItems: React.ReactNode[] = [];
  for (const languageCode in LANGUAGE_MAP) {
    const flagCode = LANGUAGE_MAP[languageCode].flagIconCode;

    menuItems.push(
      <MenuItem
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
            <ListItemIcon>{renderFlag(flagCode)}</ListItemIcon>
            <ListItemText
              sx={{ color: "#666666", fontWeight: "bold", display: "inline" }}
            >
              {languageCode.toUpperCase()}
            </ListItemText>
          </Stack>
          {/* if this menu item matches selected language, display a check mark */}
          <div>
            {language === languageCode && (
              <CheckIcon fontSize="small" sx={{ color: "#00a69a" }} />
            )}
          </div>
        </Stack>
      </MenuItem>,
    );
  }

  // renderValue function for what should be rendered after a selection is made
  const renderValue = (selected: string) => {
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
    <Box sx={{ minWidth: 60 }}>
      <FormControl
        variant="outlined"
        displayMode={displayMode}
        sx={{
          // specialized sizing based on screen size
          width:
            displayMode === "round"
              ? "fit-content"
              : !isMobile
                ? "241px"
                : "100%",
        }}
      >
        {displayMode === "round" ? (
          <StyledMuiSelect
            id="language-select"
            value={language}
            displayMode={displayMode}
            onChange={handleChange}
            // Use renderValue to display the selected language in collapsed state
            renderValue={renderValue}
            IconComponent={ExpandMoreOutlinedIcon}
          >
            {menuItems}
          </StyledMuiSelect>
        ) : (
          <TextField
            select={true}
            id="newLanguage"
            label={t("global:language_preference.select_language")}
            name="newLanguage"
            fullWidth={isMobile}
          >
            {menuItems}
          </TextField>
        )}
      </FormControl>
    </Box>
  );
}
