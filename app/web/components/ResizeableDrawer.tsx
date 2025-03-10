import { KeyboardArrowLeft, KeyboardArrowRight } from "@mui/icons-material";
import { styled } from "@mui/material";
import { useTranslation } from "i18n";
import { GLOBAL } from "i18n/namespaces";
import React from "react";
import { theme } from "theme";

import IconButton from "./IconButton";

export const DEFAULT_DRAWER_WIDTH = 400;

interface ResizeableDrawerProps {
  children: React.ReactNode;
  onDrawerWidthChange: (width: number) => void;
  showDragger?: boolean;
}

const DrawerContentWrapper = styled("div")(() => ({
  display: "flex",
  flexDirection: "row",
  height: "100%",
  width: "100%",
  position: "relative",
}));

const StyledDragger = styled("div")(({ theme }) => ({
  width: "8px",
  borderLeft: `1px solid ${theme.palette.divider}`,
  backgroundColor: theme.palette.grey[50],
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  position: "relative",
  // overflow: "visible", // @TODO(NA) Do I need this?
}));

const ScrollableContent = styled("div")(({ theme }) => ({
  paddingTop: theme.spacing(2),
  overflowY: "auto",
  overflowX: "hidden",
  height: "100%",
}));

export default function ResizeableDrawer({
  children,
  onDrawerWidthChange,
  showDragger,
}: ResizeableDrawerProps) {
  const { t } = useTranslation([GLOBAL]);

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
          <IconButton
            onClick={handleDrawerExpansion}
            aria-label={t(`global:${isExpanded ? "retract" : "expand"}`)}
            sx={{
              fontSize: "24px",
              backgroundColor: theme.palette.common.white,
              border: `1px solid ${theme.palette.divider}`,
              height: "35px",
              width: "35px",
              zIndex: 100,

              "&:hover": {
                backgroundColor: theme.palette.common.white,
              },
            }}
          >
            {isExpanded ? <KeyboardArrowLeft /> : <KeyboardArrowRight />}
          </IconButton>
        </StyledDragger>
      )}
    </DrawerContentWrapper>
  );
}
