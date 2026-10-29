# Clinical Library v0.1 — შემოწმების ანგარიში

თარიღი: 2026-10-29 (Asia/Tbilisi).
ბაზა: `main` / `8030f63`. სამუშაო ბრენჩი: `feat/clinical-library-v0.1`.
განხორციელება და კონტენტის წყაროები: [CLINICAL-LIBRARY.md](CLINICAL-LIBRARY.md).

## GitHub CI — დადასტურებული შედეგები

[წარმატებული გაშვება 40818720601](https://github.com/apkhadzeangio/VascHub/actions/runs/40818720601)
შემოწმდა runtime ვერსიაზე `9ea34ca9e08e1e78eb2203ad02ac1bffe5064e4f`.

| შემოწმება | შედეგი |
| --- | --- |
| Typecheck / Lint | წარმატებულია |
| Integration | **24/24** |
| მიგრაციები და rollback/reapply | წარმატებულია |
| Production build | წარმატებულია |
| Chromium E2E | **26 სცენარი დასრულდა წარმატებით** — 25 პირდაპირ, 1 fixture retry-ის შემდეგ |
| 390 / 768 / 1440 px | გვერდისა და ტექსტის გადაცდენა არ გამოვლინდა; შენახულია screenshots |
| CMS UI | მთავარი გვერდისა და ბიბლიოთეკის რეალური რედაქტირება/გამოქვეყნება დადასტურებულია |
| Docker build/startup/restart | წარმატებულია |
| დაცული PDF | restart-ის შემდეგ იგივე SHA-256; პირდაპირი URL-ები დახურულია; უფლების გაუქმებისას 404 |

[Browser previews — 10 PNG](https://github.com/apkhadzeangio/VascHub/actions/runs/40818720601/artifacts/12873697324):
`library/index-390.png`, `index-768.png`, `index-1440.png`, `detail-390.png`,
`detail-768.png`, `detail-1440.png` და არსებული homepage-ის ოთხი screenshot.
ეს არის რეალური სატესტო აპი, არა mockup. ყველა ჩანაწერი სატესტოდ არის მონიშნული.

ერთი retry შეეხო `beforeAll`-ს. Payload-ის `destroy()` ხურავს pool-ს, მაგრამ
`getPayload()`-ის default cache key-ში ძველი instance რჩება. სხვადასხვა E2E
ფაილს ახლა საკუთარი cache key აქვს (`e2e-homepage`, `e2e-library`), რათა
წინა ფაილის დახურული instance აღარ გამოიყენოს. მიმდინარე head-ის საბოლოო სტატუსი
მოცემულია [PR #4 Checks-ში](https://github.com/apkhadzeangio/VascHub/pull/4/checks).

## ლოკალური შემოწმების შედეგები

გარემო: Node 24.22.1, pnpm 11.25.0, Next.js 16.3.3, Payload 3.92.1,
PostgreSQL 16.15, ცალკე UTF-8 `vaschub_library_v01_test` ბაზა.

| შემოწმება | შედეგი |
| --- | --- |
| `pnpm generate:types` | წარმატებულია; საბოლოო მოდელის ტიპები რეგენერირებულია |
| `pnpm generate:importmap` | წარმატებულია; ახალი admin კომპონენტი არ დასჭირდა |
| `pnpm typecheck` | წარმატებულია |
| `pnpm lint` | წარმატებულია, 0 errors / 0 warnings |
| `pnpm test:int` | **24/24**; 15 ბიბლიოთეკის, 6 homepage-ის, 3 არსებული API-ის |
| მიგრაციები ცარიელ test ბაზაზე | initial + homepage + clinical_library_v01 წარმატებულია |
| მიგრაციების ხელახლა გაშვება | წარმატებულია, ხელმეორე ცვლილების გარეშე |
| `scripts/check-library-migration.ts` | rollback/reapply წარმატებულია; სტატია და Categories კავშირი უცვლელია |
| `payload migrate:create --skip-empty` | დამატებითი მიგრაცია არ შექმნილა |
| `pnpm build` | საბოლოო production build წარმატებულია |
| Playwright-ის ბიბლიოთეკის HTTP ნაწილი production server-ზე | **6/6** წარმატებულია |
| სრული Playwright | **7 passed / 4 failed / 15 not run**; ოთხივე failure — browser launch-ის გარემოს შეზღუდვა |
| Docker build/startup | ადგილობრივად ვერ შესრულდა — Docker executable/daemon არ არის |
| GitHub CI | გაშვებულია [PR #4](https://github.com/apkhadzeangio/VascHub/pull/4)-ზე; მიმდინარე შედეგი — Checks-ში |

## დაფარული ქცევა

Integration ამოწმებს ადმინისტრატორის create/update/publish/unpublish მოქმედებებს;
არაავტორიზებული create/update/delete-ის აკრძალვას; ქართული slug-ის გენერაციას;
ქართული ტექსტით, მთავრული ქართული query-ით, ინგლისური CLTI აბრევიატურით,
ორგანიზაციის აბრევიატურითა და თემის სათაურით ძიებას; ორგანიზაცია/ტიპი/თემა/წელი/ენა
ფილტრების კომბინაციას; სტაბილურ 12-ჩანაწერიან pagination-ს; draft, ახალი draft
revision და internal რესურსების დაფარვას; version history და rightsEvidence-ის ACL-ს;
არავალიდური URL/DOI-ის, ყალბი/არასწორი გაფართოების/დიდი/ნებართვის გარეშე PDF-ის
უარყოფას; უფლებებისა და განახლების მტკიცებულების მოთხოვნას; ტაქსონომიის კავშირების
შენარჩუნებას; რვა რესურსის draft იმპორტს, editor revision-ის შენარჩუნებას, მეორე
გაშვებისას დუბლირების/უნებართვო გამოქვეყნების არქონას და explicit publish რეჟიმს.

Playwright HTTP სცენარები იყენებს რეალურ `pnpm start` production server-ს:

1. შედეგები და კომბინირებული ფილტრები; HTML-ის next-page href-ში query/topic/page
   შენარჩუნება; მეორე გვერდი და ცარიელი შედეგი.
2. Draft slug/API/PDF და არარსებული slug-ის HTTP **404**; versions/files-ის 403;
   საერთო Media endpoint-იდან კერძო PDF-ის მიღების აკრძალვა; საჯარო sitemap.
3. ნებადართული PDF-ის ბაიტები, Content-Type და უსაფრთხო download headers.
4. უფლებების გაუქმებისთანავე 404 და detail გვერდიდან PDF ბმულის გაქრობა.
5. არსებული CMS REST ავტორიზაცია, შექმნა, გამოქვეყნება, რედაქტირება და წაშლა.
6. ჩვეულებრივი რეგისტრირებული საჯარო Media-ის ჩამოტვირთვა ისევ მუშაობს.

## აღმოჩენილი და გამოსწორებული ხარვეზი

დეტალურ გვერდზე საერთო loading boundary იწვევდა soft 404-ს (დამალული კონტენტი,
HTTP 200). Loading გადავიდა მხოლოდ `(catalog)` route group-ში. გამოსწორების
შემდეგ სრული suite-ის HTTP ტესტი და მისი ცალკე განმეორება რეალურ 404-ს ადასტურებს.

## ლოკალური გარემოსა და Production-ის შეზღუდვები

Chrome 156 ვერ გაეშვა: `socket() failed: Operation not permitted` (AF_UNIX).
ამ ლოკალურ გარემოში browser QA ვერ შესრულდა. იგი შემდგომ შესრულდა GitHub CI-ის
Chromium-ში: keyboard/focus, admin publish, responsive screenshots და არსებული
კონტრასტის სცენარები წარმატებულია. Safari/Firefox, ფიზიკური ტელეფონი და screen
reader ცალკე არ შემოწმებულა. სრული WCAG აუდიტი ამ შედეგით არ ივარაუდება.

Docker-ის restart-ზე დაცული PDF-ის შენარჩუნება დადასტურდა CI-ში.
Railway Production volume-ზე შემოწმება დარჩენილია deployment review-ზე. Railway-ის start command და volume
mount შემოწმებულია read-only connector-ით; გარემოს ცვლადების მნიშვნელობები OAuth-მა
დამალა. Production DB-ზე არც seed, არც schema push და არც დამანგრეველი ტესტი არ შესრულებულა.

ლოკალური native PostgreSQL-ისთვის გამოყენებული runtime-ის დროებითი UID shim
პროექტის/კონტეინერის ნაწილი არ არის. ინსტალირებული დამოკიდებულებები არსებული
lockfile-იდანაა; ახალი dependency არ დამატებულა. Cloud გარემოში Turbopack-ის
ძველი cache ერთხელ ვერ გაიხსნა; `.next`-ის გასუფთავების შემდეგ საბოლოო build გავიდა.
Next-ის local server-ს ამ გარემოში explicit `--hostname 127.0.0.1` სჭირდება;
Railway-ის არსებული command უკვე explicit hostname-ს იყენებს.

## ხელახლა გაშვება

ცალკე `_test` ბაზაზე, შესაბამისი `.env`-ით:

```sh
pnpm install --frozen-lockfile
pnpm db:migrate
pnpm generate:types
pnpm generate:importmap
pnpm typecheck
pnpm lint
pnpm test:int
pnpm payload run scripts/check-library-migration.ts
pnpm build
pnpm exec playwright install --with-deps chromium
E2E_SERVER_COMMAND='pnpm start --hostname 127.0.0.1' pnpm test:e2e --workers=1
```

მხოლოდ HTTP სცენარების გამეორება:

```sh
E2E_SERVER_COMMAND='pnpm start --hostname 127.0.0.1' pnpm test:e2e tests/e2e/library.e2e.spec.ts --workers=1 --grep 'serves real|denies anonymous|downloads only|revokes PDF|creates, publishes|continues serving'
```

საბოლოო CI, browser QA და reviewer-ის შემოწმება უნდა დასრულდეს merge-მდე.

## GitHub-ზე გამოქვეყნება და წვდომის ისტორია

საწყის ეტაპზე `ramchik` ანგარიშს ჰქონდა `pull:true`, `push:false`; API-მ branch-ის
შექმნა 403-ით უარყო. 2026-10-29-ის განმეორებით შემოწმებაზე დადასტურდა **push:true**.
ბრენჩი აიტვირთა და გაიხსნა [Draft PR #4](https://github.com/apkhadzeangio/VascHub/pull/4).
`main` და production არ შეცვლილა.

CLI-ს credential არ ჰქონდა, ამიტომ ატვირთვა შესრულდა GitHub connector-ით.
სამივე commit-ის tree SHA ზუსტად ემთხვევა ლოკალურად შემოწმებულ ვარიანტს;
ატვირთულ ვერსიას აქვს head `082c9073d95a503f4a52760b4e032b54344ef304` და tree
`cb8af85c8b11deaa5e043297c985428bf54e8258`. Commit SHA-ები შეიცვალა ავტორის/თარიღის
მეტამონაცემებით; ფაილები უცვლელია. ამ ვერსიაზე გაიშვა
[GitHub CI 40817589625](https://github.com/apkhadzeangio/VascHub/actions/runs/40817589625).

Docker workflow-ს დამატებულია `tests/http/library-persistence.mjs`: ცალკე
`vaschub_docker_test` ბაზაში ქმნის საკუთარ ცარიელ PDF-ს, restart-მდე/შემდეგ
ამოწმებს SHA-256 იდენტურობას, დაცული URL-ების ACL-ს, უფლების გაუქმებისთანავე 404-ს
და საკუთარ სატესტო ჩანაწერებს ასუფთავებს. Production ბაზაზე გაშვებას guard კეტავს.

გადასატანი git bundle-იდან, არსებულ clone-ში:

```sh
git fetch /path/to/VascHub-clinical-library-v0.1.bundle feat/clinical-library-v0.1:feat/clinical-library-v0.1
git switch feat/clinical-library-v0.1
git push -u origin feat/clinical-library-v0.1
```

PR-ის სათაური/აღწერა არის [LIBRARY-PR.md](LIBRARY-PR.md)-ში. PR უკვე draft-ად გახსნილია;
CI/browser/Docker შემოწმებები და განხილვა უნდა დასრულდეს merge-მდე.

### პირველი GitHub browser გაშვების შედეგი

`40817589625`: integration **24/24**, build და მიგრაციები წარმატებულია; Playwright:
**21 passed / 2 failed / 3 flaky**. Trace-ებით დადასტურდა, რომ homepage-ის 100ms
autosave-ს manual publish ტესტი უსწრებდა; Library-ის required სათაურის accessible
label ვარსკვლავს მოიცავდა; streaming fallback-ის დამალვამდე DOM გაზომვაში ორი
`main` იპოვებოდა. შემდგომი ცვლილება ელოდება autosave-სა და publish-ის ნამდვილ
HTTP პასუხს, required label-ს prefix-ით პოულობს, scroll-ის async აღდგენას ელოდება
და loading fallback-ს status `div`-ად იყენებს. ეს სცენარები შემდგომი წარმატებული CI გაშვებით გადამოწმდა.
