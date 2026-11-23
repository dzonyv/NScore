// Staticna lista takmicenja (ID-jevi iz API-Football).
// Ranije se preuzimala cela lista od preko hiljadu takmicenja da bi se prikazalo njih 16.
// hasTable: false su kupovi bez ligaske ili grupne faze (isto kao WITHOUT_TABLE u api/_lib.js).
var COMPETITIONS = [
    { id: 39, name: 'Premier League', country: 'Engleska', type: 'League' },
    { id: 140, name: 'La Liga', country: 'Španija', type: 'League' },
    { id: 135, name: 'Serie A', country: 'Italija', type: 'League' },
    { id: 78, name: 'Bundesliga', country: 'Nemačka', type: 'League' },
    { id: 61, name: 'Ligue 1', country: 'Francuska', type: 'League' },
    { id: 88, name: 'Eredivisie', country: 'Holandija', type: 'League' },
    { id: 94, name: 'Primeira Liga', country: 'Portugal', type: 'League' },
    { id: 286, name: 'Super Liga', country: 'Srbija', type: 'League' },
    { id: 2, name: 'UEFA Champions League', country: 'Evropa', type: 'Cup' },
    { id: 3, name: 'UEFA Europa League', country: 'Evropa', type: 'Cup' },
    { id: 848, name: 'UEFA Conference League', country: 'Evropa', type: 'Cup' },
    { id: 531, name: 'UEFA Super Cup', country: 'Evropa', type: 'Cup', hasTable: false },
    { id: 45, name: 'FA Cup', country: 'Engleska', type: 'Cup', hasTable: false },
    { id: 143, name: 'Copa del Rey', country: 'Španija', type: 'Cup', hasTable: false },
    { id: 81, name: 'DFB Pokal', country: 'Nemačka', type: 'Cup', hasTable: false },
    { id: 66, name: 'Coupe de France', country: 'Francuska', type: 'Cup', hasTable: false },
    { id: 732, name: 'Kup Srbije', country: 'Srbija', type: 'Cup', hasTable: false }
];

function competitionLogo(id) {
    return 'https://media.api-sports.io/football/leagues/' + id + '.png';
}

function findCompetition(id) {
    return COMPETITIONS.find(function (c) { return c.id === id; }) || null;
}

function addCompetitionTile(container, competition) {
    var tile = document.createElement('div');
    tile.classList.add('competition-tile');

    var logo = document.createElement('img');
    logo.src = competitionLogo(competition.id);
    logo.alt = '';
    logo.width = 32;
    logo.height = 32;

    var link = document.createElement('a');
    // Kup bez tabele vodi na svoje danasnje utakmice.
    link.href = (competition.hasTable === false ? 'today.html?lid=' : 'standings.html?lid=') + competition.id;
    link.classList.add('competition-link');
    link.textContent = competition.name;

    tile.appendChild(logo);
    tile.appendChild(link);
    container.appendChild(tile);
}

// leagues.html i Cups.html koriste isti kod; data-type bira lige ili kupove.
var competitionList = document.getElementById('competitions');
if (competitionList) {
    COMPETITIONS
        .filter(function (c) { return c.type === competitionList.dataset.type; })
        .forEach(function (c) { addCompetitionTile(competitionList, c); });
}
