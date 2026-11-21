// GET /api/fixtures: danasnje utakmice (po beogradskom vremenu) iz nasih takmicenja.
// Live stranica iz istog odgovora uzima utakmice u toku, pa obe stranice dele jedan kes.
import { callApi, send, sendError, team, COMPETITION_IDS } from './_lib.js';

const TIMEZONE = 'Europe/Belgrade';
// Besplatni plan ima 100 zahteva dnevno; 20 minuta kesa = najvise 72 poziva dnevno.
const CACHE_SECONDS = 20 * 60;

function todayIn(timeZone) {
    // en-CA daje format YYYY-MM-DD
    return new Intl.DateTimeFormat('en-CA', {
        timeZone, year: 'numeric', month: '2-digit', day: '2-digit'
    }).format(new Date());
}

export default async function handler(req, res) {
    const date = todayIn(TIMEZONE);
    try {
        const data = await callApi('fixtures', { date, timezone: TIMEZONE });
        const order = new Map(COMPETITION_IDS.map((id, i) => [id, i]));
        const fixtures = data.response
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
        send(res, { date, response: fixtures }, CACHE_SECONDS);
    } catch (err) {
        sendError(res, 502, 'Utakmice trenutno nisu dostupne.', err);
    }
}
