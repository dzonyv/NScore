// Header i footer za sve stranice, na jednom mestu.
// Skripta se ucitava sinhrono tamo gde treba da stoji header/footer:
//   <script src="layout.js" data-part="header"></script>
// pa se HTML upise pre iscrtavanja stranice (bez "skakanja" i bez dodatnih zahteva).

var LIVE_URL = 'https://nscore-two.vercel.app/';
var DEMO_URL = 'https://dzonyv.github.io/NScore/';

var MENU = [
    ['index.html', 'Uživo'],
    ['today.html', 'Danas'],
    ['leagues.html', 'Lige'],
    ['Cups.html', 'Kupovi'],
    ['Login.html', 'Prijava']
];

function headerHtml() {
    var items = MENU.map(function (item) {
        return '<li><a href="' + item[0] + '">' + item[1] + '</a></li>';
    }).join('');
    return '<header><div class="container flex">' +
        '<div class="header-logo"><a href="index.html"><img src="nscore-logo.png" alt="NScore logo"></a></div>' +
        '<nav><ul id="glavni-meni" class="flex column-gap-10">' + items +
        '<li class="mode-prekidac"><label title="Tamni režim">' +
        '<input type="checkbox" id="darkm" class="sakriven" aria-label="Tamni režim">' +
        '<div class="check"></div></label></li>' +
        '</ul></nav></div></header>';
}

// Link ka drugoj verziji sajta: sa demoa ka pravim podacima i obrnuto (lokalno oba).
function otherVersionLinks() {
    var host = window.location.hostname;
    var live = '<a href="' + LIVE_URL + '">Verzija sa pravim podacima</a>';
    var demo = '<a href="' + DEMO_URL + '">Demo sa primer-podacima</a>';
    if (host.endsWith('github.io')) return [live];
    if (host.endsWith('vercel.app')) return [demo];
    return [live, demo];
}

function footerHtml() {
    var links = ['Podaci: <a href="https://www.api-football.com/">API-Football</a>',
        '<a href="https://github.com/dzonyv/NScore">GitHub</a>'].concat(otherVersionLinks());
    return '<footer><div class="container">' +
        '<div class="row flex footer-red">' +
        '<div class="footer-logo"><img src="nscore-logo.png" alt="NScore logo"></div>' +
        '<div class="footer-opis">' +
        '<p>NScore: fudbalski rezultati uživo, današnje utakmice i tabele liga i kupova. Projekat iz 2022, sređen 2026.</p>' +
        '<p class="footer-linkovi">' + links.join(' · ') + '</p>' +
        '</div></div>' +
        '<div class="row text-center"><p class="copyright">© 2022–2026 NScore</p></div>' +
        '</div></footer>';
}

// Oznacava trenutnu stranicu u meniju. standings.html je poziva sama,
// jer tek posle ucitavanja zna da li je otvorena liga ili kup.
function setActiveNav(page) {
    document.querySelectorAll('#glavni-meni a').forEach(function (link) {
        if (link.getAttribute('href') === page) {
            link.setAttribute('aria-current', 'page');
        } else {
            link.removeAttribute('aria-current');
        }
    });
}

(function () {
    var script = document.currentScript;
    if (script.dataset.part === 'header') {
        script.insertAdjacentHTML('beforebegin', headerHtml());
        setActiveNav(window.location.pathname.split('/').pop() || 'index.html');
    } else if (script.dataset.part === 'footer') {
        script.insertAdjacentHTML('beforebegin', footerHtml());
    }
})();
