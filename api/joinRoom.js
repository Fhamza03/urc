import { sql } from "@vercel/postgres";
import { checkSession, unauthorizedResponse, getConnecterUser } from "../lib/session.js";

export const config = {
    runtime: 'nodejs',
};

export default async function handler(req, res) {
  try {
    // Vérifier la session
    const connected = await checkSession(req);
    if (!connected) return unauthorizedResponse();

    const currentUser = await getConnecterUser(req);

    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Méthode non autorisée" }), {
        status: 405,
        headers: { "content-type": "application/json" },
      });
    }

    const body = await req.json();
    const { roomId } = body;

    if (!roomId) {
      return new Response(JSON.stringify({ error: "roomId requis" }), {
        status: 400,
        headers: { "content-type": "application/json" },
      });
    }

    // Vérifier si l'utilisateur est déjà membre
    const { rowCount } = await sql`
      SELECT id FROM room_members
      WHERE room_id = ${roomId} AND user_id = ${currentUser.id};
    `;

    if (rowCount > 0) {
      return new Response(JSON.stringify({ status: "already_member" }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }

    // Ajouter l'utilisateur à room_members
    await sql`
      INSERT INTO room_members (room_id, user_id)
      VALUES (${roomId}, ${currentUser.id});
    `;

    return new Response(JSON.stringify({ status: "joined" }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });

  } catch (err) {
    console.error("Erreur /api/joinRoom:", err);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
}
