# Events და Directory — ერთობლივი ინტეგრაცია

BASE_SHA: `8fc2607780899b3c3530cd6cd10232be23b2fc21`.
Events PR #9: `ff73d9245f7bae452472c31806c7b428db7e5c58`.
Directory PR #10: `542a934eb4d5a1d6c7c83c997477600bcbc38501`.

ორივე წყარო კონფლიქტის გარეშე გაერთიანდა. ახალმა კოდმა Header-ის ნაგულისხმევი
ღონისძიებები `/events`-თან და პროფესიული ქსელი `/specialists`-თან დააკავშირა.
CMS-ის ძველი ღონისძიებების anchor ახლდება წარმოდგენაში; სხვა დარედაქტირებული
ბმულები შენარჩუნებულია და CMS ჩანაწერები არ შეცვლილა. მთავარ გვერდზე დარჩა
`#events` სექცია და დაემატა ყველა ღონისძიების ბმული.

`/site-modules-sitemap.xml` შეიცავს სამ კატალოგს და მხოლოდ გამოქვეყნებულ საჯარო
ცნობარის პროფილებს. Sitemap დაკავშირებულია robots.txt-თან. Guest API მოთხოვნებს
არც ადმინისტრატორის სესია და არც Preview cookie არ გადაეცემა.

CI-ს დაემატა დამოუკიდებელი native PostgreSQL 16.15 job: `vaschub_directory_test`,
პორტი 3105, საკუთარი საიდუმლოების სატესტო placeholder-ები. იგი ჯერ ამოწმებს არსებული
78 ცხრილის შენარჩუნებას upgrade/rollback/reapply-ით, შემდეგ ყველა Directory
integration და production Chromium შემთხვევას. საერთო verify job-ში კვლავ სრულად
ეშვება არსებული აპი/Events/Library/UI შემოწმებები, build და Docker persistence.
დამატებულია ახალი ნავიგაციის mobile/desktop და sitemap-ის Draft-ების დაცვის ტესტები.

გაშვების სამიზნეა მხოლოდ არსებული VascHub-Web / production. არსებული startup command
ასრულებს `payload migrate`-ს. ახალი ცნობარის მიგრაციის `up` მხოლოდ ამატებს საკუთარ
ცხრილებს/enum-ებს/ინდექსებს და ორ Payload lock relationship-ს. Production-ზე fixture,
seed, ტესტი ან rollback/down ბრძანება არ უნდა გაეშვას. რეალური ექიმების/ცენტრების
მონაცემები არ შეგროვდება და არსებული Draft სტატიები არ გამოქვეყნდება.

წინა LIVE: `b3ccc7e4-bc2e-4074-b82f-f10376795b0e`, source `8fc2607…`.
ახალი რეგრესიის შემთხვევაში კოდის წინა build-ზე დაბრუნება შესაძლებელია დამატებული
ცხრილების წაშლის გარეშე; Production down მიგრაცია არ არის rollback პროცედურის ნაწილი.
არ იცვლება domain, variables, volume, PostgreSQL service ან email provider.

Email delivery კვლავ არ არის კონფიგურირებული. Events იყენებს არსებულ CMS ველებს;
თარიღის გარეშე მასალას მომავალ ღონისძიებად ან ღია განაცხადად არ აცხადებს.
