# ინტეგრაციის მოთხოვნები

ამ PR-მა შეგნებულად **არ შეცვალა** არც ერთი საერთო ფაილი (Header/Footer, მთავარი გვერდი, გლობალური CSS,
Collections, `payload.config`, `payload-types`, migrations, plugins, access helpers, Preview Routes,
`package.json`, lockfile, CI, საერთო ტესტების კონფიგურაცია, Clinical Library). ქვემოთ ჩამოთვლილია
ცვლილებები, რომლებიც ინტეგრაციის ეტაპზე, Production Launch-ის შემდეგ, ცალკე უნდა შესრულდეს.

## 1. ნავიგაცია — `src/Header/Nav/index.tsx`

- **ახლა (`8fc2607`-ზე გადამოწმებული):** `defaults`-ში `{ label: 'ღონისძიებები', href: '/#events' }` მთავარი გვერდის
  სექციაზე მიდის. `navigationItems` უკვე `navigationHref`-ს იყენებს, ამიტომ CMS-ის Header-ის `navItems`-ის
  შემთხვევაში იგივე ბმული Admin-იდანაც შეიძლება მიეთითოს.
- **სასურველი:** `href: '/events'`.
- **მიზეზი:** `/events` ერთადერთი გვერდია, სადაც ღონისძიებებიც და განვითარების შესაძლებლობებიც ჩანს;
  `/#events` მხოლოდ ორ მოკლე ცნობას აჩვენებს. თუ საჭიროა, `/#events` დარჩეს, ხოლო `/events`
  ცალკე პუნქტად („ღონისძიებები და განვითარება“) დაემატოს.
- Production-ის მენიუს ამ PR არ ეხება.

## 2. მთავარი გვერდიდან გადასვლა — `src/Homepage/Page.tsx`

- **სასურველი:** `#events` სექციის (`<h2 id="events-heading">უახლოესი ღონისძიებები</h2>`) გვერდით
  დაემატოს ბმული „ყველა ღონისძიება“ → `/events`. სხვა სექციები უკვე იყენებენ `SectionHeading`-ს `href`
  პარამეტრით (ის `aria-label`-იან „ყველას ნახვა“ ბმულს ქმნის) — იგივე კომპონენტი გამოდგება.
- **მიზეზი:** დღეს მთავარი გვერდიდან სრულ სიაზე გადასვლა შეუძლებელია.

## 3. Sitemap — `next-sitemap.config.cjs`

- **შემოწმებულია:** `/events` ამჟამად **არც ერთ sitemap-ში არ არის**. `next-sitemap.config.cjs` სტატიკურ
  გზებს გამორიცხავს (`exclude: ['/*', …]`), ხოლო ინდექსი მხოლოდ `pages-`, `posts-` და `library-sitemap.xml`-ს
  მიუთითებს.
- **სასურველი:** დაემატოს `/events` (მაგ. `pages-sitemap.xml`-ის route-ში ან ცალკე `events-sitemap.xml` +
  `additionalSitemaps`-ში). ფილტრიანი URL-ები უკვე `noindex`-ია, canonical კი `/events`.

## 4. Production-ის წინაპირობები (შესამოწმებელი, ამ PR-ში არ შემოწმებულა)

- CMS-ში არსებობს კატეგორიები slug-ებით **`international-events`** და **`professional-development`**.
  სხვა slug-ის შემთხვევაში განახლდეს `eventTypes` (`src/Events/filters.ts`) — ერთადერთი ადგილი.
- არსებული ექვსი Post მონახაზია; `/events` გამოქვეყნებული, სათანადოდ დაკატეგორიზებული მასალის
  გარეშე ცარიელს აჩვენებს. ეს მიზანმიმართულია.

## 5. CMS-ის გაფართოება (ცალკე PR: სქემა + მიგრაცია + `generate:types`)

MVP-ის მთავარი შეზღუდვა ის არის, რომ Posts-ს ღონისძიების მონაცემები არ აქვს. მოთხოვნილი ველები
`posts`-ზე (ჯგუფი `eventDetails`, ყველა არასავალდებულო):

| ველი | ტიპი | გამოყენება |
| --- | --- | --- |
| `startDate`, `endDate` | `date` | ჩატარების თარიღი (არა `publishedAt`); უკვე არსებული `dates.ts` წესებით |
| `location` | `text` (≤120) | ადგილი |
| `externalUrl` | `text` + `publicHref` ვალიდაცია | ოფიციალური გვერდი / განაცხადი |
| `opportunityType` | `select`: `training`, `fellowship`, `observership`, `grant`, `other` | ქვეტიპის ფილტრი „ტრენინგის“ შეცდომით მინიჭების გარეშე |
| `applicationDeadline` | `date` | ვადა — ნაჩვენები მხოლოდ თუ რედაქტორმა შეავსო |
| `registrationStatus` | `select`: `open`, `closed` (ცარიელი = უცნობი) | „ღია/დახურული“ მხოლოდ რედაქტორის დადასტურებით |

შემდეგ: `src/Events/queries.ts`-ში ამ ველების ასახვა `EventItem`-ზე, `when` ფილტრის ჩართვა Post-ებზეც,
ინდექსები და ძიება/გვერდებად დაყოფის გადატანა DB-დონეზე (`MAX_POSTS` ლიმიტის მოსახსნელად).
მთავარი გვერდის `events` მასივის `maxRows: 2` ლიმიტი მხოლოდ მოკლე ცნობას ემსახურება და
შესაცვლელი არ არის.

## 6. ტესტები და CI

- ჩემი ტესტები არსებული discovery წესით მოიძებნება: `tests/int/**/*.int.spec.ts` (vitest) და
  `tests/e2e/**` (Playwright; `playwright test --list` ადასტურებს). CI-ის ფაილის შეცვლა საჭირო არ არის.
- ჩემი e2e ქმნის `home` გვერდს; `homepage.e2e.spec.ts`-იც იგივეს აკეთებს. CI-ში `workers: 1`-ია;
  ლოკალურად ერთად გაშვებისას `--workers=1` გამოიყენეთ. გრძელვადიანად ღირს `home` fixture-ის გაზიარება.
- სრული e2e კომპლექტი გაშვებულია პორტ 3104-ზე (`E2E_BASE_URL`): 2 არსებული ტესტი ვერ გადის, რადგან
  `homepage.e2e.spec.ts:139` და `tests/helpers/login.ts` პორტ 3000-ს მყარად ითხოვენ (იხ. `VALIDATION.md`).
  სასურველია ამ მნიშვნელობების `baseURL`-დან აღება — საერთო ფაილებია, ამ PR-ში არ შეცვლილა.
- `tests/int/site-cms/payload-readers.int.spec.ts` მოითხოვს ბაზას `vaschub_cms_test`/`vaschub_test`;
  სხვა სახელის (მათ შორის `*_events_test`) ბაზაზე ის გამოტოვებს ტესტებს და `test:int`-ს exit 1-ს აძლევს.

## 7. Production Launch-ის შემდეგ

1. **შესრულებულია:** `feat/events-training-v1` გადაბაზირებულია განახლებულ `main`-ზე (`8fc2607`, PR #8) —
   კონფლიქტის გარეშე, რადგან PR მხოლოდ ახალ ფაილებს ამატებს (იხ. `README.md` — „ფაილები“).
   თუ `main` კიდევ შეიცვალა, გაიმეორეთ rebase.
2. გაიმეორეთ `typecheck`, `lint`, `test:int`, `build` და `tests/e2e/events` (გადაბაზირების შემდეგ ერთხელ
   უკვე გაიარა — იხ. `VALIDATION.md`).
3. შეასრულეთ §1–§4 და მხოლოდ ამის შემდეგ გახსენით `/events` ნავიგაციაში.
