// Prikaz utakmica za LiveScores (index.html) i Today (today.html).
// Obe stranice citaju isti odgovor (danasnje utakmice); Live zadrzava samo one u toku.

var matchTable = document.querySelector('#matchTable');
var isLiveView = matchTable.dataset.view === 'live';
var REFRESH_MS = 2 * 60 * 1000;
// Koliko posle isteka podaci jos ne vaze za zastarele (kes na CDN-u, netacan sat kod posetioca).
var STALE_GRACE_MS = 5 * 60 * 1000;
var freshness = document.getElementById('svezina');
var lastData = null;
// today.html?lid=45: samo utakmice jednog takmicenja (kupovi bez tabele).
var onlyCompetition = isLiveView ? null : findCompetition(Number(new URLSearchParams(window.location.search).get('lid')));
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
    logo.width = 52;
    logo.height = 52;
    logo.loading = 'lazy';
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
    logo.width = 24;
    logo.height = 24;
    logo.loading = 'lazy';
    heading.appendChild(logo);
    heading.appendChild(document.createTextNode(league['name']));
    matchTable.appendChild(heading);
}

function render(data) {
    var matches = data['response'] || [];
    if (isLiveView) {
        // Posle ponoci proxy posebno salje utakmice od juce koje jos traju.
        matches = (data['stillInPlay'] || []).concat(matches).filter(function (m) { return IN_PLAY.includes(m['fixture']['status']['short']); });
    }
    if (onlyCompetition) {
        matches = matches.filter(function (m) { return m['league']['id'] === onlyCompetition.id; });
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

function clockText(date) {
    var time = date.toLocaleTimeString('sr-Latn-RS', { hour: '2-digit', minute: '2-digit' });
    return date.toDateString() === new Date().toDateString() ? time : formatDate(date) + ' u ' + time;
}

// "Podaci od 19:42", uz upozorenje kada osvezavanje ne uspe ili stignu zastareli podaci.
function showFreshness(requestFailed) {
    if (!lastData['updatedAt']) {
        return; // primer-podaci nemaju vreme preuzimanja
    }
    var validUntil = new Date(lastData['validUntil'] * 1000);
    // refreshFailed: proxy nije uspeo da osvezi podatke; stillInPlay null: ne zna se sta traje od juce.
    var stale = requestFailed || lastData['refreshFailed']
        || (isLiveView && lastData['stillInPlay'] === null)
        || Date.now() > validUntil.getTime() + STALE_GRACE_MS;
    var text = 'Podaci od ' + clockText(new Date(lastData['updatedAt'] * 1000)) + '.';
    if (stale) {
        text += ' Osvežavanje trenutno ne uspeva, pa rezultati mogu biti zastareli.';
    } else if (validUntil > new Date()) {
        text += ' Novi se očekuju oko ' + clockText(validUntil) + '.';
    }
    freshness.textContent = text;
    freshness.classList.toggle('svezina-upozorenje', Boolean(stale));
    freshness.hidden = false;
}

function update() {
    loadData('api/fixtures', matchTable.dataset.view)
        .then(function (data) {
            render(data);
            lastData = data;
            showFreshness(false);
        })
        .catch(function (err) {
            console.error(err);
            // Ako osvezavanje ne uspe, ostaju poslednji prikazani rezultati, uz upozorenje.
            if (lastData) {
                showFreshness(true);
            } else {
                showStatus(matchTable, 'error', 'Greška: utakmice trenutno ne mogu da se učitaju. Pokušavamo ponovo automatski.');
            }
        })
        .then(function () {
            // Pravi podaci se povremeno osvezavaju (i posle greske); primer-podaci se ne menjaju.
            if (!lastData || !lastData.demo) {
                setTimeout(refresh, REFRESH_MS);
            }
        });
}

// Skriven tab ne salje zahteve; osvezava se cim ponovo postane vidljiv.
var refreshWhenVisible = false;

function refresh() {
    if (document.hidden) {
        refreshWhenVisible = true;
    } else {
        update();
    }
}

document.addEventListener('visibilitychange', function () {
    if (!document.hidden && refreshWhenVisible) {
        refreshWhenVisible = false;
        update();
    }
});

if (onlyCompetition) {
    document.getElementById('takmicenje').textContent = onlyCompetition.name + ', ';
    document.title = 'NScore – ' + onlyCompetition.name;
    matchTable.dataset.empty = 'Danas nema utakmica u ovom takmičenju.';
    setActiveNav(onlyCompetition.type === 'Cup' ? 'Cups.html' : 'leagues.html');
}

showStatus(matchTable, 'loading', 'Učitavanje utakmica...');
update();
