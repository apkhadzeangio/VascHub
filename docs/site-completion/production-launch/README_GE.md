# VascHub — Production გაშვება დადასტურებულია

**დამტკიცებული ვერსია მუშაობს https://vasc.lithos.ge-ზე.** Railway-ის ბოლო deployment არის `SUCCESS`; Web და PostgreSQL ონლაინ არის, მოუგვარებელი pending ცვლილება არ ჩანს. ახალი deploy არ გაგვიმეორებია — ხელახალ შემოწმებაზე უკვე წარმატებით გაშვებული ვერსია დაფიქსირდა.

## გამოშვება

| პარამეტრი | დადასტურებული მნიშვნელობა |
|---|---|
| ინტეგრაცია | [PR #8](https://github.com/apkhadzeangio/VascHub/pull/8), merged |
| BASE_SHA | `01bf7cd20d9352fc2d665bcf46feb224cac140c7` |
| შემოწმებული PR HEAD | `2a8cd81b23681bf5939d6579291ef3606c29a97d` |
| Production source / main | `8fc2607780899b3c3530cd6cd10232be23b2fc21` |
| Deployment ID | `b3ccc7e4-bc2e-4074-b82f-f10376795b0e` |
| სტატუსი | SUCCESS |
| წარმატების დრო | 2026-10-31, 00:09 — Asia/Tbilisi |
| სერვისი | VascHub-Web / production |
| დაბრუნების სამიზნე | `56c6d8e8-e544-44e9-818d-5f73b90ec9aa`, source `01bf7cd…` |

Merge-ის tree ზუსტად ემთხვევა შემოწმებული PR HEAD-ის tree-ს. ორივე საწყისი აგენტის საბოლოო commit ისტორიაში შენარჩუნებულია. [Main CI](https://github.com/apkhadzeangio/VascHub/actions/runs/41118849852) წარმატებულია; შემოწმებული ინტეგრაცია მოიცავს 83 integration და 40 browser ტესტს, typecheck, lint, build და Docker startup/restart/media/PDF შემოწმებებს.

Railway Project: `35ccedcb-b9fe-4ed9-a84e-2c4d6c0d58d4`; Environment: `d91e14ca-0a43-4668-8216-ae1435625da6`; Service: `e413932a-45fd-4ad2-9e5b-8d9069d8e37d`. საიდუმლო მნიშვნელობები არ წაკითხულა.

## Production-ის შემოწმება

`public-acceptance.json` ასახავს **17 წარმატებულ read-only HTTP შემოწმებას**:

- მთავარი გვერდი, Posts, Search, Library და Admin Login — 200.
- არავალიდური `/posts/page/0` — 404.
- ჩვეულებრივი და `draft=true` guest Posts API — 0 საჯარო ჩანაწერი.
- ექვსივე არსებული მონახაზის საჯარო URL — 404.
- Guest `users/me` — `user: null`.
- Guest Preview — აპლიკაციის 403 და ტექსტი “You are not allowed to preview this page”; ძველი 1010 დაბრკოლება ამ შემოწმებაში აღარ განმეორდა.

ბრაუზერში დადასტურდა ახალი მთავარი გვერდის მინიშნებები, ძიების წინ/ბოლოში გამოტოვებების მოცილება, ქართული Posts გვერდი და ცარიელი მდგომარეობა, დიალოგის გახსნა, Escape-ით დახურვა და ფოკუსის დაბრუნება. კონსოლში დაკვირვებული შეცდომები ბრაუზერის extension-ის metadata გამგზავნს ეკუთვნოდა; აპლიკაციის წარმოშობის შეცდომა არ დაფიქსირებულა. დეტალები: `browser-acceptance.json`.

Railway-ის build დასრულდა წარმატებით; არსებული `payload migrate` runner დასრულდა `Done`-ით; Next.js მზად გახდა. ამ release-ში სქემა და მიგრაციის ფაილები არ შეცვლილა. `runtime-evidence.json` შეიცავს ჯანმრთელობისა და გაშვების შეჯამებას.

## დარჩენილი შეზღუდვები

- Payload ლოგი ადასტურებს, რომ **email adapter არ არის კონფიგურირებული**; reset წერილის რეალური მიწოდება მოქმედად არ ცხადდება.
- ადმინისტრაციის არსებული ბრაუზერის სესია Login-ზე გადამისამართდა; ავთენტიფიცირებული live Preview ამ ეტაპზე არ გამეორებულა. რეალურ Next სერვერზე ავტორიზებული enable/exit უკვე წარმატებით შეამოწმა CI-მ.
- live მობილური viewport-ის დამატებითი შემოწმება არ შესრულებულა; მობილური სცენარები და მიღებული screenshots დადასტურებულია შემოწმებული SHA-ის CI/ინტეგრაციის მასალებში.
- Production-ში სტატიები არ შექმნილა/გამოქვეყნებულა და Clinical Library-ის კოდსა თუ მონაცემებში ცვლილება არ შეგვიტანია. ექვსი მონახაზის საჯაროდ არჩენა მოსალოდნელი ქცევაა.

## წინა დამტკიცების დაბრკოლება

წინა ორი `accept-deploy` მოთხოვნა ხელსაწყომ გააუქმა პასუხით `user did not approve`, მათ შორის საუბარში პირდაპირი დადასტურების შემდეგ. ეს ისტორია შენარჩუნებულია `status.json`-ში. მომდევნო read-back-ზე patch უკვე მიღებული იყო და დამტკიცებული source SHA წარმატებით მუშაობდა. ამ შემსრულებელს დამატებითი deploy, ბრაუზერით/CLI-ით იგივე ოპერაცია ან rollback არ გაუშვია. ვინ/რომელმა არხმა მიიღო patch, არსებული მტკიცებულებით არ ვასკვნით.

## საჭიროების შემთხვევაში დაბრუნება

მხოლოდ ახალი რეალური რეგრესიისას გამოიყენეთ წინასწარ დაფიქსირებული წინა LIVE build, deployment `56c6d8e8-e544-44e9-818d-5f73b90ec9aa`, source `01bf7cd20d9352fc2d665bcf46feb224cac140c7`. Railway `canRollback: true`-ს ადასტურებს. არ წაშალოთ სერვისი, PostgreSQL, volume ან Media. DB rollback არ არის ამ release-ის ნაწილი, რადგან ახალი სქემა/მიგრაცია არ დამატებულა.

მიმდინარე სტატუსისთვის გამოიყენეთ `status.json`, `public-acceptance.json`, `runtime-evidence.json` და `browser-acceptance.json`; `preflight.json` და baseline ფაილები ისტორიულ საწყის მდგომარეობას აღწერს.
