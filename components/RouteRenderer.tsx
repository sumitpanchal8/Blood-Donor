import React, { useEffect, useRef } from 'react';
import { useMap, useMapsLibrary } from '@vis.gl/react-google-maps';
import { interpolatePath } from '../utils';

interface RouteRendererProps {
  origin: { lat: number; lng: number } | null;
  destination: { lat: number; lng: number } | null;
  travelMode?: 'DRIVING' | 'WALKING' | 'TRANSIT';
  strokeColor?: string;
  onRouteComputed?: (info: { distanceMeters: number; durationMillis: number }) => void;
}

export const RouteRenderer: React.FC<RouteRendererProps> = ({
  origin,
  destination,
  travelMode = 'DRIVING',
  strokeColor = '#ef4444',
  onRouteComputed
}) => {
  const map = useMap();
  const routesLib = useMapsLibrary('routes');
  const polylinesRef = useRef<google.maps.Polyline[]>([]);

  useEffect(() => {
    if (!map || !origin || !destination) {
      // Clear polylines
      polylinesRef.current.forEach(p => p.setMap(null));
      polylinesRef.current = [];
      return;
    }

    // Clear previous polylines
    polylinesRef.current.forEach(p => p.setMap(null));
    polylinesRef.current = [];

    let isMounted = true;

    const renderFallbackPolyline = () => {
      if (!map || !isMounted) return;
      const smoothPath = interpolatePath(origin, destination, 30);
      const polyline = new google.maps.Polyline({
        path: smoothPath,
        strokeColor,
        strokeOpacity: 0.85,
        strokeWeight: 6,
        geodesic: true,
        icons: [
          {
            icon: {
              path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
              scale: 3,
              fillColor: strokeColor,
              fillOpacity: 1,
              strokeWeight: 1,
            },
            offset: '50%',
            repeat: '100px'
          }
        ]
      });
      polyline.setMap(map);
      polylinesRef.current = [polyline];

      // Fit map bounds
      const bounds = new google.maps.LatLngBounds();
      bounds.extend(origin);
      bounds.extend(destination);
      map.fitBounds(bounds, { top: 60, right: 60, bottom: 60, left: 60 });
    };

    // Attempt modern Routes API if available
    const computeRoute = async () => {
      try {
        if (routesLib && (routesLib as any).Route?.computeRoutes) {
          const request = {
            origin,
            destination,
            travelMode,
            fields: ['path', 'distanceMeters', 'durationMillis', 'viewport']
          };

          const response = await (routesLib as any).Route.computeRoutes(request);
          if (!isMounted) return;

          const primaryRoute = response.routes?.[0];
          if (primaryRoute) {
            // Render native polyline method
            if (typeof primaryRoute.createPolylines === 'function') {
              const newPolylines = primaryRoute.createPolylines();
              newPolylines.forEach((p: google.maps.Polyline) => {
                p.setOptions({
                  strokeColor,
                  strokeWeight: 6,
                  strokeOpacity: 0.85
                });
                p.setMap(map);
              });
              polylinesRef.current = newPolylines;
            } else if (primaryRoute.path) {
              const polyline = new google.maps.Polyline({
                path: primaryRoute.path,
                strokeColor,
                strokeWeight: 6,
                strokeOpacity: 0.85,
                map
              });
              polylinesRef.current = [polyline];
            }

            if (primaryRoute.viewport) {
              map.fitBounds(primaryRoute.viewport, { top: 60, right: 60, bottom: 60, left: 60 });
            }

            if (onRouteComputed) {
              onRouteComputed({
                distanceMeters: primaryRoute.distanceMeters || 0,
                durationMillis: primaryRoute.durationMillis || 0
              });
            }
            return;
          }
        }
        // Fallback rendering
        renderFallbackPolyline();
      } catch (err) {
        console.warn('Modern Route computeRoutes fell back to smooth polyline:', err);
        renderFallbackPolyline();
      }
    };

    computeRoute();

    return () => {
      isMounted = false;
      polylinesRef.current.forEach(p => p.setMap(null));
      polylinesRef.current = [];
    };
  }, [map, routesLib, origin?.lat, origin?.lng, destination?.lat, destination?.lng, travelMode, strokeColor]);

  return null;
};
