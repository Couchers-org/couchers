import { DragHandleOutlined } from "@mui/icons-material";
import { Drawer, styled } from "@mui/material";
import React, { useCallback } from "react";

const defaultDrawerWidth = 400;
const minDrawerWidth = 150;
const maxDrawerWidth = 1200;

interface ResizeableDrawerProps {
  children: React.ReactNode;
}

interface MouseEventHandler {
  (e: MouseEvent): void;
}

const StyledDragger = styled("div")(({ theme }) => ({
  width: "8px",
  cursor: "col-resize",
  borderLeft: `1px solid ${theme.palette.divider}`,
  backgroundColor: theme.palette.grey[50],
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  "& svg": {
    fontSize: 24,
    color: theme.palette.grey[600],
  },
}));

const DrawerContentWrapper = styled("div")(() => ({
  display: "flex",
  flexDirection: "row",
  height: "100%",
}));

const ScrollableContent = styled("div")(({ theme }) => ({
  flexGrow: 1, // Take up remaining space
  padding: theme.spacing(2),
  overflowY: "auto",
  overflowX: "hidden",
  height: "100%",
}));

export default function ResizeableDrawer({ children }: ResizeableDrawerProps) {
  const [drawerWidth, setDrawerWidth] = React.useState(defaultDrawerWidth);

  const handleMouseDown = () => {
    document.addEventListener("mouseup", handleMouseUp, true);
    document.addEventListener("mousemove", handleMouseMove, true);
  };

  const handleMouseUp = () => {
    document.removeEventListener("mouseup", handleMouseUp, true);
    document.removeEventListener("mousemove", handleMouseMove, true);
  };

  const handleMouseMove: MouseEventHandler = useCallback((e) => {
    const newWidth = e.clientX - document.body.offsetLeft;
    if (newWidth > minDrawerWidth && newWidth < maxDrawerWidth) {
      setDrawerWidth(newWidth);
    }
  }, []);

  return (
    <Drawer
      variant="permanent"
      PaperProps={{
        style: {
          width: drawerWidth,
          position: "absolute", // Ensure it respects top
        },
      }}
      sx={{ flexShrink: 0 }}
    >
      <DrawerContentWrapper>
        <ScrollableContent>{children}</ScrollableContent>
        <StyledDragger onMouseDown={handleMouseDown}>
          <DragHandleOutlined sx={{ rotate: "90deg", zIndex: 10 }} />
        </StyledDragger>
      </DrawerContentWrapper>
    </Drawer>
  );
}
