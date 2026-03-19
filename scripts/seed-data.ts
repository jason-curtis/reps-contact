/**
 * Seed D1 database with current congress member data and zip-to-district mappings.
 *
 * Usage:
 *   npx tsx scripts/seed-data.ts          # generates SQL files
 *   wrangler d1 execute reps-contact --file=d1-schema/001-initial.sql
 *   wrangler d1 execute reps-contact --file=d1-schema/seed-legislators.sql
 *   wrangler d1 execute reps-contact --file=d1-schema/seed-zip-districts.sql
 */

import { writeFileSync } from "fs";
import { execSync } from "child_process";

function curlFetch(url: string): string {
  return execSync(`curl -sL "${url}"`, {
    encoding: "utf-8",
    maxBuffer: 50 * 1024 * 1024,
  });
}

interface Legislator {
  id: { bioguide: string };
  name: { first: string; last: string; official_full?: string };
  bio: { party?: string };
  terms: Array<{
    type: "sen" | "rep";
    start: string;
    end: string;
    state: string;
    district?: number;
    party: string;
    phone?: string;
    url?: string;
    contact_form?: string;
    office?: string;
  }>;
}

function escSql(val: string | null | undefined): string {
  if (val == null) return "NULL";
  return "'" + val.replace(/'/g, "''") + "'";
}

function generateLegislatorsSql(): string {
  console.log("Fetching current legislators...");
  const raw = curlFetch(
    "https://raw.githubusercontent.com/unitedstates/congress-legislators/gh-pages/legislators-current.json"
  );
  const legislators: Legislator[] = JSON.parse(raw);

  const rows: string[] = [];

  for (const leg of legislators) {
    const term = leg.terms[leg.terms.length - 1];
    if (!term) continue;

    const bioguide = leg.id.bioguide;
    const photoUrl = `https://theunitedstates.io/images/congress/225x275/${bioguide}.jpg`;

    rows.push(
      `INSERT OR REPLACE INTO representatives (bioguide_id, type, first_name, last_name, party, state, district, phone, url, contact_form, photo_url, office, start_date, end_date) VALUES (` +
        `${escSql(bioguide)}, ${escSql(term.type)}, ${escSql(leg.name.first)}, ${escSql(leg.name.last)}, ` +
        `${escSql(term.party)}, ${escSql(term.state)}, ${term.district != null ? term.district : "NULL"}, ` +
        `${escSql(term.phone)}, ${escSql(term.url)}, ${escSql(term.contact_form)}, ` +
        `${escSql(photoUrl)}, ${escSql(term.office)}, ${escSql(term.start)}, ${escSql(term.end)});`
    );
  }

  console.log(`Generated ${rows.length} legislator rows`);
  return rows.join("\n");
}

function generateZipDistrictsSql(): string {
  console.log("Fetching zip-to-district mappings...");

  // Use OpenSourceActivismTech/us-zipcodes-congress (119th Congress, Census 2020 blocks)
  // CSV format: state_fips,state_abbr,zcta,cd
  const csvText = curlFetch(
    "https://raw.githubusercontent.com/OpenSourceActivismTech/us-zipcodes-congress/refs/heads/master/zccd.csv"
  );

  const lines = csvText.trim().split("\n");
  const rows: string[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const parts = line.split(",");
    if (parts.length < 4) continue;

    const stateAbbr = parts[1].trim();
    const zip = parts[2].trim();
    const district = parseInt(parts[3].trim(), 10);

    if (!stateAbbr || !zip || zip.length !== 5 || isNaN(district)) continue;

    rows.push(
      `INSERT OR IGNORE INTO zip_districts (zip, state, district, ratio) VALUES (${escSql(zip)}, ${escSql(stateAbbr)}, ${district}, 1.0);`
    );
  }

  console.log(`Generated ${rows.length} zip-district rows`);
  return rows.join("\n");
}

const FIPS_TO_STATE: Record<string, string> = {
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

function main() {
  const legislatorsSql = generateLegislatorsSql();
  writeFileSync("d1-schema/seed-legislators.sql", legislatorsSql);
  console.log("Wrote d1-schema/seed-legislators.sql");

  const zipSql = generateZipDistrictsSql();
  writeFileSync("d1-schema/seed-zip-districts.sql", zipSql);
  console.log("Wrote d1-schema/seed-zip-districts.sql");

  console.log("\nTo apply to D1:");
  console.log(
    "  wrangler d1 execute reps-contact --file=d1-schema/001-initial.sql"
  );
  console.log(
    "  wrangler d1 execute reps-contact --file=d1-schema/seed-legislators.sql"
  );
  console.log(
    "  wrangler d1 execute reps-contact --file=d1-schema/seed-zip-districts.sql"
  );
}

main();
