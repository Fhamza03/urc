import { Redis } from "@upstash/redis";
import { getConnecterUser, triggerNotConnected } from "../lib/session.js";
import PushNotifications from "@pusher/push-notifications-server";

const redis = Redis.fromEnv();

const beamsClient = new PushNotifications({
  instanceId: process.env.PUSHER_INSTANCE_ID,
  secretKey: process.env.PUSHER_SECRET_KEY,
});

export default async function handler(req, res) {
  try {
    const user = await getConnecterUser(req);
    if (!user) return triggerNotConnected(res);

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

      // Stocker le message dans Redis
      await redis.lpush(conversationKey, JSON.stringify(messageObj));
      await redis.expire(conversationKey, 24 * 60 * 60);

      // 🔔 Envoi notification push au destinataire
      try {
        await beamsClient.publishToUsers([receiverId.toString()], {
          web: {
            notification: {
              title: user.username,
              body: content,
              deep_link: `/chat/user/${user.id}`,
              ico: "https://www.univ-brest.fr/themes/custom/ubo_parent/favicon.ico",
            },
            data: { senderId: user.id, content },
          },
        });
      } catch (notifErr) {
        console.error("Erreur notification push:", notifErr);
      }

      return res.status(200).json({ status: "success", message: messageObj });
    }

    if (req.method === "GET") {
      const { userId } = req.query;
      if (!userId) return res.status(400).json({ error: "userId manquant" });

      const conversationKey = `chat:${[user.id, userId].sort().join("-")}`;
      const messages = await redis.lrange(conversationKey, 0, -1);

      const parsed = messages
        .reverse()
        .map((msg) => (typeof msg === "string" ? JSON.parse(msg) : msg));

      return res.status(200).json({ messages: parsed });
    }

    res.setHeader("Allow", ["GET", "POST"]);
    res.status(405).json({ error: "Méthode non autorisée" });
  } catch (err) {
    console.error("Erreur API message:", err);
    res.status(500).json({ error: err.message });
  }
}
