import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { getRepById } from "../../../lib/db";

const CORS_HEADERS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
};

export const GET: APIRoute = async ({ params }) => {
  const { bioguideId } = params;

  if (!bioguideId) {
    return new Response(
      JSON.stringify({ error: "bioguideId is required" }),
      { status: 400, headers: CORS_HEADERS }
    );
  }

  try {
    const db = (env as unknown as { DB: D1Database }).DB;
    const rep = await getRepById(db, bioguideId);

    if (!rep) {
      return new Response(
        JSON.stringify({ error: "Representative not found" }),
        { status: 404, headers: CORS_HEADERS }
      );
    }

    return new Response(JSON.stringify(rep), { headers: CORS_HEADERS });
  } catch (err) {
    console.error("API error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error." }),
      { status: 500, headers: CORS_HEADERS }
    );
  }
};
