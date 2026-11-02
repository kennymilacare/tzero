/* ===========================================================
   guides/size.mjs — the size guide.

   The one number on a condom box that actually tells you
   whether it will fit: the nominal width, in millimetres.
   It is half the erect circumference, so a box marked
   "52 ± 2" is telling you the circumference is about 104 mm.

   Three languages, one file. The build script picks the one
   it needs and writes the page out.

   Pure data — no filesystem, no network.
   =========================================================== */

export default {
  path: 'guide-size.html',
  slug: 'size',
  image: 'assets/images/products/tzero-ultra-thin.jpg',
  imageWidth: 2048,
  imageHeight: 2048,
  published: '2026-11-02',

  short: {
    zh: '尺碼表',
    en: 'Size chart',
    ja: 'サイズ表',
  },
  blurb: {
    zh: '闊度對照表,同自己量度嘅方法。',
    en: 'The width table, and how to measure yourself.',
    ja: '幅の表と、測り方の説明。',
  },
  eyebrow: {
    zh: '選購指南 · 尺碼',
    en: 'Buying guide · Size',
    ja: '購入ガイド · サイズ',
  },
  h1: {
    zh: '安全套尺碼表:睇「闊度」就知道啱唔啱',
    en: 'Condom size chart: read the width and you know it fits',
    ja: 'コンドームのサイズ表:幅を読めば合うかどうかがわかる',
  },
  title: {
    zh: '安全套尺碼表 · 闊度對照 · 量度方法 · T-ZERO 第九感',
    en: 'Condom Size Chart · Nominal Width · How to Measure · T-ZERO NINTH SENSE',
    ja: 'コンドーム サイズ表 · 幅の目安 · 測り方 · T-ZERO 第九感',
  },
  description: {
    zh: '安全套尺碼表:教你睇「闊度」(mm) 對應幾多圈度,自己量一次就知揀 S、M、L 定 XL。附常見尺碼對照表同 T-ZERO 第九感 4 款建議。',
    en: 'Condom size chart: what the nominal width in mm means, the common S/M/L/XL widths, and how to measure your own erect circumference in a minute.',
    ja: 'コンドームのサイズ表:幅(mm)と周長の関係、主なサイズの目安、1分でできる自分の測り方。',
  },
  lead: {
    zh: '盒上印住嘅「闊度」,係一盒安全套入面最重要嘅一個數字。佢其實就係你勃起時周長嘅一半:52 mm 嘅闊度,等於約 10.4 厘米嘅周長。睇明呢個數,就唔使靠估。',
    en: 'The nominal width on the box is the one number that decides whether a condom fits. It is half your erect circumference, so a width of 52 mm means a circumference of about 10.4 cm. Read that one number and there is nothing left to guess.',
    ja: '箱に書かれた「幅」が、コンドームが合うかどうかを決める数字です。勃起時の周長の半分で、幅52mmなら周長は約10.4cmになります。',
  },

  sections: [
    {
      id: 'measure',
      h2: {
        zh: '第一步:量一次就知',
        en: 'First: measure yourself, once',
        ja: 'まず一度、測る',
      },
      blocks: [
        {
          t: 'p',
          text: {
            zh: '攞一條柔軟嘅量度帶(或者一條紙同一支筆),喺完全勃起嘅狀態下,量度陰莖最根部、也就是最粗嗰一圈。貼住皮膚,但唔好勒住——勒住會量細咗。',
            en: 'Take a soft measuring tape, or a strip of paper and a pen. While fully erect, measure around the base of the penis, where it is widest. Let the tape rest against the skin without squeezing it, because squeezing gives you a smaller number than the real one.',
            ja: '柔らかなテープ、または紙とペンを用意します。完全に勃起した状態で、ペニスの根元、つまり最も太い部分を測ります。肌に沿着当てるだけにして、締めつけないでください。小さく測れてしまいます。',
          },
        },
        {
          t: 'p',
          text: {
            zh: '量到嘅周長(厘米)除以二,就係你嘅闊度(毫米)。例如量到 10.5 厘米,闊度就係 52.5 mm,對應盒上標示「52 ± 2 mm」嗰個尺碼。',
            en: 'Divide the circumference in centimetres by two and you have your width in millimetres. A circumference of 10.5 cm gives a width of 52.5 mm, so look for the size marked "52 ± 2 mm".',
            ja: '測った周長（cm）を2で割ると、幅（mm）になります。周長10.5cmなら幅52.5mmなので、「52 ± 2 mm」と書かれたサイズを選びます。',
          },
        },
        {
          t: 'note',
          title: {
            zh: '點樣量唔會尷尬',
            en: 'How to measure without it being awkward',
            ja: '気兼ねなく測るには',
          },
          text: {
            zh: '喺自己屋企、沖完涼、攞住軟尺就得,冇人會見到。量度唔需要撳任何嘢,亦唔會有任何不適。一年量一次就夠。',
            en: 'Do it at home, after a shower, with a soft tape. Nobody sees it, nothing has to be pressed or squeezed, and it is not uncomfortable. Once a year is enough.',
            ja: '自宅で、シャワーの後に測れば誰でも見ません。押さえたり力を加えたりする必要はなく、不快感もありません。年に一度で十分です。',
          },
        },
      ],
    },
    {
      id: 'table',
      h2: {
        zh: '常見尺碼對照表',
        en: 'The common sizes, side by side',
        ja: '主なサイズの比較表',
      },
      blocks: [
        {
          t: 'table',
          head: [
            { zh: '闊度 (mm)', en: 'Width (mm)', ja: '幅 (mm)' },
            { zh: '對應圈度', en: 'Circumference', ja: '対応周長' },
            { zh: '常見標示', en: 'Common label', ja: '一般的な表示' },
            { zh: '適合邊啲人', en: 'Who it suits', ja: '向いている人' },
          ],
          rows: [
            [
              { zh: '44 ± 2', en: '44 ± 2', ja: '44 ± 2' },
              { zh: '約 8.8 cm', en: 'about 8.8 cm', ja: '約8.8cm' },
              { zh: 'S / 小號', en: 'S / Small', ja: 'S / スモール' },
              {
                zh: '身形較窄,想要窄身嘅貼合感',
                en: 'Narrower build, or you like a close fit',
                ja: '細身の場合、密着する感触を好む人',
              },
            ],
            [
              { zh: '49 ± 2', en: '49 ± 2', ja: '49 ± 2' },
              { zh: '約 9.8 cm', en: 'about 9.8 cm', ja: '約9.8cm' },
              { zh: 'M / 中號', en: 'M / Medium', ja: 'M / ミドル' },
              {
                zh: '最多人用嘅標準尺碼',
                en: 'The standard size most people wear',
                ja: '最も一般的な標準サイズ',
              },
            ],
            [
              { zh: '54 ± 2', en: '54 ± 2', ja: '54 ± 2' },
              { zh: '約 10.8 cm', en: 'about 10.8 cm', ja: '約10.8cm' },
              { zh: 'L / 大號', en: 'L / Large', ja: 'L / ラージ' },
              {
                zh: '想減少緊迫感,或者 M 覺得窄',
                en: 'You want less tension, or M feels tight',
                ja: '圧迫を減らしたい、Mが窮屈に感じる場合',
              },
            ],
            [
              { zh: '58 ± 2', en: '58 ± 2', ja: '58 ± 2' },
              { zh: '約 11.6 cm', en: 'about 11.6 cm', ja: '約11.6cm' },
              { zh: 'XL / 加大', en: 'XL / Extra large', ja: 'XL / 特大' },
              {
                zh: 'L 仍然覺得緊',
                en: 'L still feels tight',
                ja: 'Lでもまだ窮屈に感じる場合',
              },
            ],
            [
              { zh: '62 ± 2', en: '62 ± 2', ja: '62 ± 2' },
              { zh: '約 12.4 cm', en: 'about 12.4 cm', ja: '約12.4cm' },
              { zh: 'XXL / 特大', en: 'XXL / Extra extra large', ja: 'XXL / 超特大' },
              {
                zh: '需要更闊、束縛感更少',
                en: 'You want more room and less restraint',
                ja: 'さらに余裕と開放感が必要な場合',
              },
            ],
          ],
        },
        {
          t: 'p',
          text: {
            zh: '香港買嘅安全套,盒上通常會印住闊度(例如「52±2」);有啲品牌淨係印 S / M / L。**有闊度就以闊度為準**,因為同一個「S」可以係 44 mm,亦可以係 47 mm。',
            en: 'Condoms sold in Hong Kong usually print the width on the box, such as "52±2", while some brands print only S / M / L. **When the width is printed, use the width**, because one "S" can be 44 mm and another 47 mm.',
            ja: '香港で販売されるコンドームは、箱に「52±2」のように幅が印刷されていることが多く、S / M / L だけを書くブランドもあります。**幅が書かれていれば幅を優先**してください。同じ「S」でも44mmの場合と47mmの場合があります。',
          },
        },
      ],
    },
    {
      id: 'between',
      h2: {
        zh: '卡喺兩個尺碼之間:揀闊嗰個',
        en: 'Between two sizes: take the wider one',
        ja: '2つのサイズの間なら:広い方を',
      },
      blocks: [
        {
          t: 'p',
          text: {
            zh: '如果量出嚟剛好喺兩級中間,通常揀闊嗰個。窄過實際需要,陰莖會被勒住,血液回流減少,反而容易變得軟,亦會唔舒服;闊過太多就容易移位同滑出。',
            en: 'If you land exactly between two sizes, take the wider one. Too narrow constricts, which reduces blood flow and can make things soften, and it is uncomfortable. Too wide simply slips.',
            ja: 'ちょうど2つのサイズの間なら、広い方を選んでください。狭すぎると圧迫で血流が制限され、硬さを失ったり不快を感じたりします。広すぎるとずれ落ちてしまいます。',
          },
        },
        {
          t: 'ul',
          items: [
            {
              zh: '**戴得住、唔勒、唔甩**,就係啱尺碼。',
              en: 'A good fit stays on, does not pinch, and does not slip.',
              ja: '「しっかり装着し、締めつけず、ずれ落ちない」が正解です。',
            },
            {
              zh: '頭部位置留返少少空間(約一個拇指位),唔好拉到實,咁樣可以容納少量分泌物。',
              en: 'Leave a little space at the tip, about the width of a fingertip, so there is somewhere for the small amount of fluid that comes with an erection.',
              ja: '先端には親指ほどの中央を残してください。勃起時に出る少量の液を溜める場所が必要です。',
            },
            {
              zh: '如果你戴落去覺得「啱晒但有少少鬆」,咁就係啱嘅尺碼,唔需要換。',
              en: 'If it feels right but slightly loose, that is the right size. Do not change it.',
              ja: '「少し余裕はあるけど気にならない」なら、それが正しいサイズです。変える必要はありません。',
            },
          ],
        },
      ],
    },
    {
      id: 'which',
      h2: {
        zh: 'T-ZERO 四款,邊款啱你?',
        en: 'Which of the four T-ZERO styles is yours?',
        ja: 'T-ZERO 4種類のどれが自分に合っているか',
      },
      blocks: [
        {
          t: 'p',
          text: {
            zh: 'T-ZERO 第九感四款都係同一個闊度家族,分別係超薄、加倍潤滑、特久同顆粒。[超薄裝](product-ultra-thin.html)最薄、最貼身,適合想減少存在感嘅人;[加倍潤滑裝](product-extra-lub.html)潤滑液最多,適合容易乾澀嘅人;[特久裝](product-extended.html)較厚實;[顆粒裝](product-studded.html)有凸點紋路。',
            en: 'All four T-ZERO NINTH SENSE styles come in the same width family; what differs is the film and the finish. [Ultra Thin](product-ultra-thin.html) is the thinnest and the least noticeable. [Extra Lube](product-extra-lub.html) carries the most lubricant, for anyone who tends to run dry. [Extended](product-extended.html) is a thicker, sturdier film. [Studded](product-studded.html) has raised texture.',
            ja: 'T-ZERO 第九感の4種類は幅のレンジが同じで、膜の厚さと加工が異なります。[ウルトラシン](product-ultra-thin.html)は最も薄く、存在感が最も薄いです。[エクストラ潤滑](product-extra-lub.html)は潤滑剤が最も多く、乾きやすい方に。[エクステンド](product-extended.html)は丈夫な厚手。[スタッド](product-studded.html)は凸点加工です。',
          },
        },
        {
          t: 'p',
          text: {
            zh: '四款都喺[屈臣氏](https://www.watsons.com.hk)同 [HKTVmall](https://www.hktvmall.com)有售。唔知揀邊個尺碼,可以直接 [WhatsApp 問我哋](https://wa.me/85268971473),或者先買一盒3隻裝試下。',
            en: 'All four are available at [Watsons](https://www.watsons.com.hk) and [HKTVmall](https://www.hktvmall.com). If you are unsure of your size, [message us on WhatsApp](https://wa.me/85268971473), or start with a box of three and try.',
            ja: '4種類とも[Watsons](https://www.watsons.com.hk)と[HKTVmall](https://www.hktvmall.com)で販売しています。サイズが分からない場合は[WhatsApp](https://wa.me/85268971473)で相談いただくか、まずは3個入りの箱をお試しください。',
          },
        },
      ],
    },
  ],

  faq: [
    {
      q: {
        zh: '盒上面寫「52±2 mm」,到底係咩意思?',
        en: 'What does "52±2 mm" on the box actually mean?',
        ja: '箱の「52±2 mm」とは何のこと？',
      },
      a: {
        zh: '「52 mm」係闊度,「±2 mm」係容差,即係實際上可以係 50 至 54 mm。闊度 = 勃起的周長 ÷ 2,所以 52 mm 對應大約 10.4 厘米嘅周長。',
        en: '52 mm is the nominal width, and ±2 mm is the tolerance, so the real width may be anywhere from 50 to 54 mm. Width is half the erect circumference, so 52 mm means a circumference of roughly 10.4 cm.',
        ja: '「52mm」が公称幅、「±2mm」が公差で、実際の幅は50〜54mmです。幅は勃起時の周長を2で割った値なので、52mmなら周長は約10.4cmになります。',
      },
    },
    {
      q: {
        zh: '我唔識量,可以用身高去估嗎?',
        en: 'I cannot measure. Can I estimate from my height?',
        ja: '測るのが難しいので、身長から推測できますか？',
      },
      a: {
        zh: '唔準確。身高同陰莖尺寸嘅關聯好弱,靠身高估出嚟嘅尺碼通常都會錯。用上面嗰個方法,一條軟尺、一分鐘,準確好多。',
        en: 'Not reliably. Height and penile size are only weakly related, so a height-based estimate is usually wrong. The tape takes a minute and is far more accurate.',
        ja: '正確ではありません。身長とペニスのサイズには明確な相関がありません。テープなら1分で、より正確に選べます。',
      },
    },
    {
      q: {
        zh: '買加大尺碼會唔會安全啲?',
        en: 'Is a larger size safer?',
        ja: '大きいサイズの方が安全ですか？',
      },
      a: {
        zh: '唔會。所有正廠安全套都要通過 ISO 4071 國際標準,包括爆破壓力、拉力伸長同每一次嘅電子測試。闊度唔影響安全性,尺碼只係為咗戴得舒服同唔會滑出。',
        en: 'No. Every genuine condom has to pass ISO 4071, which covers burst pressure, tensile strength and an electrical test on every single condom. Width has nothing to do with safety; it is about comfort and staying on.',
        ja: 'いいえ。本物のコンドームはすべてISO 4071を満たす必要があり、破裂圧、引張強度、1個ごとの電気的検査が含まれます。幅は安全性とは無関係で、快適さとずれ防止のための尺寸です。',
      },
    },
  ],

  related: ['guide-material.html', 'guide-first-time.html', 'product-ultra-thin.html', 'product-extra-lub.html'],
};
