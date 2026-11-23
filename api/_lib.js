// Zajednicki kod za Vercel funkcije (fajlovi sa _ na pocetku nisu rute).
// Kljuc ostaje na serveru: cita se iz env varijable, browser ga nikad ne vidi.

const API_URL = 'https://v3.football.api-sports.io/';

// Ista lista i isti redosled kao u competitions.js; drzati ih uskladjene.
export const COMPETITION_IDS = [39, 140, 135, 78, 61, 88, 94, 286, 2, 3, 848, 531, 45, 143, 81, 66, 732];

// Kupovi bez ligaske ili grupne faze (hasTable: false u competitions.js): API za njih nema tabelu.
const WITHOUT_TABLE = [531, 45, 143, 81, 66, 732];
export const TABLE_IDS = COMPETITION_IDS.filter((id) => !WITHOUT_TABLE.includes(id));

const UPSTREAM_TIMEOUT_MS = 8000;
const MAX_RETRY_MINUTES = 20;

// Vraca false (i salje odgovor) ako metod ili parametri nisu predvidjeni. CDN kesira samo GET i HEAD,
// a svaki drugaciji URL kesira posebno, pa bi takvi zahtevi bez potrebe trosili pozive ka API-ju.
export function checkRequest(req, res, allowedParams) {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
        res.setHeader('Allow', 'GET, HEAD');
        sendError(res, 405, 'Metod nije dozvoljen.');
        return false;
    }
    if (Object.keys(req.query).some((name) => !allowedParams.includes(name))) {
        sendError(res, 400, 'Nepoznat parametar.');
        return false;
    }
    return true;
}

export async function callApi(path, params) {
    const key = process.env.API_FOOTBALL_KEY;
    if (!key) {
        throw new Error('API_FOOTBALL_KEY nije podesen');
    }
    const url = new URL(path, API_URL);
    for (const [name, value] of Object.entries(params)) {
        url.searchParams.set(name, value);
    }
    const response = await fetch(url, {
        headers: { 'x-apisports-key': key },
        signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS)
    });
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

// Kes u memoriji funkcije, iza CDN-a. CDN kesira po regionu i ne kesira zahteve sa Authorization
// zaglavljem; ovaj kes dele svi regioni dok god zahteve obradjuje ista instanca funkcije.
// Nije tvrda garancija: nova instanca krece sa praznim kesom.
const entries = new Map();

// load() preuzima podatke, ttlSeconds(value) kaze koliko vaze. Ako preuzimanje ne uspe, jos
// staleSeconds po isteku vracaju se poslednji dobri podaci, a razmak do novog pokusaja raste.
// Rezultat: { value, fetchedAt, expiresAt, staleUntil, cacheUntil, refreshFailed }, vremena su u ms.
export async function cached(key, load, ttlSeconds, staleSeconds) {
    let entry = entries.get(key);
    if (!entry) {
        entry = { result: null, error: null, failures: 0, retryAt: 0, pending: null };
        entries.set(key, entry);
    }
    const isFresh = () => entry.result && Date.now() < entry.result.expiresAt;
    if (!isFresh() && Date.now() >= entry.retryAt) {
        // Istovremeni zahtevi cekaju isti poziv.
        entry.pending ??= refresh(entry, load, ttlSeconds, staleSeconds)
            .finally(() => { entry.pending = null; });
        await entry.pending;
    }
    if (isFresh()) {
        return { ...entry.result, cacheUntil: entry.result.expiresAt, refreshFailed: false };
    }
    if (entry.result && Date.now() < entry.result.staleUntil) {
        const cacheUntil = Math.min(entry.retryAt, entry.result.staleUntil);
        return { ...entry.result, cacheUntil, refreshFailed: true };
    }
    throw entry.error;
}

async function refresh(entry, load, ttlSeconds, staleSeconds) {
    try {
        const value = await load();
        const fetchedAt = Date.now();
        const expiresAt = fetchedAt + ttlSeconds(value) * 1000;
        entry.result = { value, fetchedAt, expiresAt, staleUntil: expiresAt + staleSeconds * 1000 };
        entry.failures = 0;
        entry.retryAt = 0;
    } catch (err) {
        console.error(err);
        entry.error = err;
        entry.failures += 1;
        // 2, 4, 8, 16, pa na svakih 20 minuta
        entry.retryAt = Date.now() + Math.min(2 ** entry.failures, MAX_RETRY_MINUTES) * 60 * 1000;
    }
}

// s-maxage: Vercel CDN cuva odgovor, ali samo do isteka podataka, da se kes funkcije i kes CDN-a ne saberu.
// stale-if-error: ako funkcija padne, CDN jos neko vreme vraca poslednji dobar odgovor.
// revalidateUntil: dokle CDN sme da vrati istekao odgovor dok u pozadini trazi novi (najduze 60 s).
export function send(res, body, times) {
    const { fetchedAt, expiresAt, staleUntil, cacheUntil, refreshFailed, revalidateUntil = Infinity } = times;
    const secondsUntil = (time) => Math.max(0, Math.floor((time - Date.now()) / 1000));
    const fresh = Math.max(1, secondsUntil(cacheUntil));
    const revalidate = Math.max(0, Math.min(60, secondsUntil(Math.min(revalidateUntil, staleUntil)) - fresh));
    const stale = Math.max(0, secondsUntil(staleUntil) - fresh);
    res.setHeader('Cache-Control',
        `public, max-age=0, s-maxage=${fresh}, stale-while-revalidate=${revalidate}, stale-if-error=${stale}`);
    // Stranica po ovome prikazuje koliko su podaci stari (sekunde, kao i timestamp utakmice).
    res.status(200).json({
        ...body,
        updatedAt: Math.floor(fetchedAt / 1000),
        validUntil: Math.ceil(expiresAt / 1000),
        refreshFailed
    });
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
