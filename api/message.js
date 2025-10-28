import { Redis } from "@upstash/redis";
import { getConnecterUser, triggerNotConnected } from "../lib/session.js";
import PushNotifications from "@pusher/push-notifications-server";

export const config = {
    runtime: 'nodejs',
};


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
      // 1. Récupérer imageUrl en plus
      const { receiverId, content, imageUrl } = req.body; 
      
      // Validation mise à jour: nécessite receiverId ET au moins content OU imageUrl
      if (!receiverId || (!content && !imageUrl)) {
        return res.status(400).json({ error: "receiverId et au moins content ou imageUrl requis" });
      }

      const conversationKey = `chat:${[user.id, receiverId].sort().join("-")}`;
      
      // 2. Inclure imageUrl dans l'objet stocké
      const messageObj = {
        senderId: user.id,
        receiverId,
        content: content || "", // Assure que content est une chaîne vide si seulement image est envoyée
        imageUrl, // Nouvelle propriété
        timestamp: new Date().toISOString(),
      };

      // Stocker le message dans Redis
      await redis.lpush(conversationKey, JSON.stringify(messageObj));

      // 🔔 Envoi notification push au destinataire
      try {
        // Détermine le corps de la notification
        let notificationBody = content;
        if (!content && imageUrl) {
            notificationBody = "🖼️ Image/GIF envoyé(e)";
        } else if (content && imageUrl) {
            notificationBody = `${content} [Image/GIF]`;
        }

        await beamsClient.publishToUsers([receiverId.toString()], {
          web: {
            notification: {
              title: user.username,
              body: notificationBody,
              deep_link: `/chat/user/${user.id}`,
              ico: "https://www.univ-brest.fr/themes/custom/ubo_parent/favicon.ico",
            },
            // Inclure l'URL dans les données pour la mise à jour côté client
            data: { senderId: user.id, content, imageUrl }, 
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