# feat: implement Clinical Library v0.1

VascHub-ს ემატება CMS-დან მართვადი ქართულენოვანი კლინიკური ბიბლიოთეკა:
`/library` და `/library/[slug]`, რეალური ძიება/ფილტრები, pagination, ციტირება,
გამოცემის სტატუსი და დაცული PDF ჩამოტვირთვა. Posts/Pages-ის მიმდინარე კონტენტი
შენარჩუნებულია; მთავარი გვერდიდან და ნავიგაციიდან ბიბლიოთეკაში გადასვლაა დამატებული.

## ცვლილებები

- `src/collections/LibraryResources.ts`, `LibraryTaxonomies.ts`, `LibraryFiles.ts`:
  რესურსები, დამოუკიდებელი თემები/ტიპები/ორგანიზაციები, drafts, უფლებები და validation.
- `src/Library/`, `src/app/(frontend)/library/`: catalogue/detail/download, URL
  ფილტრები, Georgian Unicode ძიება, loading/error/empty states, related resources.
- `src/Library/seed/`, `scripts/seed-library.ts`: 8 გადამოწმებული პროფესიული
  რესურსის მეტამონაცემები, idempotent draft-first import; არ ცვლის რედაქტორის ჩანაწერებს.
- `Media.access.read`: საჯარო ფაილისთვის მოითხოვს რეგისტრირებული Media ჩანაწერის
  შესაბამისობას; საერთო volume-იდან კერძო ბიბლიოთეკის ფაილებს აღარ ავრცელებს.
- არსებული media volume გამოიყენება; ახალი სერვისი/საცავი/ფასიანი dependency არ დამატებულა.
- მიგრაცია `20261028_221853_clinical_library_v01`, JSON snapshot და რეგენერირებული
  Payload types. მიგრაცია ეფუძნება main-ის homepage schema-ს; არსებული მონაცემების წაშლის გარეშე.
- `docs/CLINICAL-LIBRARY.md`: მოდელი, ადმინისტრირება, იმპორტი, წყაროები და Railway-ის შენიშვნები.

## Validation

- Typecheck, lint, production build და integration **24/24** — წარმატებულია.
- ცარიელ test DB-ზე migrations და rollback/reapply — წარმატებულია.
- Chromium-ში დასრულდა **26 E2E სცენარი**, მათ შორის ქართული ძიება, ფილტრები,
  keyboard/focus, 390/768/1440px განლაგება და რეალური CMS UI რედაქტირება/გამოქვეყნება.
- Docker build/startup/restart, login, CMS publishing და Media upload/download — წარმატებულია.
- სპეციალური test PDF restart-მდე/შემდეგ იდენტურია SHA-256-ით; პირდაპირი ფაილის
  URL დახურულია, უფლების გაუქმება დაუყოვნებლივ აბრუნებს 404-ს.
- CI: [PR Checks](https://github.com/apkhadzeangio/VascHub/pull/4/checks).
  დეტალური შედეგები, fixture isolation და screenshots: `docs/LIBRARY-VALIDATION.md`.

## Deployment review

Production-ის main (`8030f63`) წარმატებითაა განთავსებული. Phase VI-ის ცალკე
სტაბილიზაციის სამუშაო ასლში დაუკომიტებელი ცვლილებებია; საბოლოო merge-მდე შეამოწმეთ
მისი სტატუსი და საჭირო rebase. ეს ცვლილება ავტომატურად არ გაერთიანდეს.

მიმდინარე Railway start command მიგრაციებს startup-მდე ასრულებს. PDF-ისთვის
გამოიყენეთ არსებული `/app/media-data` volume და გადაამოწმეთ
`LIBRARY_FILES_DIR=/app/media-data/library-private` და write უფლებები.
Seed ავტომატურად არ ეშვება; default არის Draft. Production-ზე მიგრაცია/seed/deploy
ამ სამუშაოს ფარგლებში არ შესრულებულა. დეტალები: `docs/LIBRARY-VALIDATION.md`.
