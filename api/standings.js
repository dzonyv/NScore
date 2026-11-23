// GET /api/standings?league=39: tabela takmicenja za tekucu sezonu.
// Odgovor ima isti oblik kao data/standings.json, pa frontend ne mora da razlikuje izvore.
import { callApi, send, sendError, team, COMPETITION_IDS } from './_lib.js';

// Tabela se menja najvise nekoliko puta dnevno (a zavrsena sezona 2024 nikako).
// 17 takmicenja x 1 poziv dnevno + 72 za utakmice = najvise 89 od 100 dozvoljenih.
const CACHE_SECONDS = 24 * 60 * 60;

// Sezona pocinje leti (od jula). Besplatni plan nema tekucu sezonu,
// pa API_FOOTBALL_MAX_SEASON (npr. 2024) ogranicava koja se sezona trazi.
function seasonFor(date) {
    const season = date.getMonth() >= 6 ? date.getFullYear() : date.getFullYear() - 1;
    const max = Number(process.env.API_FOOTBALL_MAX_SEASON);
    return max && season > max ? max : season;
}

export default async function handler(req, res) {
    const league = Number(req.query.league);
    if (!COMPETITION_IDS.includes(league)) {
        sendError(res, 400, 'Nepoznato takmičenje.');
        return;
    }
    const season = seasonFor(new Date());
    try {
        const data = await callApi('standings', { league, season });
        const groups = data.response.length ? data.response[0].league.standings : [];
        const standings = groups.map((rows) => rows.map((row) => ({
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
        send(res, { season, standings: { [league]: standings } }, CACHE_SECONDS);
    } catch (err) {
        sendError(res, 502, 'Tabela trenutno nije dostupna.', err);
    }
}
