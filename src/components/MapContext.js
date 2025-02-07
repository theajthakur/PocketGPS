import { createContext, useContext, useState } from "react";

const MapContext = createContext();

export function MapProvider({ children }) {
  const [map, setMap] = useState(null);
  const [marker, setMarker] = useState(null);

  return (
    <MapContext.Provider value={{ map, setMap, marker, setMarker }}>
      {children}
    </MapContext.Provider>
  );
}

export function useMap() {
  return useContext(MapContext);
}
