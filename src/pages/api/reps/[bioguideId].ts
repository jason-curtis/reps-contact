import type { APIRoute } from "astro";
import { getRepById } from "../../../lib/db";

export const GET: APIRoute = async ({ params, locals }) => {
  const { bioguideId } = params;

  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
  };

  if (!bioguideId) {
    return new Response(
      JSON.stringify({ error: "bioguideId is required" }),
      { status: 400, headers }
    );
  }

  const db = locals.runtime.env.DB;
  const rep = await getRepById(db, bioguideId);

  if (!rep) {
    return new Response(
      JSON.stringify({ error: "Representative not found" }),
      { status: 404, headers }
    );
  }

  return new Response(JSON.stringify(rep), { headers });
};
