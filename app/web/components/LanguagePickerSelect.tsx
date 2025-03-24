import CheckIcon from "@mui/icons-material/Check";
import {   Box,
  FormControl,
  ListItemIcon,
  MenuItem,
  Select,
  SelectChangeEvent,
styled ,
} from "@mui/material";
import { LANGUAGE_MAP } from "i18n/constants";
import * as React from "react";

// Styled Components

/**
 * We pass a generic type to `styled(FormControl)` so it can
 * read our `displayMode` prop in the styling callback.
 */
const StyledLanguageFormControl = styled(FormControl)<{
  displayMode?: "pill" | "rect";
}>(({ theme, displayMode }) => ({
  // For a "pill" shape, use a large radius; for "rect", use the default theme radius
  borderRadius: displayMode === "pill" ? 999 : theme.shape.borderRadius,
  border: `2px solid ${theme.palette.grey[300]}`,

  // Remove default MUI outline so we rely on custom border
  "& .MuiOutlinedInput-notchedOutline": {
    border: "none",
  },
  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
    border: "none",
  },
}));

const StyledLanguageSelect = styled(Select)<{ displayMode?: "pill" | "rect" }>(
  ({ theme, displayMode }) => ({
    borderRadius: displayMode === "pill" ? 999 : theme.shape.borderRadius,
    // extra spacing on the right to avoid overlap with the dropdown arrow
    paddingRight: theme.spacing(1),
    "& .MuiSelect-icon": {
      color: theme.palette.text.primary,
    },
  }),
);

const StyledMenuItem = styled(MenuItem)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1),
  // customize the selected/hover states here:
  "&.Mui-selected": {
    backgroundColor: theme.palette.action.selected,
  },
  "&.Mui-selected:hover": {
    backgroundColor: theme.palette.action.hover,
  },
}));

// --- Component ------------------------------------------------------

type LanguagePickerSelectProps = {
  defaultValue?: string;
  value?: string;
  onSelect?: (value: string) => void;
  /**
   * Toggle between "pill" shape or "rect" shape.
   * - "pill": fully rounded edges
   * - "rect": typical rounded rectangle
   */
  displayMode?: "pill" | "rect";
};

export default function LanguagePickerSelectTwo({
  defaultValue,
  value,
  onSelect,
  displayMode = "pill", // default to pill if not specified
}: LanguagePickerSelectProps) {
  // once full functionality is implemented, state changes will be handled elsewhere
  const [language, setLanguage] = React.useState("en");

  const handleChange = (event: SelectChangeEvent) => {
    const newLang = event.target.value as string;
    setLanguage(newLang);
    onSelect?.(newLang);
  };

  // Helper function to render a flag icon
  const renderFlag = (flagCode: string) => {
    return (
      <img
        alt={`${flagCode} flag`}
        src={`http://purecatamphetamine.github.io/country-flag-icons/3x2/${flagCode}.svg`}
        style={{ width: 30 }}
      />
    );
  };

  // Build list of menu items
  const menuItems: React.ReactNode[] = [];
  for (const languageCode in LANGUAGE_MAP) {
    const flagCode = LANGUAGE_MAP[languageCode].flagIconCode;

    menuItems.push(
      <StyledMenuItem value={languageCode}>
        {renderFlag(flagCode)}
        {languageCode.toUpperCase()}
        {language === languageCode && (
          <ListItemIcon>
            <CheckIcon fontSize="small" />
          </ListItemIcon>
        )}
      </StyledMenuItem>,
    );
  }

  return (
    <Box sx={{ minWidth: 120 }}>
      <StyledLanguageFormControl variant="outlined" displayMode={displayMode}>
        <StyledLanguageSelect
          id="language-select"
          value={language}
          onChange={handleChange}
          displayMode={displayMode}
          // Use renderValue to display the flag icon (and code?) in collapsed state
          renderValue={(selected) =>
            displayMode === "pill" ? (
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 1, pl: 1 }}
              >
                {renderFlag(LANGUAGE_MAP[selected].flagIconCode)}
                {selected.toUpperCase()}
              </Box>
            ) : (
              <label className="MuiFormLabel-root MuiInputLabel-root MuiInputLabel-formControl MuiInputLabel-animated MuiInputLabel-sizeMedium MuiInputLabel-outlined MuiFormLabel-colorPrimary MuiInputLabel-root MuiInputLabel-formControl MuiInputLabel-animated MuiInputLabel-sizeMedium MuiInputLabel-outlined css-1ttrm8x-MuiFormLabel-root-MuiInputLabel-root">
                {"Select a Language"}
              </label>
            )
          }
        >
          {menuItems}
        </StyledLanguageSelect>
      </StyledLanguageFormControl>
    </Box>
  );
}
