import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

export async function getConnecterUser(request) {
  let token = new Headers(request.headers).get("Authorization");
  if (token === undefined || token === null || token === "") {
    return null;
  } else {
    token = token.replace("Bearer ", "");
  }
  console.log("checking " + token);
  const user = await redis.get(token);
  console.log("Got user : " + user.id);
  return user;
}

export function triggerNotConnected(res) {
  res.status(401).json('{code: "UNAUTHORIZED", message: "Session expired"}');
}

export default async function handler(request, response) {
  try {
    const user = await getConnecterUser(request);
    if (!user) return triggerNotConnected(response);

    if (request.method === "GET") {
      // 📋 Récupérer la liste de tous les salons
      const rooms = await redis.lrange("rooms:list", 0, -1);

      // Parser les salons JSON
      const parsedRooms = rooms
        .map((roomStr) => {
          try {
            return typeof roomStr === "string" ? JSON.parse(roomStr) : roomStr;
          } catch {
            console.warn("⚠️ Skipped invalid room:", roomStr);
            return null;
          }
        })
        .filter(Boolean);

      return response.json({
        success: true,
        rooms: parsedRooms,
      });
    }

    if (request.method === "POST") {
      // 🆕 Créer un nouveau salon
      const { name, description } = request.body;

      if (!name || !name.trim()) {
        return response.status(400).json({
          error: "Le nom du salon est requis",
        });
      }

      // Générer un ID unique pour le salon
      const roomId = `room_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;

      const newRoom = {
        id: roomId,
        name: name.trim(),
        description: description?.trim() || "",
        createdAt: new Date().toISOString(),
        createdBy: user.id,
        createdByUsername: user.username,
      };

      // Sauvegarder le salon dans Redis
      await redis.lpush("rooms:list", JSON.stringify(newRoom));

      return response.json({
        success: true,
        room: newRoom,
      });
    }

    // Méthode non supportée
    response.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error("Error in rooms API:", err);
    response.status(500).json({ error: "Internal server error" });
  }
}