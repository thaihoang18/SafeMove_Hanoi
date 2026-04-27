const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";

export type LookupItem = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
};

type BootstrapResponse = {
  ok: boolean;
  activities: LookupItem[];
  healthConditions: LookupItem[];
};

export async function fetchBootstrapData() {
  const response = await fetch(`${API_BASE_URL}/api/bootstrap`);

  if (!response.ok) {
    throw new Error(`Bootstrap request failed with status ${response.status}`);
  }

  return (await response.json()) as BootstrapResponse;
}

export async function fetchDatabaseHealth() {
  const response = await fetch(`${API_BASE_URL}/api/health`);

  if (!response.ok) {
    throw new Error(`Health request failed with status ${response.status}`);
  }

  return response.json();
}
