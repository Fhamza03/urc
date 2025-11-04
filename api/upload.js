import { put } from '@vercel/blob';
import { checkSession, unauthorizedResponse } from '../lib/session.js';


export default async function handler(req) {
  const connected = await checkSession(req);
  if (!connected) return unauthorizedResponse();

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: "Méthode non autorisée" }), {
      status: 405,
      headers: { 'content-type': 'application/json' },
    });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof File)) {
      return new Response(JSON.stringify({ error: "Aucun fichier fourni" }), {
        status: 400,
        headers: { 'content-type': 'application/json' },
      });
    }


    const filename = `${Date.now()}-${file.name.replace(/[^a-z0-9.]/gi, '_')}`;

    const blob = await put(filename, file, {
      access: 'public', 
    });

    return new Response(JSON.stringify({ url: blob.url }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });

  } catch (error) {
    console.error("Erreur Blob Upload:", error);
    return new Response(JSON.stringify({ error: "Erreur lors du téléversement du fichier" }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  }
}