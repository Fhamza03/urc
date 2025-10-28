import { db } from '@vercel/postgres';
import { Redis } from '@upstash/redis';
import { arrayBufferToBase64, stringToArrayBuffer } from "../lib/base64.js";

export const config = {
    runtime: 'nodejs',
};

const redis = Redis.fromEnv();

export default async function handler(req, res) {
    try {
        if (req.method !== "POST") {
            return res.status(405).json({ error: "Méthode non autorisée" });
        }

        // Lecture du corps JSON depuis Node.js runtime
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: "Tous les champs sont requis" });
        }

        // Hash du mot de passe
        const hash = await crypto.subtle.digest('SHA-256', stringToArrayBuffer(username + password));
        const hashed64 = arrayBufferToBase64(hash);

        // Vérifier l'utilisateur dans Postgres
        const client = await db.connect();
        const { rowCount, rows } = await client.sql`
            SELECT * FROM users 
            WHERE username = ${username} AND password = ${hashed64}
        `;

        if (rowCount !== 1) {
            return res.status(401).json({ code: "UNAUTHORIZED", message: "Identifiant ou mot de passe incorrect" });
        }

        // Mettre à jour la dernière connexion
        await client.sql`UPDATE users SET last_login = now() WHERE user_id = ${rows[0].user_id}`;

        // Générer un token et stocker dans Redis
        const token = crypto.randomUUID().toString();
        const user = {
            id: rows[0].user_id,
            username: rows[0].username,
            email: rows[0].email,
            externalId: rows[0].external_id
        };

        await redis.set(token, user, { ex: 3600 });
        await redis.hset("users", { [user.id]: user });

        // Retourner la réponse
        return res.status(200).json({
            token,
            username: user.username,
            externalId: user.externalId,
            id: user.id
        });

    } catch (error) {
        console.error("Erreur login:", error);
        return res.status(500).json({ code: "SERVER_ERROR", message: "Erreur serveur", details: error.message });
    }
}
