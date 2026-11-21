// Zajednicki kod za Vercel funkcije (fajlovi sa _ na pocetku nisu rute).
// Kljuc ostaje na serveru: cita se iz env varijable, browser ga nikad ne vidi.

const API_URL = 'https://v3.football.api-sports.io/';

// Ista lista i isti redosled kao u competitions.js; drzati ih uskladjene.
export const COMPETITION_IDS = [39, 140, 135, 78, 61, 88, 286, 2, 3, 848, 531, 45, 143, 81, 66, 732];

export async function callApi(path, params) {
    const key = process.env.API_FOOTBALL_KEY;
    if (!key) {
        throw new Error('API_FOOTBALL_KEY nije podesen');
    }
    const url = new URL(path, API_URL);
    for (const [name, value] of Object.entries(params)) {
        url.searchParams.set(name, value);
    }
    const response = await fetch(url, { headers: { 'x-apisports-key': key } });
    if (!response.ok) {
        throw new Error('API-Football HTTP ' + response.status);
    }
    const data = await response.json();
    // API cesto vraca HTTP 200, a gresku (potrosena kvota, los kljuc) upise u polje errors.
    const errors = data.errors;
    if (errors && (Array.isArray(errors) ? errors.length : Object.keys(errors).length)) {
        throw new Error('API-Football: ' + JSON.stringify(errors));
    }
    return data;
}

// s-maxage: Vercel CDN cuva odgovor, pa vise posetilaca trosi samo jedan poziv ka API-ju.
export function send(res, body, cacheSeconds) {
    res.setHeader('Cache-Control', `public, max-age=0, s-maxage=${cacheSeconds}, stale-while-revalidate=60`);
    res.status(200).json(body);
}

export function sendError(res, status, message, err) {
    if (err) {
        console.error(err);
    }
    res.setHeader('Cache-Control', 'no-store');
    res.status(status).json({ error: message });
}

export function team(t) {
    return { id: t.id, name: t.name, logo: t.logo };
}
