// Prikaz utakmica za LiveScores (index.html) i Today (today.html).
// Koji fajl se ucitava odredjuje data-source atribut na #matchTable.

var matchTable = document.querySelector('#matchTable');

function statusText(fixture) {
    var status = fixture['status'];
    switch (status['short']) {
        case 'NS': return fixture['time'] || 'Uskoro';
        case 'HT': return 'Poluvreme';
        case 'FT': return 'Kraj';
        case 'PST': return 'Odloženo';
        default: return status['elapsed'] != null ? status['elapsed'] + "'" : '';
    }
}

// Utakmica koja nije pocela nema golove (null), pa umesto "null - null" pise "vs".
function scoreText(goals) {
    if (goals['home'] == null || goals['away'] == null) {
        return 'vs';
    }
    return goals['home'] + ' - ' + goals['away'];
}

function createTeam(team) {
    var box = document.createElement('div');
    box.classList.add('team');
    var logo = document.createElement('img');
    logo.src = team['logo'];
    logo.alt = '';
    var name = document.createElement('p');
    name.textContent = team['name'];
    box.appendChild(logo);
    box.appendChild(name);
    return box;
}

function addMatchTile(data) {
    var matchtile = document.createElement('div');
    matchtile.classList.add('match-tile');

    var minutaza = document.createElement('div');
    minutaza.classList.add('minutaza');
    minutaza.textContent = statusText(data['fixture']);

    var score = document.createElement('p');
    score.classList.add('score');
    score.textContent = scoreText(data['goals']);

    matchtile.appendChild(createTeam(data['teams']['home']));
    matchtile.appendChild(score);
    matchtile.appendChild(minutaza);
    matchtile.appendChild(createTeam(data['teams']['away']));
    matchTable.appendChild(matchtile);
}

function addLeagueHeading(league) {
    var heading = document.createElement('h2');
    heading.classList.add('league-heading');
    heading.textContent = league['name'];
    matchTable.appendChild(heading);
}

// Today stranica prikazuje danasnji datum u naslovu.
var dateLabel = document.getElementById('datum');
if (dateLabel) {
    dateLabel.textContent = new Intl.DateTimeFormat('sr-Latn-RS', {
        day: 'numeric', month: 'long', year: 'numeric'
    }).format(new Date());
}

showStatus(matchTable, 'loading', 'Učitavanje utakmica...');

loadData(matchTable.dataset.source)
    .then(function (data) {
        var matches = data['response'] || [];
        matchTable.replaceChildren();
        if (matches.length === 0) {
            showStatus(matchTable, 'empty', matchTable.dataset.empty || 'Nema utakmica.');
            return;
        }
        var lastLeague = null;
        matches.forEach(function (match) {
            if (matchTable.dataset.groupByLeague === 'true' && match['league']['id'] !== lastLeague) {
                addLeagueHeading(match['league']);
                lastLeague = match['league']['id'];
            }
            addMatchTile(match);
        });
    })
    .catch(function (err) {
        console.error(err);
        showStatus(matchTable, 'error', 'Greška: utakmice trenutno ne mogu da se učitaju.');
    });
