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

- Typecheck, lint და production build — passed.
- Integration — **24/24**; ბიბლიოთეკის production HTTP — **6/6**.
- ცარიელ test DB-ზე migrations, rollback/reapply და schema drift check — passed.
- სრული Playwright: **7 passed, 4 failed, 15 not run**. ოთხივე failure გამოწვეულია
  cloud გარემოში Chromium-ის აკრძალული AF_UNIX socket-ით. Browser/mobile/admin UI
  QA და Docker startup ადგილობრივად ვერ დასტურდება; CI-ში მათი გაშვება აუცილებელია.

## Deployment review

Production-ის main (`8030f63`) წარმატებითაა განთავსებული. Phase VI-ის ცალკე
სტაბილიზაციის სამუშაო ასლში დაუკომიტებელი ცვლილებებია; საბოლოო merge-მდე შეამოწმეთ
მისი სტატუსი და საჭირო rebase. ეს ცვლილება ავტომატურად არ გაერთიანდეს.

მიმდინარე Railway start command მიგრაციებს startup-მდე ასრულებს. PDF-ისთვის
გამოიყენეთ არსებული `/app/media-data` volume და გადაამოწმეთ
`LIBRARY_FILES_DIR=/app/media-data/library-private` და write უფლებები.
Seed ავტომატურად არ ეშვება; default არის Draft. Production-ზე მიგრაცია/seed/deploy
ამ სამუშაოს ფარგლებში არ შესრულებულა. დეტალები: `docs/LIBRARY-VALIDATION.md`.
