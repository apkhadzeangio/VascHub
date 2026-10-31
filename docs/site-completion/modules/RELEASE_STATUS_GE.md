# Production გაშვების დარჩენილი დაბრკოლება

ინტეგრაცია დასრულებულია: [PR #11](https://github.com/apkhadzeangio/VascHub/pull/11), main/source `6592343b473345882c6d58cb446cc0807959e1dc`. Merge-ის tree ზუსტად ემთხვევა შემოწმებულ HEAD-ს. PR/Push/Main CI წარმატებულია: 121 საერთო integration შემთხვევა, 57 საერთო browser შემთხვევა; ცნობარის ცალკე job — 14 integration + 15 browser; upgrade/rollback/reapply ინარჩუნებს 78 არსებულ ცხრილს. საერთო job-ის 12 skipped Directory DB შემთხვევა ცალკე job-ში სრულად შესრულდა; skipped წარმატებულად არ ითვლება.

**ახალი ვერსიის Production გაშვება დაუდასტურებელია.** Railway-ზე ინიციალიზაცია/Build ჯერ არ დაწყებულა. ბოლო deployment `4a9039af-5544-4620-acf2-d1441f2b2a9d` არის QUEUED, source სწორია — `6592343…`. პირველი გაჭედილი მოთხოვნა `3adb42cc…` გაუქმდა მხოლოდ inactive queued deployment-ის დონეზე; ძველი LIVE არ შეჩერებულა. შესრულდა მხოლოდ ერთი ხელახალი მცდელობა.

Railway-ის ბრაუზერში ავტორიზაცია დასრულებულია. პანელში deployment-ის Approve მოქმედება არ ჩანს; ოთხივე ფაზა Not started-ია. Source პარამეტრები აჩვენებს `Could not load branches`-ს; ერთჯერადმა Retry-მაც იგივე შედეგი გამოიღო. დადასტურებულია გაშვების/წყაროს პლატფორმული დაბრკოლება, მაგრამ მისი კონკრეტული server-side მიზეზი არსებული მონაცემებით უცნობია. სტატუსის გვერდის recovery შეტყობინება მარტო ამ deployment-ის მიზეზის მტკიცებულება არ არის.

ამჟამად LIVE რჩება `b3ccc7e4-bc2e-4074-b82f-f10376795b0e`, source `8fc2607…`. ახალი schema migration/seed/Production ტესტი არ გაშვებულა; რეალური ჩანაწერები არ გამოქვეყნებულა. Domain, env variables, volume და მონაცემთა ბაზის სერვისი უცვლელია. Email delivery არ არის კონფიგურირებული.

გაგრძელება: არსებული სერვისის Railway↔GitHub branch/source კავშირის პრობლემის მოგვარება ან რიგის დამუშავების აღდგენა; უსაფრთხოების უფლებები/ფასიანი გეგმა თვითნებურად არ შეიცვალოს. ახალი deployment-ის terminal SUCCESS-ისა და სწორი source SHA-ის შემდეგ უნდა შესრულდეს საჯარო მიღება. QA სკრიპტი ლოკალურად მომზადებულია; ბოლო ძველი LIVE-ის read-only მდგომარეობა ცალკე JSON-ში ინახება. Production-ის down migration არ არის კოდის rollback-ის ნაწილი.

ბოლო read-only public probes ამ შემსრულებლიდან 403-ს აბრუნებს. ეს არ არის ძველი LIVE აპლიკაციის გათიშვის მტკიცებულება; Railway კვლავ ადასტურებს წინა წარმატებულ deployment-ს. ახალი ვერსიის public acceptance არ შესრულებულა.
