import { sql } from "@vercel/postgres";
import { checkSession, unauthorizedResponse, getConnecterUser } from "../lib/session.js";

export const config = {
  runtime: "edge",
};

export default async function handler(req) {
  try {
    // Vérification session
    const connected = await checkSession(req);
    if (!connected) return unauthorizedResponse();

    const currentUser = await getConnecterUser(req);
    if (!currentUser) return unauthorizedResponse();


    if (req.method === "POST") {
      const { roomId, content, imageUrl } = await req.json();

      if (!roomId || (!content && !imageUrl)) {
        return new Response(
          JSON.stringify({ error: "roomId et au moins content ou imageUrl requis" }),
          { status: 400, headers: { "content-type": "application/json" } }
        );
      }

      const { rowCount: isMember } = await sql`
        SELECT 1 FROM room_members 
        WHERE room_id = ${roomId} AND user_id = ${currentUser.id};
      `;
      if (!isMember) {
        return new Response(
          JSON.stringify({ error: "Vous n'êtes pas membre de ce salon" }),
          { status: 403, headers: { "content-type": "application/json" } }
        );
      }

      const { rows } = await sql`
        INSERT INTO messages (room_id, sender_id, content, image_url)
        VALUES (${roomId}, ${currentUser.id}, ${content || ""}, ${imageUrl || null})
        RETURNING message_id, room_id, sender_id, content, image_url, sent_at;
      `;
      const message = rows[0];

      return new Response(JSON.stringify(message), {
        status: 201,
        headers: { "content-type": "application/json" },
      });
    }


    if (req.method === "GET") {
      const queryString = req.url.split("?")[1] || "";
      const params = new URLSearchParams(queryString);
      const roomId = params.get("roomId");

      if (!roomId) {
        return new Response(
          JSON.stringify({ error: "roomId requis" }),
          { status: 400, headers: { "content-type": "application/json" } }
        );
      }

      const { rowCount: isMember } = await sql`
        SELECT 1 FROM room_members 
        WHERE room_id = ${roomId} AND user_id = ${currentUser.id};
      `;
      if (!isMember) {
        return new Response(
          JSON.stringify({ error: "Vous n'êtes pas membre de ce salon" }),
          { status: 403, headers: { "content-type": "application/json" } }
        );
      }

      const { rows } = await sql`
        SELECT 
          m.message_id AS id, 
          m.sender_id, 
          m.content, 
          m.image_url AS "imageUrl",
          m.sent_at, 
          u.username AS sender_username
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
