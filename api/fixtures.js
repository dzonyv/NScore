// GET /api/fixtures: danasnje utakmice (po beogradskom vremenu) iz nasih takmicenja.
// Live stranica iz istog odgovora uzima utakmice u toku, pa obe stranice dele jedan kes.
import { cached, callApi, checkRequest, send, sendError, team, COMPETITION_IDS } from './_lib.js';

const TIMEZONE = 'Europe/Belgrade';
// Besplatni plan ima 100 zahteva dnevno. Dok traje neka utakmica podaci se obnavljaju na 20 minuta
// (najvise 72 poziva dnevno); inace kes traje do pocetka sledece utakmice, a najduze 3 sata.
const MIN_CACHE_SECONDS = 20 * 60;
const MAX_CACHE_SECONDS = 3 * 60 * 60;
// API status menja sa malim zakasnjenjem, pa se prvi put pita 2 minuta posle pocetka utakmice.
const KICKOFF_DELAY_SECONDS = 2 * 60;
// Koliko dugo posle isteka smeju da se prikazuju stari podaci ako API ne radi.
const STALE_SECONDS = 3 * 60 * 60;
// Posle ponoci jos traju utakmice od prethodnog dana (produzeci, kasni termini).
const PREVIOUS_DAY_UNTIL_HOUR = 2;
const NOT_STARTED = ['NS', 'TBD'];
const FINISHED = ['FT', 'AET', 'PEN', 'PST', 'CANC', 'ABD', 'AWD', 'WO'];

// Datum (YYYY-MM-DD) i sekunde od ponoci po beogradskom vremenu.
function belgradeNow() {
    const parts = {};
    new Intl.DateTimeFormat('en-GB', {
        timeZone: TIMEZONE, hourCycle: 'h23',
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit'
    }).formatToParts(new Date()).forEach((p) => { parts[p.type] = p.value; });
    return {
        date: `${parts.year}-${parts.month}-${parts.day}`,
        seconds: Number(parts.hour) * 3600 + Number(parts.minute) * 60 + Number(parts.second)
    };
}

function previousDay(date) {
    const [year, month, day] = date.split('-').map(Number);
    return new Date(Date.UTC(year, month - 1, day - 1)).toISOString().slice(0, 10);
}

function cacheSeconds(fixtures) {
    const now = Date.now() / 1000;
    let seconds = MAX_CACHE_SECONDS;
    for (const { fixture } of fixtures) {
        if (!FINISHED.includes(fixture.status.short)) {
            // Za utakmicu koja je vec pocela ovo je negativno, pa vazi najkraci kes.
            seconds = Math.min(seconds, fixture.timestamp + KICKOFF_DELAY_SECONDS - now);
        }
    }
    return Math.max(seconds, MIN_CACHE_SECONDS);
}

async function loadDay(date) {
    const data = await callApi('fixtures', { date, timezone: TIMEZONE });
    const order = new Map(COMPETITION_IDS.map((id, i) => [id, i]));
    return data.response
        .filter((f) => order.has(f.league.id))
        .sort((a, b) => order.get(a.league.id) - order.get(b.league.id)
            || a.fixture.timestamp - b.fixture.timestamp)
        .map((f) => ({
            fixture: {
                id: f.fixture.id,
                timestamp: f.fixture.timestamp,
                status: { short: f.fixture.status.short, elapsed: f.fixture.status.elapsed }
            },
            league: { id: f.league.id, name: f.league.name },
            teams: { home: team(f.teams.home), away: team(f.teams.away) },
            goals: f.goals
        }));
}

function cachedDay(date) {
    return cached('fixtures:' + date, () => loadDay(date), cacheSeconds, STALE_SECONDS);
}

// Jucerasnje utakmice su dopuna: ako ne mogu da se ucitaju, danasnje se ipak prikazuju.
function cachedPreviousDay(date) {
    return cachedDay(date).catch(() => ({ value: null, cacheUntil: Date.now() + 5 * 60 * 1000 }));
}

export default async function handler(req, res) {
    if (!checkRequest(req, res, [])) {
        return;
    }
    const { date, seconds } = belgradeNow();
    const midnight = Date.now() + (24 * 60 * 60 - seconds) * 1000;
    try {
        const [today, previous] = await Promise.all([
            cachedDay(date),
            seconds < PREVIOUS_DAY_UNTIL_HOUR * 3600 ? cachedPreviousDay(previousDay(date)) : null
        ]);
        // Od ponoci vazi novi datum, pa odgovor ne sme da ostane u kesu duze od toga.
        // (Uz kvar API-ja stale-if-error vraca i jucerasnji odgovor: stranica pokaze njegov datum i upozorenje.)
        const times = {
            ...today,
            expiresAt: Math.min(today.expiresAt, midnight),
            cacheUntil: Math.min(today.cacheUntil, midnight),
            revalidateUntil: midnight
        };
        // Utakmice od juce koje jos traju, samo za Live stranicu; null znaci da nisu mogle da se ucitaju.
        let stillInPlay = [];
        if (previous) {
            times.cacheUntil = Math.min(times.cacheUntil, previous.cacheUntil);
            stillInPlay = previous.value && previous.value.filter((f) =>
                !NOT_STARTED.includes(f.fixture.status.short) && !FINISHED.includes(f.fixture.status.short));
        }
        if (stillInPlay && stillInPlay.length) {
            for (const name of ['fetchedAt', 'expiresAt', 'staleUntil']) {
                times[name] = Math.min(times[name], previous[name]);
            }
            times.refreshFailed = today.refreshFailed || previous.refreshFailed;
        }
        send(res, { date, response: today.value, stillInPlay }, times);
    } catch (err) {
        // 500, a ne 502: to je status za koji Vercel dokumentuje stale-if-error.
        sendError(res, 500, 'Utakmice trenutno nisu dostupne.', err);
    }
}
