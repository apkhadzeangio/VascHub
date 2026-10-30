# ფუნქციების მიღების ცხრილი

კოდის SHA `552a9b67…`-ზე ორივე CI წარმატებულია: 83 integration და 40 browser ტესტი,
build, Docker და persistence. 8 screenshot ვიზუალურად განხილულია. Production-ის ოთხი
GET კვლავ 403-ია და Production მიღებად არ ჩაითვლება.

| ფუნქცია | შემოწმება | მდგომარეობა |
| --- | --- | --- |
| მთავარი გვერდის CMS შერჩევა / fallback | რეალური Payload + იზოლირებული SQL | 68 ტესტიან გაშვებაში გადის |
| საჯარო ძიება და Draft-ის გამორიცხვა | რეალური Payload + SQL | გადის |
| Pages/Post reference-ების წაკითხვა | numeric/string/stale object, guest/published | გადის |
| ნავიგაციის authoring validation | რეალური Header/Footer შენახვა | გადის |
| SEO გზა და ქართული Slug | helper + SEO callback + metadata | გადის |
| მობილური მენიუ, dialog/focus/scroll | აგენტი A-ს 10 browser სცენარი | გადის ერთობლივ PG16/Chromium/Docker CI-ში |
| 390/768/1440 განლაგება | screenshot + overflow/clipping assertions | გადის ერთობლივ PG16/Chromium/Docker CI-ში |
| HTTP rename/unpublish/cache | ახალი Next lifecycle suite | გადის ერთობლივ PG16/Chromium/Docker CI-ში |
| ნამდვილი Preview cookie enable/exit | ახალი ავტორიზებული/ანონიმური სცენარი | გადის ერთობლივ PG16/Chromium/Docker CI-ში |
| Media/auth | არსებული admin/E2E/Docker HTTP smoke | გადის ერთობლივ PG16/Chromium/Docker CI-ში |
| Library გადასვლა და PDF რეგრესია | არსებული იზოლირებული suite; კოდი უცვლელია | გადის ერთობლივ PG16/Chromium/Docker CI-ში |
| Production-ის ფუნქციური მიღება | წაკითხვითი GET | გარემოდან 403; დაუდასტურებელია |
| ბიბლიოთეკის/სიახლეების ცარიელი სექცია | შევსებული და ცარიელი fixtures | კონტენტის არქონა არ ნიშნავს პროგრამულ ხარვეზს |
| აკადემიის სრული მოდული / ცნობარი / წევრობა | README და არსებული მარშრუტები | ჯერ განუხორციელებელია |
| Password reset წერილის მიწოდება | კონფიგურაცია + runtime გაფრთხილება | email provider-ის დამოკიდებულება |
