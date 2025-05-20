import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import { Box, IconButton, styled } from "@mui/material";
import React from "react";
import { MapRef } from "react-map-gl/maplibre";

import { MAX_ZOOM_LEVEL, MIN_ZOOM_LEVEL } from "./utils/constants";

interface ZoomControlProps {
  mapRef: React.RefObject<MapRef>;
  onZoomIn: (newZoom: number) => void;
  onZoomOut: (newZoom: number) => void;
  isZoomFromControlRef: React.MutableRefObject<boolean>;
}

const StyledIconButton = styled(IconButton)(({ theme }) => ({
  [theme.breakpoints.down("md")]: {
    width: 26,
    height: 26,
  },

  "&:hover": {
    borderRadius: 2,
  },
}));

const ZoomControl = ({
  mapRef,
  onZoomIn,
  onZoomOut,
  isZoomFromControlRef,
}: ZoomControlProps) => {
  const handleZoomIn = () => {
    if (mapRef.current) {
      const map = mapRef.current.getMap();
      const currentMapZoom = map.getZoom();
      const newZoom = Math.min(currentMapZoom + 2, MAX_ZOOM_LEVEL);
      onZoomIn(newZoom);
    }
  };

  const handleZoomOut = () => {
    if (mapRef.current) {
      const map = mapRef.current.getMap();
      const currentMapZoom = map.getZoom();
      const newZoom = Math.max(currentMapZoom - 2, MIN_ZOOM_LEVEL);
      onZoomOut(newZoom);
    }
  };

  return (
    <Box
      sx={{
        position: "absolute",
        top: 10,
        right: 10,
        display: "flex",
        flexDirection: "column",
        backgroundColor: "white",
        borderRadius: 2,
        boxShadow: 3,
        zIndex: 2,
      }}
      ref={isZoomFromControlRef}
    >
      <StyledIconButton onClick={handleZoomIn} size="small">
        <AddIcon />
      </StyledIconButton>
      <StyledIconButton onClick={handleZoomOut} size="small">
        <RemoveIcon />
      </StyledIconButton>
    </Box>
  );
};

export default ZoomControl;
