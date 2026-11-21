// Tabela jednog takmicenja: standings.html?lid=39
var table = document.getElementById('standings');
var title = document.getElementById('standings-title');
var competition = findCompetition(Number(new URLSearchParams(window.location.search).get('lid')));

var COLUMNS = [
    ['#', 'Pozicija'],
    ['Tim', 'Tim'],
    ['U', 'Utakmice'],
    ['P', 'Pobede'],
    ['N', 'Nerešeno'],
    ['I', 'Izgubljeno'],
    ['GR', 'Gol-razlika'],
    ['B', 'Bodovi']
];

function cell(tag, text) {
    var el = document.createElement(tag);
    el.textContent = text;
    return el;
}

function renderTable(rows) {
    var tableEl = document.createElement('table');
    tableEl.classList.add('standings-table');

    var headRow = document.createElement('tr');
    COLUMNS.forEach(function (col) {
        var th = cell('th', col[0]);
        th.title = col[1];
        headRow.appendChild(th);
    });
    tableEl.appendChild(document.createElement('thead')).appendChild(headRow);

    var body = tableEl.appendChild(document.createElement('tbody'));
    rows.forEach(function (row) {
        var tr = document.createElement('tr');
        tr.appendChild(cell('td', row['rank']));

        var teamCell = document.createElement('td');
        teamCell.classList.add('team-cell');
        var logo = document.createElement('img');
        logo.src = row['team']['logo'];
        logo.alt = '';
        teamCell.appendChild(logo);
        teamCell.appendChild(document.createTextNode(row['team']['name']));
        tr.appendChild(teamCell);

        var all = row['all'];
        [all['played'], all['win'], all['draw'], all['lose'], row['goalsDiff'], row['points']]
            .forEach(function (value) { tr.appendChild(cell('td', value)); });
        body.appendChild(tr);
    });

    var wrapper = document.createElement('div');
    wrapper.classList.add('table-scroll');
    wrapper.appendChild(tableEl);
    table.appendChild(wrapper);
}

if (!competition) {
    title.textContent = 'Tabela';
    showStatus(table, 'error', 'Nepoznato takmičenje. Izaberi ligu ili kup iz menija.');
} else {
    title.textContent = competition.name + ' ' + seasonLabel(currentSeason());
    document.title = 'NScore – ' + competition.name;
    showStatus(table, 'loading', 'Učitavanje tabele...');

    loadData('standings')
        .then(function (data) {
            var groups = data['standings'][String(competition.id)];
            table.replaceChildren();
            if (!groups || groups.length === 0) {
                showStatus(table, 'empty', 'Za ovo takmičenje nema tabele u primer-podacima.');
                return;
            }
            groups.forEach(renderTable);
        })
        .catch(function (err) {
            console.error(err);
            showStatus(table, 'error', 'Greška: tabela trenutno ne može da se učita.');
        });
}
