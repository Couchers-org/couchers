import React from "react";

import { createControlComponent } from "@react-leaflet/core";
import L, { ControlOptions } from "leaflet";
import ReactDOMServer from "react-dom/server";

interface MapSearchProps extends ControlOptions {
  color: string;
}

function MapSearch({ color }: MapSearchProps) {
  return <div style={{ width: 50, height: 50, backgroundColor: color }} />;
}

//const MapSearchControl = L.Control.extend({

//});

class MapSearchControl extends L.Control {
  props: MapSearchProps;
  constructor(props: MapSearchProps) {
    super({ position: props?.position });
    this.props = props;
  }
  onAdd() {
    const container = L.DomUtil.create("div");
    const element = ReactDOMServer.renderToString(
      <MapSearch {...this.props} />
    );
    container.innerHTML = element;
    return container;
  }
}

export default createControlComponent<MapSearchControl, MapSearchProps>(
  (props) => new MapSearchControl(props)
);
