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
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { LANGUAGE_MAP } from "i18n/constants";
import { useState } from "react";

// Styled Components

/**
 * We pass a generic type to `styled(FormControl)` so it can
 * read our `displayMode` prop in the styling callback.
 */
const StyledLanguageFormControl = styled(FormControl)<{
  displayMode?: "round" | "rect";
}>(({ theme, displayMode }) => ({
  // For a "round" shape, use a large radius; for "rect", use the default theme radius
  borderRadius: displayMode === "round" ? 999 : theme.shape.borderRadius,
  // border: `1px solid ${theme.palette.grey[300]}`,
  // height: displayMode === "rect" ? 56 : "auto", // Match TextField height
  "& .MuiOutlinedInput-notchedOutline": {
    // border: "none",
  },
}));

// --- Component ------------------------------------------------------

type LanguagePickerSelectProps = {
  defaultValue?: string;
  value?: string;
  onSelect?: (value: string) => void;
  /**
   * Toggle between "round" shape or "rect" shape.
   * - "round": fully rounded edges
   * - "rect": typical rounded rectangle
   */
  displayMode?: "round" | "rect";
};

// note: this will not retrieve secure cookies in development,
// manually add a non-secure cookie in development to test this functionality
function getLangCookie() {
  let name = "couchers-preferred-language" + "=";
  let decodedCookie = decodeURIComponent(document.cookie);
  let ca = decodedCookie.split(";");
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) == " ") {
      c = c.substring(1);
    }
    if (c.indexOf(name) == 0) {
      return c.substring(name.length, c.length);
    }
  }
  return "";
}

export default function LanguagePickerSelect({
  defaultValue,
  value,
  onSelect,
  displayMode = "round", // default to round if not specified
}: LanguagePickerSelectProps) {
  // once functionality is implemented, state changes will be handled elsewhere
  const [language, setLanguage] = useState(getLangCookie());
  const theme = useTheme();
  const isMdOrWider = useMediaQuery(theme.breakpoints.up("md"));

  const handleChange = (event: SelectChangeEvent) => {
    const newLang = event.target.value as string;
    setLanguage(newLang);
    onSelect?.(newLang);
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

  // Build list of menu items based on language map
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
          // customized selected/hover states:
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

  return (
    <Box sx={{ minWidth: 60 }}>
      <StyledLanguageFormControl
        variant="outlined"
        displayMode={displayMode}
        sx={{
          // specialized sizing based on screen size
          width:
            displayMode === "round"
              ? "fit-content"
              : isMdOrWider
                ? "241px"
                : "100%",
        }}
      >
        <MuiSelect
          id="language-select"
          value={language}
          sx={{
            borderRadius:
              displayMode === "round" ? 999 : theme.shape.borderRadius,
            // extra spacing on the right to avoid overlap with the dropdown arrow
            // paddingRight: theme.spacing(0.5),
            "& .MuiSelect-icon": {
              color: theme.palette.text.primary,
              fontSize: "1.25rem",
              top: "50%",
              transform: "translateY(-50%)",
              right: 10,
            },
          }}
          onChange={handleChange}
          // Use renderValue to display the selected language in collapsed state
          renderValue={(selected: string) => {
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
            return displayMode === "round" ? (
              selectedDisplay
            ) : selected ? (
              selectedDisplay
            ) : (
              <label className="MuiFormLabel-root MuiInputLabel-root MuiInputLabel-formControl MuiInputLabel-animated MuiInputLabel-sizeMedium MuiInputLabel-outlined MuiFormLabel-colorPrimary MuiInputLabel-root MuiInputLabel-formControl MuiInputLabel-animated MuiInputLabel-sizeMedium MuiInputLabel-outlined css-1ttrm8x-MuiFormLabel-root-MuiInputLabel-root">
                {"Select a Language"}
              </label>
            );
          }}
          IconComponent={ExpandMoreOutlinedIcon}
        >
          {menuItems}
        </MuiSelect>
      </StyledLanguageFormControl>
    </Box>
  );
}
