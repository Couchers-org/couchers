import * as React from "react";
import Box from "@mui/material/Box";
import MenuItem from "@mui/material/MenuItem";
import { US } from "country-flag-icons/react/3x2";
import FormControl from "@mui/material/FormControl";
import { LANGUAGE_MAP } from "../i18n/constants";
import Select, { SelectChangeEvent } from "@mui/material/Select";

// this should probably come from parent as defaultValue prop instead
function getCookie(name: String) {
  const cookieString = document.cookie;
  const cookies = cookieString.split(";");
  for (let i = 0; i < cookies.length; i++) {
    const cookie = cookies[i].trim();
    if (cookie.startsWith(name + "=")) {
      return cookie.substring(name.length + 1);
    }
  }
  return null;
}

export default function LanguagePickerSelect({
  defaultValue,
  value,
  onSelect, // should send new language pick back to parent to trigger backend updates
}) {
  const [language, setLanguage] = React.useState("en");

  // load the defaultValue as language cookie value
  React.useEffect(() => {
    const languagePref = getCookie("couchers-preferred-language");
    // setLanguage(getCookie('couchers-preferred-language'))
  }, []);

  const handleChange = (event: SelectChangeEvent) => {
    // rerender menu display
    setLanguage(event.target.value as string);
    // TBD: send request to backend to update cookie
  };

  // build list of menu items
  const menuItems: React.ReactNode[] = [];
  for (let languageCode in LANGUAGE_MAP) {
    menuItems.push(
      <MenuItem value={languageCode} key={languageCode}>
        <span>🌐 </span>
        {languageCode}
      </MenuItem>,
    );
  }

  return (
    // if in nav bar return micro layout, else return account settings layout
    <Box sx={{ minWidth: 60 }}>
      <FormControl sx={{ m: 1, minWidth: 80 }} size="small">
        <Select
          labelId="language-select-label"
          id="language-select"
          value={language}
          onChange={handleChange}
          sx={{
            borderRadius: "30px",
            border: "1px solid #ddd",
          }}
        >
          {menuItems}
        </Select>
      </FormControl>
    </Box>
  );
}
