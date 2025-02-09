import React, { useEffect, useState, useCallback, useRef } from "react";
import Loader from "./Loader";
import "./style/map.css";
import { FaWrench, FaArrowUp, FaArrowDown } from "react-icons/fa";
export default function Map() {
  const [pos, setPos] = useState(null);
  const [map, setMap] = useState(null);
  const [linePath, setLinePath] = useState([]);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [checkpointDistance, setCheckpointDistance] = useState(0);
  const [totalDistance, setTotalDistance] = useState(0);
  const [totalDisplacement, setTotalDisplacement] = useState(0);
  const markerRef = useRef(null);
  const lineRef = useRef(null);
  const [statsView, setStatsView] = useState(true);
  const [pathToProcess, setPathToProcess] = useState(10);

  const statsViewerToggle = () => {
    const trgt = document.getElementsByClassName("stats-child")[0];
    if (trgt) {
      if (statsView) {
        setStatsView(false);
        trgt.style.height = "0";
        trgt.style.overflow = "hidden";
      } else {
        setStatsView(true);
        trgt.style.height = "200px";
        trgt.style.overflow = "auto";
      }
    } else {
      alert("No Div found!");
    }
  };
  useEffect(() => {
    if (!window.google) {
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.REACT_APP_GOOGLE_MAP_API}&map_ids=YOUR_MAP_ID&v=beta&libraries=marker`;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
      script.onload = () => setIsMapLoaded(true);
    } else {
      setIsMapLoaded(true);
    }
  }, []);

  // Initialize map, marker, and polyline
  useEffect(() => {
    if (!isMapLoaded || !pos) return;
    if (map) return;

    const mapInstance = new window.google.maps.Map(
      document.getElementById("map"),
      {
        center: pos,
        zoom: 20,
        mapId: "YOUR_MAP_ID",
      }
    );
    setMap(mapInstance);
    // const imageMarker = document.createElement("img");
    // imageMarker.src = "/PocketGPS/marker.gif";
    // imageMarker.width = "50";
    // imageMarker.style.mixBlendMode = "screen";
    markerRef.current = new window.google.maps.marker.AdvancedMarkerElement({
      map: mapInstance,
      position: pos,
      title: "You are here!",
      id: "user-location-marker",
      // content: imageMarker,
    });

    lineRef.current = new window.google.maps.Polyline({
      map: mapInstance,
      path: linePath,
      geodesic: true,
      strokeColor: "#FF0000",
      strokeOpacity: 1.0,
      strokeWeight: 2,
    });
  }, [isMapLoaded, pos]);

  function haversineDistance(coords1, coords2) {
    if (!coords1 || !coords2 || !coords1.lat || !coords2.lng) return;
    const toRadians = (degrees) => degrees * (Math.PI / 180);

    const lat1 = toRadians(coords1.lat);
    const lng1 = toRadians(coords1.lng);
    const lat2 = toRadians(coords2.lat);
    const lng2 = toRadians(coords2.lng);

    const dlat = lat2 - lat1;
    const dlng = lng2 - lng1;

    const a =
      Math.sin(dlat / 2) ** 2 +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(dlng / 2) ** 2;

    const c = 2 * Math.asin(Math.sqrt(a));

    const R = 6371;
    return R * c * 1000;
  }

  const moveMarkerSmoothly = useCallback(
    (startPos, endPos) => {
      const steps = 50;
      let curStep = 0;

      const animate = setInterval(() => {
        const newPosition = interpolate(startPos, endPos, ++curStep / steps);
        if (markerRef.current) {
          markerRef.current.position = newPosition;
        }

        if (curStep === steps) {
          endPos.time = Date.now();
          curStep = 0;
          clearInterval(animate);
          setLinePath((prevPath) => {
            const pathLength = prevPath.length;
            if (pathLength >= 2) {
              const dist = haversineDistance(
                prevPath[pathLength - 1],
                prevPath[pathLength - 2]
              );
              setCheckpointDistance(dist);
              setTotalDisplacement(
                parseInt(
                  haversineDistance(prevPath[pathLength - 1], prevPath[0])
                )
              );
              if (dist < 5) {
                return [...prevPath.slice(0, -1), endPos];
              }
              setTotalDistance((d) => d + dist);
            }
            if (prevPath.length > 50) {
            }
            return [...prevPath, endPos];
          });
        }
      }, 10);
    },
    [checkpointDistance]
  );

  useEffect(() => {
    if (!lineRef.current) return;
    lineRef.current.setPath(linePath);

    if (linePath.length >= pathToProcess) {
      (async () => {
        const start = Math.max(0, pathToProcess - 20); // Ensure non-negative slicing
        const data = await coordsToSnapRoad(
          linePath.slice(start, pathToProcess)
        );

        setLinePath((prevPath) => {
          const newArray = [
            ...prevPath.slice(0, start),
            ...data,
            ...prevPath.slice(pathToProcess),
          ];
          return newArray;
        });

        setPathToProcess((prev) => prev + 20); // Move to next batch
      })();
    }
  }, [linePath]);

  useEffect(() => {
    if (!isMapLoaded) return;

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const newPos = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setPos((prevPos) => {
          if (prevPos) {
            moveMarkerSmoothly(prevPos, newPos);
          } else {
            newPos.time = Date.now();
            setLinePath([newPos]);
          }
          return newPos;
        });
      },
      (error) => {
        alert("Location access denied or not available.");
      },
      { enableHighAccuracy: true, maximumAge: 0 }
    );

    return () => navigator.geolocation.clearWatch(watchId); // Cleanup watch
  }, [isMapLoaded, moveMarkerSmoothly]);

  // Interpolate between two positions
  const interpolate = (start, end, factor) => {
    return {
      lat: start.lat + (end.lat - start.lat) * factor,
      lng: start.lng + (end.lng - start.lng) * factor,
    };
  };

  const coordsToSnapRoad = async () => {
    try {
      const mappedCoords = linePath.map((e) => `${e.lat},${e.lng}`).join("|");

      const url = `https://roads.googleapis.com/v1/snapToRoads?path=${mappedCoords}&interpolate=true&key=${process.env.REACT_APP_GOOGLE_MAP_API}`;

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data;
      // const snappedPoints = data?.snappedPoints || [];

      // setLinePath([
      //   ...snappedPoints.map(({ location }) => ({
      //     lat: location.latitude,
      //     lng: location.longitude,
      //   })),
      //   { lat: pos.lat, lng: pos.lng },
      // ]);
    } catch (error) {
      console.error("Error snapping to road:", error);
    }
  };

  return (
    <div className="map-container">
      {pos ? (
        <div>
          <div id="map"></div>
          <div className="statistics">
            <div className="row p-0 stats-child">
              <div className="col-6 col-sm-8 col-lg-3 p-0">
                <div className="h-100 d-inline-flex justify-content-center align-items-center bg-primary w-100 pt-3">
                  <div className="text-center">
                    <h3>
                      {totalDisplacement > 1000
                        ? `${(totalDisplacement / 1000).toFixed(1)}km`
                        : `${totalDisplacement}m`}
                    </h3>
                    <p>Total Displacement</p>
                  </div>
                </div>
              </div>
              <div className="col-6 col-sm-4 col-lg-3 p-0">
                <div className="h-100 d-inline-flex justify-content-center align-items-center bg-success w-100 pt-3">
                  <div className="text-center">
                    <h3>
                      {totalDistance > 1000
                        ? `${(totalDistance / 1000).toFixed(1)}km`
                        : `${parseInt(totalDistance)}m`}
                    </h3>
                    <p>Total Distance</p>
                  </div>
                </div>
              </div>
              <div className="col-6 col-lg-3 p-0">
                <div className="h-100 d-inline-flex justify-content-center align-items-center bg-warning w-100 pt-3">
                  <div className="text-center">
                    <h3>
                      {checkpointDistance > 1000
                        ? `${(checkpointDistance / 1000).toFixed(1)}km`
                        : `${parseInt(checkpointDistance)}m`}
                    </h3>
                    <p>Checkpoint Distance</p>
                  </div>
                </div>
              </div>
              <div className="col-6 col-lg-3  p-0">
                <div className="h-100 d-inline-flex justify-content-center align-items-center bg-info w-100 pt-3">
                  <div className="text-center">
                    <h3>{linePath.length - 1}</h3>
                    <p>Total Checkpoint{linePath.length > 2 ? "s" : ""}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="stats-toggler container py-2 text-center">
              <div className="inner">
                <button
                  onClick={statsViewerToggle}
                  className={
                    statsView
                      ? "btn btn-primary rounded-0"
                      : "btn btn-secondary rounded-0"
                  }
                >
                  {statsView ? <FaArrowUp /> : <FaArrowDown />}
                </button>
                <button
                  className="btn btn-secondary rounded-0"
                  onClick={coordsToSnapRoad}
                >
                  <FaWrench />
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <Loader />
      )}
    </div>
  );
}
