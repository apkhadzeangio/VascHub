# VascHub

საქართველოს სისხლძარღვთა ქირურგიის პროფესიული პლატფორმის ტექნიკური საფუძველი.
ოფიციალური **Payload Website Template** მორგებულია **Next.js + PostgreSQL**-ზე.
ამ ეტაპზე დამატებულია Figma დიზაინზე დაფუძნებული ქართული მთავარი გვერდი,
რედაქტირებადი სექციები და გამოქვეყნებული სტატიების რეალური ძიება.
კლინიკური ბიბლიოთეკა `/library`-ზე აერთიანებს გაიდლაინებს, პუბლიკაციებსა და
სასწავლო რესურსებს. მართვა, დაცული PDF-ები და გაშვების ნაბიჯები: [LIBRARY.md](docs/LIBRARY.md).
მოქმედებს CMS, ადმინისტრირება, გვერდები, სტატიები და მედიის მართვა.
აკადემია, ღონისძიებები, ცნობარი და საჯარო წევრობა ჯერ არ არის განხორციელებული.

## მოთხოვნები

- Node.js **24.22.1** (ან package.json-ში მითითებული თავსებადი ვერსია).
- pnpm **11.25.0**, Corepack-ით.
- PostgreSQL **16** (კონფიგურაციაში დაფიქსირებულია 16.15).
- Docker Engine + Compose v2 — კონტეინერებით გაშვების შემთხვევაში.

```bash
git clone https://github.com/apkhadzeangio/VascHub.git
cd VascHub
cp .env.example .env
```

`.env`-ში შეავსეთ `PAYLOAD_SECRET`, `PREVIEW_SECRET`, `CRON_SECRET` და
`POSTGRES_PASSWORD` სხვადასხვა შემთხვევითი მნიშვნელობით. თითოეულისთვის:

```bash
openssl rand -hex 32
```

`DATABASE_URL`-ში ჩაწერეთ ადგილობრივი PostgreSQL-ის იგივე მომხმარებელი,
პაროლი და ბაზა. Hex პაროლები URL-ში დამატებით კოდირებას არ მოითხოვს.
`NEXT_PUBLIC_SERVER_URL` არის საიტის მისამართი ბოლოში `/`-ის გარეშე;
ჰოსტის შეცვლისას აპი თავიდან ააწყეთ. `.env` არ იტვირთება Git-ში.

## Docker-ით გაშვება

```bash
docker compose up --build -d
docker compose logs -f app
```

მისამართი: http://localhost:3000; პანელი: http://localhost:3000/admin.
აპი მიბმულია მხოლოდ ლოკალურ ინტერფეისზე. საჯარო გაშვებისთვის საჭიროა ცალკე
TLS/reverse proxy-ის კონფიგურაცია; ამ ეტაპზე საჯარო ჰოსტინგი არ არის გამართული.
Compose თავად ქმნის ბაზას, ელოდება მის მზადყოფნას და აპის დაწყებამდე ასრულებს მიგრაციებს.
Docker build-ს მოქმედი ბაზა ან რეალური საიდუმლო გასაღები არ სჭირდება.

მიგრაციების ხელახლა შესრულება:

```bash
docker compose exec app pnpm db:migrate
```

## პირველი ადმინისტრატორი

საჯარო რეგისტრაცია და `/api/users/first-register` დაბლოკილია. პირველი ადმინისტრატორი
შექმენით **სერვერზე**, მინიმუმ 16-სიმბოლოიანი უნიკალური პაროლით. Bash-ში:

```bash
read -r -p 'Admin email: ' ADMIN_EMAIL
read -r -s -p 'Admin password: ' ADMIN_PASSWORD
export ADMIN_EMAIL ADMIN_PASSWORD
docker compose exec -e ADMIN_EMAIL -e ADMIN_PASSWORD app pnpm admin:create
unset ADMIN_EMAIL ADMIN_PASSWORD
```

პაროლი ბრძანების ტექსტში არ იწერება. სკრიპტი უარს ამბობს მუშაობაზე, თუ ერთი
მაინც ადმინისტრატორი უკვე არსებობს. შემდგომი ანგარიშები იქმნება ავტორიზებული
ადმინისტრატორის მიერ `/admin`-ში. ლოკალური გაშვებისას Docker-ის ბრძანების ნაცვლად
გამოიყენეთ `pnpm admin:create`. ცარიელ ბაზაზე პანელმა შეიძლება საწყისი ანგარიშის
ფორმა აჩვენოს, მაგრამ ბრაუზერიდან მისი გაგზავნა აკრძალულია — გამოიყენეთ CLI.

## ლოკალური გაშვება

გამოიყენეთ საკუთარი PostgreSQL ან მხოლოდ Compose-ის ბაზა გამოაქვეყნეთ ლოკალურად:

```bash
docker compose -f docker-compose.yml -f docker-compose.local.yml up -d db
corepack enable
corepack prepare pnpm@11.25.0 --activate
pnpm install --frozen-lockfile
pnpm db:migrate
pnpm dev
```

მონაცემთა სტრუქტურის შეცვლისას:

```bash
pnpm db:migrate:create აღწერითი_სახელი
pnpm db:migrate
pnpm generate:types
pnpm generate:importmap
```

განვითარების ავტომატური schema push გამორთულია: ბაზის ცვლილებები მიგრაციებით
კონტროლდება. გენერირებული მიგრაციები და ტიპები ატვირთეთ რეპოზიტორიაში.

Production რეჟიმის ადგილობრივი შემოწმება:

```bash
pnpm build
pnpm start
```

## შემოწმებები

```bash
pnpm typecheck
pnpm lint
pnpm test:int
pnpm exec playwright install chromium
pnpm test:e2e
```

ტესტებისთვის აუცილებლად გამოიყენეთ ცალკე `vaschub_test` ბაზა და მასზე შეასრულეთ
`pnpm db:migrate`. Integration/E2E ტესტები ქმნის და ასუფთავებს სატესტო ჩანაწერებს.
E2E ავტომატურად გაუშვებს dev სერვერს; production-ის შესამოწმებლად ჯერ შეასრულეთ
`pnpm build`, შემდეგ `E2E_SERVER_COMMAND='pnpm start' pnpm test:e2e`.
Linux-ზე შეიძლება საჭირო იყოს `pnpm exec playwright install --with-deps chromium`.
გაშვებულ სატესტო სერვერზე HTTP შემოწმებისთვის არსებობს `pnpm test:http`.
მას მიაწოდეთ სატესტო ადმინისტრატორის `ADMIN_EMAIL` და `ADMIN_PASSWORD`
გარემოს ცვლადებით, ზემოთ ნაჩვენები `read` ბრძანებებით. იგი ამოწმებს შესვლას,
გვერდის შექმნა/გამოქვეყნებასა და მედიის ატვირთვას და თავის ჩანაწერებს შლის.
გამოიყენეთ მხოლოდ იზოლირებულ სატესტო გარემოში.

GitHub Actions-ის სამუშაო პროცესი აღწერილია `.github/workflows/checks.yml`-ში.

## მონაცემების შენახვა და აღდგენა

- კოდი, სქემები, მიგრაციები და ინსტრუქციები — GitHub-ში.
- PostgreSQL — `postgres_data` named volume, `/var/lib/postgresql/data`.
- ატვირთული ფაილები — `media_data` named volume, `/app/public/media`.
- ბიბლიოთეკის დაცული PDF-ები — `library_files` volume, `/app/private/library-files`.
- ლოკალური ატვირთვები — `public/media/`, ან `MEDIA_DIR`-ით მითითებული დირექტორია.
- `docker compose down` მონაცემებს ინარჩუნებს; `down -v` წაშლის მათ.

ბაზის ასლის აღება (Bash):

```bash
mkdir -p backups
docker compose exec -T db sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc' > backups/database.dump
docker compose exec -T app tar -C /app/public/media -czf - . > backups/media.tar.gz
docker compose exec -T app tar -C /app/private/library-files -czf - . > backups/library-files.tar.gz
```

აღდგენა შეასრულეთ ცარიელ ბაზაში, შეჩერებული აპით, შესაბამისი კოდის ვერსიით:

```bash
docker compose stop app
docker compose exec -T db sh -c 'pg_restore -U "$POSTGRES_USER" -d "$POSTGRES_DB" --no-owner' < backups/database.dump
docker compose run --rm --no-deps -T app tar -C /app/public/media -xzf - < backups/media.tar.gz
docker compose run --rm --no-deps -T app tar -C /app/private/library-files -xzf - < backups/library-files.tar.gz
docker compose up -d app
```

ბაზისა და მედიის ასლები ერთად შეინახეთ დაცულ საცავში; `backups/` Git-ში არ შედის.
საიდუმლო გასაღებების დაცული ასლები ცალკე საჭიროა. რეპოზიტორია ცოცხალ მონაცემებს
და პაროლებს არ შეიცავს.

## მიმდინარე ფარგლები

- ქართული მთავარი გვერდი, მობილური მენიუ, Noto Sans Georgian და Figma-ის ვიზუალური სისტემა.
- მთავარი გვერდის კონტენტი იმართება Pages-ის `home` ჩანაწერის „მთავარი გვერდი“ ტაბიდან.
- ძიება მუშაობს გამოქვეყნებულ სტატიებზე; წევრობა/პირადი კაბინეტი ჯერ მიუწვდომელია.
- `/library` — კლინიკური რესურსები, ქართული ძიება/ფილტრები, უსაფრთხო PDF ჩამოტვირთვა და CMS-ით მართვა.
- არსებული CMS-ის ავტორიზებული მომხმარებლები ადმინისტრაციული თანამშრომლები არიან;
  საჯარო პროფესიული წევრობა ჯერ არ არის დამატებული.
- დემო seeding endpoint გამორთულია; დემო სამედიცინო მასალა არ არის დამატებული.
- ელფოსტის პროვაიდერი ჯერ არ არის ჩართული. Password reset წერილები რეალურად
  არ იგზავნება; მიმდინარე console adapter წარმოებისთვის შესაცვლელია.
- jobs/cron-ის ავტომატური განრიგი ამ ეტაპზე არ არის ჩართული.

სტარტერის წარმომავლობა: [docs/UPSTREAM.md](docs/UPSTREAM.md).
მთავარი გვერდის მართვა და შემოწმება: [docs/HOMEPAGE.md](docs/HOMEPAGE.md).
მთავარი გვერდის შედეგები და screenshots: [docs/HOMEPAGE-VALIDATION.md](docs/HOMEPAGE-VALIDATION.md).
ტექნიკური საფუძვლის საწყისი შემოწმებები: [docs/VALIDATION.md](docs/VALIDATION.md).
ორიგინალი ინსტრუქცია: [docs/UPSTREAM-README.md](docs/UPSTREAM-README.md).
ლიცენზია: [MIT](LICENSE.md).
