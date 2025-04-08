import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import { Box, IconButton, styled } from "@mui/material";
import React, { MutableRefObject } from "react";
import { MapRef } from "react-map-gl/maplibre";

import { MAX_ZOOM_LEVEL, MIN_ZOOM_LEVEL } from "./utils/constants";

interface ZoomControlProps {
  mapRef: React.RefObject<MapRef>;
  onZoomIn: (newZoom: number) => void;
  onZoomOut: (newZoom: number) => void;
  ref: MutableRefObject<boolean>;
}

const StyledIconButton = styled(IconButton)(({ theme }) => ({
  "&:hover": {
    borderRadius: 2,
  },
}));

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const ZoomControl: React.FC<ZoomControlProps> = ({
  mapRef,
  onZoomIn,
  onZoomOut,
  ref,
}) => {
  const handleZoomIn = () => {
    if (mapRef.current) {
      delay(1000);
      const map = mapRef.current.getMap();
      const currentMapZoom = map.getZoom();
      const newZoom = Math.min(currentMapZoom + 2, MAX_ZOOM_LEVEL);
      onZoomIn(newZoom);
    }
  };

  const handleZoomOut = () => {
    if (mapRef.current) {
      delay(1000);
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
      ref={ref}
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
