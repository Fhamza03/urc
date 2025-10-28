import { sql } from "@vercel/postgres";
// Assurez-vous d'importer getConnecterUser ici ! C'est crucial.
import { checkSession, unauthorizedResponse, getConnecterUser } from "../lib/session"; 

export const config = {
  runtime: "nodejs",
};

export default async function handler(req) {
  try {
    const connected = await checkSession(req);
    if (!connected) return unauthorizedResponse();

    // 1. Récupérer l'ID de l'utilisateur connecté
    const currentUser = await getConnecterUser(req);
    const currentUserId = currentUser.id;

    // 2. Requête SQL mise à jour avec LEFT JOIN pour vérifier l'adhésion
    const { rows } = await sql`
      SELECT
        r.room_id AS id,
        r.name,  
        r.created_on,
        -- Ajout de la colonne is_member: TRUE si l'utilisateur est trouvé dans room_members, FALSE sinon.
        CASE WHEN rm.user_id IS NOT NULL THEN TRUE ELSE FALSE END AS is_member
      FROM rooms r
      -- LEFT JOIN pour vérifier l'adhésion pour l'utilisateur actuel
      LEFT JOIN room_members rm ON r.room_id = rm.room_id AND rm.user_id = ${currentUserId}
      ORDER BY r.created_on ASC;
    `;

    // 3. Renvoi des données
    return new Response(JSON.stringify(rows), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
    
  } catch (error) {
    console.error("Error fetching rooms:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
}