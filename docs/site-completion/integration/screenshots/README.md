# ვიზუალურად მიღებული screenshots

წყარო: კოდის SHA `552a9b67f58a56a6fc9c3160b35cdae1b8282fb3`,
[CI run 41112464720](https://github.com/apkhadzeangio/VascHub/actions/runs/41112464720),
artifact `13002459982`. PNG-ები უცვლელი ბაიტებითაა კოპირებული; hashes — [manifest.json](manifest.json).

რვავე გამოსახულება ვიზუალურად განხილულია: ქართული ტექსტის წაკითხვადობა, ბარათების
განლაგება, სათაურების გადატანა, ნავიგაცია, მენიუ და ძიების შედეგი/ცარიელი მდგომარეობა.
Overflow/clipping, focus და scroll locking დამატებით browser assertions-ით მოწმდება.
მენიუს full-page capture-ში viewport-ის ქვემოთ ფონი ბუნებრივად დაუჩრდილავია;
modal backdrop viewport-ს ფარავს და სხეულის scroll locking ცალკე მოწმდება.

ყველა ჩანაწერი სინთეტიკური სატესტო მონაცემია. Production-ის ფოტო/კონტენტი და რეალური
პაციენტები არ გამოიყენება. ეს არ არის Production-ის მიღების screenshot.

- [მთავარი — 1440](homepage-1440.png)
- [მთავარი — 768](homepage-768.png)
- [მთავარი — 390](homepage-390.png)
- [ცარიელი მდგომარეობა — 390](empty-390.png)
- [მობილური მენიუ — 768](menu-768.png)
- [ძიების შედეგები — 390](search-results-390.png)
- [ცარიელი ძიება — 390](search-empty-390.png)
- [ახალი HTTP lifecycle — 390](lifecycle-home-390.png)
