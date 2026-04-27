import { useEffect, useMemo } from "react";
import L from "leaflet";
import {
  CircleMarker,
  MapContainer,
  Marker,
  Polyline,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";
import type { LatLngExpression, LatLngTuple } from "leaflet";
import type { PlannedRoutesResponse, RouteRecommendation } from "@/lib/types";

type DecoratedRoute = RouteRecommendation & {
  color: string;
};

type Props = {
  planResult: PlannedRoutesResponse | null;
  routes: DecoratedRoute[];
  selectedKind: RouteRecommendation["kind"];
  heightClassName?: string;
  interactive?: boolean;
};

const tileUrl = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

export function RouteMapCanvas({
  planResult,
  routes,
  selectedKind,
  heightClassName = "h-[320px]",
  interactive = true,
}: Props) {
  const selectedRoute = routes.find((route) => route.kind === selectedKind) ?? routes[0] ?? null;

  const allPoints = useMemo(() => {
    if (!planResult) {
      return [] as LatLngTuple[];
    }

    const points: LatLngTuple[] = [[planResult.origin.lat, planResult.origin.lng], [planResult.destination.lat, planResult.destination.lng]];

    for (const route of routes) {
      for (const point of route.route.geometry?.coordinates ?? []) {
        if (point.length >= 2) {
          points.push([point[1], point[0]]);
        }
      }
    }

    return points;
  }, [planResult, routes]);

  const center = useMemo<LatLngExpression>(() => {
    if (allPoints.length === 0) {
      return [21.0285, 105.8542];
    }

    const lat = allPoints.reduce((sum, point) => sum + point[0], 0) / allPoints.length;
    const lng = allPoints.reduce((sum, point) => sum + point[1], 0) / allPoints.length;
    return [lat, lng];
  }, [allPoints]);

  const originIcon = useMemo(() => createPinIcon("#2563eb", "A"), []);
  const destinationIcon = useMemo(() => createPinIcon("#10b981", "B"), []);

  if (!planResult) {
    return (
      <div className={`flex items-center justify-center bg-[#eef4ea] px-6 text-sm text-slate-500 ${heightClassName}`}>
        Bản đồ sẽ hiện khi có kết quả định tuyến.
      </div>
    );
  }

  return (
    <div className={`overflow-hidden ${heightClassName}`}>
      <MapContainer
        center={center}
        zoom={14}
        scrollWheelZoom={interactive}
        dragging={interactive}
        doubleClickZoom={interactive}
        touchZoom={interactive}
        zoomControl={interactive}
        attributionControl={false}
        className="h-full w-full"
      >
        <TileLayer
          url={tileUrl}
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <FitBounds points={allPoints} />

        {routes.map((route) => {
          const positions = toLatLngs(route.route.geometry?.coordinates ?? []);
          if (positions.length < 2) {
            return null;
          }

          const active = route.kind === selectedKind;
          return (
            <Polyline
              key={route.kind}
              positions={positions}
              pathOptions={{
                color: route.color,
                weight: active ? 7 : 5,
                opacity: active ? 0.95 : 0.55,
                dashArray: active ? undefined : "10 10",
                lineCap: "round",
                lineJoin: "round",
              }}
            />
          );
        })}

        <Marker position={[planResult.origin.lat, planResult.origin.lng]} icon={originIcon}>
          <Popup>{planResult.origin.label}</Popup>
        </Marker>
        <Marker
          position={[planResult.destination.lat, planResult.destination.lng]}
          icon={destinationIcon}
        >
          <Popup>{planResult.destination.label}</Popup>
        </Marker>

        {selectedRoute ? (
          <>
            <CircleMarker
              center={[planResult.origin.lat, planResult.origin.lng]}
              radius={14}
              pathOptions={{ color: selectedRoute.color, opacity: 0.35, fillOpacity: 0.12 }}
            />
            <CircleMarker
              center={[planResult.destination.lat, planResult.destination.lng]}
              radius={14}
              pathOptions={{ color: selectedRoute.color, opacity: 0.35, fillOpacity: 0.12 }}
            />
          </>
        ) : null}
      </MapContainer>
    </div>
  );
}

function FitBounds({ points }: { points: LatLngTuple[] }) {
  const map = useMap();

  useEffect(() => {
    if (points.length >= 2) {
      map.fitBounds(points, {
        padding: [32, 32],
        maxZoom: 16,
      });
    } else if (points.length === 1) {
      map.setView(points[0], 15);
    }
  }, [map, points]);

  return null;
}

function toLatLngs(coordinates: number[][]): LatLngTuple[] {
  return coordinates
    .filter((point) => point.length >= 2)
    .map((point) => [point[1], point[0]]);
}

function createPinIcon(color: string, label: string) {
  return L.divIcon({
    className: "",
    html: `
      <div style="position: relative; width: 28px; height: 28px;">
        <div style="
          position: absolute;
          inset: 0;
          border-radius: 9999px;
          background: ${color};
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 700;
          border: 3px solid white;
          box-shadow: 0 2px 8px rgba(15, 23, 42, 0.22);
        ">${label}</div>
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}
