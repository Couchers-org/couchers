import CheckIcon from "@mui/icons-material/Check";
import {
  Box,
  FormControl,
  ListItemIcon,
  ListItemText,
  MenuItem,
  Select,
  SelectChangeEvent,
  styled,
  Stack,
} from "@mui/material";
import { LANGUAGE_MAP } from "i18n/constants";
import * as React from "react";

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
  border: `2px solid ${theme.palette.grey[300]}`,

  // Remove default MUI outline so we rely on custom border
  "& .MuiOutlinedInput-notchedOutline": {
    border: "none",
  },
  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
    border: "none",
  },
}));

const StyledLanguageSelect = styled(Select)<{ displayMode?: "round" | "rect" }>(
  ({ theme, displayMode }) => ({
    borderRadius: displayMode === "round" ? 999 : theme.shape.borderRadius,
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
  "& .Mui-selected": {
    backgroundColor: theme.palette.action.selected,
  },
  "& .Mui-selected:hover": {
    backgroundColor: theme.palette.action.hover,
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

export default function LanguagePickerSelect({
  defaultValue,
  value,
  onSelect,
  displayMode = "round", // default to round if not specified
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
        <Stack
          sx={{ width: "100%" }}
          direction="row"
          alignItems="center"
          justifyContent="space-between"
        >
          <Stack direction="row">
            <ListItemIcon>{renderFlag(flagCode)}</ListItemIcon>{" "}
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
      </StyledMenuItem>,
    );
  }

  return (
    <Box sx={{ minWidth: 60 }}>
      <StyledLanguageFormControl variant="outlined" displayMode={displayMode}>
        <StyledLanguageSelect
          id="language-select"
          value={language}
          onChange={handleChange}
          displayMode={displayMode}
          // Use renderValue to display the selected language in collapsed state
          renderValue={(selected: string) =>
            displayMode === "round" ? (
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
