import { MoreHoriz } from "@mui/icons-material";
import { IconButton, Menu, styled } from "@mui/material";

interface EllipsisMenuProps {
  children: React.ReactNode;
  idName: string;
  isMenuOpen: boolean;
  menuAnchorEl: Element | null;
  onMenuOpen: (event: React.MouseEvent<HTMLButtonElement>) => void;
  onMenuClose: (event: React.MouseEvent<HTMLButtonElement>) => void;
}

const MenuWrapper = styled("div")(({ theme }) => ({
  display: "flex",
  justifyContent: "flex-end",
  flexDirection: "column",
}));

//** @param {children} should be the  MenuItems */
const EllipsisMenu = ({
  children,
  idName,
  isMenuOpen,
  menuAnchorEl,
  onMenuOpen,
  onMenuClose,
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
                  bgcolor: "background.paper",
                  transform: "translateY(-50%) rotate(45deg)",
                  zIndex: 0,
                },
              },
            },
          }}
          transformOrigin={{ horizontal: "right", vertical: "top" }}
          anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
        >
          {children}
        </Menu>
      </>
    </MenuWrapper>
  );
};

export default EllipsisMenu;
