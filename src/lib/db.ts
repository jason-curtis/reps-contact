import type { Representative, ZipDistrict, LookupResult } from "./types";

export async function getRepsByZip(
  db: D1Database,
  zip: string
): Promise<LookupResult> {
  const districts = await db
    .prepare("SELECT state, district, ratio FROM zip_districts WHERE zip = ?")
    .bind(zip)
    .all<ZipDistrict>();

  if (!districts.results.length) {
    return { zip, representatives: [], ambiguous: false, districts: [] };
  }

  const districtList = districts.results.map((d) => ({
    state: d.state,
    district: d.district,
  }));
  const ambiguous = districtList.length > 1;

  // Get senators for the state(s) — deduplicated
  const states = [...new Set(districtList.map((d) => d.state))];
  const statePlaceholders = states.map(() => "?").join(",");

  const senators = await db
    .prepare(
      `SELECT * FROM representatives WHERE type = 'sen' AND state IN (${statePlaceholders}) AND (end_date IS NULL OR end_date > date('now'))`
    )
    .bind(...states)
    .all<Representative>();

  // Build district conditions for batch query
  const districtConditions = districtList
    .map(() => "(state = ? AND district = ?)")
    .join(" OR ");
  const districtParams = districtList.flatMap((d) => [d.state, d.district]);

  const houseReps = await db
    .prepare(
      `SELECT * FROM representatives WHERE type = 'rep' AND (${districtConditions}) AND (end_date IS NULL OR end_date > date('now'))`
    )
    .bind(...districtParams)
    .all<Representative>();

  return {
    zip,
    representatives: [...senators.results, ...houseReps.results],
    ambiguous,
    districts: districtList,
  };
}

export async function getRepsByLatLng(
  db: D1Database,
  lat: number,
  lng: number
): Promise<LookupResult> {
  const url = `https://geocoding.geo.census.gov/geocoder/geographies/coordinates?x=${lng}&y=${lat}&benchmark=Public_AR_Current&vintage=Current_Current&format=json`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  let response: Response;
  try {
    response = await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    throw new Error(`Census geocoder returned ${response.status}`);
  }

  const data = (await response.json()) as {
    result?: {
      geographies?: Record<
        string,
        Array<{ STATE: string; BASENAME: string; [key: string]: string }>
      >;
    };
  };

  // Find congressional district data — try 119th first, then 118th
  const geos = data.result?.geographies;
  const cdKey = geos
    ? Object.keys(geos).find((k) => /Congressional Districts/i.test(k))
    : undefined;
  const congressionalDistricts = cdKey ? geos![cdKey] : undefined;

  if (!congressionalDistricts?.length) {
    return { zip: "", representatives: [], ambiguous: false, districts: [] };
  }

  const cd = congressionalDistricts[0];
  const stateFips = cd.STATE;
  // Try CD119, CD118, or BASENAME for district number
  const districtStr =
    Object.entries(cd).find(([k]) => /^CD\d+$/.test(k))?.[1] ?? cd.BASENAME;
  const districtNum = parseInt(districtStr, 10);

  const stateAbbr = fipsToState(stateFips);
  if (!stateAbbr || isNaN(districtNum)) {
    return { zip: "", representatives: [], ambiguous: false, districts: [] };
  }

  // Batch query — senators and house rep together
  const [senators, houseReps] = await Promise.all([
    db
      .prepare(
        `SELECT * FROM representatives WHERE type = 'sen' AND state = ? AND (end_date IS NULL OR end_date > date('now'))`
      )
      .bind(stateAbbr)
      .all<Representative>(),
    db
      .prepare(
        `SELECT * FROM representatives WHERE type = 'rep' AND state = ? AND district = ? AND (end_date IS NULL OR end_date > date('now'))`
      )
      .bind(stateAbbr, districtNum)
      .all<Representative>(),
  ]);

  return {
    zip: "",
    representatives: [...senators.results, ...houseReps.results],
    ambiguous: false,
    districts: [{ state: stateAbbr, district: districtNum }],
  };
}

export async function getRepsByAddress(
  db: D1Database,
  address: string
): Promise<LookupResult> {
  const url = `https://geocoding.geo.census.gov/geocoder/geographies/address?onelineaddress=${encodeURIComponent(address)}&benchmark=Public_AR_Current&vintage=Current_Current&format=json`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  let response: Response;
  try {
    response = await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    throw new Error(`Census geocoder returned ${response.status}`);
  }

  const data = (await response.json()) as {
    result?: {
      addressMatches?: Array<{
        coordinates?: { x: number; y: number };
        geographies?: Record<
          string,
          Array<{ STATE: string; BASENAME: string; [key: string]: string }>
        >;
      }>;
    };
  };

  const match = data.result?.addressMatches?.[0];
  if (!match) {
    return { zip: "", representatives: [], ambiguous: false, districts: [] };
  }

  // Extract congressional district from geographies
  const geos = match.geographies;
  const cdKey = geos
    ? Object.keys(geos).find((k) => /Congressional Districts/i.test(k))
    : undefined;
  const congressionalDistricts = cdKey ? geos![cdKey] : undefined;

  if (!congressionalDistricts?.length) {
    return { zip: "", representatives: [], ambiguous: false, districts: [] };
  }

  const cd = congressionalDistricts[0];
  const stateFips = cd.STATE;
  const districtStr =
    Object.entries(cd).find(([k]) => /^CD\d+$/.test(k))?.[1] ?? cd.BASENAME;
  const districtNum = parseInt(districtStr, 10);

  const stateAbbr = fipsToState(stateFips);
  if (!stateAbbr || isNaN(districtNum)) {
    return { zip: "", representatives: [], ambiguous: false, districts: [] };
  }

  const [senators, houseReps] = await Promise.all([
    db
      .prepare(
        `SELECT * FROM representatives WHERE type = 'sen' AND state = ? AND (end_date IS NULL OR end_date > date('now'))`
      )
      .bind(stateAbbr)
      .all<Representative>(),
    db
      .prepare(
        `SELECT * FROM representatives WHERE type = 'rep' AND state = ? AND district = ? AND (end_date IS NULL OR end_date > date('now'))`
      )
      .bind(stateAbbr, districtNum)
      .all<Representative>(),
  ]);

  return {
    zip: "",
    representatives: [...senators.results, ...houseReps.results],
    ambiguous: false,
    districts: [{ state: stateAbbr, district: districtNum }],
  };
}

export async function getRepById(
  db: D1Database,
  bioguideId: string
): Promise<Representative | null> {
  const result = await db
    .prepare("SELECT * FROM representatives WHERE bioguide_id = ?")
    .bind(bioguideId)
    .first<Representative>();
  return result ?? null;
}

const FIPS_MAP: Record<string, string> = {
  "01": "AL", "02": "AK", "04": "AZ", "05": "AR", "06": "CA",
  "08": "CO", "09": "CT", "10": "DE", "11": "DC", "12": "FL",
  "13": "GA", "15": "HI", "16": "ID", "17": "IL", "18": "IN",
  "19": "IA", "20": "KS", "21": "KY", "22": "LA", "23": "ME",
  "24": "MD", "25": "MA", "26": "MI", "27": "MN", "28": "MS",
  "29": "MO", "30": "MT", "31": "NE", "32": "NV", "33": "NH",
  "34": "NJ", "35": "NM", "36": "NY", "37": "NC", "38": "ND",
  "39": "OH", "40": "OK", "41": "OR", "42": "PA", "44": "RI",
  "45": "SC", "46": "SD", "47": "TN", "48": "TX", "49": "UT",
  "50": "VT", "51": "VA", "53": "WA", "54": "WV", "55": "WI",
  "56": "WY", "60": "AS", "66": "GU", "69": "MP", "72": "PR",
  "78": "VI",
};

function fipsToState(fips: string): string | null {
  return FIPS_MAP[fips] ?? null;
}
