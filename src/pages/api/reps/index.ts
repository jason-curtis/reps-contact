import type { APIRoute } from "astro";
import { getRepsByZip, getRepsByLatLng } from "../../../lib/db";

export const GET: APIRoute = async ({ request, locals }) => {
  const url = new URL(request.url);
  const zip = url.searchParams.get("zip");
  const lat = url.searchParams.get("lat");
  const lng = url.searchParams.get("lng");

  const db = locals.runtime.env.DB;

  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  if (zip) {
    if (!/^\d{5}$/.test(zip)) {
      return new Response(
        JSON.stringify({ error: "Invalid zip code. Must be 5 digits." }),
        { status: 400, headers }
      );
    }
    const result = await getRepsByZip(db, zip);
    return new Response(JSON.stringify(result), { headers });
  }

  if (lat && lng) {
    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);
    if (isNaN(latNum) || isNaN(lngNum)) {
      return new Response(
        JSON.stringify({ error: "Invalid lat/lng values." }),
        { status: 400, headers }
      );
    }
    const result = await getRepsByLatLng(db, latNum, lngNum);
    return new Response(JSON.stringify(result), { headers });
  }

  return new Response(
    JSON.stringify({
      error: "Provide ?zip=XXXXX or ?lat=XX&lng=XX query parameters.",
    }),
    { status: 400, headers }
  );
};

export const OPTIONS: APIRoute = async () => {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
};
