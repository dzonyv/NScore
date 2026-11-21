// Prikaz utakmica za LiveScores (index.html) i Today (today.html).
// Obe stranice citaju isti odgovor (danasnje utakmice); Live zadrzava samo one u toku.

var matchTable = document.querySelector('#matchTable');
var isLiveView = matchTable.dataset.view === 'live';
var REFRESH_MS = 2 * 60 * 1000;
var IN_PLAY = ['1H', 'HT', '2H', 'ET', 'BT', 'P', 'SUSP', 'INT', 'LIVE'];

function kickoffTime(fixture) {
    if (fixture['time']) {
        return fixture['time']; // primer-podaci
    }
    return new Date(fixture['timestamp'] * 1000).toLocaleTimeString('sr-Latn-RS', {
        hour: '2-digit', minute: '2-digit'
    });
}

function statusText(fixture) {
    var status = fixture['status'];
    switch (status['short']) {
        case 'NS': return kickoffTime(fixture);
        case 'TBD': return 'Vreme nije poznato';
        case 'HT': return 'Poluvreme';
        case 'BT': return 'Pauza';
        case 'P': return 'Penali';
        case 'FT': return 'Kraj';
        case 'AET': return 'Kraj (produžeci)';
        case 'PEN': return 'Kraj (penali)';
        case 'PST': return 'Odloženo';
        case 'CANC': return 'Otkazano';
        case 'ABD': return 'Prekinuto';
        case 'SUSP':
        case 'INT': return 'Prekid';
        case 'AWD':
        case 'WO': return 'Službeni rezultat';
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

    var middle = document.createElement('div');
    middle.classList.add('match-middle');
    middle.appendChild(minutaza);
    middle.appendChild(score);

    matchtile.appendChild(createTeam(data['teams']['home']));
    matchtile.appendChild(middle);
    matchtile.appendChild(createTeam(data['teams']['away']));
    matchTable.appendChild(matchtile);
}

function addLeagueHeading(league) {
    var heading = document.createElement('h2');
    heading.classList.add('league-heading');
    var logo = document.createElement('img');
    logo.src = competitionLogo(league['id']); // iz competitions.js
    logo.alt = '';
    heading.appendChild(logo);
    heading.appendChild(document.createTextNode(league['name']));
    matchTable.appendChild(heading);
}

function render(data) {
    var matches = data['response'] || [];
    if (isLiveView) {
        matches = matches.filter(function (m) { return IN_PLAY.includes(m['fixture']['status']['short']); });
    }

    // Today: datum iz odgovora (proxy racuna dan po beogradskom vremenu), inace danasnji.
    var dateLabel = document.getElementById('datum');
    if (dateLabel) {
        var parts = data['date'] ? data['date'].split('-').map(Number) : null;
        dateLabel.textContent = formatDate(parts ? new Date(parts[0], parts[1] - 1, parts[2]) : new Date());
    }

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
}

function update(firstLoad) {
    loadData('api/fixtures', matchTable.dataset.view)
        .then(function (data) {
            render(data);
            // Pravi podaci se povremeno osvezavaju; primer-podaci se ne menjaju.
            if (firstLoad && !data.demo) {
                setInterval(update, REFRESH_MS);
            }
        })
        .catch(function (err) {
            console.error(err);
            // Ako osvezavanje ne uspe, ostaju poslednji prikazani rezultati.
            if (firstLoad) {
                showStatus(matchTable, 'error', 'Greška: utakmice trenutno ne mogu da se učitaju.');
            }
        });
}

showStatus(matchTable, 'loading', 'Učitavanje utakmica...');
update(true);
