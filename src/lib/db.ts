import type { Representative, ZipDistrict, LookupResult } from "./types";

export async function getRepsByZip(
  db: D1Database,
  zip: string
): Promise<LookupResult> {
  // Find districts for this zip
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

  // Get senators for the state(s)
  const states = [...new Set(districtList.map((d) => d.state))];
  const statePlaceholders = states.map(() => "?").join(",");

  const senators = await db
    .prepare(
      `SELECT * FROM representatives WHERE type = 'sen' AND state IN (${statePlaceholders}) AND (end_date IS NULL OR end_date > date('now'))`
    )
    .bind(...states)
    .all<Representative>();

  // Get house reps for each district
  const reps: Representative[] = [];
  for (const d of districtList) {
    const result = await db
      .prepare(
        `SELECT * FROM representatives WHERE type = 'rep' AND state = ? AND district = ? AND (end_date IS NULL OR end_date > date('now'))`
      )
      .bind(d.state, d.district)
      .all<Representative>();
    reps.push(...result.results);
  }

  return {
    zip,
    representatives: [...senators.results, ...reps],
    ambiguous,
    districts: districtList,
  };
}

export async function getRepsByLatLng(
  db: D1Database,
  lat: number,
  lng: number
): Promise<LookupResult> {
  // Use Census Geocoder to find congressional district
  const url = `https://geocoding.geo.census.gov/geocoder/geographies/coordinates?x=${lng}&y=${lat}&benchmark=Public_AR_Current&vintage=Current_Current&format=json`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Census geocoder returned ${response.status}`);
  }

  const data = (await response.json()) as {
    result?: {
      geographies?: {
        "118th Congressional Districts"?: Array<{
          STATE: string;
          CD118: string;
          BASENAME: string;
        }>;
        "119th Congressional Districts"?: Array<{
          STATE: string;
          CD119: string;
          BASENAME: string;
        }>;
      };
    };
  };

  const congressionalDistricts =
    data.result?.geographies?.["119th Congressional Districts"] ??
    data.result?.geographies?.["118th Congressional Districts"];

  if (!congressionalDistricts?.length) {
    return {
      zip: "",
      representatives: [],
      ambiguous: false,
      districts: [],
    };
  }

  const cd = congressionalDistricts[0];
  const stateFips = cd.STATE;
  const districtNum = parseInt(cd.CD119 ?? cd.CD118 ?? cd.BASENAME, 10);

  // Convert FIPS to state abbreviation
  const stateAbbr = fipsToState(stateFips);
  if (!stateAbbr) {
    return { zip: "", representatives: [], ambiguous: false, districts: [] };
  }

  // Get senators
  const senators = await db
    .prepare(
      `SELECT * FROM representatives WHERE type = 'sen' AND state = ? AND (end_date IS NULL OR end_date > date('now'))`
    )
    .bind(stateAbbr)
    .all<Representative>();

  // Get house rep
  const houseReps = await db
    .prepare(
      `SELECT * FROM representatives WHERE type = 'rep' AND state = ? AND district = ? AND (end_date IS NULL OR end_date > date('now'))`
    )
    .bind(stateAbbr, districtNum)
    .all<Representative>();

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

// FIPS state codes to abbreviations
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
