import { KeyboardArrowLeft, KeyboardArrowRight } from "@mui/icons-material";
import { styled } from "@mui/material";
import React from "react";

export const DEFAULT_DRAWER_WIDTH = 400;

interface ResizeableDrawerProps {
  children: React.ReactNode;
  onDrawerWidthChange: (width: number) => void;
  showDragger?: boolean;
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
  showDragger,
}: ResizeableDrawerProps) {
  const [isExpanded, setIsExpanded] = React.useState(false);

  const handleDrawerExpansion = () => {
    setIsExpanded(!isExpanded);

    onDrawerWidthChange(
      isExpanded ? DEFAULT_DRAWER_WIDTH : Math.floor(window?.innerWidth * 0.6),
    );
  };

  return (
    <DrawerContentWrapper>
      <ScrollableContent>{children}</ScrollableContent>
      {showDragger && (
        <StyledDragger>
          {isExpanded ? (
            <KeyboardArrowLeft
              onClick={handleDrawerExpansion}
              sx={{ fontSize: "24px", "&:hover": { cursor: "pointer" } }}
            />
          ) : (
            <KeyboardArrowRight
              onClick={handleDrawerExpansion}
              sx={{ fontSize: "24px", "&:hover": { cursor: "pointer" } }}
            />
          )}
        </StyledDragger>
      )}
    </DrawerContentWrapper>
  );
}
