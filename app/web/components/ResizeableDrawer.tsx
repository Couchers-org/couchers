import { DragHandleOutlined } from "@mui/icons-material";
import { styled } from "@mui/material";
import React, { useCallback } from "react";

const minDrawerWidth = 150;
const maxDrawerWidth = 1200;

interface ResizeableDrawerProps {
  children: React.ReactNode;
  onDrawerWidthChange: (width: number) => void;
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
  width: "100%",
}));

const ScrollableContent = styled("div")(({ theme }) => ({
  flexGrow: 1, // Take up remaining space
  padding: theme.spacing(2),
  overflowY: "auto",
  overflowX: "hidden",
  height: "100%",
}));

export default function ResizeableDrawer({
  children,
  onDrawerWidthChange,
}: ResizeableDrawerProps) {
  const handleMouseDown = () => {
    document.addEventListener("mouseup", handleMouseUp, true);
    document.addEventListener("mousemove", handleMouseMove, true);
  };

  const handleMouseUp = () => {
    document.removeEventListener("mouseup", handleMouseUp, true);
    document.removeEventListener("mousemove", handleMouseMove, true);
  };

  const handleMouseMove: MouseEventHandler = useCallback(
    (e) => {
      const newWidth = e.clientX - document.body.offsetLeft;
      if (newWidth > minDrawerWidth && newWidth < maxDrawerWidth) {
        onDrawerWidthChange(newWidth);
      }
    },
    [onDrawerWidthChange],
  );

  return (
    <DrawerContentWrapper>
      <ScrollableContent>{children}</ScrollableContent>
      <StyledDragger onMouseDown={handleMouseDown}>
        <DragHandleOutlined sx={{ rotate: "90deg" }} />
      </StyledDragger>
    </DrawerContentWrapper>
  );
}
