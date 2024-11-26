import { Divider, IconButton, popoverClasses, styled } from "@mui/material";
import { MenuIcon, SinglePersonIcon } from "components/Icons";
import Menu, { MenuItem } from "components/Menu";
import { GLOBAL } from "i18n/namespaces";
import Link from "next/link";
import { useTranslation } from "next-i18next";
import React, { Dispatch, SetStateAction } from "react";
import { helpCenterURL, loginRoute, signupRoute } from "routes";
import { theme } from "theme";

import ReportButton from "./ReportButton";

const StyledIconButton = styled(IconButton)({
  display: "flex",
  flexDirection: "row",
  alignItems: "center",
  border: `1px solid ${theme.palette.grey[300]}`,
  borderRadius: 999,
  backgroundColor: theme.palette.grey[200],
  padding: theme.spacing(1),
  transition: `${theme.transitions.duration.short}ms ${theme.transitions.easing.easeInOut}`,
  "&:hover": {
    opacity: 0.8,
    backgroundColor: theme.palette.grey[300],
  },
});

export default function GuestMenu({
  menuOpen,
  setMenuOpen,
}: {
  menuOpen: boolean;
  setMenuOpen: Dispatch<SetStateAction<boolean>>;
}) {
  const menuRef = React.useRef<HTMLButtonElement>(null);
  const { t } = useTranslation(GLOBAL);

  return (
    <>
      <StyledIconButton
        aria-controls="navigation-menu"
        aria-haspopup="true"
        onClick={() => setMenuOpen((prevMenuOpen: boolean) => !prevMenuOpen)}
        ref={menuRef}
      >
        <MenuIcon sx={{ fontSize: 18 }} />
        <SinglePersonIcon sx={{ fontSize: 24, marginLeft: theme.spacing(1) }} />
      </StyledIconButton>
      <Menu
        id="navigation-menu"
        open={menuOpen}
        anchorEl={menuRef.current}
        onClose={() => setMenuOpen(false)}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        sx={{
          boxShadow: theme.shadows[1],
          minWidth: "12rem",

          [`&.${popoverClasses.root}`]: {
            transform: "translateY(1rem)",
          },
        }}
      >
        <MenuItem>
          <Link href={signupRoute}>{t("sign_up")}</Link>
        </MenuItem>
        <MenuItem>
          <Link href={loginRoute}>{t("login")}</Link>
        </MenuItem>
        <Divider />
        <MenuItem>
          <ReportButton isMenuLink />
        </MenuItem>
        <Divider />
        <MenuItem>
          <Link href={helpCenterURL} target="_blank">
            {t("nav.help")}
          </Link>
        </MenuItem>
      </Menu>
    </>
  );
}
