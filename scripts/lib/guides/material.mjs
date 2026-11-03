/* ===========================================================
   guides/material.mjs — latex vs PU vs PI.

   What the box does not tell you: what the film is made of,
   whether it can carry heat, and what it does when it meets
   the wrong lubricant.

   The Chinese is written Chinese — the way a shop would put
   it on a shelf, not the way it is spoken.

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
    zh: '乳膠、PU、PI 有什麼分別,以及如何配合潤滑液。',
    en: 'Latex, PU and PI, and which lubricant to use.',
    ja: 'ラテックス、PU、PIの違いと、潤滑剤の選び方。',
  },
  eyebrow: {
    zh: '選購指南 · 材質',
    en: 'Buying guide · Materials',
    ja: '購入ガイド · 素材',
  },
  h1: {
    zh: '乳膠、PU、PI:安全套有什麼不同?',
    en: 'Latex, PU, PI: what is actually different between them',
    ja: 'ラテックス、PU、PI:何が違うのか',
  },
  title: {
    zh: '乳膠 vs PU vs PI 安全套 · 材質比較 · 過敏 · 潤滑液 · T-ZERO 第九感',
    en: 'Latex vs PU vs PI Condoms · Material Guide · Allergy · Lubricants · T-ZERO NINTH SENSE',
    ja: 'ラテックス・PU・PI コンドーム比較 · 素材ガイド · アレルギー · 潤滑剤 · T-ZERO 第九感',
  },
  description: {
    zh: '安全套材質比較:天然乳膠、PU(聚氨酯)、PI(聚異戊烯)有什麼分別?哪些適合乳膠過敏者?油性潤滑液會如何損壞乳膠?一頁看完。',
    en: 'Latex vs PU vs PI condoms explained: the difference between natural rubber, polyurethane and polyisoprene, who should avoid latex, and why oil-based lubricant ruins a latex condom.',
    ja: 'ラテックス・PU・PI・コンドームの違いを解説。天然ゴム过身者、オイル系潤滑剤がラテックスを壊す理由まで。',
  },
  lead: {
    zh: '盒上印有「乳膠」兩個字,很多人便不再細看。但如果你對乳膠敏感,或者想知道為何有些安全套貴上一倍,答案就在這兩個字裏。',
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
            zh: '安全套的薄膜主要有三種。天然乳膠佔全球用量九成以上;PU 與 PI 的存在,是為了解決兩個問題:乳膠過敏,以及傳熱。',
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
            { zh: '適合哪些人', en: 'Who it suits', ja: '向いている人' },
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
              { zh: '最低', en: 'Lowest', ja: '最も安い' },
              {
                zh: '大部分人的首選',
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
              { zh: '中等,彈性較低', en: 'Moderate, less elastic', ja: '普通、伸びがやや劣る' },
              { zh: '最好', en: 'Best', ja: '最も良い' },
              { zh: '沒有', en: 'No', ja: 'なし' },
              { zh: '較貴', en: 'Higher', ja: 'やや高い' },
              {
                zh: '乳膠過敏,或希望感受較多體溫',
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
              { zh: '高,與乳膠十分接近', en: 'High, close to latex', ja: '高い、ラテックスに近い' },
              { zh: '良好', en: 'Good', ja: '良い' },
              { zh: '沒有', en: 'No', ja: 'なし' },
              { zh: '最貴', en: 'Highest', ja: '最も高い' },
              {
                zh: '乳膠過敏,但希望保留乳膠的觸感',
                en: 'Latex allergy, but you want the feel of latex',
                ja: 'アレルギーだが、ラテックスの感触を残したい人',
              },
            ],
          ],
        },
        {
          t: 'p',
          text: {
            zh: '另有第四種,稱為 TPE(熱塑性彈性體),價格便宜、不含乳膠,但觸感與伸展性均較遜色,通常用於入門或旅行裝。',
            en: 'There is a fourth: TPE, thermoplastic elastomer. It is cheap and latex-free, but the feel and the stretch are not as good, so it usually turns up in entry-level or travel packs.',
            ja: '4つ目にTPE（熱可塑性弾性体）があります。安価でラテックスは含みませんが、感触と伸びは劣り、エントリーモデルや旅行用に使われます。',
          },
        },
      ],
    },
    {
      id: 'allergy',
      h2: {
        zh: '乳膠過敏:如何判斷自己是否屬於此類',
        en: 'Latex allergy: how to tell if you have it',
        ja: 'ラテックスアレルギー:自分が該当するか',
      },
      blocks: [
        {
          t: 'p',
          text: {
            zh: '乳膠過敏是對乳膠蛋白的即時免疫反應,通常在接觸後數分鐘至一小時內出現。症狀可以是紅痕、痕癢、腫脹;少數人會出現氣促,或面部、喉嚨腫脹。在一般人群中,即時型乳膠過敏的比例約為 1 至 3 個百分比,不同族群與地區之間會有差異。',
            en: 'Latex allergy is an immediate immune reaction to the proteins in latex, usually starting minutes to an hour after contact. It shows as redness, itching and swelling; some people get wheeze, or swelling of the face or throat. In the general population, immediate latex allergy affects roughly one to three per cent, and it varies by group and by region.',
            ja: 'ラテックスアレルギーは、ラテックスに含まれる蛋白質に対する即時型免疫反応で、通常は接触から数分〜1時間以内に現れます。赤み、瘙痒、腫れが主で、息苦しさや顔・喉の腫れを起こす場合もあります。一般人群中での即時型ラテックスアレルギーは約1〜3％で、集団や地域によって差があります。',
          },
        },
        {
          t: 'note',
          title: {
            zh: '「Latex-free」不一定等於不含乳膠',
            en: '"Latex-free" does not always mean no latex',
            ja: '「ラテックスフリー」は必ず乳テックスなしを意味しない',
          },
          text: {
            zh: '部分標榜 non-latex 的產品採用羊腸膜製造,羊腸膜同樣含有天然乳膠蛋白。真正的判斷方法是查看成分表:找 "polyurethane" 或 "polyisoprene",並確認沒有 "natural rubber latex"。',
            en: 'Some products labelled non-latex are made from lamb membrane, and lamb membrane carries the same latex proteins. The real test is the ingredient list: look for "polyurethane" or "polyisoprene", and confirm that "natural rubber latex" is absent.',
            ja: '「non-latex」とある商品には、羊腸膜を使ったものがあります。羊腸膜にも天然ラテックス蛋白質が含まれます。確実な判断は成分表示です。「polyurethane」または「polyisoprene」とあり、「natural rubber latex」がないことを確認してください。',
          },
        },
      ],
    },
    {
      id: 'lube',
      h2: {
        zh: '潤滑液:安全套最常見的「失效」原因',
        en: 'Lubricants: the most common way a condom fails',
        ja: '潤滑剤: コンドームが最も壊れやすい理由',
      },
      blocks: [
        {
          t: 'p',
          text: {
            zh: '安全套破裂的原因,通常不是質地不良,而是潤滑液不合適。乳膠與大部分 PU 遇油會膨脹、變得脆弱,一拉就斷,而且斷裂之時未必能即時察覺。',
            en: 'When a condom tears, the film is usually not at fault; the lubricant is. Latex, and most polyurethane, swell and weaken when they meet oil. The condom then tears under a pull that it would easily have survived when dry.',
            ja: 'コンドームが破れるとき、原因は通常フィルムではなく潤滑剤です。ラテックスと多くのPUは油に触れると膨潤して弱くなり、乾いていれば耐えられる力で破れます。',
          },
        },
        {
          t: 'ul',
          items: [
            {
              zh: '**安全**:水性(water-based)與矽性(silicone-based)潤滑液。',
              en: '**Safe:** water-based and silicone-based lubricants.',
              ja: '**安全:** 水ベースとシリコンベースの潤滑剤。',
            },
            {
              zh: '**不安全**:椰子油、橄欖油、凡士林(petroleum jelly)、BB 油、潤膚露、髮油。',
              en: '**Not safe:** coconut oil, olive oil, petroleum jelly, baby oil, body lotion, hair oil.',
              ja: '**危険:** ココナッツオイル、オリーブオイル、ベビーオイル、ボディローション、ヘアオイル、そして石油系（ペトロールタムなど）。',
            },
          ],
        },
        {
          t: 'p',
          text: {
            zh: '大部分安全套本身已有潤滑液,無須再添加。如果確實需要添加,選擇水性或矽性即不會出事。包裝背面通常印有建議使用的種類。',
            en: 'Most condoms come with lubricant already on them and need nothing added. If you do add more, a water-based or silicone-based product is the safe choice. The back of the pack usually tells you which one the manufacturer recommends.',
            ja: 'ほとんどのコンドームには最初から潤滑剤が付いています。追加する場合も、水ベースかシリコンベースなら問題ありません。箱の裏に推奨する潤滑剤が書かれています。',
          },
        },
        {
          t: 'note',
          title: {
            zh: '如果使用 PU 安全套',
            en: 'If your condom is PU',
            ja: 'PUコンドームの場合',
          },
          text: {
            zh: '部分矽性潤滑液會令 PU 變得更脆,包裝上會註明建議使用水性。部分品牌會直接印上「請使用水性潤滑液」。查看包裝是最快的方法。',
            en: 'Some silicone-based lubricants make polyurethane brittle, and the pack says to use a water-based one instead. Some brands print "use with water-based lubricant" outright. Reading the pack is the quickest answer.',
            ja: '一部のシリコンベース潤滑剤はPUを脆くします。箱には水ベースの併用を推奨しているものもあり、箱を読むのが確実です。',
          },
        },
      ],
    },
    {
      id: 'storage',
      h2: {
        zh: '如何存放,才不會過早老化',
        en: 'How to store it so it does not age early',
        ja: '劣化しない保存方法',
      },
      blocks: [
        {
          t: 'ul',
          items: [
            {
              zh: '存放於陰涼乾爽之處,不要長期放置於車內、窗邊,或陽光直接照射的位置。',
              en: 'Keep it somewhere cool and dry, and not in a car, a window ledge, or anywhere the sun reaches it.',
              ja: '涼しく乾燥した場所に保管し、車内や窓際、日が当たる場所は避けてください。',
            },
            {
              zh: '不要長期收在銀包內。銀包的體溫與摩擦會令乳膠提早老化。',
              en: 'Do not keep it in a wallet for long. The body heat and the friction in a wallet make latex age early.',
              ja: '財布に長く入れないでください。体温と摩擦でラテックスは早く劣化します。',
            },
            {
              zh: '看清有效期,過期後便不應再使用,即使未曾開封亦然。',
              en: 'Check the expiry date. After it, do not use the condom, even if the pack is unopened.',
              ja: '有効期限を確認してください。切れていれば、開封していないものでも使いません。',
            },
            {
              zh: '不宜一次購買太多。安全套不會因存放而更耐,反而愈新鮮愈好。',
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
        zh: 'T-ZERO 第九感採用什麼材質',
        en: 'What T-ZERO NINTH SENSE is made of',
        ja: 'T-ZERO 第九感の素材',
      },
      blocks: [
        {
          t: 'p',
          text: {
            zh: 'T-ZERO 第九感全線採用天然乳膠薄膜,按日本工藝製造,每一片均通過電子檢漏測試後才出廠。潤滑液含玻尿酸,以水性為基礎,均勻塗佈在同一片上,因此無須另外添加潤滑液。',
            en: 'Every T-ZERO NINTH SENSE condom uses a natural rubber latex film, made to Japanese standards, and every single one is electronically tested for holes before it leaves the factory. The lubricant contains hyaluronic acid and is water-based, and it is spread evenly over the film, so there is nothing to add.',
            ja: 'T-ZERO 第九感は全シリーズ天然ゴムラテックスの膜を使用し、日本の技術基準で製造しています。1枚ずつ電子的な漏れ検査を通して出荷しています。潤滑剤はヒアルロン酸を含む水ベースで、膜に均一に塗布されるため、別途追加する必要はありません。',
          },
        },
        {
          t: 'p',
          text: {
            zh: '如想進一步了解保濕成分的作用,可閱讀[玻尿酸究竟是什麼](guide-hyaluronic.html);如想了解不同紋路的分別,可閱讀[紋路種類](guide-texture.html)。',
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
        zh: '「latex-free」是否一定不會過敏?',
        en: 'Does "latex-free" guarantee no allergy?',
        ja: '「ラテックスフリー」なら必ずアレルギーにならない？',
      },
      a: {
        zh: '不一定。部分品牌的 non-latex 產品仍然使用天然橡膠(例如羊腸膜),同樣含有乳膠蛋白。查看成分表最為可靠:確認有 "polyurethane" 或 "polyisoprene",而且沒有 "natural rubber latex"。',
        en: 'Not necessarily. Some non-latex products are still made from natural rubber, such as lamb membrane, and they carry the same proteins. The ingredient list is the reliable answer: look for "polyurethane" or "polyisoprene", and confirm that "natural rubber latex" is absent.',
        ja: '必ずしもそうではありません。「non-latex」とある商品でも天然ゴム（羊腸膜など）由来のものはあり、同じ蛋白質を含みます。成分表示が確実です。「polyurethane」か「polyisoprene」があり、「natural rubber latex」がないことを確認してください。',
      },
    },
    {
      q: {
        zh: '油性潤滑液是否一定不安全?',
        en: 'Is oil-based lubricant always unsafe?',
        ja: 'オイルベース潤滑剤は必ず危険？',
      },
      a: {
        zh: '對乳膠與大部分 PU 安全套而言,是。油會令乳膠膨脹、容易撕裂。若你慣常使用椰子油或凡士林,改用水性或矽性即可解決。',
        en: 'With latex and with most PU condoms, yes. Oil makes latex swell and tear easily. If you normally use coconut oil or petroleum jelly, switching to a water-based or silicone-based product solves it.',
        ja: 'ラテックスと多くのPUではそうです。油はラテックスを膨潤させ、破れやすくします。ココナッツオイルやペトロールタムを使っているなら、水ベースやシリコンベースに替えるだけで解決します。',
      },
    },
    {
      q: {
        zh: '我對乳膠敏感,應該怎麼做?',
        en: 'What should I do if I react to latex?',
        ja: 'ラテックスに反応する場合、どうすれば？',
      },
      a: {
        zh: '紅疹、痕癢、腫脹多數在接觸後短時間內出現,改用 PU 或 PI 通常已經足夠。但如果有氣促,或面部、喉嚨腫脹,便不要只更換材質,應立即求醫。',
        en: 'Redness, itching and swelling usually appear shortly after contact, and switching to PU or PI is usually enough. But if you wheeze, or your face or throat swells, that is not a material problem to solve on your own — get medical help straight away.',
        ja: '赤み、瘙痒、腫れは通常すぐ現れ、PUやPIに切り替えれば解決します。ただし息苦しさや顔・喉の腫れがある場合は、素材だけの問題ではありません。すぐに医療機関へ相談してください。',
      },
    },
  ],

  related: ['guide-texture.html', 'guide-hyaluronic.html', 'product-ultra-thin.html', 'product-extra-lub.html'],
};
