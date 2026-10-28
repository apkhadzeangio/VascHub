# შემოწმების ანგარიში — 2026-10-28

## წარმატებული

გარემო: Node 24.22.1, pnpm 11.25.0, PostgreSQL 16.15, დროებითი `vaschub_test` ბაზა.

- `pnpm install` და განმეორებით `pnpm install --frozen-lockfile`.
- `pnpm typecheck`.
- `pnpm lint` — შეცდომებისა და გაფრთხილებების გარეშე.
- საწყისი მიგრაციის გენერაცია და ცარიელ PostgreSQL ბაზაზე შესრულება.
- `pnpm db:migrate` განმეორებით — უკვე შესრულებული მიგრაცია აღარ მეორდება.
- `pnpm generate:types`.
- `pnpm test:int` — **3/3**: ანონიმური admin შექმნის აკრძალვა,
  პირველი ანგარიშის hook-ის დაცვა, draft/published გვერდების წვდომა.
- `pnpm build` — დასრულებული production build.
- `pnpm start --hostname 127.0.0.1` — მთავარი გვერდი HTTP 200.
- `pnpm admin:create` — პირველი ადმინისტრატორის შექმნა სერვერიდან;
  განმეორებითი bootstrap სწორად უარყოფილია.
- რეალური HTTP შემოწმება: ადმინისტრატორის შესვლა, `/admin` HTTP 200,
  `/api/users/first-register` HTTP 403, გვერდის შექმნა/რედაქტირება/გამოქვეყნება,
  მონახაზის ანონიმური წაკითხვის აკრძალვა, გამოქვეყნებული გვერდის HTTP 200,
  SVG მედიის ატვირთვა და მისი გადმოწერა. სატესტო კონტენტი წაიშალა.
  განმეორებადი სკრიპტი: `tests/http/smoke.mjs`.
- Compose, GitHub Actions და pnpm YAML ფაილების სინტაქსური შემოწმება.

## გარემოთი შეზღუდული

- **Docker image build და Compose-ის გაშვება ადგილობრივად არ შესრულებულა:**
  Docker executable/daemon არ არის ხელმისაწვდომი. YAML-ის ვალიდურობა არ ნიშნავს
  კონტეინერების ფუნქციურ შემოწმებას. CI-ში დამატებულია `docker compose build app`.
- **Playwright UI ტესტები ბოლომდე არ შესრულებულა:** სტანდარტული Chromium-ის
  ჩამოტვირთვის ZIP დაზიანებული იყო. ცალკე დაყენებული Google Chrome 156 გაეშვა
  Playwright-ით, მაგრამ გარემომ აკრძალა მისთვის საჭირო AF_UNIX socket-ის შექმნა
  (`socket() failed: Operation not permitted`). ორი browser ტესტი launch-ზე ჩავარდა,
  ორი admin ტესტი ვეღარ შესრულდა; მხოლოდ request-ზე დაფუძნებული anonymous
  registration ტესტი გავიდა. აპის UI სისწორე ამით დადასტურებული არ არის.
- Sandbox-ში Next.js-ის network-interface discovery შეზღუდულია; რეალური სერვერის
  შემოწმებისთვის hostname პირდაპირ `127.0.0.1` იყო მითითებული.
- PostgreSQL შემოწმდა ამოღებული native Ubuntu PostgreSQL 16.15 ბინარებით,
  TCP-ზე, Unix socket-ის გარეშე. Sandbox-ის root UID check-ისთვის გამოყენებული
  დროებითი shim დარჩა მხოლოდ `/tmp`-ში და პროექტში/კონტეინერში არ შედის.
- ღია გარემოში დარჩენილი ნაბიჯები: `docker compose up --build`, შემდეგ პირველი
  admin-ის CLI შექმნა და `pnpm test:e2e` სტანდარტულ Chromium-ით.

## ჯერ არ არის ჩართული

რეალური ელფოსტის გაგზავნა, საჯარო ჰოსტინგი, კლინიკური მოდულები და სრული დიზაინი.
GitHub Actions-ის აღწერის არსებობა CI-ის წარმატებით დასრულების მტკიცებულება არ არის;
შემდგომი შედეგი უნდა შემოწმდეს შესაბამის workflow run-ში.
