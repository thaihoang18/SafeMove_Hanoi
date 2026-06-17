import { Search, MapPin } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { PlaceCatalogItem } from "@/lib/guest-exercise-places";
import "../styles/demo-search.css";

type Props = {
  locations: PlaceCatalogItem[];
  currentPosition?: Coordinates | null;
  onSelectLocation: (location: PlaceCatalogItem) => void;
  onRequireLogin?: () => void;
};

type Coordinates = {
  lat: number;
  lng: number;
};

const SEARCH_POSITION_CACHE_KEY = "safemove:search-position";
const SEARCH_POSITION_CACHE_TTL_MS = 10 * 60 * 1000;

function loadCachedSearchPosition(): Coordinates | null {
  try {
    const cached = JSON.parse(localStorage.getItem(SEARCH_POSITION_CACHE_KEY) ?? "null") as {
      position?: Coordinates;
      cachedAt?: number;
    } | null;

    if (
      cached?.position &&
      typeof cached.position.lat === "number" &&
      typeof cached.position.lng === "number" &&
      typeof cached.cachedAt === "number" &&
      Date.now() - cached.cachedAt < SEARCH_POSITION_CACHE_TTL_MS
    ) {
      return cached.position;
    }
  } catch {
    // Ignore unavailable or malformed browser storage.
  }

  return null;
}

function storeSearchPosition(position: Coordinates) {
  try {
    localStorage.setItem(
      SEARCH_POSITION_CACHE_KEY,
      JSON.stringify({ position, cachedAt: Date.now() })
    );
  } catch {
    // Distance display still works when browser storage is unavailable.
  }
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusKm * c;
}

function getFilterType(location: PlaceCatalogItem): "park" | "gym" | "sports" {
  if (location.filter_type) {
    return location.filter_type;
  }

  const haystack = [location.name, location.location_type, location.categories, location.description]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (/(cong vien|park|garden|outdoor)/.test(haystack)) {
    return "park";
  }

  if (/(stadium|court|track|arena|sports complex|sport|gymnastics|boxing|martial arts|badminton|tennis|basketball|football|futsal|swimming|pool)/.test(haystack)) {
    return "sports";
  }

  return "gym";
}

const CARD_IMAGES: Record<"gym" | "park" | "sports", string> = {
  gym: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=240&q=80",
  park: "https://static.vinwonders.com/production/cong-vien-1.jpg",
  sports: "https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=240&q=80",
};

function getSpotCardImage(location: PlaceCatalogItem) {
  return CARD_IMAGES[getFilterType(location)];
}

export function SearchLocationsView({
  locations,
  currentPosition: initialPosition,
  onSelectLocation,
  onRequireLogin,
}: Props) {
  void onRequireLogin;
  const [searchKeyword, setSearchKeyword] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "park" | "gym" | "sports">("all");
  const [pageIndex, setPageIndex] = useState<number>(1);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const [currentPosition, setCurrentPosition] = useState<Coordinates | null>(
    () => loadCachedSearchPosition() ?? initialPosition ?? null
  );

  const removeDiacritics = (str: string) => {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D");
  };

  const filteredLocations = locations.filter((loc) => {
    const query = removeDiacritics(searchKeyword.toLowerCase().trim());
    const name = removeDiacritics(loc.name.toLowerCase());
    const matchesKeyword = query === "" || name.includes(query);
    
    if (activeFilter === "all") return matchesKeyword;

    const matchesType = getFilterType(loc) === activeFilter;

    return matchesKeyword && matchesType;
  });

  const itemsPerPage = 5;
  const pageCount = filteredLocations.length <= 10 ? 1 : 1 + Math.ceil((filteredLocations.length - 10) / itemsPerPage);
  const visibleCount = Math.min(
    filteredLocations.length,
    pageIndex === 1 ? 10 : 10 + (pageIndex - 1) * itemsPerPage
  );

  // Use the app-level position immediately while a fresher GPS fix is requested.
  useEffect(() => {
    if (initialPosition) {
      setCurrentPosition((current) => current ?? initialPosition);
    }
  }, [initialPosition]);

  // Resolve a cached/low-power fix quickly, then improve accuracy in the background.
  useEffect(() => {
    if (!navigator?.geolocation) return;
    let mounted = true;

    const applyPosition = (position: GeolocationPosition) => {
      if (!mounted) return;
      const nextPosition = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      };
      setCurrentPosition(nextPosition);
      storeSearchPosition(nextPosition);
    };
    const ignoreError = () => {
      // Keep showing the immediate cached/app-level distance.
    };

    navigator.geolocation.getCurrentPosition(applyPosition, ignoreError, {
      enableHighAccuracy: false,
      maximumAge: 5 * 60 * 1000,
      timeout: 900,
    });
    navigator.geolocation.getCurrentPosition(applyPosition, ignoreError, {
      enableHighAccuracy: true,
      maximumAge: 60 * 1000,
      timeout: 5000,
    });

    return () => { mounted = false; };
  }, []);

  // Reset pagination when filters/search change
  useEffect(() => {
    setPageIndex(1);
  }, [searchKeyword, activeFilter, locations]);

  const loadMorePage = () => {
    setPageIndex((current) => Math.min(pageCount, current + 1));
  };

  // IntersectionObserver to load more when sentinel becomes visible
  useEffect(() => {
    const root = scrollContainerRef.current;
    const sentinel = sentinelRef.current;
    if (!root || !sentinel) return;

    const obs = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          setPageIndex((current) => Math.min(pageCount, current + 1));
        }
      }
    }, { root, rootMargin: '200px' });

    obs.observe(sentinel);
    return () => obs.disconnect();
  }, [pageCount]);

  return (
    <div className="demo-search-container">
      {/* Sticky Search Header */}
      <div className="search-sticky-header">
        <div className="search-input-wrapper">
          <Search size={16} className="search-bar-icon" />
          <input
            type="text"
            className="search-input"
          placeholder="スポットを検索..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
          />
        </div>

        <div className="filter-row">
          <button
            className={`filter-tag ${activeFilter === "all" ? "active" : ""}`}
            onClick={() => setActiveFilter("all")}
          >
            すべて
          </button>
          <button
            className={`filter-tag ${activeFilter === "park" ? "active" : ""}`}
            onClick={() => setActiveFilter("park")}
          >
            公園
          </button>
          <button
            className={`filter-tag ${activeFilter === "gym" ? "active" : ""}`}
            onClick={() => setActiveFilter("gym")}
          >
            ジム
          </button>
          <button
            className={`filter-tag ${activeFilter === "sports" ? "active" : ""}`}
            onClick={() => setActiveFilter("sports")}
          >
            スポーツ
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="search-scrollable-content" ref={scrollContainerRef}>
          <h3 className="section-title">
            検索結果 {filteredLocations.length > 0 && `(${filteredLocations.length})`}
          </h3>

        <div className="result-list">
          {filteredLocations.length > 0 ? (
            filteredLocations.slice(0, visibleCount).map((location) => (
              <div
                key={location.id}
                className={`spot-card ${location.is_japan_friendly === true ? "has-japan-friendly" : ""}`}
                onClick={() => onSelectLocation(location)}
              >
                <img src={getSpotCardImage(location)} alt={location.name} className="spot-img" loading="lazy" />
                {location.is_japan_friendly === true && (
                  <span className="japan-badge">日本語対応</span>
                )}

                <div className="spot-info-mid">
                  <h4 className="spot-name">{location.name}</h4>
                  <span className="distance-tag">
                    {(() => {
                      if (typeof location.distance_km === 'number') return `${location.distance_km.toFixed(1)} km`;
                      if (currentPosition && typeof location.lat === 'number' && typeof location.lng === 'number') {
                        const km = haversineKm(currentPosition.lat, currentPosition.lng, location.lat, location.lng);
                        return `${km.toFixed(1)} km`;
                      }
                      return '距離なし';
                    })()}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="no-results">
              <MapPin size={32} className="no-results-icon" />
              <p>スポットが見つかりません</p>
              <small>検索条件またはフィルターを調整してください</small>
            </div>
          )}
          {filteredLocations.length > 0 && (
            <div className="pagination-footer">
              <span className="pagination-summary">
                {Math.min(visibleCount, filteredLocations.length)} / {filteredLocations.length} 件を表示
              </span>
              {pageIndex < pageCount && (
                <button className="load-more-btn" type="button" onClick={loadMorePage}>
                  さらに 5 件表示
                </button>
              )}
            </div>
          )}
          {/* sentinel for infinite scroll */}
          <div ref={sentinelRef} style={{ height: 1 }} />
        </div>
      </div>
    </div>
  );
}
