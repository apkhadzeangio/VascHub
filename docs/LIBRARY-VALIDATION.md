# Clinical Library v0.1 — შემოწმების ანგარიში

თარიღი: 2026-10-29 (Asia/Tbilisi).
ბაზა: `main` / `8030f63`. სამუშაო ბრენჩი: `feat/clinical-library-v0.1`.
განხორციელება და კონტენტის წყაროები: [CLINICAL-LIBRARY.md](CLINICAL-LIBRARY.md).

## რეალური შედეგები

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
| GitHub CI | არ გაშვებულა: branch-ის ატვირთვის write უფლება არ არის |

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

## დაუდასტურებელი ნაწილები

Chrome 156 ვერ გაეშვა: `socket() failed: Operation not permitted` (AF_UNIX).
შესაბამისად keyboard UI, admin UI-ის publish, 390/768/1440px screenshots და
ვიზუალური WCAG/mobile QA ამ გარემოში არ არის დადასტურებული. ტესტები არ გამორთულა;
ისინი CI-ში გაშვებისთვის რჩება. HTTP ტესტები browser-rendered QA-ს არ ანაცვლებს.

Docker-ისა და Railway volume-ზე PDF-ის restart-ის შემდეგ შენარჩუნების რეალური
შემოწმება დარჩენილია deployment review-ზე. Railway-ის start command და volume
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

## GitHub-ის საბოლოო სტატუსი

დაკავშირებული ანგარიშია `ramchik`, repository permissions: `pull:true`, `push:false`.
საბოლოო branch-ის შექმნის რეალურმა მცდელობამ დააბრუნა **403 Resource not accessible
by integration**. Git push-ს shell-ში write ავტორიზაცია არ ჰქონდა (`could not read
Username`). ამიტომ დისტანციური branch, Pull Request და ამ ცვლილების GitHub CI
არ შექმნილა/არ გაშვებულა. საჭირო მოქმედებაა write წვდომის მქონე ანგარიშის
დაკავშირება ან repository write უფლების მინიჭება; main/production არ შეცვლილა.

გადასატანი git bundle-იდან, არსებულ clone-ში:

```sh
git fetch /path/to/VascHub-clinical-library-v0.1.bundle feat/clinical-library-v0.1:feat/clinical-library-v0.1
git switch feat/clinical-library-v0.1
git push -u origin feat/clinical-library-v0.1
```

PR-ის სათაური/აღწერა არის [LIBRARY-PR.md](LIBRARY-PR.md)-ში. გახსენით draft PR,
გაიარეთ CI/browser/Docker შემოწმებები და განხილვა merge-მდე.
