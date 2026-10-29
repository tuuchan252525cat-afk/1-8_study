/**
 * High-fidelity authentic Japanese exam test papers and prints (SVG Data URIs).
 * These display directly as crisp, vector-sharp PDF/JPG image documents on page.
 */

// Math Exam Sheet (A4 format with official Japanese high school exam styling)
export const MATH_EXAM_PAPER_JPG = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1130" width="100%" height="100%">
  <!-- Paper Background with subtle texture -->
  <rect width="800" height="1130" fill="#FCFCFA" stroke="#D1D5DB" stroke-width="2"/>
  <rect x="25" y="25" width="750" height="1080" fill="none" stroke="#374151" stroke-width="1.5"/>

  <!-- Exam Header -->
  <text x="400" y="65" font-family="'Noto Sans JP', sans-serif" font-size="14" font-weight="bold" text-anchor="middle" fill="#374151" letter-spacing="2">2026年度 10月定期考査（校内実力テスト）</text>
  <text x="400" y="105" font-family="'Noto Sans JP', sans-serif" font-size="24" font-weight="900" text-anchor="middle" fill="#111827">数 学 Ｉ ・ 数 学 Ａ  問 題 用 紙</text>
  
  <!-- Student ID Box -->
  <rect x="480" y="125" width="280" height="42" fill="none" stroke="#374151" stroke-width="1.2"/>
  <line x1="560" y1="125" x2="560" y2="167" stroke="#374151" stroke-width="1"/>
  <line x1="640" y1="125" x2="640" y2="167" stroke="#374151" stroke-width="1"/>
  <text x="520" y="150" font-family="'Noto Sans JP', sans-serif" font-size="11" text-anchor="middle" fill="#4B5563">3年 B組</text>
  <text x="600" y="150" font-family="'Noto Sans JP', sans-serif" font-size="11" text-anchor="middle" fill="#4B5563">出席番号</text>
  <text x="700" y="150" font-family="'Noto Sans JP', sans-serif" font-size="11" text-anchor="middle" fill="#9CA3AF">氏名（非公開）</text>

  <!-- Notice -->
  <text x="45" y="155" font-family="'Noto Sans JP', sans-serif" font-size="11" fill="#4B5563">※ 答案は別紙の解答用紙に濃くはっきりと記入すること。計算用紙は裏面を使用可。</text>
  <line x1="35" y1="180" x2="765" y2="180" stroke="#374151" stroke-width="1.5"/>

  <!-- Problem 1 -->
  <rect x="45" y="195" width="36" height="24" fill="#1F2937" rx="3"/>
  <text x="63" y="212" font-family="'Noto Sans JP', sans-serif" font-size="13" font-weight="bold" text-anchor="middle" fill="#FFFFFF">1</text>
  <text x="90" y="212" font-family="'Noto Sans JP', sans-serif" font-size="14" font-weight="bold" fill="#111827">二次関数の動く区間における最大・最小（配点 30点）</text>
  
  <text x="45" y="245" font-family="'Noto Sans JP', sans-serif" font-size="13" fill="#1F2937" line-height="24">
    関数 f(x) = x² - 4x + 5 (a ≦ x ≦ a + 2) について、次の問いに答えよ。ただし a は実数の定数とする。
  </text>
  <text x="60" y="275" font-family="'Noto Sans JP', sans-serif" font-size="12" fill="#374151">
    (1) 関数 f(x) を平方完成し、グラフの頂点の座標を求めよ。（6点）
  </text>
  <text x="60" y="305" font-family="'Noto Sans JP', sans-serif" font-size="12" fill="#374151">
    (2) a = 1 のとき、f(x) の最大値および最小値を求めよ。（8点）
  </text>
  <text x="60" y="335" font-family="'Noto Sans JP', sans-serif" font-size="12" fill="#374151">
    (3) f(x) の最小値を m(a) とする。m(a) を a の値の範囲によって場合分けして表せ。（16点）
  </text>

  <!-- Problem 1 Mathematical Parabola Diagram -->
  <g transform="translate(480, 230)">
    <rect width="260" height="150" fill="#F8FAFC" stroke="#E2E8F0" rx="6"/>
    <!-- Coordinate axes -->
    <line x1="20" y1="130" x2="240" y2="130" stroke="#64748B" stroke-width="1.5"/>
    <line x1="40" y1="10" x2="40" y2="140" stroke="#64748B" stroke-width="1.5"/>
    <text x="235" y="125" font-size="10" fill="#64748B">x</text>
    <text x="45" y="20" font-size="10" fill="#64748B">y</text>
    <text x="30" y="142" font-size="10" fill="#64748B">O</text>
    
    <!-- Parabola curve -->
    <path d="M 45 30 Q 110 130 180 30" fill="none" stroke="#059669" stroke-width="2.5"/>
    <!-- Vertex (2, 1) -->
    <circle cx="112" cy="85" r="3.5" fill="#DC2626"/>
    <line x1="112" y1="85" x2="112" y2="130" stroke="#94A3B8" stroke-dasharray="3 3"/>
    <text x="115" y="80" font-size="10" font-weight="bold" fill="#DC2626">頂点(2, 1)</text>

    <!-- Interval bar [a, a+2] -->
    <rect x="75" y="128" width="80" height="4" fill="#3B82F6"/>
    <text x="70" y="145" font-size="9" fill="#1D4ED8">x=a</text>
    <text x="145" y="145" font-size="9" fill="#1D4ED8">x=a+2</text>
  </g>

  <line x1="45" y1="410" x2="755" y2="410" stroke="#E5E7EB" stroke-width="1"/>

  <!-- Problem 2 -->
  <rect x="45" y="430" width="36" height="24" fill="#1F2937" rx="3"/>
  <text x="63" y="447" font-family="'Noto Sans JP', sans-serif" font-size="13" font-weight="bold" text-anchor="middle" fill="#FFFFFF">2</text>
  <text x="90" y="447" font-family="'Noto Sans JP', sans-serif" font-size="14" font-weight="bold" fill="#111827">図形と計量・三角比の応用（配点 35点）</text>

  <text x="45" y="480" font-family="'Noto Sans JP', sans-serif" font-size="13" fill="#1F2937">
    円に内接する四角形 ABCD において、AB = 5, BC = 4, CD = 4, DA = 2 とする。
  </text>
  <text x="60" y="510" font-family="'Noto Sans JP', sans-serif" font-size="12" fill="#374151">
    (1) cos ∠ABC の値を求めよ。（10点）
  </text>
  <text x="60" y="540" font-family="'Noto Sans JP', sans-serif" font-size="12" fill="#374151">
    (2) 対角線 AC の長さを求めよ。（10点）
  </text>
  <text x="60" y="570" font-family="'Noto Sans JP', sans-serif" font-size="12" fill="#374151">
    (3) 四角形 ABCD の面積 S を求めよ。（15点）
  </text>

  <!-- Problem 2 Circle geometry diagram -->
  <g transform="translate(500, 470)">
    <circle cx="110" cy="80" r="65" fill="#F8FAFC" stroke="#64748B" stroke-width="1.5"/>
    <polygon points="65,45 160,35 155,130 75,120" fill="none" stroke="#2563EB" stroke-width="2"/>
    <text x="55" y="40" font-size="10" font-weight="bold" fill="#1E40AF">A</text>
    <text x="165" y="30" font-size="10" font-weight="bold" fill="#1E40AF">B</text>
    <text x="160" y="145" font-size="10" font-weight="bold" fill="#1E40AF">C</text>
    <text x="65" y="135" font-size="10" font-weight="bold" fill="#1E40AF">D</text>
    <line x1="65" y1="45" x2="155" y2="130" stroke="#E11D48" stroke-dasharray="3 2" stroke-width="1.5"/>
    <text x="105" y="90" font-size="9" fill="#E11D48">AC</text>
  </g>

  <line x1="45" y1="640" x2="755" y2="640" stroke="#E5E7EB" stroke-width="1"/>

  <!-- Problem 3 -->
  <rect x="45" y="660" width="36" height="24" fill="#1F2937" rx="3"/>
  <text x="63" y="677" font-family="'Noto Sans JP', sans-serif" font-size="13" font-weight="bold" text-anchor="middle" fill="#FFFFFF">3</text>
  <text x="90" y="677" font-family="'Noto Sans JP', sans-serif" font-size="14" font-weight="bold" fill="#111827">場合の数と確率・期待値（配点 35点）</text>

  <text x="45" y="710" font-family="'Noto Sans JP', sans-serif" font-size="13" fill="#1F2937">
    赤玉 4個、白玉 3個、青玉 2個の合計 9個が入っている袋から、同時に 3個の玉を取り出す。
  </text>
  <text x="60" y="740" font-family="'Noto Sans JP', sans-serif" font-size="12" fill="#374151">
    (1) 3個とも同じ色である確率を求めよ。（10点）
  </text>
  <text x="60" y="770" font-family="'Noto Sans JP', sans-serif" font-size="12" fill="#374151">
    (2) 3個の玉の色がすべて異なる確率を求めよ。（12点）
  </text>
  <text x="60" y="800" font-family="'Noto Sans JP', sans-serif" font-size="12" fill="#374151">
    (3) 取り出された赤玉の個数を X とするとき、X の期待値 E(X) を求めよ。（13点）
  </text>

  <!-- Official High School Test Bottom Footer -->
  <line x1="35" y1="1020" x2="765" y2="1020" stroke="#374151" stroke-width="1.5"/>
  <text x="400" y="1050" font-family="'Noto Sans JP', sans-serif" font-size="12" text-anchor="middle" fill="#6B7280">- 1 / 2 ページ （裏面に続きます） -</text>
  <text x="730" y="1050" font-family="'Noto Sans JP', sans-serif" font-size="11" text-anchor="end" fill="#9CA3AF">【禁無断転載・ClassHub 3-B】</text>
</svg>
`)}`;

// Science & Physics Exam Sheet (Optical Reflection, Critical Angle, Mizo-Blue Test Paper)
export const SCIENCE_EXAM_PAPER_JPG = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1130" width="100%" height="100%">
  <rect width="800" height="1130" fill="#FCFCFA" stroke="#D1D5DB" stroke-width="2"/>
  <rect x="25" y="25" width="750" height="1080" fill="none" stroke="#0F766E" stroke-width="1.5"/>

  <!-- Exam Header -->
  <text x="400" y="65" font-family="'Noto Sans JP', sans-serif" font-size="14" font-weight="bold" text-anchor="middle" fill="#0F766E" letter-spacing="2">ミゾブルー連動・校内定期考査対策演習</text>
  <text x="400" y="105" font-family="'Noto Sans JP', sans-serif" font-size="24" font-weight="900" text-anchor="middle" fill="#134E4A">物 理 【 幾 何 光 学 ・ 全 反 射 】 特 訓 プ リ ン ト</text>

  <rect x="520" y="125" width="240" height="40" fill="#F0FDFA" stroke="#0F766E" stroke-width="1"/>
  <text x="640" y="150" font-family="'Noto Sans JP', sans-serif" font-size="12" font-weight="bold" text-anchor="middle" fill="#115E59">重点単元：屈折の法則と光ファイバー</text>

  <line x1="35" y1="180" x2="765" y2="180" stroke="#0F766E" stroke-width="1.5"/>

  <!-- Problem 1: Total Internal Reflection -->
  <rect x="45" y="200" width="40" height="24" fill="#0F766E" rx="3"/>
  <text x="65" y="217" font-family="'Noto Sans JP', sans-serif" font-size="13" font-weight="bold" text-anchor="middle" fill="#FFFFFF">問1</text>
  <text x="95" y="217" font-family="'Noto Sans JP', sans-serif" font-size="15" font-weight="bold" fill="#134E4A">全反射の条件と臨界角の導出</text>

  <text x="45" y="250" font-family="'Noto Sans JP', sans-serif" font-size="13" fill="#1F2937">
    屈折率 n₁ の媒質Ⅰ（ガラス）から、屈折率 n₂ の媒質Ⅱ（空気）に光を入射角 θ₁ で入射させる（n₁ &gt; n₂ とする）。
  </text>
  <text x="60" y="280" font-family="'Noto Sans JP', sans-serif" font-size="12" fill="#374151">
    (1) スネルの屈折の法則の式を記せ。
  </text>
  <text x="60" y="310" font-family="'Noto Sans JP', sans-serif" font-size="12" fill="#374151">
    (2) 屈折角が 90° となるときの入射角を「臨界角 θc」と呼ぶ。sin θc を n₁, n₂ で表せ。
  </text>
  <text x="60" y="340" font-family="'Noto Sans JP', sans-serif" font-size="12" fill="#374151">
    (3) ガラスの屈折率 n₁ = 1.50、空気の屈折率 n₂ = 1.00 のとき、臨界角 θc はおよそ何度か（sin 42° ≒ 0.67）。
  </text>

  <!-- Optical Ray Diagram (SVG Vector Graphics) -->
  <g transform="translate(480, 230)">
    <rect width="270" height="180" fill="#F8FAFC" stroke="#CBD5E1" rx="6"/>
    <!-- Boundary line -->
    <line x1="10" y1="90" x2="260" y2="90" stroke="#0F766E" stroke-width="2"/>
    <text x="20" y="80" font-size="11" font-weight="bold" fill="#0369A1">媒質Ⅱ（空気 n₂）</text>
    <text x="20" y="115" font-size="11" font-weight="bold" fill="#0F766E">媒質Ⅰ（ガラス n₁）</text>
    
    <!-- Normal dashed line -->
    <line x1="140" y1="20" x2="140" y2="160" stroke="#64748B" stroke-dasharray="4 3"/>
    
    <!-- Incident ray -->
    <line x1="60" y1="160" x2="140" y2="90" stroke="#DC2626" stroke-width="2.5"/>
    <polygon points="100,125 105,120 98,118" fill="#DC2626"/>
    <text x="95" y="145" font-size="11" font-weight="bold" fill="#DC2626">入射角 θ₁</text>

    <!-- Refracted ray along boundary (Critical state) -->
    <line x1="140" y1="90" x2="250" y2="90" stroke="#2563EB" stroke-width="3"/>
    <text x="180" y="75" font-size="10" font-weight="bold" fill="#2563EB">屈折角 90° (臨界角)</text>
    <!-- Total internal reflection ray -->
    <line x1="140" y1="90" x2="220" y2="160" stroke="#E11D48" stroke-width="2" stroke-dasharray="3 2"/>
    <text x="175" y="145" font-size="10" fill="#E11D48">全反射光 (θ₁ &gt; θc)</text>
  </g>

  <line x1="45" y1="440" x2="755" y2="440" stroke="#E5E7EB" stroke-width="1"/>

  <!-- Problem 2: Optical Fiber Core-Clad Application -->
  <rect x="45" y="460" width="40" height="24" fill="#0F766E" rx="3"/>
  <text x="65" y="477" font-family="'Noto Sans JP', sans-serif" font-size="13" font-weight="bold" text-anchor="middle" fill="#FFFFFF">問2</text>
  <text x="95" y="477" font-family="'Noto Sans JP', sans-serif" font-size="15" font-weight="bold" fill="#134E4A">光ファイバー内の光線伝播と最大入射角</text>

  <text x="45" y="510" font-family="'Noto Sans JP', sans-serif" font-size="13" fill="#1F2937">
    中心のコア（屈折率 n₁ = 1.60）と外側のクラッド（屈折率 n₂ = 1.40）からなる光ファイバーがある。
  </text>
  <text x="60" y="540" font-family="'Noto Sans JP', sans-serif" font-size="12" fill="#374151">
    (1) 端面から空気中（屈折率 1.00）を通ってコアに入射角 α で入った光線が、コアとクラッドの境界面で全反射を繰り返して進むための sin α の条件を求めよ。
  </text>
  <text x="60" y="580" font-family="'Noto Sans JP', sans-serif" font-size="12" fill="#374151">
    (2) クラッドの屈折率 n₂ を小さくすると、光ファイバーに光を取り込める最大角度はどう変化するか理由とともに答えよ。
  </text>

  <!-- Optical fiber diagram -->
  <g transform="translate(180, 620)">
    <!-- Cladding top -->
    <rect x="0" y="0" width="440" height="35" fill="#E2E8F0" stroke="#94A3B8"/>
    <text x="20" y="22" font-size="11" fill="#475569">クラッド (n₂ = 1.40)</text>
    <!-- Core middle -->
    <rect x="0" y="35" width="440" height="70" fill="#FEF3C7" stroke="#F59E0B" stroke-width="1.5"/>
    <text x="20" y="75" font-size="12" font-weight="bold" fill="#B45309">コア (n₁ = 1.60)</text>
    <!-- Cladding bottom -->
    <rect x="0" y="105" width="440" height="35" fill="#E2E8F0" stroke="#94A3B8"/>
    <text x="20" y="127" font-size="11" fill="#475569">クラッド (n₂ = 1.40)</text>

    <!-- Light bounce pathway inside core -->
    <polyline points="0,70 90,35 190,105 290,35 390,105 440,70" fill="none" stroke="#DC2626" stroke-width="3"/>
    <circle cx="90" cy="35" r="4" fill="#DC2626"/>
    <circle cx="190" cy="105" r="4" fill="#DC2626"/>
    <circle cx="290" cy="35" r="4" fill="#DC2626"/>
    <text x="140" y="60" font-size="11" font-weight="bold" fill="#DC2626">全反射で光を密閉伝送</text>
  </g>

  <line x1="35" y1="1020" x2="765" y2="1020" stroke="#0F766E" stroke-width="1.5"/>
  <text x="400" y="1050" font-family="'Noto Sans JP', sans-serif" font-size="12" text-anchor="middle" fill="#6B7280">- 物理・定期テスト要点プリント -</text>
</svg>
`)}`;

// English Target Exam Sheet
export const ENGLISH_EXAM_PAPER_JPG = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1130" width="100%" height="100%">
  <rect width="800" height="1130" fill="#FCFCFA" stroke="#D1D5DB" stroke-width="2"/>
  <rect x="25" y="25" width="750" height="1080" fill="none" stroke="#1E3A8A" stroke-width="1.5"/>

  <!-- Exam Header -->
  <text x="400" y="65" font-family="'Noto Sans JP', sans-serif" font-size="14" font-weight="bold" text-anchor="middle" fill="#1E3A8A" letter-spacing="2">ClassHub 3-B 英語科 定期考査特訓問題用紙</text>
  <text x="400" y="105" font-family="'Noto Sans JP', sans-serif" font-size="24" font-weight="900" text-anchor="middle" fill="#0F172A">英 語 表 現 ＆ 単 語 タ ー ゲ ッ ト 5 0 0  演 習</text>

  <line x1="35" y1="140" x2="765" y2="140" stroke="#1E3A8A" stroke-width="1.5"/>

  <!-- Section 1 -->
  <rect x="45" y="160" width="36" height="24" fill="#1E3A8A" rx="3"/>
  <text x="63" y="177" font-family="'Noto Sans JP', sans-serif" font-size="13" font-weight="bold" text-anchor="middle" fill="#FFFFFF">I</text>
  <text x="90" y="177" font-family="'Noto Sans JP', sans-serif" font-size="14" font-weight="bold" fill="#0F172A">語法・前置詞空所補充（各4点 × 5問 ＝ 20点）</text>

  <text x="60" y="220" font-size="13" fill="#1F2937">
    1. They had to abandon ( &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ) the project due to a lack of sufficient funds.
  </text>
  <text x="80" y="245" font-size="12" fill="#4B5563">
    [A] to &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; [B] on &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; [C] (前置詞不要・他動詞) &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; [D] with
  </text>

  <text x="60" y="290" font-size="13" fill="#1F2937">
    2. We can substitute margarine ( &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ) butter in this cookie recipe.
  </text>
  <text x="80" y="315" font-size="12" fill="#4B5563">
    [A] for &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; [B] with &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; [C] into &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; [D] against
  </text>

  <text x="60" y="360" font-size="13" fill="#1F2937">
    3. Proper communication is crucial ( &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ) resolving the dispute peacefully.
  </text>
  <text x="80" y="385" font-size="12" fill="#4B5563">
    [A] to &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; [B] by &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; [C] at &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; [D] towards
  </text>

  <!-- Section 2 -->
  <line x1="45" y1="430" x2="755" y2="430" stroke="#CBD5E1" stroke-width="1"/>
  <rect x="45" y="450" width="36" height="24" fill="#1E3A8A" rx="3"/>
  <text x="63" y="467" font-family="'Noto Sans JP', sans-serif" font-size="13" font-weight="bold" text-anchor="middle" fill="#FFFFFF">II</text>
  <text x="90" y="467" font-family="'Noto Sans JP', sans-serif" font-size="14" font-weight="bold" fill="#0F172A">長文読解・文脈判断問題（30点）</text>

  <rect x="55" y="500" width="690" height="220" fill="#F8FAFC" stroke="#E2E8F0" rx="4"/>
  <text x="75" y="530" font-size="12" fill="#1E293B" line-height="22">
    Many scientific phenomena were once regarded as completely supernatural. However,
  </text>
  <text x="75" y="555" font-size="12" fill="#1E293B">
    through rigorous empirical experimentation and mathematical modeling, researchers have been
  </text>
  <text x="75" y="580" font-size="12" fill="#1E293B">
    able to unveil the fundamental laws governing nature. It is vital that students cultivate both
  </text>
  <text x="75" y="605" font-size="12" fill="#1E293B">
    critical thinking and imaginative curiosity to engage with future innovations...
  </text>

  <line x1="35" y1="1020" x2="765" y2="1020" stroke="#1E3A8A" stroke-width="1.5"/>
  <text x="400" y="1050" font-family="'Noto Sans JP', sans-serif" font-size="12" text-anchor="middle" fill="#6B7280">- 英語・定期考査プレビュー用紙 -</text>
</svg>
`)}`;
