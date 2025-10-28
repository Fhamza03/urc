import { db } from '@vercel/postgres';
import { Redis } from '@upstash/redis';
import { arrayBufferToBase64, stringToArrayBuffer } from "../lib/base64";

export const config = {
    runtime: 'nodejs',
};

const redis = Redis.fromEnv(); 

export default async function handler(request) {
    try {
        const { username, email, password } = await request.json();
        console.log(username + " " + email)

        if (!username || !email || !password) {
            return new Response(JSON.stringify({ code: "BAD_REQUEST", message: "Tous les champs sont requis" }), {
                status: 400,
                headers: { 'content-type': 'application/json' },
            });
        }

        const client = await db.connect();

        const existing = await client.sql`
            SELECT * FROM users WHERE username = ${username} OR email = ${email}
        `;
        if (existing.rowCount > 0) {
            return new Response(JSON.stringify({ code: "CONFLICT", message: "Username ou email déjà utilisé" }), {
                status: 409,
                headers: { 'content-type': 'application/json' },
            });
        }

        const hashBuffer = await crypto.subtle.digest('SHA-256', stringToArrayBuffer(username + password));
        const hashed64 = arrayBufferToBase64(hashBuffer);

        const externalId = crypto.randomUUID().toString();

        const insert = await client.sql`
            INSERT INTO users (username, password, email, created_on, external_id)
            VALUES (${username}, ${hashed64}, ${email}, now(), ${externalId})
            RETURNING user_id, username, email, external_id
        `;

        console.log('Insert result:', insert); 
        if (!insert.rows[0]) {
            throw new Error("Insertion échouée !");
        }

        const userRow = insert.rows[0];

        const token = crypto.randomUUID().toString();
        const user = {
            id: userRow.user_id,
            username: userRow.username,
            email: userRow.email,
            externalId: userRow.external_id
        };
        await redis.set(token, user, { ex: 3600 });
        await redis.hset("users", { [user.id]: user });

        return new Response(JSON.stringify({
            id: user.id,
            username: user.username,
            email: user.email,
            externalId: user.externalId,
            token
        }), {
            status: 201,
            headers: { 'content-type': 'application/json' },
        });

    } catch (error) {
        console.error(error);
        return new Response(JSON.stringify({ code: "SERVER_ERROR", message: "Erreur serveur", details: error.message }), {
            status: 500,
            headers: { 'content-type': 'application/json' },
        });
    }
}
