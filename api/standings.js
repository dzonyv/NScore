// GET /api/standings?league=39: tabela takmicenja za tekucu sezonu.
// Odgovor ima isti oblik kao data/standings.json, pa frontend ne mora da razlikuje izvore.
import { cached, callApi, checkRequest, send, sendError, team, TABLE_IDS } from './_lib.js';

// Tabela se menja najvise nekoliko puta dnevno (a zavrsena sezona 2024 nikako).
// 11 takmicenja sa tabelom = najvise 11 poziva dnevno.
const CACHE_SECONDS = 24 * 60 * 60;
const STALE_SECONDS = 7 * 24 * 60 * 60;

// Sezona pocinje leti (od jula). Besplatni plan nema tekucu sezonu,
// pa API_FOOTBALL_MAX_SEASON (npr. 2024) ogranicava koja se sezona trazi.
function seasonFor(date) {
    const season = date.getMonth() >= 6 ? date.getFullYear() : date.getFullYear() - 1;
    const max = Number(process.env.API_FOOTBALL_MAX_SEASON);
    return max && season > max ? max : season;
}

async function loadStandings(league, season) {
    const data = await callApi('standings', { league, season });
    const groups = data.response.length ? data.response[0].league.standings : [];
    return groups.map((rows) => rows.map((row) => ({
        rank: row.rank,
        group: row.group,
        team: team(row.team),
        points: row.points,
        goalsDiff: row.goalsDiff,
        all: {
            played: row.all.played,
            win: row.all.win,
            draw: row.all.draw,
            lose: row.all.lose
        }
    })));
}

export default async function handler(req, res) {
    if (!checkRequest(req, res, ['league'])) {
        return;
    }
    const league = Number(req.query.league);
    // Samo tacan zapis: "039" ili "39.0" bi bili ista liga, a poseban unos u kesu.
    if (!TABLE_IDS.includes(league) || String(league) !== req.query.league) {
        sendError(res, 400, 'Nepoznato takmičenje.');
        return;
    }
    const season = seasonFor(new Date());
    try {
        const result = await cached(`standings:${league}:${season}`,
            () => loadStandings(league, season), () => CACHE_SECONDS, STALE_SECONDS);
        send(res, { season, standings: { [league]: result.value } }, result);
    } catch (err) {
        // 500, a ne 502: to je status za koji Vercel dokumentuje stale-if-error.
        sendError(res, 500, 'Tabela trenutno nije dostupna.', err);
    }
}
