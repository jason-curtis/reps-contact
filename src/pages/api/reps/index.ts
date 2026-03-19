import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { getRepsByZip, getRepsByLatLng } from "../../../lib/db";

const CORS_HEADERS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const zip = url.searchParams.get("zip");
  const lat = url.searchParams.get("lat");
  const lng = url.searchParams.get("lng");

  const db = (env as unknown as { DB: D1Database }).DB;

  try {
    if (zip) {
      if (!/^\d{5}$/.test(zip)) {
        return new Response(
          JSON.stringify({ error: "Invalid zip code. Must be 5 digits." }),
          { status: 400, headers: CORS_HEADERS }
        );
      }
      const result = await getRepsByZip(db, zip);
      return new Response(JSON.stringify(result), { headers: CORS_HEADERS });
    }

    if (lat && lng) {
      const latNum = parseFloat(lat);
      const lngNum = parseFloat(lng);
      if (
        isNaN(latNum) ||
        isNaN(lngNum) ||
        latNum < -90 ||
        latNum > 90 ||
        lngNum < -180 ||
        lngNum > 180
      ) {
        return new Response(
          JSON.stringify({ error: "Invalid lat/lng values." }),
          { status: 400, headers: CORS_HEADERS }
        );
      }
      const result = await getRepsByLatLng(db, latNum, lngNum);
      return new Response(JSON.stringify(result), { headers: CORS_HEADERS });
    }

    return new Response(
      JSON.stringify({
        error: "Provide ?zip=XXXXX or ?lat=XX&lng=XX query parameters.",
      }),
      { status: 400, headers: CORS_HEADERS }
    );
  } catch (err) {
    console.error("API error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error." }),
      { status: 500, headers: CORS_HEADERS }
    );
  }
};

export const OPTIONS: APIRoute = async () => {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
};
