import { Redis } from "@upstash/redis";
import { getConnecterUser, triggerNotConnected } from "../lib/session.js";

const redis = Redis.fromEnv();

export default async function handler(req, res) {
  try {
    const user = await getConnecterUser(req);
    if (!user) {
      return triggerNotConnected(res);
    }

    if (req.method === "POST") {
      const { receiverId, content } = req.body;
      if (!receiverId || !content)
        return res.status(400).json({ error: "receiverId et content requis" });

      const conversationKey = `chat:${[user.id, receiverId].sort().join("-")}`;
      const messageObj = {
        senderId: user.id,
        receiverId,
        content,
        timestamp: new Date().toISOString(),
      };

      await redis.lpush(conversationKey, JSON.stringify(messageObj));
      await redis.expire(conversationKey, 24 * 60 * 60);

      return res.status(200).json({ status: "success", message: messageObj });
    }

    if (req.method === "GET") {
  const { userId } = req.query;
  if (!userId)
    return res.status(400).json({ error: "userId manquant dans la requête" });

  const conversationKey = `chat:${[user.id, userId].sort().join("-")}`;
  const messages = await redis.lrange(conversationKey, 0, -1);

  const parsed = messages
    .reverse()
    .map((msg) => {
      try {
        // Si c’est déjà un objet, on le garde tel quel
        return typeof msg === "string" ? JSON.parse(msg) : msg;
      } catch (e) {
        console.warn("⚠️ Message non parsable :", msg);
        return msg; // on renvoie brut pour ne pas bloquer
      }
    });

  return res.status(200).json({ messages: parsed });
}


    res.setHeader("Allow", ["GET", "POST"]);
    res.status(405).json({ error: "Méthode non autorisée" });
  } catch (err) {
    console.error("Erreur API:", err);
    res.status(500).json({ error: err.message });
  }
}
