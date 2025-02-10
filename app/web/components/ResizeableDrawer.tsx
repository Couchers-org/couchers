import { DragHandleOutlined } from "@mui/icons-material";
import { Drawer, styled } from "@mui/material";
import React, { useCallback } from "react";

const defaultDrawerWidth = 300;
const minDrawerWidth = 150;
const maxDrawerWidth = 800;

interface ResizeableDrawerProps {
  children: React.ReactNode;
}

interface MouseEventHandler {
  (e: MouseEvent): void;
}
const StyledDragger = styled("div")(({ theme }) => ({
  width: "5px",
  cursor: "col-resize",
  borderTop: `1px solid ${theme.palette.divider}`,
  position: "absolute",
  top: 0,
  right: 0,
  bottom: 0,
  zIndex: 10,
  backgroundColor: theme.palette.grey[50],
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  "& svg": {
    fontSize: 24,
    color: theme.palette.grey[600],
  },
}));

const ContentWrapper = styled("div")(({ theme }) => ({
  padding: theme.spacing(2),
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
      <StyledDragger onMouseDown={() => handleMouseDown()}>
        <DragHandleOutlined sx={{ rotate: "90deg", zIndex: 10 }} />
      </StyledDragger>
      <ContentWrapper>{children}</ContentWrapper>
    </Drawer>
  );
}
