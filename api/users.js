import { sql } from "@vercel/postgres";
import { checkSession, unauthorizedResponse, getConnecterUser } from "../lib/session";

export const config = { runtime: "nodejs" };

export default async function handler(req) {
  try {
    // Vérifier la session avec le token du header
    const connected = await checkSession(req);
    if (!connected) return unauthorizedResponse();

    // Récupérer l'utilisateur connecté
    const currentUser = await getConnecterUser(req);

    // Récupérer tous les autres utilisateurs avec leur dernière connexion
    const { rows } = await sql`
      SELECT 
        user_id AS id, 
        username, 
        last_login
      FROM users
      WHERE user_id != ${currentUser.id}
      ORDER BY username ASC;
    `;

    return new Response(JSON.stringify(rows), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  } catch (err) {
    console.error("Erreur /api/users:", err);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
}
