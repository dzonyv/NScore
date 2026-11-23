# NScore

![NScore, the Today page](docs/screenshot.png)

NScore is a football scores website I made in 2022 while learning HTML, CSS and JavaScript. It has a page for live matches, a list of today's matches, and a list of leagues and cups with their standings. The frontend has no frameworks and no build step.

Live site: https://nscore-two.vercel.app/
Demo with sample data: https://dzonyv.github.io/NScore/

## How the data works

The data comes from [API-Football](https://www.api-football.com/). The browser never sees the API key. It calls two small Vercel functions in `api/`, and those call API-Football with the key from an environment variable:

- `/api/fixtures` returns today's matches (Belgrade time) from the 17 competitions on the site. The Live page uses the same response and keeps only the matches in progress.
- `/api/standings?league=39` returns the table for one of the 11 competitions that have one. Knockout cups have no table, so their links show that cup's matches for today.

The free API plan allows 100 requests a day, so responses are cached on the Vercel CDN and in the function's memory. Tables are kept for 24 hours. Matches are kept for 20 minutes while any match is on, otherwise until the next kickoff (at least 20 minutes, at most 3 hours). With that, one function instance makes about 90 API calls on the busiest possible day, and usually far fewer. This is not a hard limit, because a new function instance starts with an empty cache. Live scores can be a little over 20 minutes behind; the page shows when the data was fetched and warns when refreshing fails.

The free plan also has no access to the current season's tables, only to 2022 to 2024. `API_FOOTBALL_MAX_SEASON=2024` makes the site show the 2024/25 tables, and the page says so. With a paid plan, remove that variable.

Where there is no `api/` (GitHub Pages, or any plain static server), the pages fall back to the made-up sample data in `data/` and show a "Demo" label. The login page is a mockup and does not send anything.

## Built in 2022, without AI

I wrote the original code between March and June 2022, before ChatGPT was released. The commit dates in the history are the real ones. The tag [`v2022-original`](https://github.com/dzonyv/NScore/tree/v2022-original) points to the code as it was on 31 May 2022; the only changes there are a removed API key and removed links to personal profiles. Everything after 2022 (the fixes from 2024, and the cleanup and API proxy from 2026) is in separate commits on top of it.

## Running it locally

With real data you need the [Vercel CLI](https://vercel.com/docs/cli) and an API-Football key:

```
git clone https://github.com/dzonyv/NScore.git
cd NScore
cp .env.example .env     # then put your key in API_FOOTBALL_KEY
npx vercel dev
```

Without a key, any static server shows the sample data:

```
python -m http.server 8000
```

Then open http://localhost:8000. Opening `index.html` straight from disk (`file://`) does not work, because browsers block `fetch` there.

Club and competition logos load from the API-Football media server, so they need an internet connection.

## License

MIT, see [LICENSE](LICENSE).

---

## Srpski

NScore je sajt za fudbalske rezultate koji sam napravio 2022. godine, dok sam učio HTML, CSS i JavaScript. Ima stranicu sa utakmicama uživo, listu današnjih utakmica i spisak liga i kupova sa tabelama. Frontend nema frameworke ni build korak.

Sajt sa pravim podacima: https://nscore-two.vercel.app/
Demo sa primer-podacima: https://dzonyv.github.io/NScore/

### Odakle stižu podaci

Podaci dolaze sa [API-Football](https://www.api-football.com/) servisa. Browser nikad ne vidi API ključ: zove dve male Vercel funkcije u folderu `api/`, a one zovu API-Football sa ključem iz env varijable. `/api/fixtures` vraća današnje utakmice (po beogradskom vremenu) iz 17 takmičenja sa sajta, a Live stranica iz istog odgovora uzima samo utakmice u toku. `/api/standings?league=39` vraća tabelu jednog od 11 takmičenja koja je imaju. Kupovi na ispadanje nemaju tabelu, pa njihovi linkovi prikazuju današnje utakmice tog kupa.

Besplatni plan dozvoljava 100 zahteva dnevno, pa se odgovori keširaju na Vercel CDN-u i u memoriji funkcije. Tabele se čuvaju 24 sata. Utakmice se čuvaju 20 minuta dok neka traje, a inače do početka sledeće (najmanje 20 minuta, najduže 3 sata). Tako jedna instanca funkcije i najprometnijeg dana pravi oko 90 poziva, a obično mnogo manje. To nije tvrda granica, jer nova instanca kreće sa praznim kešom. Rezultati uživo mogu da kasne nešto više od 20 minuta; stranica prikazuje kada su podaci preuzeti i upozorava kada osvežavanje ne uspe.

Besplatni plan nema tabele za tekuću sezonu, samo za 2022–2024. Zato `API_FOOTBALL_MAX_SEASON=2024` prikazuje tabele sezone 2024/25, i to piše na stranici. Sa plaćenim planom tu varijablu treba obrisati.

Gde `api/` ne postoji (GitHub Pages ili običan statični server), stranice prikazuju izmišljene primer-podatke iz `data/` uz oznaku „Demo”. Login stranica je samo mockup i ništa ne šalje.

### Napravljeno 2022, bez AI

Originalni kod sam pisao od marta do juna 2022, pre nego što je ChatGPT izašao. Datumi commitova u istoriji su pravi. Tag [`v2022-original`](https://github.com/dzonyv/NScore/tree/v2022-original) pokazuje kod onakav kakav je bio 31. maja 2022; jedine izmene su uklonjen API ključ i uklonjeni linkovi ka ličnim profilima. Sve posle 2022. (ispravke iz 2024, sređivanje i API proxy iz 2026) nalazi se u posebnim commitovima.

### Pokretanje

Sa pravim podacima treba [Vercel CLI](https://vercel.com/docs/cli) i API-Football ključ:

```
git clone https://github.com/dzonyv/NScore.git
cd NScore
cp .env.example .env     # pa upiši ključ u API_FOOTBALL_KEY
npx vercel dev
```

Bez ključa, bilo koji statični server prikazuje primer-podatke (`python -m http.server 8000`, pa otvori http://localhost:8000).

Licenca: MIT, vidi [LICENSE](LICENSE).
