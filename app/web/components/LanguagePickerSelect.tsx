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
} from "@mui/material";
import { useTranslation } from "i18n";
import { LANGUAGE_MAP } from "i18n/constants";
import { getLangCookie } from "i18n/getLangCookie";
import { GLOBAL } from "i18n/namespaces";
import { useState } from "react";
import { theme } from "theme";

interface StyledMuiSelectProps {
  displayMode?: "round" | "rect";
}

const StyledMuiSelect = styled(MuiSelect)<StyledMuiSelectProps>(
  ({ theme, displayMode }) => ({
    borderRadius: displayMode === "round" ? 999 : theme.shape.borderRadius,
    "& .MuiSelect-icon": {
      color: theme.palette.text.primary,
      fontSize: "1.25rem",
      top: "50%",
      transform: "translateY(-50%)",
      right: 10,
    },
    height: 41.25,
  }),
);

type LanguagePickerSelectProps = {
  defaultValue?: string;
  value?: string;
  onSelect?: (value: string) => void;
  displayMode?: "round" | "rect";
};

export default function LanguagePickerSelect({
  defaultValue = "en",
  onSelect,
  displayMode = "round", // default to round if not specified
}: LanguagePickerSelectProps) {
  const [language, setLanguage] = useState(
    getLangCookie() != "" ? getLangCookie() : defaultValue,
  );
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const { t } = useTranslation([GLOBAL]);

  const handleChange = (event: SelectChangeEvent<unknown>) => {
    const newLang = event.target.value as string;
    setLanguage(newLang);
    onSelect?.(newLang); // uses i18n.changeLanguage to update UI language
  };

  // Helper function to render a flag icon from country flag icons collection
  const renderFlag = (flagCode: string) => {
    return (
      <img
        alt={`${flagCode} flag`}
        src={`http://purecatamphetamine.github.io/country-flag-icons/3x2/${flagCode}.svg`}
        style={{ width: 25 }}
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
    <Box sx={{ minWidth: 60 }}>
      <FormControl
        variant="outlined"
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
