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

// Zahtev koji visi se prekida, da stranica ne bi ostala na "Ucitavanje...".
var FETCH_TIMEOUT_MS = 15 * 1000;

function fetchWithTimeout(url) {
    // Stariji browseri nemaju AbortSignal.timeout; tamo ostaje zahtev bez roka.
    var canTimeout = typeof AbortSignal !== 'undefined' && AbortSignal.timeout;
    return fetch(url, canTimeout ? { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) } : {});
}

function fetchJson(url) {
    return fetchWithTimeout(url).then(function (response) {
        if (!response.ok) {
            throw new Error('HTTP ' + response.status);
        }
        return response.json();
    });
}

// Pravi podaci stizu preko proxyja u api/ (Vercel funkcije, kljuc je na serveru).
// Gde proxy ne postoji (GitHub Pages, lokalni staticni server) ruta vraca 404,
// pa se prikazuju primer-podaci iz data/ uz vidljivu oznaku "Demo".
function loadData(apiPath, sampleName) {
    return fetchWithTimeout(apiPath).then(function (response) {
        if (response.status === 404) {
            return fetchJson('data/' + sampleName + '.json').then(function (data) {
                document.querySelectorAll('.demo-podaci').forEach(function (el) { el.hidden = false; });
                data.demo = true;
                return data;
            });
        }
        if (!response.ok) {
            throw new Error('HTTP ' + response.status);
        }
        return response.json();
    });
}

function formatDate(date) {
    return new Intl.DateTimeFormat('sr-Latn-RS', {
        day: 'numeric', month: 'long', year: 'numeric'
    }).format(date);
}

// Poruka za ucitavanje, gresku ili prazan rezultat.
function showStatus(container, kind, text) {
    container.replaceChildren();
    var message = document.createElement('p');
    message.className = 'status status-' + kind;
    message.textContent = text;
    container.appendChild(message);
}
