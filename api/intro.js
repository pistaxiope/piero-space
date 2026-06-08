import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

function asArray(value) {
  if (Array.isArray(value)) return value.map((v) => String(v));
  if (value == null || value === "") return [];
  return [String(value)];
}

function authorized(request) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  const header = request.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  const provided = token || request.headers["x-admin-password"] || "";
  return provided === expected;
}

export default async function handler(request, response) {
  try {
    if (request.method === "POST") {
      const body = request.body || {};
      const rows = await sql`
        INSERT INTO public.intro_responses
          (name, linkedin_url, desired_outcomes, worlds, company_project, description, post_ltw_ai_circle, ai_intro_card, user_agent)
        VALUES (
          ${body.name || null},
          ${body.linkedin_url || null},
          ${asArray(body.desired_outcomes)},
          ${asArray(body.worlds)},
          ${body.company_project || null},
          ${body.description || null},
          ${Boolean(body.post_ltw_ai_circle)},
          ${body.ai_intro_card || null},
          ${request.headers["user-agent"] || null}
        )
        RETURNING id, created_at, name, linkedin_url, desired_outcomes, worlds, company_project, description, post_ltw_ai_circle, ai_intro_card
      `;
      return response.status(201).json({ ok: true, response: rows[0] });
    }

    if (request.method === "GET") {
      if (!authorized(request)) {
        response.setHeader("www-authenticate", "Bearer");
        return response.status(401).json({ ok: false, error: "unauthorized" });
      }
      const rows = await sql`
        SELECT id, created_at, name, linkedin_url, desired_outcomes, worlds,
               company_project, description, post_ltw_ai_circle, ai_intro_card
        FROM public.intro_responses
        ORDER BY created_at DESC
      `;
      return response.status(200).json({ ok: true, responses: rows });
    }

    response.setHeader("allow", "GET, POST");
    return response.status(405).json({ ok: false, error: "method_not_allowed" });
  } catch (error) {
    console.log("[v0] /api/intro error:", error.message);
    return response.status(500).json({ ok: false, error: "server_error" });
  }
}
