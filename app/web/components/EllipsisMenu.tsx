import { MoreHoriz, SvgIconComponent } from "@mui/icons-material";
import { IconButton, Menu, styled, Typography } from "@mui/material";
import { theme } from "theme";

import { MenuItem } from "./Menu";

export interface EllipsisMenuItem {
  icon: SvgIconComponent;
  label: string;
  onClick: () => unknown;
  id?: string;
  shouldCloseMenu?: boolean;
}

interface EllipsisMenuProps {
  idName: string;
  isMenuOpen: boolean;
  menuAnchorEl: Element | null;
  onMenuOpen: (event: React.MouseEvent<HTMLButtonElement>) => void;
  onMenuClose: (event: React.MouseEvent<HTMLLIElement>) => void;
  items: EllipsisMenuItem[];
}

const MenuWrapper = styled("div")(() => ({
  display: "flex",
  justifyContent: "flex-end",
  flexDirection: "column",
}));

const EllipsisMenu = ({
  idName,
  isMenuOpen,
  menuAnchorEl,
  onMenuOpen,
  onMenuClose,
  items,
}: EllipsisMenuProps) => {
  return (
    <MenuWrapper>
      <>
        <IconButton
          aria-controls={isMenuOpen ? `${idName}-more-options` : undefined}
          aria-haspopup="true"
          aria-expanded={isMenuOpen ? "true" : undefined}
          id={`${idName}-more-options`}
          data-testid={`${idName}-more-options`}
          onClick={onMenuOpen}
          size="large"
        >
          <MoreHoriz fontSize="small" />
        </IconButton>
        <Menu
          anchorEl={menuAnchorEl}
          id={`${idName}-more-options`}
          data-testid={`${idName}-more-options`}
          open={isMenuOpen}
          onClose={onMenuClose}
          slotProps={{
            paper: {
              elevation: 0,
              sx: {
                overflow: "visible",
                filter: "drop-shadow(0px 2px 8px rgba(0,0,0,0.32))",
                mt: 1.5,
                "& .MuiAvatar-root": {
                  width: 32,
                  height: 32,
                  ml: -0.5,
                  mr: 1,
                },
                "&::before": {
                  content: '""',
                  display: "block",
                  position: "absolute",
                  top: 0,
                  right: 14,
                  width: 10,
                  height: 10,
                  bgcolor: "var(--mui-palette-background-paper)",
                  transform: "translateY(-50%) rotate(45deg)",
                  zIndex: 0,
                },
              },
            },
          }}
          transformOrigin={{ horizontal: "right", vertical: "top" }}
          anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
        >
          {items.map((item, index) => (
            <MenuItem
              key={index}
              onClick={(e) => {
                if (item.shouldCloseMenu !== false) {
                  onMenuClose(e);
                }
                item.onClick();
              }}
              {...(item.id
                ? {
                    id: `${idName}-${item.id}`,
                    "data-testid": `${idName}-${item.id}`,
                  }
                : {})}
            >
              <item.icon fontSize="small" />
              <Typography
                variant="body2"
                sx={{ marginLeft: theme.spacing(1), fontWeight: 500 }}
              >
                {item.label}
              </Typography>
            </MenuItem>
          ))}
        </Menu>
      </>
    </MenuWrapper>
  );
};

export default EllipsisMenu;
