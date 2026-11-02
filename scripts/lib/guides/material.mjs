/* ===========================================================
   guides/material.mjs — latex vs PU vs PI.

   What the box does not tell you: what the film is made of,
   whether it can carry heat, and what it does when it meets
   the wrong lubricant.

   Pure data — no filesystem, no network.
   =========================================================== */

export default {
  path: 'guide-material.html',
  slug: 'material',
  image: 'assets/images/products/lubricant-comparison.jpg',
  imageWidth: 1254,
  imageHeight: 1254,
  published: '2026-11-02',

  short: {
    zh: '材質比較',
    en: 'Materials',
    ja: '素材の比較',
  },
  blurb: {
    zh: '乳膠、PU、PI 有咩分別,同潤滑液點配合。',
    en: 'Latex, PU and PI, and which lubricant to use.',
    ja: 'ラテックス、PU、PIの違いと、潤滑剤の選び方。',
  },
  eyebrow: {
    zh: '選購指南 · 材質',
    en: 'Buying guide · Materials',
    ja: '購入ガイド · 素材',
  },
  h1: {
    zh: '乳膠、PU、PI:安全套有咩唔同?',
    en: 'Latex, PU, PI: what is actually different between them',
    ja: 'ラテックス、PU、PI:何が違うのか',
  },
  title: {
    zh: '乳膠 vs PU vs PI 安全套 · 材質比較 · 過敏 · 潤滑液 · T-ZERO 第九感',
    en: 'Latex vs PU vs PI Condoms · Material Guide · Allergy · Lubricants · T-ZERO NINTH SENSE',
    ja: 'ラテックス・PU・PI コンドーム比較 · 素材ガイド · アレルギー · 潤滑剤 · T-ZERO 第九感',
  },
  description: {
    zh: '安全套材質比較:天然乳膠、PU(聚氨酯)、PI(聚異戊烯)有咩分別?邊啲適合乳膠過敏?油性潤滑液會點樣整壞乳膠?一頁睇晒。',
    en: 'Latex vs PU vs PI condoms explained: the difference between natural rubber, polyurethane and polyisoprene, who should avoid latex, and why oil-based lubricant ruins a latex condom.',
    ja: 'ラテックス・PU・PI・コンドームの違いを解説。天然ゴム过身者、オイル系潤滑剤がラテックスを壊す理由まで。',
  },
  lead: {
    zh: '盒上寫住「乳膠」兩個字,好多人就直接放低。但如果你對乳膠敏感,或者想知點解有啲安全套貴咁多,答案就喺呢兩個字裡面。',
    en: 'Most people read "latex" on the box and stop there. But if you react to latex, or you have wondered why one condom costs twice another, the answer is in that word.',
    ja: '「ラテックス」と書かれた箱を、大部分の人はそこで読み終えます。しかしラテックスに反応する場合や、値段差の理由が知りたい場合は、その2文字に答えがあります。',
  },

  sections: [
    {
      id: 'three',
      h2: {
        zh: '三種主要材質',
        en: 'The three materials you will meet',
        ja: '出会う3つの素材',
      },
      blocks: [
        {
          t: 'p',
          text: {
            zh: '安全套嘅薄膜主要有三種做法。天然乳膠佔咗全球九成以上嘅用量;PU 同 PI 就係為咗兩個問題而存在:乳膠過敏,同埋傳熱。',
            en: 'Condom films come in three main kinds. Natural rubber latex accounts for more than nine out of every ten condoms sold. PU and PI exist to solve two problems: latex allergy, and heat transfer.',
            ja: 'コンドームの膜は主に3種類です。天然ゴムラテックスが世界全体の9割以上を占めます。PUとPIは、ラテックスアレルギーと熱伝導という2つの問題のために存在しています。',
          },
        },
        {
          t: 'table',
          head: [
            { zh: '材質', en: 'Material', ja: '素材' },
            { zh: '伸展度', en: 'Stretch', ja: '伸び' },
            { zh: '傳熱', en: 'Heat', ja: '熱の伝わり' },
            { zh: '含乳膠蛋白', en: 'Latex protein', ja: 'ラテックス蛋白' },
            { zh: '一般價位', en: 'Price', ja: '価格' },
            { zh: '適合邊啲人', en: 'Who it suits', ja: '向いている人' },
          ],
          rows: [
            [
              {
                zh: '天然乳膠 (natural rubber latex)',
                en: 'Natural rubber latex',
                ja: '天然ゴムラテックス',
              },
              { zh: '最高,最貼身', en: 'Highest, closest fit', ja: '最も伸び、密着' },
              { zh: '中等', en: 'Moderate', ja: '普通' },
              { zh: '有', en: 'Yes', ja: 'あり' },
              { zh: '最平', en: 'Lowest', ja: '最も安い' },
              {
                zh: '大部分人嘅首選',
                en: 'The first choice for most people',
                ja: 'ほとんどの人の第一選択',
              },
            ],
            [
              {
                zh: 'PU 聚氨酯 (polyurethane)',
                en: 'PU (polyurethane)',
                ja: 'PU（ポリウレタン）',
              },
              { zh: '中等,較少回彈', en: 'Moderate, less elastic', ja: '普通、伸びがやや劣る' },
              { zh: '最好', en: 'Best', ja: '最も良い' },
              { zh: '冇', en: 'No', ja: 'なし' },
              { zh: '較貴', en: 'Higher', ja: 'やや高い' },
              {
                zh: '乳膠過敏,或者想多啲體溫',
                en: 'Latex allergy, or you want more warmth',
                ja: 'ラテックスアレルギー、体温を感じたい人',
              },
            ],
            [
              {
                zh: 'PI 聚異戊烯 (polyisoprene)',
                en: 'PI (polyisoprene)',
                ja: 'PI（ポリイソプレン）',
              },
              { zh: '高,同乳膠好接近', en: 'High, close to latex', ja: '高い、ラテックスに近い' },
              { zh: '好', en: 'Good', ja: '良い' },
              { zh: '冇', en: 'No', ja: 'なし' },
              { zh: '最貴', en: 'Highest', ja: '最も高い' },
              {
                zh: '乳膠過敏,但想留住乳膠嘅觸感',
                en: 'Latex allergy, but you want the feel of latex',
                ja: 'アレルギーだが、ラテックスの感触を残したい人',
              },
            ],
          ],
        },
        {
          t: 'p',
          text: {
            zh: '仲有第四種叫 TPE(熱塑性彈性體),價錢平、冇乳膠,但觸感同伸展性都冇咁好,通常用喺入門或者旅行裝。',
            en: 'There is a fourth: TPE, thermoplastic elastomer. It is cheap and latex-free, but the feel and the stretch are not as good, so it usually turns up in entry-level or travel packs.',
            ja: '4つ目にTPE（熱可塑性弾性体）があります。安価でラテックスは含みませんが、感触と伸びは劣り、エントリーモデルや旅行用に使われます。',
          },
        },
      ],
    },
    {
      id: 'allergy',
      h2: {
        zh: '乳膠過敏:點樣知道自己係唔係',
        en: 'Latex allergy: how to tell if you have it',
        ja: 'ラテックスアレルギー:自分が該当するか',
      },
      blocks: [
        {
          t: 'p',
          text: {
            zh: '乳膠過敏係對乳膠蛋白嘅即時免疫反應,通常喺接觸之後幾分鐘至一個鐘內出現。症狀可以係紅痕、痕癢、腫脹;少數人會有喘、面部或者喉嚨腫脹。喺一般人群中,即時型乳膠過敏嘅比例大約係 1 至 3 個百分比,族群同地區之間會有差異。',
            en: 'Latex allergy is an immediate immune reaction to the proteins in latex, usually starting minutes to an hour after contact. It shows as redness, itching and swelling; some people get wheeze, or swelling of the face or throat. In the general population, immediate latex allergy affects roughly one to three per cent, and it varies by group and by region.',
            ja: 'ラテックスアレルギーは、ラテックスに含まれる蛋白質に対する即時型免疫反応で、通常は接触から数分〜1時間以内に現れます。赤み、瘙痒、腫れが主で、息苦しさや顔・喉の腫れを起こす場合もあります。一般人群中での即時型ラテックスアレルギーは約1〜3％で、集団や地域によって差があります。',
          },
        },
        {
          t: 'note',
          title: {
            zh: '「Latex-free」唔一定等於冇乳膠',
            en: '"Latex-free" does not always mean no latex',
            ja: '「ラテックスフリー」は必ず乳テックスなしを意味しない',
          },
          text: {
            zh: '有啲標榜 non-latex 嘅產品,係用羊腸膜做,羊腸膜一樣含天然乳膠蛋白。真正嘅選擇係睇成份表:搵 "polyurethane" 或 "polyisoprene",同埋確認冇 "natural rubber latex"。',
            en: 'Some products labelled non-latex are made from lamb membrane, and lamb membrane carries the same latex proteins. The real test is the ingredient list: look for "polyurethane" or "polyisoprene", and confirm that "natural rubber latex" is absent.',
            ja: '「non-latex」とある商品には、羊腸膜を使ったものがあります。羊腸膜にも天然ラテックス蛋白質が含まれます。確実な判断は成分表示です。「polyurethane」または「polyisoprene」とあり、「natural rubber latex」がないことを確認してください。',
          },
        },
      ],
    },
    {
      id: 'lube',
      h2: {
        zh: '潤滑液:安全套最常見嘅「失效」原因',
        en: 'Lubricants: the most common way a condom fails',
        ja: '潤滑剤: コンドームが最も壊れやすい理由',
      },
      blocks: [
        {
          t: 'p',
          text: {
            zh: '安全套破裂嘅原因,通常唔係質地差,而係潤滑液唔啱。乳膠同大部分 PU 遇油會膨脹、變得脆弱,一拉就斷,而且斷嘅時候未必即刻發現。',
            en: 'When a condom tears, the film is usually not at fault; the lubricant is. Latex, and most polyurethane, swell and weaken when they meet oil. The condom then tears under a pull that it would easily have survived when dry.',
            ja: 'コンドームが破れるとき、原因は通常フィルムではなく潤滑剤です。ラテックスと多くのPUは油に触れると膨潤して弱くなり、乾いていれば耐えられる力で破れます。',
          },
        },
        {
          t: 'ul',
          items: [
            {
              zh: '**安全**:水性(water-based)同矽性(silicone-based)潤滑液。',
              en: '**Safe:** water-based and silicone-based lubricants.',
              ja: '**安全:** 水ベースとシリコンベースの潤滑剤。',
            },
            {
              zh: '**唔安全**:椰子油、橄欖油、凡士林(petroleum jelly)、BB 油、潤膚露、髮油。',
              en: '**Not safe:** coconut oil, olive oil, petroleum jelly, baby oil, body lotion, hair oil.',
              ja: '**危険:** ココナッツオイル、オリーブオイル、ベビーオイル、ボディローション、ヘアオイル、そして石油系（ペトロールタムなど）。',
            },
          ],
        },
        {
          t: 'p',
          text: {
            zh: '大部分安全套本身已經有潤滑液,唔需要再加。如果真係需要加,揀水性或者矽性就唔會出事。包裝背面通常會印明建議用邊一款。',
            en: 'Most condoms come with lubricant already on them and need nothing added. If you do add more, a water-based or silicone-based product is the safe choice. The back of the pack usually tells you which one the manufacturer recommends.',
            ja: 'ほとんどのコンドームには最初から潤滑剤が付いています。追加する場合も、水ベースかシリコンベースなら問題ありません。箱の裏に推奨する潤滑剤が書かれています。',
          },
        },
        {
          t: 'note',
          title: {
            zh: '如果係 PU 安全套',
            en: 'If your condom is PU',
            ja: 'PUコンドームの場合',
          },
          text: {
            zh: '部分矽性潤滑液會令 PU 變得更脆,包裝上會寫明建議用水性。有啲品牌會直接印「使用水性潤滑液」。睇包裝最快。',
            en: 'Some silicone-based lubricants make polyurethane brittle, and the pack says to use a water-based one instead. Some brands print "use with water-based lubricant" outright. Reading the pack is the quickest answer.',
            ja: '一部のシリコンベース潤滑剤はPUを脆くします。箱には水ベースの併用を推奨しているものもあり、箱を読むのが確実です。',
          },
        },
      ],
    },
    {
      id: 'storage',
      h2: {
        zh: '點樣存放,先至唔會太快老化',
        en: 'How to store it so it does not age early',
        ja: '劣化しない储存方法',
      },
      blocks: [
        {
          t: 'ul',
          items: [
            {
              zh: '放喺陰涼乾爽嘅地方,唔好長期擺喺車上、窗邊或者太陽曬到嘅地方。',
              en: 'Keep it somewhere cool and dry, and not in a car, a window ledge, or anywhere the sun reaches it.',
              ja: '涼しく乾燥した場所に保管し、車内や窓際、日が当たる場所は避けてください。',
            },
            {
              zh: '唔好長期塞喺銀包。銀包嘅體溫同摩擦會令乳膠提早老化。',
              en: 'Do not keep it in a wallet for long. The body heat and the friction in a wallet make latex age early.',
              ja: '財布に長く入れないでください。体温と摩擦でラテックスは早く劣化します。',
            },
            {
              zh: '睇清楚有效期,過咗期就唔好再用,就算未開封亦一樣。',
              en: 'Check the expiry date. After it, do not use the condom, even if the pack is unopened.',
              ja: '有効期限を確認してください。切れていれば、開封していないものでも使いません。',
            },
            {
              zh: '一次過唔好買太多。安全套唔會愈擺愈耐,反而係愈新鮮愈好。',
              en: 'Do not buy too many at once. Condoms do not keep better with age; fresher is better.',
              ja: '一度に多く買いすぎないでください。保存しても長くはなりません。新しいものを選んでください。',
            },
          ],
        },
      ],
    },
    {
      id: 'tzero',
      h2: {
        zh: 'T-ZERO 第九感用咩材質',
        en: 'What T-ZERO NINTH SENSE is made of',
        ja: 'T-ZERO 第九感の素材',
      },
      blocks: [
        {
          t: 'p',
          text: {
            zh: 'T-ZERO 第九感全線採用天然乳膠薄膜,日本工藝製造,每一片都經電子檢漏測試,先至出廠。潤滑液含玻尿酸,以水性為基礎,喺同一片上均勻塗佈,所以唔需要另外加潤滑液。',
            en: 'Every T-ZERO NINTH SENSE condom uses a natural rubber latex film, made to Japanese standards, and every single one is electronically tested for holes before it leaves the factory. The lubricant contains hyaluronic acid and is water-based, and it is spread evenly over the film, so there is nothing to add.',
            ja: 'T-ZERO 第九感は全シリーズ天然ゴムラテックスの膜を使用し、日本の技術基準で製造しています。1枚ずつ電子的な漏れ検査を通して出荷しています。潤滑剤はヒアルロン酸を含む水ベースで、膜に均一に塗布されるため、別途追加する必要はありません。',
          },
        },
        {
          t: 'p',
          text: {
            zh: '想知多啲保濕成分有咩作用,可以睇[玻尿酸究竟係咩](guide-hyaluronic.html);想知道唔同紋路嘅分別,就睇[紋路種類](guide-texture.html)。',
            en: 'To know what the hyaluronic acid in the lubricant actually does, read [what hyaluronic acid really is](guide-hyaluronic.html). To see how the finishes differ, read [the texture guide](guide-texture.html).',
            ja: '潤滑剤中のヒアルロン酸がどんな働きをするかは[ヒアルロン酸とは](guide-hyaluronic.html)を、テクスチャーの違いは[テクスチャーの種類](guide-texture.html)をご覧ください。',
          },
        },
      ],
    },
  ],

  faq: [
    {
      q: {
        zh: '「latex-free」係咪就一定唔會過敏?',
        en: 'Does "latex-free" guarantee no allergy?',
        ja: '「ラテックスフリー」なら必ずアレルギーにならない？',
      },
      a: {
        zh: '唔一定。部分品牌嘅 non-latex 產品仍然使用天然橡膠(例如羊腸膜),一樣含乳膠蛋白。睇成份表最穩陣:確認有 "polyurethane" 或 "polyisoprene",而且冇 "natural rubber latex"。',
        en: 'Not necessarily. Some non-latex products are still made from natural rubber, such as lamb membrane, and they carry the same proteins. The ingredient list is the reliable answer: look for "polyurethane" or "polyisoprene", and confirm that "natural rubber latex" is absent.',
        ja: '必ずしもそうではありません。「non-latex」とある商品でも天然ゴム（羊腸膜など）由来のものはあり、同じ蛋白質を含みます。成分表示が確実です。「polyurethane」か「polyisoprene」があり、「natural rubber latex」がないことを確認してください。',
      },
    },
    {
      q: {
        zh: '油性潤滑液係咪一定唔安全?',
        en: 'Is oil-based lubricant always unsafe?',
        ja: 'オイルベース潤滑剤は必ず危険？',
      },
      a: {
        zh: '對乳膠同大部分 PU 安全套嚟講,係。油會令乳膠膨脹、變得易斷。如果你習慣用椰子油或者凡士林,換返水性或者矽性就解決到。',
        en: 'With latex and with most PU condoms, yes. Oil makes latex swell and tear easily. If you normally use coconut oil or petroleum jelly, switching to a water-based or silicone-based product solves it.',
        ja: 'ラテックスと多くのPUではそうです。油はラテックスを膨潤させ、破れやすくします。ココナッツオイルやペトロールタムを使っているなら、水ベースやシリコンベースに替えるだけで解決します。',
      },
    },
    {
      q: {
        zh: '我對乳膠敏感,應該點做?',
        en: 'What should I do if I react to latex?',
        ja: 'ラテックスに反応する場合、どうすれば？',
      },
      a: {
        zh: '紅、痕、腫多數喺接觸後短時間出現,轉用 PU 或者 PI 通常已經足夠。但如果有喘、面部或者喉嚨腫脹,唔好只係轉材質,應該即刻求醫。',
        en: 'Redness, itching and swelling usually appear shortly after contact, and switching to PU or PI is usually enough. But if you wheeze, or your face or throat swells, that is not a material problem to solve on your own — get medical help straight away.',
        ja: '赤み、瘙痒、腫れは通常すぐ現れ、PUやPIに切り替えれば解決します。ただし息苦しさや顔・喉の腫れがある場合は、素材だけの問題ではありません。すぐに医療機関へ相談してください。',
      },
    },
  ],

  related: ['guide-texture.html', 'guide-hyaluronic.html', 'product-ultra-thin.html', 'product-extra-lub.html'],
};
