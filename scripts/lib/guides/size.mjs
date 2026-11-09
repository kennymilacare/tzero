/* ===========================================================
   guides/size.mjs — the size guide.

   The one number on a condom box that actually tells you
   whether it will fit: the nominal width, in millimetres.
   It is half the erect circumference, so a box marked
   "52 ± 2" is telling you the circumference is about 104 mm.

   Three languages, one file. The build script picks the one
   it needs and writes the page out.

   The Chinese is written Chinese — the way a shop would put
   it on a shelf, not the way it is spoken.

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
    zh: '闊度對照表，以及量度自己的方法。',
    en: 'The width table, and how to measure yourself.',
    ja: '幅の表と、測り方の説明。',
  },
  eyebrow: {
    zh: '選購指南 · 尺碼',
    en: 'Buying guide · Size',
    ja: '購入ガイド · サイズ',
  },
  h1: {
    zh: '安全套尺碼表：看「闊度」就知道是否合適',
    en: 'Condom size chart: read the width and you know it fits',
    ja: 'コンドームのサイズ表：幅を読めば合うかどうかがわかる',
  },
  title: {
    zh: '安全套尺碼表 · 闊度對照 · 量度方法 · T-ZERO 第九感',
    en: 'Condom Size Chart · Nominal Width · How to Measure · T-ZERO NINTH SENSE',
    ja: 'コンドーム サイズ表 · 幅の目安 · 測り方 · T-ZERO 第九感',
  },
  description: {
    zh: '安全套尺碼表：說明「闊度」（mm）對應的周長，量度一次即可確定適合 S、M、L 抑或 XL。附常見尺碼對照表及 T-ZERO 第九感 4 款建議。',
    en: 'Condom size chart: what the nominal width in mm means, the common S/M/L/XL widths, and how to measure your own erect circumference in a minute.',
    ja: 'コンドームのサイズ表：幅（mm）と周長の関係、S/M/L/XLの目安、1分でできる自分の測り方と、T-ZERO各モデルの選択肢。',
  },
  lead: {
    zh: '盒上印有的「闊度」，是一盒安全套最重要的數字。它其實是勃起時周長的一半：闊度 52 mm，相當於約 10.4 公分的周長。看清楚這個數字，便不需要靠估計。',
    en: 'The nominal width on the box is the one number that decides whether a condom fits. It is half your erect circumference, so a width of 52 mm means a circumference of about 10.4 cm. Read that one number and there is nothing left to guess.',
    ja: '箱に書かれた「幅」が、コンドームが合うかどうかを決める数字です。勃起時の周長の半分で、幅52mmなら周長は約10.4cmになります。',
  },

  sections: [
    {
      id: 'measure',
      h2: {
        zh: '第一步：如何準確測量安全套闊度？',
        en: 'First: how to measure your width accurately',
        ja: 'まず、幅の正確な測り方',
      },
      blocks: [
        {
          t: 'p',
          text: {
            zh: '準備一條軟尺（或一條紙帶與筆），在充血勃起狀態下，測量局部最豐滿（最粗）的一圈周長。讓軟尺輕貼肌膚即可，切勿刻意勒緊，以免數據偏小。',
            en: 'Take a soft measuring tape, or a strip of paper and a pen. While fully erect, measure the circumference around the fullest, widest part. Let the tape rest against the skin without squeezing it, because squeezing gives you a smaller number than the real one.',
            ja: '柔らかなテープ、または紙とペンを用意します。完全に勃起した状態で、最も太い部分の周長を測ります。肌に沿着当てるだけにして、締めつけないでください。小さく測れてしまいます。',
          },
        },
        {
          t: 'p',
          text: {
            zh: '將測量得到的「周長（公分）」除以二，即為適合您的「安全套闊度（毫米 / mm）」。舉例來說：若測得周長為 10.5 公分，除以二後的闊度為 52.5 mm，即可完美對應外盒標示「52 ± 2 mm」的標準亞洲尺碼。',
            en: 'Divide the circumference you measured in centimetres by two and you have the width that will fit you, in millimetres. A circumference of 10.5 cm gives a width of 52.5 mm, which matches the "52 ± 2 mm" standard Asian size on the box.',
            ja: '測った周長（cm）を2で割ると、あなたに合う幅（mm）になります。周長10.5cmなら幅は52.5mm、箱に書かれた「52 ± 2 mm」の標準アジアサイズにちょうど合います。',
          },
        },
        {
          t: 'note',
          title: {
            zh: '💡 輕鬆測量的小貼士',
            en: '💡 Tips for an easy measurement',
            ja: '💡 簡単な測量のコツ',
          },
          text: {
            zh: '建議可在單獨居家或沐浴後進行，過程簡單且完全隱密。測量時順其自然即可，無須按壓或過度施力。男性身形與尺寸可能隨時間有輕微變化，建議每隔一段時間定期微調確認即可。',
            en: 'Do it at home on your own, or after a shower — it is simple and entirely private. Let the measurement happen on its own; there is no need to press or to apply force. Body shape and size can change slightly over time, so it is worth re-checking every so often and adjusting as needed.',
            ja: '一人で自宅、あるいはシャワーの後に行えば、簡単な操作で、完全にプライベートです。力を込めず、自然なまま測ってください。体型やサイズが少しずつ変わることがありますので、ときどき測り直して微調整するとよいです。',
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
            { zh: '闊度（mm）', en: 'Width (mm)', ja: '幅（mm）' },
            { zh: '對應周長', en: 'Circumference', ja: '対応周長' },
            { zh: '常見標示', en: 'Common label', ja: '一般的な表示' },
            { zh: '適合哪些人', en: 'Who it suits', ja: '向いている人' },
          ],
          rows: [
            [
              { zh: '44 ± 2', en: '44 ± 2', ja: '44 ± 2' },
              { zh: '約 8.8 cm', en: 'about 8.8 cm', ja: '約8.8cm' },
              { zh: 'S / 小號', en: 'S / Small', ja: 'S / スモール' },
              {
                zh: '身形較窄，或偏好窄身的貼合感',
                en: 'Narrower build, or you like a close fit',
                ja: '細身の場合、密着する感触を好む人',
              },
            ],
            [
              { zh: '49 ± 2', en: '49 ± 2', ja: '49 ± 2' },
              { zh: '約 9.8 cm', en: 'about 9.8 cm', ja: '約9.8cm' },
              { zh: 'M / 中號', en: 'M / Medium', ja: 'M / ミドル' },
              {
                zh: '最多人選用的標準尺碼',
                en: 'The standard size most people wear',
                ja: '最も一般的な標準サイズ',
              },
            ],
            [
              { zh: '54 ± 2', en: '54 ± 2', ja: '54 ± 2' },
              { zh: '約 10.8 cm', en: 'about 10.8 cm', ja: '約10.8cm' },
              { zh: 'L / 大號', en: 'L / Large', ja: 'L / ラージ' },
              {
                zh: '想減少緊迫感，或 M 碼感覺偏窄',
                en: 'You want less tension, or M feels tight',
                ja: '圧迫を減らしたい、Mが窮屈に感じる場合',
              },
            ],
            [
              { zh: '58 ± 2', en: '58 ± 2', ja: '58 ± 2' },
              { zh: '約 11.6 cm', en: 'about 11.6 cm', ja: '約11.6cm' },
              { zh: 'XL / 加大', en: 'XL / Extra large', ja: 'XL / 特大' },
              {
                zh: 'L 碼仍然感覺偏緊',
                en: 'L still feels tight',
                ja: 'Lでもまだ窮屈に感じる場合',
              },
            ],
            [
              { zh: '62 ± 2', en: '62 ± 2', ja: '62 ± 2' },
              { zh: '約 12.4 cm', en: 'about 12.4 cm', ja: '約12.4cm' },
              { zh: 'XXL / 特大', en: 'XXL / Extra extra large', ja: 'XXL / 超特大' },
              {
                zh: '需要更闊的空間、束縛感更少',
                en: 'You want more room and less restraint',
                ja: 'さらに余裕と開放感が必要な場合',
              },
            ],
          ],
        },
        {
          t: 'p',
          text: {
            zh: '香港發售的安全套，盒上通常印有闊度（例如「52±2」）；部分品牌只印 S / M / L。**印有闊度便以闊度為準**，因為同一個「S」可能是 44 mm，也可能是 47 mm。',
            en: 'Condoms sold in Hong Kong usually print the width on the box, such as "52±2", while some brands print only S / M / L. **When the width is printed, use the width**, because one "S" can be 44 mm and another 47 mm.',
            ja: '香港で販売されるコンドームは、箱に「52±2」のように幅が印刷されていることが多く、S / M / L だけを書くブランドもあります。**幅が書かれていれば幅を優先**してください。同じ「S」でも44mmの場合と47mmの場合があります。',
          },
        },
      ],
    },
    {
      id: 'between',
      h2: {
        zh: '介乎兩個尺碼之間：選擇較闊的尺碼',
        en: 'Between two sizes: take the wider one',
        ja: '2つのサイズの間なら：広い方を',
      },
      blocks: [
        {
          t: 'p',
          text: {
            zh: '如果量度結果剛好介乎兩級之間，通常選擇較闊的尺碼。窄於實際需要，陰莖會被勒緊，血液回流減少，反而容易變軟，亦會不適；過於寬闊則容易移位和滑出。',
            en: 'If you land exactly between two sizes, take the wider one. Too narrow constricts, which reduces blood flow and can make things soften, and it is uncomfortable. Too wide simply slips.',
            ja: 'ちょうど2つのサイズの間なら、広い方を選んでください。狭すぎると圧迫で血流が制限され、硬さを失ったり不快を感じたりします。広すぎるとずれ落ちてしまいます。',
          },
        },
        {
          t: 'ul',
          items: [
            {
              zh: '**戴得住、不勒、不滑落**，就是合適的尺碼。',
              en: 'A good fit stays on, does not pinch, and does not slip.',
              ja: '「しっかり装着し、締めつけず、ずれ落ちない」が正解です。',
            },
            {
              zh: '前端保留一點空間（約一個拇指闊），不要拉至實，這樣可以容納少量分泌物。',
              en: 'Leave a little space at the tip, about the width of a fingertip, so there is somewhere for the small amount of fluid that comes with an erection.',
              ja: '先端には親指ほどの中央を残してください。勃起時に出る少量の液を溜める場所が必要です。',
            },
            {
              zh: '如果戴上後感覺「剛好但略為寬鬆」，那就是合適的尺碼，不需要更換。',
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
        zh: 'T-ZERO 四款，哪一款適合你？',
        en: 'Which of the four T-ZERO styles is yours?',
        ja: 'T-ZERO 4種類のどれが自分に合っているか',
      },
      blocks: [
        {
          t: 'p',
          text: {
            zh: 'T-ZERO 第九感四款屬於同一闊度系列，分別在於超薄、加倍潤滑、特久與顆粒。[超薄裝](product-ultra-thin.html)最薄、最貼身，適合希望降低存在感的人；[加倍潤滑裝](product-extra-lub.html)潤滑液最多，適合容易乾澀的人；[特久裝](product-extended.html)較厚實；[顆粒裝](product-studded.html)帶有凸點紋路。',
            en: 'All four T-ZERO NINTH SENSE styles come in the same width family; what differs is the film and the finish. [Ultra Thin](product-ultra-thin.html) is the thinnest and the least noticeable. [Extra Lube](product-extra-lub.html) carries the most lubricant, for anyone who tends to run dry. [Extended](product-extended.html) is a thicker, sturdier film. [Studded](product-studded.html) has raised texture.',
            ja: 'T-ZERO 第九感の4種類は幅のレンジが同じで、膜の厚さと加工が異なります。[ウルトラシン](product-ultra-thin.html)は最も薄く、存在感が最も薄いです。[エクストラ潤滑](product-extra-lub.html)は潤滑剤が最も多く、乾きやすい方に。[エクステンド](product-extended.html)は丈夫な厚手。[スタッド](product-studded.html)は凸点加工です。',
          },
        },
        {
          t: 'p',
          text: {
            zh: '四款均有售於[屈臣氏](https://www.watsons.com.hk)及 [HKTVmall](https://www.hktvmall.com)。如有疑問歡迎 [WhatsApp 查詢](https://wa.me/85268971473)。',
            en: 'All four are available at [Watsons](https://www.watsons.com.hk) and [HKTVmall](https://www.hktvmall.com). If you have any questions, [message us on WhatsApp](https://wa.me/85268971473).',
            ja: '4種類とも[Watsons](https://www.watsons.com.hk)と[HKTVmall](https://www.hktvmall.com)で販売しています。ご不明な点は[WhatsApp](https://wa.me/85268971473)でお問い合わせください。',
          },
        },
      ],
    },
  ],

  faq: [
    {
      q: {
        zh: '盒上寫着「52±2 mm」，究竟是什麼意思？',
        en: 'What does "52±2 mm" on the box actually mean?',
        ja: '箱の「52±2 mm」とは何のこと？',
      },
      a: {
        zh: '「52 mm」是闊度，「±2 mm」是容差，實際上可能是 50 至 54 mm。闊度 = 勃起時周長 ÷ 2，因此 52 mm 對應約 10.4 公分的周長。',
        en: '52 mm is the nominal width, and ±2 mm is the tolerance, so the real width may be anywhere from 50 to 54 mm. Width is half the erect circumference, so 52 mm means a circumference of roughly 10.4 cm.',
        ja: '「52mm」が公称幅、「±2mm」が公差で、実際の幅は50〜54mmです。幅は勃起時の周長を2で割った値なので、52mmなら周長は約10.4cmになります。',
      },
    },
    {
      q: {
        zh: '我不熟悉量度方法，可以用身高估算嗎？',
        en: 'I cannot measure. Can I estimate from my height?',
        ja: '測るのが難しいので、身長から推測できますか？',
      },
      a: {
        zh: '不準確。身高與陰莖尺寸沒有直接關聯，靠身高估算的尺碼通常都會出錯。使用上述方法，一條軟尺，一分鐘，準確得多。',
        en: 'Not reliably. Height and penile size are not directly related, so a height-based estimate is usually wrong. Using the method above — a tape, a minute — is far more accurate.',
        ja: '正確ではありません。身長とペニスのサイズには直接的な関係がないため、身長から推測したサイズは外れがちです。上の方法なら、テープ1本で1分、より正確に選べます。',
      },
    },
    {
      q: {
        zh: '購買較大的尺碼會否更安全？',
        en: 'Is a larger size safer?',
        ja: '大きいサイズの方が安全ですか？',
      },
      a: {
        zh: '不會。所有正廠安全套都必須通過國際標準，包括爆破壓力，拉力伸長，以及每一片的電子測試。闊度不影響安全性，尺碼只是為了戴得舒適和不易滑出。',
        en: 'No. Every genuine condom must pass international standards, which cover burst pressure, tensile strength and an electrical test on every single condom. Width has nothing to do with safety; the size is about comfort and staying on.',
        ja: 'いいえ。本物のコンドームはすべて国際基準を満たす必要があり、破裂圧、引張強度、1枚ごとの電気的検査が含まれます。幅は安全性には影響せず、サイズは装着の快適さと、ずれ落ちしないことのためにあります。',
      },
    },
  ],

  related: ['guide-material.html', 'guide-first-time.html', 'product-ultra-thin.html', 'product-extra-lub.html'],
};
