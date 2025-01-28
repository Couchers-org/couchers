import { Button, styled } from "@mui/material";
import Avatar from "components/Avatar";
import { MenuIcon } from "components/Icons";
import Menu from "components/Menu";
import useCurrentUser from "features/userQueries/useCurrentUser";
import React, { Dispatch, ReactNode, SetStateAction } from "react";
import { theme } from "theme";

import ReportButton from "./ReportButton";

const StyledMenu = styled(Menu)(({ theme }) => ({
  "& .MuiPaper-root": {
    boxShadow: theme.shadows[1],
    minWidth: "12rem",
  },

  "& .MuiPopover-root": {
    transform: "translateY(1rem)",
  },
}));

const StyledMenuButton = styled(Button)(({ theme }) => ({
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
}));

const StyledAvatar = styled(Avatar)(({ theme }) => ({
  height: "2rem",
  width: "2rem",
  marginLeft: theme.spacing(1),
}));

const ReportButtonContainer = styled("div")(({ theme }) => ({
  padding: theme.spacing(2),
}));

export default function LoggedInMenu({
  menuOpen,
  setMenuOpen,
  children,
}: {
  menuOpen: boolean;
  setMenuOpen: Dispatch<SetStateAction<boolean>>;
  children: ReactNode;
}) {
  const menuRef = React.useRef<HTMLButtonElement>(null);
  const { data: user } = useCurrentUser();

  return (
    <>
      <ReportButtonContainer>
        <ReportButton />
      </ReportButtonContainer>
      <StyledMenuButton
        aria-controls="navigation-menu"
        aria-haspopup="true"
        onClick={() => setMenuOpen((prevMenuOpen: boolean) => !prevMenuOpen)}
        ref={menuRef}
      >
        <MenuIcon sx={{ color: theme.palette.text.primary }} />
        <StyledAvatar user={user} isProfileLink={false} />
      </StyledMenuButton>
      <StyledMenu
        id="navigation-menu"
        open={menuOpen}
        anchorEl={menuRef.current}
        onClose={() => setMenuOpen(false)}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
      >
        {children}
      </StyledMenu>
    </>
  );
}
