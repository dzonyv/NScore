// Zajednicki kod za sve stranice: tamni rezim, sezona i ucitavanje primer-podataka.

// Tamni rezim se pamti u localStorage, pa ostaje ukljucen i na drugim stranicama.
// Skripta se ucitava u <head>, da bi klasa bila postavljena pre prikaza stranice.
(function () {
    var STORAGE_KEY = 'nscore-darkmode';

    function readMode() {
        try { return localStorage.getItem(STORAGE_KEY) === '1'; } catch (e) { return false; }
    }

    function saveMode(isDark) {
        try { localStorage.setItem(STORAGE_KEY, isDark ? '1' : '0'); } catch (e) { /* nije bitno */ }
    }

    if (readMode()) {
        document.documentElement.classList.add('darkmode');
    }

    document.addEventListener('DOMContentLoaded', function () {
        var toggle = document.getElementById('darkm');
        if (!toggle) return;
        toggle.checked = document.documentElement.classList.contains('darkmode');
        toggle.addEventListener('change', function () {
            document.documentElement.classList.toggle('darkmode', toggle.checked);
            saveMode(toggle.checked);
        });
    });
})();

// Fudbalska sezona pocinje leti: od jula vazi nova sezona (novembar 2026 -> 2026/27).
function currentSeason(date) {
    date = date || new Date();
    return date.getMonth() >= 6 ? date.getFullYear() : date.getFullYear() - 1;
}

function seasonLabel(season) {
    return season + '/' + String((season + 1) % 100).padStart(2, '0');
}

// Demo nema API kljuc, pa se podaci citaju iz data/*.json (primer-podaci).
function loadData(name) {
    return fetch('data/' + name + '.json').then(function (response) {
        if (!response.ok) {
            throw new Error('HTTP ' + response.status);
        }
        return response.json();
    });
}

// Poruka za ucitavanje, gresku ili prazan rezultat.
function showStatus(container, kind, text) {
    container.replaceChildren();
    var message = document.createElement('p');
    message.className = 'status status-' + kind;
    message.textContent = text;
    container.appendChild(message);
}
