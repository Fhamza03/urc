import { sql } from "@vercel/postgres";
import { checkSession, unauthorizedResponse, getConnecterUser } from "../lib/session";

export const config = { runtime: "edge" };

export default async function handler(req) {
  try {
    const connected = await checkSession(req);
    if (!connected) return unauthorizedResponse();

    const currentUser = await getConnecterUser(req);
    if (!currentUser) return unauthorizedResponse();

    if (req.method === "POST") {
      const { roomId, content } = await req.json();
      if (!roomId || !content) {
        return new Response(JSON.stringify({ error: "roomId et content requis" }), {
          status: 400,
          headers: { "content-type": "application/json" },
        });
      }

      // Vérifier que l'utilisateur est membre du salon
      const { rowCount: isMember } = await sql`
        SELECT 1 FROM room_members 
        WHERE room_id = ${roomId} AND user_id = ${currentUser.id};
      `;
      if (!isMember) {
        return new Response(JSON.stringify({ error: "Vous n'êtes pas membre de ce salon" }), {
          status: 403,
          headers: { "content-type": "application/json" },
        });
      }

      // Insérer le message
      const { rows } = await sql`
        INSERT INTO messages (room_id, sender_id, content)
        VALUES (${roomId}, ${currentUser.id}, ${content})
        RETURNING message_id, room_id, sender_id, content, sent_at;
      `;

      const message = rows[0];

      return new Response(JSON.stringify(message), {
        status: 201,
        headers: { "content-type": "application/json" },
      });
    }

    if (req.method === "GET") {
      const url = new URL(req.url);
      const roomId = url.searchParams.get("roomId");
      if (!roomId) {
        return new Response(JSON.stringify({ error: "roomId requis" }), {
          status: 400,
          headers: { "content-type": "application/json" },
        });
      }

      // Vérifier que l'utilisateur est membre du salon
      const { rowCount: isMember } = await sql`
        SELECT 1 FROM room_members 
        WHERE room_id = ${roomId} AND user_id = ${currentUser.id};
      `;
      if (!isMember) {
        return new Response(JSON.stringify({ error: "Vous n'êtes pas membre de ce salon" }), {
          status: 403,
          headers: { "content-type": "application/json" },
        });
      }

      // Récupérer les messages
      const { rows } = await sql`
        SELECT m.message_id, m.sender_id, m.content, m.sent_at, u.username AS sender_username
        FROM messages m
        JOIN users u ON m.sender_id = u.user_id
        WHERE m.room_id = ${roomId}
        ORDER BY m.sent_at ASC;
      `;

      return new Response(JSON.stringify(rows), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Méthode non autorisée" }), {
      status: 405,
      headers: { "content-type": "application/json" },
    });
  } catch (err) {
    console.error("Erreur /api/roomMessages:", err);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
}
