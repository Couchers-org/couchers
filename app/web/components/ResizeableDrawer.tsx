import { KeyboardDoubleArrowLeft, KeyboardDoubleArrowRight } from "@mui/icons-material";
import { styled } from "@mui/material";
import { useTranslation } from "i18n";
import { GLOBAL } from "i18n/namespaces";
import React from "react";

import IconButton from "./IconButton";

export const DEFAULT_DRAWER_WIDTH = 420;

interface ResizeableDrawerProps {
  children: React.ReactNode;
  nonScrollableChildren?: React.ReactNode;
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

const StyledDragger = styled("div")(() => ({
  width: "8px",
  borderLeft: `1px solid var(--mui-palette-divider)`,
  backgroundColor: "var(--mui-palette-grey-50)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  position: "relative",
}));

const ScrollableContent = styled("div")(() => ({
  overflowY: "auto",
  overflowX: "hidden",
  height: "100%",
  width: "100%",
}));

const FlexColumn = styled("div")({
  display: "flex",
  flexDirection: "column",
  height: "100%",
  width: "100%",
});

export default function ResizeableDrawer({
  children,
  nonScrollableChildren,
  onDrawerWidthChange,
  showDragger,
}: ResizeableDrawerProps) {
  const { t } = useTranslation([GLOBAL]);

  const [isExpanded, setIsExpanded] = React.useState(false);

  const handleDrawerExpansion = () => {
    setIsExpanded(!isExpanded);

    onDrawerWidthChange(isExpanded ? DEFAULT_DRAWER_WIDTH : Math.floor(window?.innerWidth * 0.6));
  };

  return (
    <DrawerContentWrapper>
      <FlexColumn>
        <ScrollableContent>{children}</ScrollableContent>
        {nonScrollableChildren}
      </FlexColumn>
      {showDragger && (
        <StyledDragger>
          <IconButton
            onClick={handleDrawerExpansion}
            aria-label={t(`global:${isExpanded ? "retract" : "expand"}`)}
            sx={(theme) => ({
              fontSize: "24px",
              backgroundColor: "var(--mui-palette-background-paper)",
              border: `1px solid var(--mui-palette-divider)`,
              height: "35px",
              width: "35px",
              zIndex: 100,
              transition: "all 0.2s ease-in-out",
              boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",

              "&:hover": {
                backgroundColor: "var(--mui-palette-grey-50)",
                borderColor: "var(--mui-palette-grey-400)",
                boxShadow: "0 2px 6px rgba(0, 0, 0, 0.15)",
                transform: "scale(1.05)",
              },

              "&:active": {
                transform: "scale(0.98)",
                backgroundColor: "var(--mui-palette-grey-100)",
              },
            })}
          >
            {isExpanded ? (
              <KeyboardDoubleArrowLeft
                sx={{
                  "&:hover": {
                    color: "var(--mui-palette-primary-main)",
                  },
                }}
              />
            ) : (
              <KeyboardDoubleArrowRight
                sx={{
                  "&:hover": {
                    color: "var(--mui-palette-primary-main)",
                  },
                }}
              />
            )}
          </IconButton>
        </StyledDragger>
      )}
    </DrawerContentWrapper>
  );
}
