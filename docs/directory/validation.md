# შემოწმებების ანგარიში — 2026-10-31

BASE_SHA: `01bf7cd20d9352fc2d665bcf46feb224cac140c7`.
საბოლოო შემოწმება შესრულდა აღდგენილ სამუშაო ასლზე, მხოლოდ ამ ბრენჩის კოდით.
სატესტო ადმინისტრატორი, 13 საჯარო სპეციალისტი, ორი საჯარო ცენტრი, Draft ჩანაწერები
და ნეიტრალური PNG მხოლოდ იზოლირებულ ბაზაში შეიქმნა და ტესტების შემდეგ გაიწმინდა.

| შემოწმება | შედეგი |
| --- | --- |
| `pnpm typecheck` | წარმატებული |
| `pnpm lint` | წარმატებული |
| `pnpm build` | წარმატებული, ოთხივე ახალი dynamic მარშრუტით |
| იზოლირებული integration + states | 14 passed, 0 failed, 0 skipped |
| Chromium production E2E | 14 passed, 0 failed, 0 skipped |
| მიგრაციის upgrade/rollback/reapply | წარმატებული |
| არსებული სქემა და მონაცემები | 78 ცხრილი; სვეტები, რაოდენობა და შიგთავსის ანაბეჭდები შენარჩუნებულია |
| წინასწარ არსებული Category/Media | შენარჩუნებულია |
| განლაგება | ოთხივე გვერდი 390/768/1440px-ზე, 14 screenshot |
| საერთო Vitest-ის იზოლაციის შემოწმება | 12 DB ტესტი აშკარად skipped-ია საკუთარი config-ის გარეშე; წარმატებულებად არ ითვლება |

## შესრულებული სცენარები

ორივე მოდელის ადმინისტრაციული CRUD; ანონიმური ჩაწერისა და version history-ის
აკრძალვა; Draft/Publish და ახალი Draft რევიზიის გამიჯვნა; ქართული ძიება;
კომბინირებული ფილტრები; URL/refresh/back/pagination; უნიკალური და გრძელი ქართული
Slug; რეალური Media ფაილის 200/PNG პასუხი; არჩევითი/დაკარგული ფოტო და კავშირი;
საჯარო ურთიერთკავშირები ორივე მიმართულებით; არასაჯარო კავშირის WHERE/count/sort/
distinct inference-ის შეზღუდვა; არასაიმედო კონტაქტის URL-ის უარყოფა;
რეალური HTTP 404; ცარიელი ცნობარი; loading/error UI და reset; ხილული keyboard focus;
native CMS-ში რეალური რედაქტირება/გამოქვეყნება და ავტორიზებულ საჯარო სესიაში Draft-ის დამალვა.

## მიგრაციის უსაფრთხოება

ახალი მიგრაცია შექმნილია არსებული Payload CLI-ით (`migrate:create specialists_centres_v1`)
და SQL ხელით გადამოწმებულია. `up` მხოლოდ ამატებს 12 ახალ ცხრილს, ოთხ ახალ status enum-ს,
მათ ინდექსებს/FK-ებს და ორ lock relationship სვეტს. ძველ სქემაში DROP/RENAME ან
არსებული ველების/კლინიკური ბიბლიოთეკის ცვლილება არ არის. ძველი მიგრაციები უცვლელია.
გენერირებული `down`-ის FK მოხსნის რიგი გასწორდა, რათა CASCADE-ის შემდეგ constraint
მეორედ არ მოიხსნას. ქვემოთ მოყვანილი script ჯერ ძველ სამ მიგრაციას ასრულებს,
ქმნის Category/Media საკონტროლო ჩანაწერებს, იღებს სქემას/რაოდენობებს/content digest-ს,
ამატებს ცნობარს, შემდეგ მხოლოდ ცნობარის rollback-სა და ხელახალ გაშვებას ამოწმებს.
Migration ledger-ის დამატება და ორი ნებადართული lock სვეტი შესაბამისი გამონაკლისებია.

```text
PASS upgrade: 78 existing tables retain columns, counts and content digests;
Category and Media sentinels preserved.
PASS isolated rollback: original schema and pre-existing data preserved.
PASS reapply and migration-ledger idempotency.
```

## განმეორების ბრძანებები

გამოიყენეთ საკუთარი ადგილობრივი `vaschub_directory_test` ბაზა, საკუთარი `.env` და
`NEXT_PUBLIC_SERVER_URL=http://localhost:3105`. Fixture-ის დამცავი პირობა ამოწმებს
ბაზის ზუსტ სახელს და localhost-ს. Production URL-ზე fixture მუშაობას უარყოფს.

ახალ, ცარიელ იზოლირებულ ბაზაზე სრული მიგრაციის მტკიცებულება:

```bash
pnpm payload run tests/int/directory/check-migration.ts
```

უკვე არსებულ სატესტო ბაზაზე ჩვეულებრივი განახლებისთვის: `pnpm db:migrate`.

```bash
pnpm typecheck
pnpm lint
pnpm exec vitest run --config tests/int/directory/vitest.config.mts
pnpm build
pnpm exec cross-env 'NODE_OPTIONS=--no-deprecation --import=tsx/esm' \
  'DIRECTORY_SERVER_COMMAND=pnpm start --hostname 127.0.0.1 --port 3105' \
  playwright test --config tests/e2e/directory/playwright.config.ts
```

საკუთარი Chromium executable-ისთვის გამოიყენეთ `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`.
კონფიგურაციები თავად რთავს `DIRECTORY_TESTS=1`-ს. shared CI/config-ში შემთხვევითი
ჩართვა DB ტესტებს აშკარად გამოტოვებს; საკუთარი CI job [ინტეგრაციის მოთხოვნებში](integration-requests.md) არის აღწერილი.

## გარემო და პრაქტიკული საზღვრები

Node 24.22.1, pnpm 11.25.0, Next.js 16.3.3, Payload 3.92.1, native PostgreSQL 16.15,
Chromium 153.0.8010.0 და Playwright 1.63.0. ბაზა იყო მხოლოდ `127.0.0.1:5545`, აპი — `3105`.
თითოეული shell call-ის network namespace იზოლირებულია; DB, აპი და ტესტები ერთი
supervisor-ის შვილი პროცესებით მუშაობდა. Production URL/საიდუმლოები არ გამოყენებულა.

PostgreSQL 16.15 ოფიციალური source release-იდან აიწყო მხოლოდ ერთჯერადი სატესტო
runtime-სთვის. UID-0-only namespace-ის გამო `initdb`/server-ის startup root guard-ს
მხოლოდ `VASCHUB_DIRECTORY_LOCAL_TEST` დროშით მართვადი გამონაკლისი დაემატა. ეს binary,
source და გარემოს ადაპტაცია პროექტში/PR-ში ან Production-ში არ შედის; SQL ძრავა,
ტრანზაქციები და აპლიკაციის adapter ტესტებისთვის არ შეცვლილა.

სწრაფი browser navigation-ისას Next ზოგჯერ წერს `The destination stream closed early`-ს;
ფუნქციური assertions და HTTP სტატუსები დამოუკიდებლად მოწმდება. ეს log წარმატებულ
ტესტად არ ჩაითვალა. გაერთიანებულ main-ზე და Production-ში ხელახალი QA ცალკე ეტაპია.
Merge/deploy, Production მიგრაცია, reset, seed ან ინფრასტრუქტურის ცვლილება არ შესრულებულა.
