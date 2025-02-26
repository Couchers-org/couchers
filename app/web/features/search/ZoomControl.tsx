import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import { Box, IconButton, styled } from "@mui/material";
import React from "react";
import { MapRef } from "react-map-gl/maplibre";

interface ZoomControlProps {
  mapRef: React.RefObject<MapRef>;
  onZoomIn: (newZoom: number) => void;
  onZoomOut: (newZoom: number) => void;
}

const StyledIconButton = styled(IconButton)(({ theme }) => ({
  "&:hover": {
    borderRadius: 2,
  },
}));

const ZoomControl: React.FC<ZoomControlProps> = ({
  mapRef,
  onZoomIn,
  onZoomOut,
}) => {
  const handleZoomIn = () => {
    if (mapRef.current) {
      const map = mapRef.current.getMap();
      const newZoom = Math.min(map.getZoom() + 1, 14); // Don't go higher than zoom level 14

      map.zoomIn();
      onZoomIn(newZoom);
    }
  };

  const handleZoomOut = () => {
    if (mapRef.current) {
      const map = mapRef.current.getMap();
      const newZoom = Math.min(map.getZoom() - 1, 1); // don't go lower than zoom level 1

      map.zoomOut();
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
