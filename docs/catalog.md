# Catalog and source notes

The canonical files are the individual records in [src/data](../src/data). Food records have a primary meal, and meal-placements.json lists additional meal and cuisine assignments. The 449 branded products include records from the supplied menu document and public menus. The links below are public references for the listed brands. Individual records identify their own source and may lack an independently verified menu URL. Every wheel uses those records through the same eligibility and draw functions in [catalog.js](../src/catalog.js).

| Brand | Products | Menu evidence |
| --- | ---: | --- |
| HEYTEA | 78 | [Foodpanda Hong Kong](https://www.foodpanda.hk/zh/restaurant/vfhf/heytea-tsuen-wan-citywalk), [Mainland menu listings](https://www.nckfhsm.com/zh-tw/brands/xi-cha/menu/available?page=1) |
| Nayuki | 25 | [Brand site](https://www.naixuecha.com/), [Foodpanda Hong Kong](https://www.foodpanda.hk/zh/restaurant/csv0/naixue-k11-art-mall), [Mainland menu listings](https://www.nckfhsm.com/brands/nai-xue-de-cha/menu/available) |
| Mixue | 42 | [Brand menu](https://www.mxbc.com/product_strength.html), [Foodpanda Hong Kong](https://www.foodpanda.hk/zh/restaurant/bj0i/mixue-bing-cheng-yau-ma-tei-bj0i) |
| Goodme | 47 | [Product listing](https://gumingos.com/product/), [Mainland menu listings](https://www.nckfhsm.com/brands/gu-ming/menu/available) |
| Chabaidao | 41 | [Brand site](https://www.chabaidao.com/), [Mainland menu listings](https://www.nckfhsm.com/brands/cha-bai-dao/menu/available) |
| CHAGEE | 31 | [Foodpanda Hong Kong](https://www.foodpanda.hk/zh/restaurant/y5w9/chagee-yoho-shop) |
| Auntea Jenny | 36 | [CGS brand report](https://pdf.dfcfw.com/pdf/H3_AP202601161817651355_1.pdf?1768572691000.pdf=), [Mainland menu listings](https://www.nckfhsm.com/brands/hu-shang-a-yi/menu/available) |
| Shuyi | 30 | [Brand site](https://shuyisxc.com/), [Product catalog](https://shuyisxc.com/home/product/index/id/40.html) |
| CoCo | 24 | [TVBS Taiwan menu](https://supertaste.tvbs.com.tw/food/347016) |
| ALittle Tea (1點點) | 31 | [Brand menu](https://www.alittle-tea.com/ourdrinks/), [Brand launches](https://www.alittle-tea.com/), [Mainland menu listings](https://nckfhsm.com/brands/yi-dian-dian/menu/available) |
| YH Tea | 37 | [Brand product catalog](https://www.yihetang.com/products/1371909852601004032.html) |
| Sweet7 | 27 | [Brand product catalog](https://www.tianlala.com/bingxianguocha/) |

## Editing records

Use a stable lowercase hyphenated `id`, a specific English `name`, and the original `nameChinese` when applicable. For dishes from Japan and Korea, this field can also hold the original-script name. Record the meal category, cuisine, typical main ingredients, dietary tags, and recognizable allergens. A typical recipe is representative and can vary across kitchens. The Healthy Food preference favors selected preparation styles and food types. It does not use a nutrient score.

For tea products add the exact brand key and product type. Record the source, menu market, and date checked when available. For supplied menu documents, retain the document source label until an item-level public reference is available. Use published ingredient highlights when available. An empty ingredient list denotes missing ingredient information. Add a numeric reference price and currency only when the cited listing provides one. The price is a snapshot for that market and can be a starting or size-specific price.

- `menu-listed` means the product appeared in a public catalog for the cited market.
- `regional` means the listing reflects a particular market or branch.
- `seasonal` means the source identifies a seasonal listing or limited release.
- `archived` and `unavailable` products can be browsed and are excluded from draws.

Public sources were checked on 2026-11-13. The catalog is a snapshot across several markets. Coverage and store availability can change. Size, temperature, package artwork, and topping-only entries are excluded as standalone products. Distinct branded recipes may share a generic English descriptor across brands.

## Ingredient restrictions

Allergen-related restrictions require a complete verified ingredient declaration. The current catalog contains typical dish recipes and partial menu information, so these filters can return an empty pool. Other food restrictions use known ingredients, dish names, and tagged metadata. Branded products with incomplete ingredients are also excluded when a restriction or custom term is set. Each product detail indicates the quality of its ingredient evidence.

The catalog tests check IDs, minimum counts, normalized English and original-script names, data shapes, placeholder names, eligible pools, and wheel pointer math.
