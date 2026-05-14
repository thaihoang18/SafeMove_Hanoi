import rawPlaces from "../../../assets/address/phòng-gym-ở-hà-nội-20-9945353-105-843831-14z-overview.json";

type AssetPlaceRecord = {
  place_id: string;
  name: string;
  description: string | null;
  reviews: number | null;
  rating: number | null;
  website: string | null;
  phone: string | null;
  featured_image: string | null;
  main_category: string | null;
  categories: string | null;
  workday_timing: string | null;
  address: string | null;
  link: string | null;
  query: string | null;
};

export type PlaceCatalogItem = {
  id: string;
  name: string;
  location_type: string;
  address: string | null;
  city: string | null;
  district: string | null;
  lat: number;
  lng: number;
  rating?: number | null;
  reviews?: number | null;
  categories?: string | null;
  workday_timing?: string | null;
  website?: string | null;
  phone?: string | null;
  featured_image?: string | null;
  description?: string | null;
  source?: "backend" | "asset";
};

const assetPlaces = (rawPlaces as AssetPlaceRecord[])
  .map(normalizeAssetPlace)
  .filter((item): item is PlaceCatalogItem => item !== null)
  .sort((left, right) => {
    const ratingDelta = (right.rating ?? 0) - (left.rating ?? 0);
    if (ratingDelta !== 0) return ratingDelta;
    const reviewDelta = (right.reviews ?? 0) - (left.reviews ?? 0);
    if (reviewDelta !== 0) return reviewDelta;
    return left.name.localeCompare(right.name);
  });

export const featuredExercisePlaces = assetPlaces.slice(0, 6);

export function mergeExercisePlaces(basePlaces: PlaceCatalogItem[]) {
  const merged: PlaceCatalogItem[] = [...assetPlaces];
  const seen = new Set(merged.map(createKey));

  for (const place of basePlaces) {
    const key = createKey(place);
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    merged.push(place);
  }

  return merged;
}

function normalizeAssetPlace(record: AssetPlaceRecord): PlaceCatalogItem | null {
  const coordinates = extractCoordinates(record.link, record.query);
  if (!coordinates) {
    return null;
  }

  const addressParts = (record.address ?? "")
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  return {
    id: record.place_id,
    name: record.name,
    location_type: record.main_category ?? record.categories ?? "Exercise",
    address: record.address,
    city: pickCity(addressParts),
    district: pickDistrict(addressParts),
    lat: coordinates.lat,
    lng: coordinates.lng,
    rating: record.rating,
    reviews: record.reviews,
    categories: record.categories,
    workday_timing: record.workday_timing,
    website: record.website,
    phone: record.phone,
    featured_image: record.featured_image,
    description: record.description,
    source: "asset",
  };
}

function extractCoordinates(link: string | null, query: string | null) {
  const sources = [link, query].filter((value): value is string => Boolean(value));

  for (const source of sources) {
    const googleMatch = source.match(/!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/);
    if (googleMatch) {
      return {
        lat: Number(googleMatch[1]),
        lng: Number(googleMatch[2]),
      };
    }

    const queryMatch = source.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
    if (queryMatch) {
      return {
        lat: Number(queryMatch[1]),
        lng: Number(queryMatch[2]),
      };
    }
  }

  return null;
}

function pickDistrict(parts: string[]) {
  if (parts.length >= 3) {
    return parts[1] ?? null;
  }

  if (parts.length >= 2) {
    return parts[0] ?? null;
  }

  return null;
}

function pickCity(parts: string[]) {
  const city = parts.find((part) => /ha noi/i.test(part));
  return city ?? parts.at(-1) ?? null;
}

function createKey(place: PlaceCatalogItem) {
  return `${normalizeText(place.name)}|${normalizeText(place.address ?? "")}`;
}

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}