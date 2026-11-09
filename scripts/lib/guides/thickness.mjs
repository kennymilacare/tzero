/* ===========================================================
   guides/thickness.mjs — the thickness guide.

   0.01 mm, 0.03 mm, 0.04 mm: what the number on the box
   means, what it changes, and what it does not.

   The Chinese is written Chinese — the way a shop would put
   it on a shelf, not the way it is spoken.

   Pure data — no filesystem, no network.
   =========================================================== */

export default {
  path: 'guide-thickness.html',
  slug: 'thickness',
  image: 'assets/images/products/tzero-ultra-thin.jpg',
  imageWidth: 2048,
  imageHeight: 2048,
  published: '2026-11-05',

  short: {
    zh: '厚度比較',
    en: 'Thickness',
    ja: '薄さの比較',
  },
  blurb: {
    zh: '0.01、0.03、0.04 毫米之間的分別。',
    en: 'What 0.01, 0.03 and 0.04 mm actually change.',
    ja: '0.01mmと0.03mmと0.04mmの違い。',
  },
  eyebrow: {
    zh: '選購指南 · 厚度',
    en: 'Buying guide · Thickness',
    ja: '購入ガイド · 厚さ',
  },
  h1: {
    zh: '安全套厚度比較：0.01、0.03、0.04 毫米有什麼分別？',
    en: 'Condom thickness compared: 0.01, 0.03 and 0.04 mm',
    ja: 'コンドームの薄さの比較：0.01mm、0.03mm、0.04mmの違い',
  },
  title: {
    zh: '安全套厚度 · 0.01 / 0.03 / 0.04 毫米比較 · T-ZERO 第九感',
    en: 'Condom Thickness · 0.01 / 0.03 / 0.04 mm Compared · T-ZERO NINTH SENSE',
    ja: 'コンドームの厚さ · 0.01 / 0.03 / 0.04mmの比較 · T-ZERO 第九感',
  },
  description: {
    zh: '安全套厚度比較：0.01、0.03、0.04 毫米分別代表什麼？薄一點是否較不耐用？較厚是否較安全？一次講清，並對照 T-ZERO 第九感四款的實際厚度。',
    en: 'Condom thickness compared: what 0.01, 0.03 and 0.04 mm mean. Is thinner less durable, is thicker safer, and how do the four T-ZERO designs differ.',
    ja: '0.01mm、0.03mm、0.04mmが何を意味するか。薄いほど弱いのか、厚いほど安全なのか、T-ZERO 4モデルの厚さを比べます。',
  },
  lead: {
    zh: '安全套盒上印著的毫米數，說的是薄膜本身的厚度。數字愈小，戴上去愈感覺不到；數字愈大，則愈有存在感，亦愈有餘地做出凸點與紋路。不過厚度並不等於安全性。',
    en: 'The millimetre figure on a condom box is the thickness of the film itself. A smaller number feels less intrusive; a larger one has more presence, and leaves more room for studs and texture. Thickness, though, is not the same thing as safety.',
    ja: '箱に記されたミリ単位の数字は、膜そのものの厚さです。小さい数字ほど装着感が薄く、大きい数字ほど存在感があり、凸粒や凹凸をつける余裕も残ります。ただし、厚度は安全性とは別です。',
  },

  sections: [
    {
      id: 'what-the-number-is',
      h2: {
        zh: '盒上的數字，是薄膜的厚度',
        en: 'The number is the thickness of the film',
        ja: '箱の数字は膜の厚さ',
      },
      blocks: [
        {
          t: 'p',
          text: {
            zh: '安全套的薄膜是用模具成型，再切成適當的長度。盒上印的「0.03 mm」之類的數字，說的是這一層薄膜在製造時的厚度，不是長度，也不是闊度。同一款產品每一片的厚度都略有不同，包裝上的數字是平均值的標示。',
            en: 'A condom is moulded as a thin film and then cut to length. A figure like "0.03 mm" on the box is the thickness of that film as it is made — not the length, and not the width. Every condom in a box varies slightly; the printed figure is an average.',
            ja: 'コンドームは薄い膜を成形し、長さに切り落として作ります。箱に「0.03mm」とあるのは、その膜の厚さです。長さでも幅でもありません。同じ箱の中で1枚ずつ多少のばらつきがあり、印字は平均値です。',
          },
        },
        {
          t: 'table',
          head: [
            { zh: '厚度', en: 'Thickness', ja: '厚さ' },
            { zh: '常見的產品', en: 'Where you meet it', ja: '一般的な製品' },
            { zh: '戴上之後的感覺', en: 'How it feels', ja: '装着した感じ' },
            { zh: '要注意', en: 'Worth knowing', ja: '知っておきたいこと' },
          ],
          rows: [
            [
              { zh: '0.01 – 0.02 mm', en: '0.01 – 0.02 mm', ja: '0.01〜0.02mm' },
              { zh: '超薄型', en: 'Ultra thin', ja: '超薄タイプ' },
              { zh: '幾乎感覺不到薄膜的存在', en: 'You barely notice the film is there', ja: '膜的存在をほとんど感じない' },
              { zh: '製造工藝要求較高，但檢漏標準不會因此降低', en: 'Harder to make, but the leak test is the same', ja: '製造の精度は要求されるが、漏れ検査の基準は変わらない' },
            ],
            [
              { zh: '0.03 mm', en: '0.03 mm', ja: '0.03mm' },
              { zh: '薄型', en: 'Thin', ja: '薄型' },
              { zh: '存在感很輕，傳溫較快', en: 'Light presence, and warmth comes through', ja: '存在感は軽く、体温が伝わりやすい' },
              { zh: '薄與耐用之間的平衡點', en: 'The balance between thinness and durability', ja: '薄さと耐久性のバランス' },
            ],
            [
              { zh: '0.04 mm', en: '0.04 mm', ja: '0.04mm' },
              { zh: '中等厚度', en: 'Medium', ja: '中程度の厚さ' },
              { zh: '有較明顯的存在感', en: 'More noticeable', ja: 'ある程度の存在感がある' },
              { zh: '有足夠材料做出立體凸點', en: 'Enough material for raised studs', ja: '立体の凸粒を出すのに十分な材料がある' },
            ],
            [
              { zh: '0.06 – 0.08 mm', en: '0.06 – 0.08 mm', ja: '0.06〜0.08mm' },
              { zh: '標準型', en: 'Standard', ja: 'スタンダード' },
              { zh: '最常見的厚度', en: 'The most common thickness', ja: 'もっとも一般的な厚さ' },
              { zh: '大部分日常使用的產品都在這個範圍', en: 'Most condoms people use are in this range', ja: '日常的に使われるものはほぼこの範囲' },
            ],
          ],
        },
      ],
    },
    {
      id: 'what-it-changes',
      h2: {
        zh: '薄與厚，實際的分別在哪裡',
        en: 'What thin and thick actually change',
        ja: '薄いものと厚いものの、実際の違い',
      },
      blocks: [
        {
          t: 'p',
          text: {
            zh: '厚度改變的是觸感，不是功能。四個地方感受得到：',
            en: 'Thickness changes the feel, not the function. There are four places you can feel it:',
            ja: '厚さが変えるのは感触です。機能ではありません。感じるのは次の4点です。',
          },
        },
        {
          t: 'ul',
          items: [
            {
              zh: '**存在感**：越薄的產品，戴上去越接近沒有佩戴的感覺。',
              en: '**Presence** — the thinner the film, the closer it is to wearing nothing at all.',
              ja: '**存在感** — 薄いほど、装着していないことに近い感覚になります。',
            },
            {
              zh: '**傳溫**：薄膜越薄，體溫傳得越快，較少隔熱的感覺。',
              en: '**Warmth** — a thinner film carries body heat through faster and insulates less.',
              ja: '**体温の伝わり** — 膜が薄いほど体温が速く伝わり、保温感が弱くなります。',
            },
            {
              zh: '**耐用度**：較薄的產品在長時間使用下，對摩擦與拉扯的容錯較低，換一個新的較安心。',
              en: '**Durability** — a thinner film has less margin against friction and stretching over a long time, so a fresh one is the safer choice.',
              ja: '**耐久性** — 薄い膜は、長時間の摩擦や引き伸ばしに対する余裕が小さいため、新しいものを選ぶほうが安心です。',
            },
            {
              zh: '**紋路空間**：做出凸點、皺紋與環紋需要額外的材料，所以帶紋路的產品通常較厚。',
              en: '**Room for texture** — studs, wrinkles and ribs need extra material, so textured products are normally thicker.',
              ja: '**凹凸のための余裕** — 凸粒や皺、リブには余分な材料が必要です。そのためテクスチャーのあるものは通常厚くなります。',
            },
          ],
        },
        {
          t: 'note',
          title: {
            zh: '厚 ≠ 安全感覺',
            en: 'Thicker does not mean safer',
            ja: '厚い = 安全、ではない',
          },
          text: {
            zh: '很多人以為較厚便較安全。其實正廠安全套的爆破壓力與拉力受國際標準（ISO 4071）規管，每一片都要通過電子檢漏，不會因為薄膜較薄便容易出現破洞。較厚只是戴上去的感覺不同。',
            en: 'A lot of people assume thicker means safer. The burst pressure and tensile strength of a genuine condom are governed by an international standard, ISO 4071, and every condom is electronically tested for holes. A thinner film is not more likely to fail. Thickness changes the feel, not the safety.',
            ja: '厚いほうが安全だと考える人が多いですが、そうではありません。本物のコンドームの破裂圧と引張強度は国際規格 ISO 4071で定められ、1枚ごとに漏れ検査を受けます。薄いだけで破れやすくなることはありません。厚さが変えるのは感触だけです。',
          },
        },
      ],
    },
    {
      id: 'tzero',
      h2: {
        zh: 'T-ZERO 第九感四款的厚度',
        en: 'The thickness of the four T-ZERO designs',
        ja: 'T-ZERO 第九感 4モデルの厚さ',
      },
      blocks: [
        {
          t: 'table',
          head: [
            { zh: '款式', en: 'Design', ja: 'モデル' },
            { zh: '厚度', en: 'Thickness', ja: '厚さ' },
            { zh: '為何是這個厚度', en: 'Why this thickness', ja: 'この厚さになった理由' },
          ],
          rows: [
            [
              { zh: '[超薄裝](product-ultra-thin.html)', en: '[Ultra Thin](product-ultra-thin.html)', ja: '[ウルトラシン](product-ultra-thin.html)' },
              { zh: '0.01 mm', en: '0.01 mm', ja: '0.01mm' },
              { zh: '追求接近無感的體驗，並迅速傳導體溫', en: 'For the feel of very nearly nothing, and for warmth to come through quickly', ja: '装着感をほとんど感じさせず、体温をすみやかに伝えるため' },
            ],
            [
              { zh: '[持久裝](product-extended.html)', en: '[Extended](product-extended.html)', ja: '[エクステンド](product-extended.html)' },
              { zh: '0.03 mm', en: '0.03 mm', ja: '0.03mm' },
              { zh: '在傳溫與貼合之間取得平衡，長時間使用仍保持存在感', en: 'A balance between warmth and fit that still holds up over a long time', ja: '体温の伝わりと密着感のバランスを保ち、長時間でも装着感を保つため' },
            ],
            [
              { zh: '[加倍潤滑裝](product-extra-lub.html)', en: '[Extra Lubricant](product-extra-lub.html)', ja: '[エクストラ潤滑](product-extra-lub.html)' },
              { zh: '0.03 mm', en: '0.03 mm', ja: '0.03mm' },
              { zh: '薄身薄膜配以玻尿酸潤滑層，重心放在潤滑而非厚薄', en: 'A thin film with a hyaluronic lubricant layer — the emphasis is on lubrication, not on thickness', ja: '薄い膜にヒアルロン酸の潤滑層を合わせたもの。重点は厚さではなく潤滑感にあります' },
            ],
            [
              { zh: '[顆粒裝](product-studded.html)', en: '[Studded](product-studded.html)', ja: '[スタッデッド](product-studded.html)' },
              { zh: '0.04 mm', en: '0.04 mm', ja: '0.04mm' },
              { zh: '立體凸點需要足夠材料才能穩定成形，分佈亦更平均', en: 'Raised studs need enough material to hold their shape, and they sit more evenly', ja: '立体の凸粒が形を保つには十分な材料が必要で、配置もより均等になります' },
            ],
          ],
        },
        {
          t: 'p',
          text: {
            zh: '四款的材質相同，都是醫療級天然橡膠，每一片都經電子檢漏測試。厚度不同，但安全標準相同。四款均有售於[屈臣氏](https://www.watsons.com.hk)及 [HKTVmall](https://www.hktvmall.com)。',
            en: 'All four are made of the same material — medical-grade natural latex — and every condom is electronically leak tested. The thickness differs; the standard does not. All four are sold at [Watsons](https://www.watsons.com.hk) and [HKTVmall](https://www.hktvmall.com).',
            ja: '4モデルとも同じ素材、医療グレードの天然ラテックスです。1枚ごとに漏れ検査を受けます。厚さは違いますが、基準は同じです。4種類とも[Watsons](https://www.watsons.com.hk)と[HKTVmall](https://www.hktvmall.com)で販売しています。',
          },
        },
      ],
    },
    {
      id: 'choose',
      h2: {
        zh: '應該選擇多厚的？',
        en: 'Which thickness to choose',
        ja: '何の厚さを選ぶべきか',
      },
      blocks: [
        {
          t: 'p',
          text: {
            zh: '多數人不需要猶豫太久：第一盒先買中等厚度的款式，把尺碼與材質確認下來，之後再按需要轉向更薄或更有紋路的版本。',
            en: 'Most people should not deliberate for long: start with a middle-of-the-road box, settle the size and the material, and move to a thinner or a more textured one afterwards if you want to.',
            ja: '多くは迷わなくてかまいません。まず標準的な厚さで1箱選び、サイズと素材を決めてから、薄いものやテクスチャーのあるものに変えればよいです。',
          },
        },
        {
          t: 'ul',
          items: [
            {
              zh: '想要**感覺最輕**、接近沒有佩戴 → [超薄裝](product-ultra-thin.html)，0.01 mm。',
              en: 'For the **least sensation**, close to wearing nothing → [Ultra Thin](product-ultra-thin.html), 0.01 mm.',
              ja: '**感覚を最小限**に、着用していないように感じたい → [ウルトラシン](product-ultra-thin.html)、0.01mm。',
            },
            {
              zh: '想要**穩定貼合**、長時間使用 → [持久裝](product-extended.html)或[加倍潤滑裝](product-extra-lub.html)，0.03 mm。',
              en: 'For a **steady fit** over a longer stretch → [Extended](product-extended.html) or [Extra Lubricant](product-extra-lub.html), 0.03 mm.',
              ja: '**安定した密着感**と長時間の使用 → [エクステンド](product-extended.html)か[エクストラ潤滑](product-extra-lub.html)、0.03mm。',
            },
            {
              zh: '想要**額外觸感刺激** → [顆粒裝](product-studded.html)，0.04 mm。',
              en: 'For **extra sensation** → [Studded](product-studded.html), 0.04 mm.',
              ja: '**触覚の刺激**を多一点 → [スタッデッド](product-studded.html)、0.04mm。',
            },
            {
              zh: '仍未決定 → 讀[第一次購買指南](guide-first-time.html)，由尺碼開始。',
              en: 'Still deciding → read the [first-time guide](guide-first-time.html) and start with the size.',
              ja: 'まだ迷っているなら、[はじめての一本](guide-first-time.html)を読んで、サイズから確認してください。',
            },
          ],
        },
      ],
    },
  ],

  faq: [
    {
      q: {
        zh: '0.01 mm 的安全套安全嗎？',
        en: 'Is a 0.01 mm condom safe?',
        ja: '0.01mmのコンドームは安全ですか？',
      },
      a: {
        zh: '安全。正廠安全套的爆破壓力與拉力受國際標準（ISO 4071）規管，每一批都要抽樣驗證，每一片都要通過電子檢漏。0.01 mm 說的是薄膜的厚度，不是檢驗的標準。',
        en: 'Yes. The burst pressure and tensile strength of a genuine condom are governed by ISO 4071, each batch is tested and every condom is electronically checked for holes. The 0.01 mm figure describes the thickness of the film, not the standard it is held to.',
        ja: 'はい。本物のコンドームの破裂圧と引張強度は ISO 4071で定められ、ロットごとに検査を行い、1枚ごとに漏れ検査も受けます。0.01mmという数字が表すのは膜の厚さであり、基準の松懈ではありません。',
      },
    },
    {
      q: {
        zh: '厚一點會比較耐用嗎？',
        en: 'Does a thicker condom last longer?',
        ja: '厚いほうが持ちますか？',
      },
      a: {
        zh: '一般來說，較厚的薄膜對摩擦與拉扯的容錯較高，長時間使用下較不容易破損。但安全套是一次性的用品，不論厚薄，每次使用都應換一個新的，這才是最有效的做法。',
        en: 'Generally a thicker film has more margin against friction and stretching, so it is less likely to break over a long time. But a condom is a single-use product: whatever the thickness, a new one every time is what actually works.',
        ja: '一般に、厚い膜は摩擦や引き伸ばしに対する余裕があり、長時間でも破れにくくなります。ただしコンドームは使い捨ての用具です。厚さに関係なく、毎回新しいものを使うことが大切です。',
      },
    },
    {
      q: {
        zh: '0.03 mm 算是超薄嗎？',
        en: 'Is 0.03 mm ultra thin?',
        ja: '0.03mmは超薄ですか？',
      },
      a: {
        zh: '算是薄型，但不是超薄。日常最常見的安全套厚度約為 0.06 至 0.08 毫米，因此 0.03 毫米明顯較薄。T-ZERO 的[超薄裝](product-ultra-thin.html)為 0.01 毫米，屬超薄範疇。',
        en: 'It counts as thin, but not as ultra thin. The most common condoms are around 0.06 to 0.08 mm, so 0.03 mm is clearly thinner than usual. The T-ZERO [Ultra Thin](product-ultra-thin.html) is 0.01 mm, which is in the ultra-thin range.',
        ja: '薄型ですが、超薄ではありません。日常的に使われているコンドームは0.06〜0.08mm前後なので、0.03mmは明らかに薄くなります。T-ZEROの[ウルトラシン](product-ultra-thin.html)は0.01mmで、超薄の範囲に入ります。',
      },
    },
    {
      q: {
        zh: '同樣價錢，應該買薄一點還是厚一點？',
        en: 'At the same price, should I buy the thinner one or the thicker one?',
        ja: '同じ値段なら、薄いものと厚いもののどちらを選ぶべきですか？',
      },
      a: {
        zh: '先看用途。第一次購買或較少使用，選薄身款式可以減少存在感；想長期使用或者需要額外觸感，選較厚的有紋路款式會更實用。',
        en: 'Start with what you are using it for. Buying for the first time, or using it now and then, a thinner style keeps the feel to a minimum; for longer sessions or extra sensation, a thicker textured one is the more practical choice.',
        ja: 'まず用途で決めます。はじめて買う、あるいは使う頻度が低い場合は、薄いものは装着感を抑えます。長めに使う場合や刺激を求めたい場合は、厚みのあるテクスチャー付きのほうが扱いやすいでしょう。',
      },
    },
  ],

  related: ['guide-size.html', 'guide-texture.html', 'guide-material.html', 'product-ultra-thin.html'],
};
