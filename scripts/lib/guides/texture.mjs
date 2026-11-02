/* ===========================================================
   guides/texture.mjs — the texture guide.

   What the words on the box mean: plain, ribbed, studded,
   wrinkled, snug fit. What they feel like, and what they do
   not do.

   Pure data — no filesystem, no network.
   =========================================================== */

export default {
  path: 'guide-texture.html',
  slug: 'texture',
  image: 'assets/images/products/tzero-studded.jpg',
  imageWidth: 2048,
  imageHeight: 2048,
  published: '2026-11-02',

  short: {
    zh: '紋路種類',
    en: 'Textures',
    ja: 'テクスチャーの種類',
  },
  blurb: {
    zh: '平紋、環紋、凸點、皺紋有咩唔同。',
    en: 'Plain, ribbed, studded, wrinkled — what each one is.',
    ja: 'プレーン、リブ、スタッド、皺の意味。',
  },
  eyebrow: {
    zh: '選購指南 · 紋路',
    en: 'Buying guide · Texture',
    ja: '購入ガイド · テクスチャ',
  },
  h1: {
    zh: '安全套紋路一覽:平紋、環紋、凸點、皺紋有咩唔同?',
    en: 'Condom textures explained: plain, ribbed, studded, wrinkled',
    ja: 'コンドームのテクチャー一覧:プレーン、リブ、スタッド、皺',
  },
  title: {
    zh: '安全套紋路種類 · 平紋 環紋 凸點 皺紋 · 厚薄比較 · T-ZERO 第九感',
    en: 'Condom Textures · Plain, Ribbed, Studded, Wrinkled · Thickness · T-ZERO NINTH SENSE',
    ja: 'コンドームのテクチャー · プレーン・リブ・スタッド・皺 · 厚さの比較 · T-ZERO 第九感',
  },
  description: {
    zh: '安全套紋路種類一覽:平紋、光面、環紋、皺紋、凸點、收窄式同熱感有咩分別?邊啲最薄?邊啲最薄身?一次過講清。',
    en: 'What the texture words on a condom box mean: plain, ribbed, wrinkled, studded, snug fit and warming. Which are thinnest, which feel closest to the skin.',
    ja: 'コンドームのテクチャーの意味を解説：プレーン、リブ、皺、スタッド、スナッグフィット、ウォーミング。薄いのはどれか。',
  },
  lead: {
    zh: '安全套盒上嗰句「ribbed」「studded」「textured」,係話畀你知戴上去嘅觸感有咩唔同。佢哋唔係安全嘅分別——所有正廠安全套都要過同一套標準——而係感覺上嘅分別。',
    en: 'The words "ribbed", "studded" and "textured" on a condom box tell you how it will feel. They are not a difference in safety — every genuine condom passes the same tests — they are a difference in sensation.',
    ja: '箱にある「ribbed」「studded」「textured」という言葉は、装着したときの感触の違いを示します。安全性の違いではなく、正真正銘のコンドームはすべて同じ検査を通ります。',
  },

  sections: [
    {
      id: 'kinds',
      h2: {
        zh: '常見嘅五種紋路',
        en: 'The five textures you will meet',
        ja: '出会う5つのテクスチャ',
      },
      blocks: [
        {
          t: 'table',
          head: [
            { zh: '名稱', en: 'Name', ja: '名称' },
            { zh: '英文通常點寫', en: 'Usually written', ja: '英文表記' },
            { zh: '觸感', en: 'What it feels like', ja: '感触' },
            { zh: '厚薄', en: 'Thickness', ja: '厚さ' },
          ],
          rows: [
            [
              { zh: '平紋 / 光面', en: 'Plain / smooth', ja: 'プレーン / スムーズ' },
              { zh: 'plain, smooth', en: 'plain, smooth', ja: 'plain, smooth' },
              {
                zh: '完全冇起伏,最貼身、最少阻礙',
                en: 'No texture at all — the closest, least intrusive',
                ja: '凹凸がなく体に最も沿う',
              },
              { zh: '最薄', en: 'Thinnest', ja: '最も薄い' },
            ],
            [
              { zh: '環紋', en: 'Ribbed', ja: 'リブ（リング）' },
              { zh: 'ribbed', en: 'ribbed', ja: 'ribbed' },
              {
                zh: '一圈一圈嘅凸起,增加摩擦力',
                en: 'Raised rings around the shaft, adding friction',
                ja: '一周のリング状の隆起で、摩擦を加える',
              },
              { zh: '中等', en: 'Medium', ja: '普通' },
            ],
            [
              { zh: '皺紋 / 凹凸紋', en: 'Wrinkled / textured', ja: 'ワンクル / テクスチャー' },
              { zh: 'wrinkled, textured', en: 'wrinkled, textured', ja: 'wrinkled, textured' },
              {
                zh: '不規則嘅起伏,似皺紙咁嘅質感',
                en: 'Irregular bumps, like crinkled paper',
                ja: '不規則な凹凸、皺紙のような質感',
              },
              { zh: '中等至厚', en: 'Medium to thick', ja: '普通〜厚め' },
            ],
            [
              { zh: '凸點 / 顆粒', en: 'Studded / dotted', ja: 'スタッド / ドット' },
              { zh: 'studded, dotted', en: 'studded, dotted', ja: 'studded, dotted' },
              {
                zh: '離散嘅小凸粒,多數集中喺前端',
                en: 'Discrete raised bumps, usually concentrated near the tip',
                ja: '離散した小さな凸粒、先端に集中することが多い',
              },
              { zh: '較厚', en: 'Thicker', ja: 'やや厚い' },
            ],
            [
              { zh: '收窄式 / 環帶', en: 'Snug fit / tightness ring', ja: 'スナッグフィット / タイトリング' },
              { zh: 'snug fit, tightness ring', en: 'snug fit, tightness ring', ja: 'snug fit, tightness ring' },
              {
                zh: '根部有一條較厚嘅環,減少滑動、增加阻礙',
                en: 'A thicker ring at the base that stops it sliding and adds friction',
                ja: '根元が厚く、ずれを防ぐリング',
              },
              { zh: '較厚', en: 'Thicker', ja: 'やや厚い' },
            ],
          ],
        },
        {
          t: 'p',
          text: {
            zh: '仲有一類叫「熱感」或者「暖感」,係指薄膜嘅材質會比較快傳遞體溫,唔係加咗加熱包,亦唔會發熱。',
            en: 'There is also "warming" or "heat transfer" condoms. The film carries body warmth through faster than usual; there is no heating element and nothing gets warm on its own.',
            ja: '「ウォーミング（温感）」系の コンドームもあります。通常のものより体温が伝わりやすいだけで、ヒーターや発熱剤が入っているわけではありません。',
          },
        },
      ],
    },
    {
      id: 'thickness',
      h2: {
        zh: '紋路越多,通常越厚',
        en: 'More texture usually means a thicker film',
        ja: 'テクスチャーが多いほど、一般に厚くなる',
      },
      blocks: [
        {
          t: 'p',
          text: {
            zh: '要整凸起、凸粒、皺紋,就要多一層材料,所以有紋路嘅安全套通常比平紋厚。超薄裝通常都係平紋,因為薄到一個程度就冇位加紋路。',
            en: 'Raised bumps and wrinkles need extra material, so a textured condom is normally thicker than a plain one. Ultra-thin condoms are usually plain, because below a certain thickness there is no material left to texture.',
            ja: '凸粒や皺をつけるには余分な材料が必要です。そのためテクスチャーのある コンドームは、プレーンのものより厚くなります。ウルトラシンは通常プレーンです。薄くしすぎると凹凸をつける余地がありません。',
          },
        },
        {
          t: 'ul',
          items: [
            {
              zh: '**超薄**:大約 0.03 至 0.06 毫米,幾乎感覺唔到。',
              en: '**Ultra thin:** roughly 0.03 to 0.06 mm — you barely notice it is there.',
              ja: '**ウルトラシン:** およそ0.03〜0.06mm。ほとんど存在感を感じません。',
            },
            {
              zh: '**標準**:大約 0.06 至 0.08 毫米,最常見。',
              en: '**Standard:** roughly 0.06 to 0.08 mm — the most common.',
              ja: '**スタンダード:** およそ0.06〜0.08mm。最も一般的。',
            },
            {
              zh: '**較厚**:0.08 毫米以上,多數有紋路或者凸點。',
              en: '**Thicker:** over 0.08 mm — usually textured or studded.',
              ja: '**厚め:** 0.08mm超。テクスチャーを加えたものが多い。',
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
            zh: '好多人以為厚啲就安全啲。其實正廠安全套嘅爆破壓力同拉力有國際標準(ISO 4071)管住,薄身啲嘅一樣要通過電子檢漏,唔會因為薄就容易漏。',
            en: 'A lot of people assume thicker means safer. In fact the burst pressure and tensile strength of a genuine condom are governed by an international standard, ISO 4071, and every condom is electronically tested for holes. A thinner film is not more likely to fail.',
            ja: '厚いほうが安全だと考える人が多いですが、実際にはそうではありません。本物のコンドームの破裂圧と引張強度は国際規格 ISO 4071で定められ、1枚ごとに漏れ検査も受けます。薄いだけで破れやすくなることはありません。',
          },
        },
      ],
    },
    {
      id: 'choose',
      h2: {
        zh: '第一次買,應該揀邊種紋路?',
        en: 'Which texture to try first',
        ja: '初めてならどのテクスチャーを選ぶべきか',
      },
      blocks: [
        {
          t: 'p',
          text: {
            zh: '最穩陣嘅做法係:第一盒買平紋嘅超薄裝。理由好簡單——你要確認嘅係尺碼啱唔啱、有冇過敏、戴落去舒唔舒服,而唔係紋路。確認咗呢三樣,之後先加紋路,你就知道係邊個因素改變咗感受。',
            en: 'The safest first box is a plain ultra-thin one. The reason is simple: what you need to work out first is whether the size is right, whether you react to the material, and whether it feels comfortable — not the texture. Once those three are settled, add texture, and you will know what actually changed the feeling.',
            ja: '最初に選ぶなら、プレーンなウルトラシンがもっとも無難です。確認したいのは、サイズ合っているか、素材に反応しないか、装着が快適か — テクスチャーではありません。この3点が分かれば、次からテクスチャーを加えても、何が変わったのかが分かります。',
          },
        },
        {
          t: 'ul',
          items: [
            {
              zh: '想要**感覺最細**、最似「冇戴嘢」→ 平紋超薄。',
              en: 'For the **least sensation**, as close to wearing nothing as it goes → plain ultra-thin.',
              ja: '**感覚を最小限**に、着用していないように感じたい → プレーン・ウルトラシン。',
            },
            {
              zh: '想要**多啲摩擦力**、刺激啲 → 環紋或者凸點。',
              en: 'For **more friction** and a sharper sensation → ribbed or studded.',
              ja: '**摩擦を多一点**、刺激を求めたい → リブかスタッド。',
            },
            {
              zh: '容易**滑落**、想戴得穩陣啲 → 收窄式或者環帶。',
              en: 'If it **keeps slipping** and you want it to stay put → snug fit or a tightness ring.',
              ja: '**ずれがち**で、しっかり固定したい → スナッグフィットまたはタイトリング。',
            },
            {
              zh: '怕**凍**,想要體溫感 → 傳熱快嘅超薄或者熱感型。',
              en: 'If you feel **cold** and want more warmth → a thin heat-transfer film or a warming style.',
              ja: '**冷たく感じる**、温かさほしい → 熱を伝えやすい薄膜やウォーミングタイプ。',
            },
          ],
        },
      ],
    },
    {
      id: 'tzero',
      h2: {
        zh: 'T-ZERO 四款嘅紋路分別',
        en: 'How the four T-ZERO styles differ',
        ja: 'T-ZERO 4種類のテクスチャーの違い',
      },
      blocks: [
        {
          t: 'ul',
          items: [
            {
              zh: '**[超薄裝](product-ultra-thin.html)** — 平紋,最薄最貼身。',
              en: '**[Ultra Thin](product-ultra-thin.html)** — plain, the thinnest and the least noticeable.',
              ja: '**[ウルトラシン](product-ultra-thin.html)** — プレーン。最も薄く、存在感も最も薄い。',
            },
            {
              zh: '**[加倍潤滑裝](product-extra-lub.html)** — 平紋,加最多玻尿酸潤滑液。',
              en: '**[Extra Lube](product-extra-lub.html)** — plain, with the most hyaluronic lubricant.',
              ja: '**[エクストラ潤滑](product-extra-lub.html)** — プレーン。最も多くヒアルロンを含んだ潤滑剤。',
            },
            {
              zh: '**[特久裝](product-extended.html)** — 平紋但較厚實,配更耐嘅薄膜。',
              en: '**[Extended](product-extended.html)** — plain, but a sturdier film that is built to last.',
              ja: '**[エクステンド](product-extended.html)** — プレーンだが、丈夫な厚めの膜。',
            },
            {
              zh: '**[顆粒裝](product-studded.html)** — 凸點紋路,集中喺前端。',
              en: '**[Studded](product-studded.html)** — raised bumps, concentrated near the tip.',
              ja: '**[スタッド](product-studded.html)** — 凸点テクスチャー。先端に集中しています。',
            },
          ],
        },
        {
          t: 'p',
          text: {
            zh: '四款都喺[屈臣氏](https://www.watsons.com.hk)同 [HKTVmall](https://www.hktvmall.com)有售,唔想買錯可以先買一盒試。',
            en: 'All four are sold at [Watsons](https://www.watsons.com.hk) and [HKTVmall](https://www.hktvmall.com). If you would rather not guess, start with one box.',
            ja: '4種類とも[Watsons](https://www.watsons.com.hk)と[HKTVmall](https://www.hktvmall.com)で販売しています。迷ったらまず1箱をお試しください。',
          },
        },
      ],
    },
  ],

  faq: [
    {
      q: {
        zh: '凸點會唔會唔安全?',
        en: 'Are studded condoms less safe?',
        ja: 'スタッドは安全性が低いですか？',
      },
      a: {
        zh: '唔會。凸點只係加咗形狀,唔會加厚到影響爆破壓力,亦唔會令電子檢漏失效。所有正廠產品一樣要符合 ISO 4071。',
        en: 'No. The bumps add shape, not weakness: they do not take the film past its burst pressure, and they do not interfere with the electronic hole test. Every genuine product still has to meet ISO 4071.',
        ja: 'いいえ。凸粒は形状を加えるだけで、破裂圧を弱めるものでもなく、電子的な漏れ検査を妨げるものでもありません。本物の製品はすべて ISO 4071を満たす必要があります。',
      },
    },
    {
      q: {
        zh: '有紋路嘅會唔會好油?',
        en: 'Do textured condoms get oily?',
        ja: 'テクスチャーのあるものは油っぽくなりますか？',
      },
      a: {
        zh: '唔會,至少唔會因為紋路本身。有啲人有「濕滑」嘅感覺,其實係潤滑液比較多,加上皮膚同潤滑液嘅混合,感覺上會覺得滑。呢個係配方差異,唔係紋路嘅問題。',
        en: 'Not from the texture itself. What feels slick is usually the amount of lubricant, mixed with skin moisture. That is a difference in formulation, not in texture.',
        ja: 'テクスチャーそのものではありません。滑らかだと感じるのは、潤滑剤の量と皮膚との混ざり合いによるものです。配合の違いであり、テクスチャーの問題ではありません。',
      },
    },
    {
      q: {
        zh: '想試下唔同紋路,但唔知會唔會太厚?',
        en: 'I want to try a texture. Will it be too thick?',
        ja: 'テクスチャーを試したいですが、厚すぎませんか？',
      },
      a: {
        zh: '有紋路嘅安全套通常比平紋厚 0.01 至 0.02 毫米左右。實際感覺通常比數字上嘅差異細好多。T-ZERO 嘅[顆粒裝](product-studded.html)就係一個唔錯嘅起點。',
        en: 'A textured condom is usually about 0.01 to 0.02 mm thicker than a plain one. In practice the difference feels smaller than the number suggests. The T-ZERO [Studded](product-studded.html) is a good place to start.',
        ja: 'テクスチャーのある コンドームは、通常プレーンより0.01〜0.02mmほど厚くなります。実際の感じは数値ほどの差にはなりません。T-ZERO の[スタッド](product-studded.html)は、ちょうどよい起点です。',
      },
    },
  ],

  related: ['guide-first-time.html', 'guide-material.html', 'product-studded.html', 'product-ultra-thin.html'],
};
