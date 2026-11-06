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
    zh: '【安全套材質比較】乳膠 vs PU 分別在哪？',
    en: 'Condom material comparison: latex vs PU, and what the difference is',
    ja: '【コンドームの素材比較】ラテックス vs PUの違いは？',
  },
  title: {
    zh: '【安全套材質比較】乳膠 vs PU 分別在哪？',
    en: 'Condom material comparison: latex vs PU, and what the difference is',
    ja: '【コンドームの素材比較】ラテックス vs PUの違いは？',
  },
  description: {
    zh: '從彈性與傳熱挑選最適合你的親密防護',
    en: 'Pick the material that suits you — compared by elasticity and by how well it carries heat.',
    ja: '伸縮性と熱の伝わり方から、自分に合ったものを選びましょう。',
  },
  lead: {
    zh: '從彈性與傳熱挑選最適合你的親密防護',
    en: 'Pick the material that suits you — compared by elasticity and by how well it carries heat.',
    ja: '伸縮性と熱の伝わり方から、自分に合ったものを選びましょう。',
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
            zh: '安全套的薄膜主要有三種。天然乳膠佔全球用量九成以上;PU 與 PI 的存在,是為了解決乳膠過敏,以及讓追求更極速傳熱的人多一個選擇。',
            en: 'Condom films come in three main kinds. Natural rubber latex accounts for more than nine out of every ten condoms sold. PU and PI exist for two reasons: latex allergy, and giving people who want faster heat transfer a choice.',
            ja: 'コンドームの膜は主に3種類です。天然ゴムラテックスが世界全体の9割以上を占めます。PUとPIが存在するのは、ラテックスアレルギーと、さらに速い熱伝導を好む人のための選択肢からです。',
          },
        },
        {
          t: 'table',
          head: [
            { zh: '材質', en: 'Material', ja: '素材' },
            { zh: '伸展度', en: 'Stretch', ja: '伸び' },
            { zh: '傳熱', en: 'Heat', ja: '熱の伝わり' },
            { zh: '親密包裹感', en: 'Fit and feel', ja: '密着感' },
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
              {
                zh: '極高,完美包裹不滑落',
                en: 'Very high — wraps perfectly and will not slip',
                ja: '非常に高い。ぴったりと包み、ずれ落ちない',
              },
              { zh: '自然體溫傳導', en: 'Natural body heat', ja: '体温を自然に伝導' },
              {
                zh: '如第二層肌膚般服貼柔軟',
                en: 'Soft and close, like a second skin',
                ja: '第二の肌のように柔らかく密着',
              },
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
              {
                zh: '中等,彈性較低,容易有異物感或鬆脫',
                en: 'Moderate, less elastic — it can feel odd or work loose',
                ja: '普通。伸びがやや足りず、違和感やずれ落ちが出やすい',
              },
              { zh: '極速傳熱', en: 'Very fast heat transfer', ja: '熱が非常に速く伝わる' },
              { zh: '偏硬,形狀固定', en: 'Firmer, and it keeps its shape', ja: 'やや硬く、形を保つ' },
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
              {
                zh: '接近乳膠的柔軟度',
                en: 'Close to the softness of latex',
                ja: 'ラテックスに近い柔らかさ',
              },
              { zh: '沒有', en: 'No', ja: 'なし' },
              { zh: '最貴', en: 'Highest', ja: '最も高い' },
              {
                zh: '乳膠過敏,但希望保留乳膠的觸感',
                en: 'Latex allergy, but you want the feel of latex',
                ja: 'アレルギーだが、ラテックスらしい感触の人',
              },
            ],
          ],
        },
      ],
    },
    {
      id: 'allergy',
      h2: {
        zh: '如何選擇適合自己的材質？',
        en: 'How to choose the material that suits you',
        ja: '自分に合った素材の選び方',
      },
      blocks: [
        {
          t: 'p',
          text: {
            zh: '在醫學統計中，真正對天然乳膠產生嚴重免疫反應的人群比例極低（僅約 1% 至 3%）。許多人誤以為自己對乳膠「過敏」，其實往往是因為使用了傳統安全套中添加的化學添加劑、劣質香精，或是黏膩難清洗的工業矽油，因而導致私密肌膚出現紅痕或乾澀不適。如果您過去曾有不適經驗，不妨先確認是否為潤滑成分所致。若屬於極少數已被醫生確診為乳膠過敏的體質，則建議選用 PU 材質。',
            en: 'In the medical statistics the proportion of people who have a severe immune reaction to natural latex is very small — around one to three per cent. Many people think they are "allergic" to latex when what actually happened is the additives, the cheap fragrance or the clingy industrial silicone oil in an ordinary condom, which leaves the skin down there red, dry and uncomfortable. If you have had that experience before, it is worth checking first whether the lubricant was the cause. If you are one of the very few whose doctor has confirmed a latex allergy, then PU is the material to choose.',
            ja: '医学的な統計では、天然ラテックスに重い免疫反応を示す人の割合はきわめて小さく、1〜3％にとどまります。大部分の人が「ラテックスアレルギーだと思っていますが、実際には一般的なコンドームに含まれる化学的な添加剤、質の低い香料、洗い流しにくい工業用シリコンオイルが刺激になって、敏感肌に赤みや乾燥の不快感が生じているだけの場合があります。過去に不快感があった経験があれば、まずは潤滑成分が原因かどうかを確認してみてください。医師にラテックスアレルギーと診断された、ごく限られた患者さんには、PU素材を選ぶことをおすすめします。',
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
          t: 'note',
          title: {
            zh: '💡 為什麼 T-ZERO 第九感堅持選用「日本工藝天然乳膠」？',
            en: '💡 Why T-ZERO NINTH SENSE insists on natural latex, made to Japanese standards',
            ja: '💡 なぜT-ZERO 第九感は「日本の工芸による天然ラテックス」を選ぶのか',
          },
          text: {
            zh: '市面上許多產品為了追求噱頭而採用無彈性的硬質 PU 塑料薄膜。然而，T-ZERO 團隊深知，一場完美的親密體驗，「貼合的延展性」與「持久的水潤度」才是關鍵。',
            en: 'Plenty of products reach for a hard, inelastic PU plastic film, because it makes a louder claim on the box. The T-ZERO team knows that a good experience comes down to two things: how well the film stretches to fit you, and how long the moisture lasts.',
            ja: '話題性のために、伸びのない硬いPUのプラスチックフィルムを使う商品が多くあります。しかしT-ZEROのチームは、完璧な親密な時間には「体にフィットする伸び」と「長く続くうるおい」が本質だと知っています。',
          },
        },
        {
          t: 'ul',
          items: [
            {
              zh: '**拋棄塑料感，回歸真觸感：** PU 材質本質上是塑料膜，缺乏彈性，容易在過程中產生異物感與摩擦不適。T-ZERO 堅持採用頂級天然乳膠，具備無可比擬的極高伸展度，能隨著您的身形完美延伸包裹，自然不拘束。',
              en: '**Leaving the plastic feel behind, and coming back to a real touch:** PU is, at heart, a plastic film. It has little stretch, so it can leave you feeling that something is there, and it rubs. T-ZERO uses top-grade natural latex instead, with an elasticity nothing else comes close to — it stretches and wraps to your shape, so it never feels restrictive.',
              ja: '**プラスチックの感触を捨て、本物の触感へ:** PUは本質的にプラスチックフィルムで、伸びに乏しく、使う間に違和感や摩擦の不快感が生じやすくなります。T-ZEROは最高級の天然ラテックスを用います。その伸びは比類がなく、身体に合わせてぴたりと包み、窮屈さを感じさせません。',
            },
            {
              zh: '**玻尿酸配方，徹底告別傳統乳膠痛點：** 許多人討厭乳膠安全套，是因為無法忍受傳統矽油的難聞氣味與洗不掉的黏膩感。T-ZERO 揚棄化學矽油，日本工藝製程中完美淡化橡膠氣味，並注入護膚級玻尿酸水性潤滑液。水潤清爽、長效鎖水不反乾，事後清水一沖即淨，將乳膠的舒適度提升至全新境界。',
              en: '**Hyaluronic acid, and the end of the usual complaints about latex:** People who dislike latex condoms usually cannot stand the smell of traditional silicone oil, or the sticky film it leaves behind that will not wash off. T-ZERO leaves chemical silicone oil out; the Japanese process takes the rubber smell away almost entirely, and the lubricant is water-based with skin-care-grade hyaluronic acid in it. Light and fresh, long-lasting without drying out, and it rinses away with plain water afterwards — which takes the comfort of latex to a new level.',
              ja: '**ヒアルロン酸配合で、従来のラテックスへの不満も解消:** ラテックスコンドームが嫌だという人の多くは、従来のシリコンオイルの匂いと、洗っても取れないべたつきが原因です。T-ZEROは化学的なシリコンオイルを使わず、日本の製造工程でゴム臭みをほぼ消し、肌にやさしい玻尿酸入りの水性潤滑剤を入れています。清爽で、持続しても乾かず、事後は水でさっと洗い流せます。ラテックスの快適さを一段引き上げます。',
            },
          ],
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
