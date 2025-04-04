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
  TextField,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { LANGUAGE_MAP } from "i18n/constants";
import { useState } from "react";

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
    let cookie = allCookies[i];

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
  const isMdOrWider = useMediaQuery(theme.breakpoints.up("md"));

  console.log(getLangCookie());

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
              : isMdOrWider
                ? "241px"
                : "100%",
        }}
      >
        {" "}
        {displayMode === "round" ? (
          <MuiSelect
            id="language-select"
            value={language}
            sx={{
              borderRadius:
                displayMode === "round" ? 999 : theme.shape.borderRadius,
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
        ) : (
          <TextField
            select={true}
            id="newLanguage"
            // {...register("newLanguage", { required: true })}
            // label={t("auth:change_language_form.new_language")}
            label="Select a language"
            name="newLanguage"
            fullWidth={!isMdOrWider}
          >
            {menuItems}
          </TextField>
        )}
      </FormControl>
    </Box>
  );
}
