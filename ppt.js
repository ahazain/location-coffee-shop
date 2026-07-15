const pptxgen = require("pptxgenjs");

// ---------- Palette ----------
const ESPRESSO = "3E2723";   // primary dark brown
const ESPRESSO2 = "5D4037";  // lighter brown
const LATTE = "C9A66B";      // gold/latte
const GREEN = "2F6F4E";      // deep green (GIS/map)
const GREEN_L = "5B8F6E";
const CREAM = "F7F1E8";      // card tint only, not full bg
const WHITE = "FFFFFF";
const INK = "2A211D";        // near-black text
const MUTE = "7A6F66";       // muted gray-brown
const RED = "B23A2F";        // kurang sesuai
const AMBER = "D99B3F";      // cukup sesuai

let pres = new pptxgen();
pres.layout = "LAYOUT_WIDE"; // 13.3 x 7.5
const PGW = 13.333, PGH = 7.5;

const FONT_HEAD = "Cambria";
const FONT_BODY = "Calibri";

function bgSlide(s, color) {
    s.background = { color };
}

function footer(s, pageNum) {
    s.addText("Sistem Pendukung Keputusan Lokasi Coffee Shop  •  Hasil dan Pembahasan", {
        x: 0.5, y: 7.16, w: 9.0, h: 0.28, fontFace: FONT_BODY, fontSize: 9, color: MUTE, align: "left",
    });
    s.addText(String(pageNum), {
        x: 12.4, y: 7.16, w: 0.4, h: 0.28, fontFace: FONT_BODY, fontSize: 9, color: MUTE, align: "right",
    });
}

function sectionTag(s, tag) {
    s.addShape(pres.ShapeType.roundRect, {
        x: 0.5, y: 0.42, w: 1.7, h: 0.34, rectRadius: 0.17, fill: { color: GREEN }, line: { type: "none" },
    });
    s.addText(tag, {
        x: 0.5, y: 0.42, w: 1.7, h: 0.34, fontFace: FONT_BODY, fontSize: 12, bold: true, color: WHITE,
        align: "center", valign: "middle", margin: 0,
    });
}

function slideTitle(s, title) {
    s.addText(title, {
        x: 0.5, y: 0.82, w: 12.3, h: 0.62, fontFace: FONT_HEAD, fontSize: 28, bold: true, color: ESPRESSO,
        margin: 0,
    });
}

// ============================================================
// SLIDE 1 — TITLE
// ============================================================
{
    const s = pres.addSlide();
    bgSlide(s, ESPRESSO);

    // decorative circles motif (coffee ring / map dot)
    s.addShape(pres.ShapeType.ellipse, { x: 10.6, y: -1.4, w: 4.6, h: 4.6, fill: { color: ESPRESSO2 }, line: { type: "none" } });
    s.addShape(pres.ShapeType.ellipse, { x: -1.6, y: 4.6, w: 4.2, h: 4.2, fill: { color: ESPRESSO2 }, line: { type: "none" } });
    s.addShape(pres.ShapeType.ellipse, { x: 11.6, y: 5.6, w: 2.6, h: 2.6, fill: { color: GREEN }, line: { type: "none" }, transparency: 15 });

    s.addText("BAB 4", {
        x: 0.9, y: 2.15, w: 4, h: 0.5, fontFace: FONT_BODY, fontSize: 16, color: LATTE, bold: true, charSpacing: 3,
    });
    s.addText("Hasil dan Pembahasan", {
        x: 0.9, y: 2.55, w: 10.8, h: 1.2, fontFace: FONT_HEAD, fontSize: 44, bold: true, color: WHITE, margin: 0,
    });
    s.addText("Sistem Pendukung Keputusan Berbasis Spasial Multikriteria untuk Menentukan\nLokasi Coffee Shop Menggunakan Metode Weighted Linear Combination", {
        x: 0.9, y: 3.75, w: 10.2, h: 0.9, fontFace: FONT_BODY, fontSize: 15, color: "E4D9C8", margin: 0, lineSpacingMultiple: 1.2,
    });

    s.addShape(pres.ShapeType.line, { x: 0.9, y: 5.05, w: 2.2, h: 0, line: { color: LATTE, width: 2 } });

    s.addText([
        { text: "Ahmad Farid Zainudin", options: { bold: true, color: WHITE, breakLine: true } },
        { text: "NIM 222410102093", options: { color: "CBB99C" } },
    ], { x: 0.9, y: 5.25, w: 6, h: 0.7, fontFace: FONT_BODY, fontSize: 14, margin: 0 });

    s.addText("Program Studi Teknologi Informasi — Fakultas Ilmu Komputer\nUniversitas Jember, 2026", {
        x: 0.9, y: 6.65, w: 8, h: 0.6, fontFace: FONT_BODY, fontSize: 11, color: "B7A98C", margin: 0,
    });
}

// ============================================================
// SLIDE 2 — ALUR PENELITIAN (matches infographic flow)
// ============================================================
{
    const s = pres.addSlide();
    bgSlide(s, WHITE);
    sectionTag(s, "ALUR");
    slideTitle(s, "Alur Tahapan Hasil Penelitian");
    s.addText("Tujuh tahapan yang dibahas pada Bab 4, dari pengumpulan data hingga desain sistem WebGIS.", {
        x: 0.5, y: 1.42, w: 12, h: 0.4, fontFace: FONT_BODY, fontSize: 13, color: MUTE, margin: 0,
    });

    const steps = [
        { n: "4.1", t: "Pengumpulan Data", d: "POI, jalan, populasi,\ncahaya malam, pembatas" },
        { n: "4.2", t: "Preprocessing Data", d: "450 grid analisis\n463 m x 463 m" },
        { n: "4.3", t: "Standardisasi Fuzzy", d: "Linear increasing,\ndecreasing, near" },
        { n: "4.4", t: "Pembobotan AHP", d: "Bobot kriteria &\nindikator (CR < 0,1)" },
        { n: "4.5", t: "Analisis WLC", d: "Skor & kelas\nkesesuaian lokasi" },
        { n: "4.6", t: "Validasi Spasial", d: "Audit sampel\ngrid wilayah" },
        { n: "4.7", t: "Desain Sistem", d: "Implementasi\nWebGIS interaktif" },
    ];

    const startX = 0.5, cardW = 1.68, gap = 0.145, y = 2.55, cardH = 3.55;
    const colors = [GREEN, GREEN_L, LATTE, ESPRESSO2, GREEN, LATTE, ESPRESSO2];

    steps.forEach((st, i) => {
        const x = startX + i * (cardW + gap);
        // step number chip
        s.addShape(pres.ShapeType.roundRect, {
            x, y, w: cardW, h: cardW, rectRadius: 0.14, fill: { color: colors[i] }, line: { type: "none" },
        });
        s.addText(st.n, {
            x, y, w: cardW, h: cardW, fontFace: FONT_HEAD, fontSize: 26, bold: true, color: WHITE,
            align: "center", valign: "middle", margin: 0,
        });
        // connector arrow (except last)
        if (i < steps.length - 1) {
            s.addText("\u203A", {
                x: x + cardW, y: y, w: gap, h: cardW, fontFace: FONT_BODY, fontSize: 16, color: MUTE,
                align: "center", valign: "middle", margin: 0,
            });
        }
        // title
        s.addText(st.t, {
            x, y: y + cardW + 0.18, w: cardW, h: 0.75, fontFace: FONT_BODY, fontSize: 12, bold: true, color: ESPRESSO,
            align: "center", valign: "top", margin: 0,
        });
        // desc
        s.addText(st.d, {
            x, y: y + cardW + 0.85, w: cardW, h: 1.1, fontFace: FONT_BODY, fontSize: 9.5, color: MUTE,
            align: "center", valign: "top", margin: 0, lineSpacingMultiple: 1.15,
        });
    });

    footer(s, 2);
}

// ============================================================
// SLIDE 3 — 4.1 PENGAMBILAN DATA
// ============================================================
{
    const s = pres.addSlide();
    bgSlide(s, WHITE);
    sectionTag(s, "4.1");
    slideTitle(s, "Pengambilan Data");
    s.addText("Data spasial dan data pembobotan dikumpulkan dari berbagai sumber untuk wilayah Patrang, Kaliwates, dan Sumbersari.", {
        x: 0.5, y: 1.42, w: 12.3, h: 0.4, fontFace: FONT_BODY, fontSize: 13, color: MUTE, margin: 0,
    });

    const stats = [
        { v: "280", u: "titik POI", d: "pendidikan, olahraga & rekreasi, kantor/jasa\nkeuangan, pusat belanja, layanan makan" },
        { v: "77 km", u: "jaringan jalan", d: "220 titik simpang jalan hasil\nekstraksi data OpenStreetMap" },
        { v: "369.415", u: "jiwa penduduk", d: "data BPS 2024 pada\n22 kelurahan di 3 kecamatan" },
        { v: "0,06–36,8", u: "nW/cm2/sr", d: "intensitas cahaya malam\n(VIIRS Nighttime Light, raster 463 m)" },
        { v: "3.035 ha", u: "+ 19 km", d: "pembatas lahan: area\npersawahan dan sungai (RBI)" },
        { v: "22 titik", u: "coffee shop eksisting", d: "dasar perhitungan kepadatan\ndan jarak ke pesaing" },
    ];

    const cols = 3, rows = 2, cardW = 3.95, cardH = 1.95, gx = 0.2, gy = 0.22;
    const startX = 0.5, startY = 2.15;
    stats.forEach((st, i) => {
        const col = i % cols, row = Math.floor(i / cols);
        const x = startX + col * (cardW + gx), y = startY + row * (cardH + gy);
        s.addShape(pres.ShapeType.roundRect, {
            x, y, w: cardW, h: cardH, rectRadius: 0.08, fill: { color: CREAM }, line: { type: "none" },
            shadow: { type: "outer", color: "000000", opacity: 0.12, blur: 6, offset: 2, angle: 90 },
        });
        s.addText(st.v, {
            x: x + 0.25, y: y + 0.16, w: cardW - 0.5, h: 0.55, fontFace: FONT_HEAD, fontSize: 24, bold: true, color: GREEN, margin: 0,
        });
        s.addText(st.u, {
            x: x + 0.25, y: y + 0.68, w: cardW - 0.5, h: 0.32, fontFace: FONT_BODY, fontSize: 11.5, bold: true, color: ESPRESSO, margin: 0,
        });
        s.addText(st.d, {
            x: x + 0.25, y: y + 1.05, w: cardW - 0.5, h: 0.8, fontFace: FONT_BODY, fontSize: 9.5, color: MUTE, margin: 0, lineSpacingMultiple: 1.15,
        });
    });

    footer(s, 3);
}

// ============================================================
// SLIDE 4 — 4.2 PREPROCESSING DATA
// ============================================================
{
    const s = pres.addSlide();
    bgSlide(s, WHITE);
    sectionTag(s, "4.2");
    slideTitle(s, "Preprocessing Data");
    s.addText("Data mentah diolah menjadi 450 unit grid analisis berukuran 463 m x 463 m, lengkap dengan status kelayakan lahan.", {
        x: 0.5, y: 1.42, w: 12.3, h: 0.4, fontFace: FONT_BODY, fontSize: 13, color: MUTE, margin: 0,
    });

    // Left: donut chart of layak vs tidak layak
    s.addText("Status Kelayakan Grid (Constraint)", {
        x: 0.5, y: 2.05, w: 5.4, h: 0.35, fontFace: FONT_BODY, fontSize: 13, bold: true, color: ESPRESSO, margin: 0,
    });
    s.addChart(pres.ChartType.doughnut, [
        { name: "Grid", labels: ["Layak (271)", "Tidak layak / constraint (179)"], values: [271, 179] },
    ], {
        x: 0.5, y: 2.45, w: 5.4, h: 3.9,
        chartColors: [GREEN, "D9CFC0"],
        dataLabelColor: WHITE, showValue: true, dataLabelFontSize: 12, dataLabelFontFace: FONT_BODY,
        showLegend: true, legendPos: "b", legendFontSize: 11, legendFontFace: FONT_BODY, legendColor: ESPRESSO,
        holeSize: 55,
    });
    s.addText("450", { x: 0.5, y: 3.55, w: 5.4, h: 0.5, align: "center", fontFace: FONT_HEAD, fontSize: 26, bold: true, color: ESPRESSO, margin: 0 });
    s.addText("total grid", { x: 0.5, y: 4.05, w: 5.4, h: 0.3, align: "center", fontFace: FONT_BODY, fontSize: 10, color: MUTE, margin: 0 });

    // Right: table of key indicator ranges
    s.addText("Ringkasan Rentang Nilai Indikator (mentah)", {
        x: 6.3, y: 2.05, w: 6.5, h: 0.35, fontFace: FONT_BODY, fontSize: 13, bold: true, color: ESPRESSO, margin: 0,
    });
    const rows = [
        [{ text: "Indikator", options: { bold: true, color: WHITE, fill: { color: ESPRESSO } } },
        { text: "Min", options: { bold: true, color: WHITE, fill: { color: ESPRESSO }, align: "center" } },
        { text: "Maks", options: { bold: true, color: WHITE, fill: { color: ESPRESSO }, align: "center" } },
        { text: "Radius", options: { bold: true, color: WHITE, fill: { color: ESPRESSO }, align: "center" } }],
        ["Kepadatan layanan makan non-cafe", "0", "1,54", "1000 m"],
        ["Kepadatan kampus & fasilitas pendidikan", "0", "1,46", "1000 m"],
        ["Kepadatan kantor, bank, jasa keuangan", "0", "3,81", "1000 m"],
        ["Jarak ke jalan utama", "0", "8.989,8 m", "150 m"],
        ["Kedekatan simpul transportasi", "0", "12.872,7 m", "800 m"],
        ["Kepadatan coffee shop eksisting", "0", "0,80", "1000 m"],
    ].map((r, i) => i === 0 ? r : r.map((c, j) => ({ text: c, options: { align: j === 0 ? "left" : "center", color: INK, fontSize: 10.5 } })));

    s.addTable(rows, {
        x: 6.3, y: 2.45, w: 6.5, h: 3.9,
        fontFace: FONT_BODY, fontSize: 10.5, border: { type: "solid", color: "E4DCCD", pt: 0.75 },
        autoPage: false, colW: [3.1, 1.05, 1.4, 0.95],
        valign: "middle",
        fill: { color: WHITE },
    });

    footer(s, 4);
}

// ============================================================
// SLIDE 5 — 4.3 STANDARDISASI FUZZY
// ============================================================
{
    const s = pres.addSlide();
    bgSlide(s, WHITE);
    sectionTag(s, "4.3");
    slideTitle(s, "Standardisasi Indikator Berbasis Fuzzy");
    s.addText("Seluruh 13 indikator dikonversi ke skala fuzzy 0–1 menggunakan tiga fungsi keanggotaan sesuai arah pengaruhnya.", {
        x: 0.5, y: 1.42, w: 12.3, h: 0.4, fontFace: FONT_BODY, fontSize: 13, color: MUTE, margin: 0,
    });

    const groups = [
        {
            title: "Fuzzy Linear Increasing", count: "8 indikator", color: GREEN,
            desc: "Nilai indikator semakin tinggi → semakin sesuai.",
            items: "Layanan makan non-cafe · Olahraga & rekreasi · Kawasan hunian · Kantor/bank/jasa keuangan · Kampus & pendidikan · Cahaya malam · Populasi · Simpang jalan",
        },
        {
            title: "Fuzzy Linear Decreasing", count: "3 indikator", color: LATTE,
            desc: "Semakin dekat jarak → semakin sesuai.",
            items: "Jarak ke jalan utama (150 m) · Kedekatan simpul transportasi (800 m) · Kedekatan pusat belanja (400 m)",
        },
        {
            title: "Fuzzy Near", count: "2 indikator", color: ESPRESSO2,
            desc: "Nilai optimum berada di titik tengah tertentu (midpoint), bukan di ekstrem.",
            items: "Kepadatan coffee shop eksisting · Jarak ke coffee shop eksisting terdekat (spread = 0,2)",
        },
    ];

    const cardW = 3.95, gx = 0.2, y = 2.15, cardH = 4.3;
    groups.forEach((g, i) => {
        const x = 0.5 + i * (cardW + gx);
        s.addShape(pres.ShapeType.roundRect, {
            x, y, w: cardW, h: cardH, rectRadius: 0.1, fill: { color: CREAM }, line: { type: "none" },
            shadow: { type: "outer", color: "000000", opacity: 0.12, blur: 6, offset: 2, angle: 90 },
        });
        s.addShape(pres.ShapeType.ellipse, { x: x + 0.28, y: y + 0.28, w: 0.55, h: 0.55, fill: { color: g.color }, line: { type: "none" } });
        s.addText(String(i + 1), { x: x + 0.28, y: y + 0.28, w: 0.55, h: 0.55, align: "center", valign: "middle", fontFace: FONT_HEAD, fontSize: 18, bold: true, color: WHITE, margin: 0 });
        s.addText(g.title, { x: x + 0.28, y: y + 0.95, w: cardW - 0.56, h: 0.55, fontFace: FONT_BODY, fontSize: 14, bold: true, color: ESPRESSO, margin: 0, lineSpacingMultiple: 1.05 });
        s.addText(g.count, { x: x + 0.28, y: y + 1.42, w: cardW - 0.56, h: 0.3, fontFace: FONT_BODY, fontSize: 10.5, bold: true, color: g.color, margin: 0 });
        s.addText(g.desc, { x: x + 0.28, y: y + 1.78, w: cardW - 0.56, h: 0.65, fontFace: FONT_BODY, fontSize: 10.5, italic: true, color: INK, margin: 0, lineSpacingMultiple: 1.15 });
        s.addShape(pres.ShapeType.line, { x: x + 0.28, y: y + 2.5, w: cardW - 0.56, h: 0, line: { color: "DFD5C2", width: 1 } });
        s.addText(g.items, { x: x + 0.28, y: y + 2.62, w: cardW - 0.56, h: 1.55, fontFace: FONT_BODY, fontSize: 9.5, color: MUTE, margin: 0, lineSpacingMultiple: 1.25 });
    });

    footer(s, 5);
}

// ============================================================
// SLIDE 6 — 4.4 PEMBOBOTAN AHP (kriteria)
// ============================================================
{
    const s = pres.addSlide();
    bgSlide(s, WHITE);
    sectionTag(s, "4.4");
    slideTitle(s, "Pembobotan AHP — Bobot Kriteria");
    s.addText("Rata-rata bobot dari 3 responden (Omah Kulos, Cafe Nuansa, Cafe Wijaya). Seluruh nilai Consistency Ratio (CR) = 0,01 — konsisten.", {
        x: 0.5, y: 1.42, w: 12.3, h: 0.4, fontFace: FONT_BODY, fontSize: 13, color: MUTE, margin: 0,
    });

    s.addChart(pres.ChartType.bar, [
        {
            name: "Bobot Kriteria",
            labels: ["Persaingan", "Kondisi Ekonomi", "Aksesibilitas Transportasi", "Zona Fungsional Kota", "Permintaan Pasar"],
            values: [5.25, 8.67, 14.59, 14.59, 56.90],
        },
    ], {
        x: 0.5, y: 2.1, w: 7.6, h: 4.5,
        barDir: "bar",
        chartColors: [GREEN],
        showValue: true, dataLabelFontSize: 11, dataLabelFontFace: FONT_BODY, dataLabelColor: ESPRESSO, dataLabelPosition: "outEnd",
        catAxisLabelFontSize: 11, catAxisLabelFontFace: FONT_BODY, catAxisLabelColor: INK,
        valAxisHidden: true, showLegend: false, valAxisLabelFontSize: 0,
        dataLabelFormatCode: '0.00"%"',
        barGapWidthPct: 40,
        valGridLine: { style: "none" },
        catGridLine: { style: "none" },
    });

    // right callout card
    s.addShape(pres.ShapeType.roundRect, {
        x: 8.5, y: 2.1, w: 4.3, h: 4.5, rectRadius: 0.1, fill: { color: ESPRESSO }, line: { type: "none" },
    });
    s.addText("PERMINTAAN PASAR", { x: 8.8, y: 2.4, w: 3.7, h: 0.35, fontFace: FONT_BODY, fontSize: 11, bold: true, color: LATTE, charSpacing: 1, margin: 0 });
    s.addText("56,90%", { x: 8.8, y: 2.75, w: 3.7, h: 0.8, fontFace: FONT_HEAD, fontSize: 40, bold: true, color: WHITE, margin: 0 });
    s.addText("Kriteria paling dominan dalam penentuan lokasi coffee shop, jauh melampaui empat kriteria lainnya.", {
        x: 8.8, y: 3.6, w: 3.7, h: 0.75, fontFace: FONT_BODY, fontSize: 11, color: "E4D9C8", margin: 0, lineSpacingMultiple: 1.2,
    });
    s.addShape(pres.ShapeType.line, { x: 8.8, y: 4.5, w: 3.7, h: 0, line: { color: "6B5A4E", width: 1 } });
    s.addText("Nilai CR", { x: 8.8, y: 4.65, w: 3.7, h: 0.3, fontFace: FONT_BODY, fontSize: 10.5, color: "CBB99C", margin: 0 });
    s.addText("0,01  <  0,1", { x: 8.8, y: 4.95, w: 3.7, h: 0.45, fontFace: FONT_HEAD, fontSize: 20, bold: true, color: GREEN_L, margin: 0 });
    s.addText("Penilaian ketiga responden dinyatakan konsisten pada seluruh tingkat hierarki.", {
        x: 8.8, y: 5.45, w: 3.7, h: 0.9, fontFace: FONT_BODY, fontSize: 10.5, color: "E4D9C8", margin: 0, lineSpacingMultiple: 1.2,
    });

    footer(s, 6);
}

// ============================================================
// SLIDE 7 — 4.4 PEMBOBOTAN AHP (bobot total indikator)
// ============================================================
{
    const s = pres.addSlide();
    bgSlide(s, WHITE);
    sectionTag(s, "4.4");
    slideTitle(s, "Pembobotan AHP — Bobot Akhir Indikator");
    s.addText("Bobot akhir = bobot kriteria x bobot lokal indikator. Nilai ini menjadi bobot default pada perhitungan WLC.", {
        x: 0.5, y: 1.42, w: 12.3, h: 0.4, fontFace: FONT_BODY, fontSize: 13, color: MUTE, margin: 0,
    });

    s.addChart(pres.ChartType.bar, [
        {
            name: "Bobot Akhir",
            labels: [
                "Kepadatan coffee shop eksisting", "Kawasan hunian", "Kepadatan simpang jalan", "Kepadatan populasi",
                "Kedekatan simpul transportasi", "Olahraga & rekreasi", "Kantor, bank, jasa keuangan",
                "Jarak ke pesaing terdekat", "Intensitas cahaya malam", "Jarak ke jalan utama",
                "Kedekatan pusat belanja", "Kepadatan kampus & fasilitas pendidikan",
            ],
            values: [1.70, 2.50, 2.50, 2.80, 4.12, 4.12, 4.81, 3.55, 5.87, 7.97, 8.28, 43.81],
        },
    ], {
        x: 0.5, y: 2.05, w: 12.3, h: 4.65,
        barDir: "bar",
        chartColors: [GREEN],
        showValue: true, dataLabelFontSize: 9.5, dataLabelFontFace: FONT_BODY, dataLabelColor: ESPRESSO, dataLabelPosition: "outEnd",
        catAxisLabelFontSize: 9.5, catAxisLabelFontFace: FONT_BODY, catAxisLabelColor: INK,
        valAxisHidden: true, showLegend: false,
        dataLabelFormatCode: '0.0"%"',
        barGapWidthPct: 30,
        valGridLine: { style: "none" },
        catGridLine: { style: "none" },
    });

    footer(s, 7);
}

// ============================================================
// SLIDE 8 — 4.5 ANALISIS WLC (distribusi kelas)
// ============================================================
{
    const s = pres.addSlide();
    bgSlide(s, WHITE);
    sectionTag(s, "4.5");
    slideTitle(s, "Analisis WLC — Distribusi Kelas Kesesuaian");
    s.addText("Skor WLC dihitung untuk 450 grid, lalu diklasifikasikan dengan Jenks Natural Breaks menjadi 3 kelas kesesuaian.", {
        x: 0.5, y: 1.42, w: 12.3, h: 0.4, fontFace: FONT_BODY, fontSize: 13, color: MUTE, margin: 0,
    });

    const classes = [
        { name: "Sesuai", n: 24, pct: "5,33%", range: "Skor > 0,3013", color: GREEN },
        { name: "Cukup Sesuai", n: 123, pct: "27,33%", range: "0,1007 < Skor \u2264 0,3013", color: AMBER },
        { name: "Kurang Sesuai", n: 303, pct: "67,33%", range: "Skor \u2264 0,1007 / kena constraint", color: RED },
    ];
    const cardW = 3.95, gx = 0.2, y = 2.1, cardH = 2.15;
    classes.forEach((c, i) => {
        const x = 0.5 + i * (cardW + gx);
        s.addShape(pres.ShapeType.roundRect, { x, y, w: cardW, h: cardH, rectRadius: 0.08, fill: { color: CREAM }, line: { type: "none" } });
        s.addShape(pres.ShapeType.ellipse, { x: x + 0.28, y: y + 0.24, w: 0.28, h: 0.28, fill: { color: c.color }, line: { type: "none" } });
        s.addText(c.name, { x: x + 0.68, y: y + 0.18, w: cardW - 0.9, h: 0.4, fontFace: FONT_BODY, fontSize: 13, bold: true, color: ESPRESSO, margin: 0 });
        s.addText(String(c.n) + " grid", { x: x + 0.28, y: y + 0.62, w: cardW - 0.56, h: 0.55, fontFace: FONT_HEAD, fontSize: 26, bold: true, color: c.color, margin: 0 });
        s.addText(c.pct + " dari total 450 grid", { x: x + 0.28, y: y + 1.16, w: cardW - 0.56, h: 0.3, fontFace: FONT_BODY, fontSize: 10.5, color: MUTE, margin: 0 });
        s.addText(c.range, { x: x + 0.28, y: y + 1.5, w: cardW - 0.56, h: 0.5, fontFace: FONT_BODY, fontSize: 9.5, italic: true, color: INK, margin: 0 });
    });

    // stacked bar as proportion visual
    s.addText("Proporsi Kelas Kesesuaian (450 grid)", { x: 0.5, y: 4.5, w: 8, h: 0.32, fontFace: FONT_BODY, fontSize: 12, bold: true, color: ESPRESSO, margin: 0 });
    s.addChart(pres.ChartType.bar, [
        { name: "Sesuai", labels: ["Grid"], values: [24] },
        { name: "Cukup Sesuai", labels: ["Grid"], values: [123] },
        { name: "Kurang Sesuai", labels: ["Grid"], values: [303] },
    ], {
        x: 0.5, y: 4.85, w: 12.3, h: 1.0,
        barDir: "bar", barGrouping: "percentStacked",
        chartColors: [GREEN, AMBER, RED],
        showValue: false, catAxisHidden: true, valAxisHidden: true,
        showLegend: true, legendPos: "b", legendFontSize: 10.5, legendFontFace: FONT_BODY, legendColor: ESPRESSO,
        valGridLine: { style: "none" }, catGridLine: { style: "none" },
        barGapWidthPct: 20,
    });

    s.addText("Grid kelas Sesuai terkonsentrasi di sekitar kampus, jalan utama, dan pusat komersial (Kepatihan, Jemberlor, Sumbersari); mayoritas wilayah pinggiran tergolong Kurang Sesuai karena rendahnya cahaya malam/populasi atau terkena pembatas sawah dan sungai.", {
        x: 0.5, y: 6.05, w: 12.3, h: 1.0, fontFace: FONT_BODY, fontSize: 11, color: MUTE, margin: 0, lineSpacingMultiple: 1.25,
    });

    footer(s, 8);
}

// ============================================================
// SLIDE 9 — 4.5 ANALISIS WLC (top 10 grid)
// ============================================================
{
    const s = pres.addSlide();
    bgSlide(s, WHITE);
    sectionTag(s, "4.5");
    slideTitle(s, "Analisis WLC — Lokasi Grid Terbaik");
    s.addText("Sepuluh grid dengan skor WLC tertinggi terpusat di Kaliwates, Patrang, dan Sumbersari.", {
        x: 0.5, y: 1.42, w: 12.3, h: 0.4, fontFace: FONT_BODY, fontSize: 13, color: MUTE, margin: 0,
    });

    const head = ["Peringkat", "ID Grid", "Kelurahan", "Skor WLC", "Indikator Dominan"].map(t => ({
        text: t, options: { bold: true, color: WHITE, fill: { color: ESPRESSO }, align: t === "Indikator Dominan" || t === "Kelurahan" ? "left" : "center" },
    }));
    const dataRows = [
        ["1", "GRID-654", "Kepatihan, Kaliwates", "0,7478", "Kedekatan pusat belanja; kepadatan kampus"],
        ["2", "GRID-653", "Kepatihan, Kaliwates", "0,6821", "Kedekatan pusat belanja; kantor & jasa keuangan"],
        ["3", "GRID-625", "Jemberlor, Patrang", "0,6583", "Cahaya malam; jarak ke jalan utama"],
        ["4", "GRID-627", "Sumbersari, Sumbersari", "0,5199", "Jarak jalan utama; olahraga & rekreasi"],
        ["5", "GRID-628", "Sumbersari, Sumbersari", "0,5161", "Jarak jalan utama; olahraga & rekreasi"],
        ["6", "GRID-758", "Mangli, Kaliwates", "0,5016", "Jarak jalan utama; kedekatan pusat belanja"],
        ["7", "GRID-682", "Kepatihan, Kaliwates", "0,4977", "Jarak jalan utama; kepadatan populasi"],
        ["8", "GRID-624", "Kepatihan, Kaliwates", "0,4975", "Kepadatan populasi; kantor & jasa keuangan"],
    ];
    const rows = [head, ...dataRows.map(r => r.map((c, j) => ({
        text: c, options: { align: (j === 0 || j === 3) ? "center" : "left", color: INK, fontSize: 10.5 },
    })))];

    s.addTable(rows, {
        x: 0.5, y: 2.05, w: 12.3, h: 4.55,
        fontFace: FONT_BODY, fontSize: 10.5, border: { type: "solid", color: "E4DCCD", pt: 0.75 },
        autoPage: false, colW: [1.1, 1.5, 2.7, 1.2, 5.8],
        valign: "middle", fill: { color: WHITE },
    });

    s.addText("Skor tertinggi: GRID-654 (Kel. Kepatihan) = 0,7478 — lokasi paling direkomendasikan pada bobot default.", {
        x: 0.5, y: 6.72, w: 12.3, h: 0.35, fontFace: FONT_BODY, fontSize: 11, italic: true, color: GREEN, bold: true, margin: 0,
    });

    footer(s, 9);
}

// ============================================================
// SLIDE 10 — 4.6 VALIDASI SPASIAL
// ============================================================
{
    const s = pres.addSlide();
    bgSlide(s, WHITE);
    sectionTag(s, "4.6");
    slideTitle(s, "Validasi Spasial");
    s.addText("Empat grid sampel diperiksa untuk membuktikan mekanisme WLC bekerja konsisten sesuai rancangan model.", {
        x: 0.5, y: 1.42, w: 12.3, h: 0.4, fontFace: FONT_BODY, fontSize: 13, color: MUTE, margin: 0,
    });

    const samples = [
        {
            id: "GRID-487", tag: "Kepadatan pesaing tertinggi", skor: "0,000", kelas: "Kurang Sesuai", color: RED,
            note: "Kepadatan coffee shop eksisting 0,802 (tertinggi), namun berada pada area sawah → constraint = 0 meniadakan skor secara mutlak."
        },
        {
            id: "GRID-758", tag: "Tanpa pesaing, kelas Sesuai", skor: "0,501", kelas: "Sesuai", color: GREEN,
            note: "Nilai fuzzy kepadatan kampus 0,5165 (bobot 43,81%) didukung jarak jalan utama & pusat belanja maksimal."
        },
        {
            id: "GRID-836", tag: "Tanpa pesaing, kelas Kurang Sesuai", skor: "0,100", kelas: "Kurang Sesuai", color: AMBER,
            note: "Nilai fuzzy kepadatan kampus hampir nol (0,0023) meski jarak ke jalan utama maksimal."
        },
        {
            id: "GRID-040", tag: "Area constraint kosong", skor: "0,000", kelas: "Kurang Sesuai", color: RED,
            note: "Grid terkena kawasan perlindungan sawah irigasi → constraint = 0, tanpa coffee shop eksisting."
        },
    ];

    const cardW = 2.98, gx = 0.15, y = 2.1, cardH = 4.55;
    samples.forEach((sm, i) => {
        const x = 0.5 + i * (cardW + gx);
        s.addShape(pres.ShapeType.roundRect, { x, y, w: cardW, h: cardH, rectRadius: 0.09, fill: { color: CREAM }, line: { type: "none" } });
        s.addShape(pres.ShapeType.roundRect, { x: x + 0.2, y: y + 0.2, w: cardW - 0.4, h: 0.3, rectRadius: 0.06, fill: { color: sm.color }, line: { type: "none" } });
        s.addText(sm.kelas, { x: x + 0.2, y: y + 0.2, w: cardW - 0.4, h: 0.3, align: "center", valign: "middle", fontFace: FONT_BODY, fontSize: 9.5, bold: true, color: WHITE, margin: 0 });
        s.addText(sm.id, { x: x + 0.2, y: y + 0.62, w: cardW - 0.4, h: 0.4, fontFace: FONT_HEAD, fontSize: 17, bold: true, color: ESPRESSO, margin: 0 });
        s.addText(sm.tag, { x: x + 0.2, y: y + 1.02, w: cardW - 0.4, h: 0.55, fontFace: FONT_BODY, fontSize: 9.5, italic: true, color: MUTE, margin: 0, lineSpacingMultiple: 1.15 });
        s.addText("Skor WLC", { x: x + 0.2, y: y + 1.62, w: cardW - 0.4, h: 0.25, fontFace: FONT_BODY, fontSize: 9, color: MUTE, margin: 0 });
        s.addText(sm.skor, { x: x + 0.2, y: y + 1.85, w: cardW - 0.4, h: 0.55, fontFace: FONT_HEAD, fontSize: 24, bold: true, color: sm.color, margin: 0 });
        s.addShape(pres.ShapeType.line, { x: x + 0.2, y: y + 2.5, w: cardW - 0.4, h: 0, line: { color: "DFD5C2", width: 1 } });
        s.addText(sm.note, { x: x + 0.2, y: y + 2.62, w: cardW - 0.4, h: 1.8, fontFace: FONT_BODY, fontSize: 9.5, color: INK, margin: 0, lineSpacingMultiple: 1.2 });
    });

    footer(s, 10);
}

// ============================================================
// SLIDE 11 — 4.7 DESAIN SISTEM WEBGIS
// ============================================================
{
    const s = pres.addSlide();
    bgSlide(s, WHITE);
    sectionTag(s, "4.7");
    slideTitle(s, "Desain Sistem WebGIS");
    s.addText("Seluruh perhitungan AHP dan WLC diimplementasikan ke antarmuka interaktif dengan dua aktor utama.", {
        x: 0.5, y: 1.42, w: 12.3, h: 0.4, fontFace: FONT_BODY, fontSize: 13, color: MUTE, margin: 0,
    });

    // Admin column
    s.addShape(pres.ShapeType.roundRect, { x: 0.5, y: 2.1, w: 5.9, h: 4.55, rectRadius: 0.1, fill: { color: ESPRESSO }, line: { type: "none" } });
    s.addText("ADMIN", { x: 0.85, y: 2.35, w: 5.2, h: 0.4, fontFace: FONT_BODY, fontSize: 15, bold: true, color: LATTE, charSpacing: 1, margin: 0 });
    s.addText("mengelola data dan proses analisis sistem", { x: 0.85, y: 2.72, w: 5.2, h: 0.3, fontFace: FONT_BODY, fontSize: 10.5, italic: true, color: "CBB99C", margin: 0 });
    const adminFeatures = [
        "Autentikasi (login/logout)",
        "Kelola dataset indikator hasil preprocessing QGIS",
        "Kelola aturan & hitung nilai fuzzy",
        "Kelola bobot AHP (pakar, kriteria, indikator)",
        "Jalankan & perbarui perhitungan WLC",
        "Kelola hasil audit validasi spasial",
    ];
    let ay = 3.18;
    adminFeatures.forEach(f => {
        s.addShape(pres.ShapeType.ellipse, { x: 0.85, y: ay + 0.06, w: 0.1, h: 0.1, fill: { color: LATTE }, line: { type: "none" } });
        s.addText(f, { x: 1.1, y: ay - 0.06, w: 4.95, h: 0.42, fontFace: FONT_BODY, fontSize: 11, color: WHITE, margin: 0, valign: "top" });
        ay += 0.52;
    });

    // Pelaku usaha column
    s.addShape(pres.ShapeType.roundRect, { x: 6.6, y: 2.1, w: 6.2, h: 4.55, rectRadius: 0.1, fill: { color: CREAM }, line: { type: "none" } });
    s.addText("PELAKU USAHA", { x: 6.95, y: 2.35, w: 5.6, h: 0.4, fontFace: FONT_BODY, fontSize: 15, bold: true, color: GREEN, charSpacing: 1, margin: 0 });
    s.addText("melihat hasil dan mensimulasikan strategi bisnis", { x: 6.95, y: 2.72, w: 5.6, h: 0.3, fontFace: FONT_BODY, fontSize: 10.5, italic: true, color: MUTE, margin: 0 });

    const usahaFeatures = [
        { t: "Peta Kesesuaian Lokasi", d: "Melihat kelas kesesuaian tiap grid (Sesuai / Cukup Sesuai / Kurang Sesuai) di atas basemap wilayah studi." },
        { t: "Detail Grid", d: "Memeriksa skor WLC, nilai fuzzy tiap indikator, dan status constraint pada grid tertentu." },
        { t: "Simulasi Bobot", d: "Mengubah persentase bobot kriteria; sistem menghitung ulang skor & warna peta secara langsung tanpa mengubah bobot default." },
        { t: "Rekomendasi Lokasi", d: "Melihat daftar grid dengan tingkat kesesuaian tinggi sesuai skenario bobot yang dipilih." },
    ];
    let uy = 3.2;
    usahaFeatures.forEach(f => {
        s.addShape(pres.ShapeType.ellipse, { x: 6.95, y: uy, w: 0.34, h: 0.34, fill: { color: GREEN }, line: { type: "none" } });
        s.addText("\u2713", { x: 6.95, y: uy, w: 0.34, h: 0.34, align: "center", valign: "middle", fontFace: FONT_BODY, fontSize: 12, bold: true, color: WHITE, margin: 0 });
        s.addText(f.t, { x: 7.42, y: uy - 0.04, w: 5.2, h: 0.3, fontFace: FONT_BODY, fontSize: 12, bold: true, color: ESPRESSO, margin: 0 });
        s.addText(f.d, { x: 7.42, y: uy + 0.25, w: 5.2, h: 0.55, fontFace: FONT_BODY, fontSize: 9.5, color: MUTE, margin: 0, lineSpacingMultiple: 1.15 });
        uy += 0.92;
    });

    footer(s, 11);
}

// ============================================================
// SLIDE 12 — KESIMPULAN HASIL (closing)
// ============================================================
{
    const s = pres.addSlide();
    bgSlide(s, ESPRESSO);
    s.addShape(pres.ShapeType.ellipse, { x: -1.8, y: -1.8, w: 4.4, h: 4.4, fill: { color: ESPRESSO2 }, line: { type: "none" } });
    s.addShape(pres.ShapeType.ellipse, { x: 11.2, y: 5.0, w: 4.0, h: 4.0, fill: { color: ESPRESSO2 }, line: { type: "none" } });

    s.addText("RINGKASAN", { x: 0.7, y: 0.55, w: 5, h: 0.4, fontFace: FONT_BODY, fontSize: 14, bold: true, color: LATTE, charSpacing: 2, margin: 0 });
    s.addText("Poin Kunci Hasil Penelitian", { x: 0.7, y: 0.92, w: 11, h: 0.7, fontFace: FONT_HEAD, fontSize: 30, bold: true, color: WHITE, margin: 0 });

    const points = [
        { n: "01", t: "Permintaan pasar dominan", d: "Kriteria permintaan pasar (56,9%) dan indikator kepadatan kampus & fasilitas pendidikan (43,8%) paling menentukan lokasi coffee shop." },
        { n: "02", t: "Hanya 5,33% lokasi sesuai", d: "Dari 450 grid, 24 grid tergolong Sesuai — terkonsentrasi di sekitar kampus, jalan utama, dan pusat komersial." },
        { n: "03", t: "Constraint bekerja mutlak", d: "Area sawah dan sungai meniadakan skor kesesuaian meski nilai indikator lain tinggi, terbukti pada validasi GRID-487." },
        { n: "04", t: "Sistem WebGIS interaktif", d: "Pelaku usaha dapat mensimulasikan bobot kriteria dan langsung melihat pembaruan peta rekomendasi lokasi." },
    ];
    const cardW = 5.95, cardH = 2.35, gx = 0.3, gy = 0.3, sx = 0.7, sy = 2.0;
    points.forEach((p, i) => {
        const col = i % 2, row = Math.floor(i / 2);
        const x = sx + col * (cardW + gx), y = sy + row * (cardH + gy);
        s.addText(p.n, { x, y, w: 1.1, h: 0.9, fontFace: FONT_HEAD, fontSize: 34, bold: true, color: "6B5A4E", margin: 0 });
        s.addText(p.t, { x: x + 1.0, y: y + 0.02, w: cardW - 1.1, h: 0.5, fontFace: FONT_BODY, fontSize: 14, bold: true, color: LATTE, margin: 0 });
        s.addText(p.d, { x: x + 1.0, y: y + 0.5, w: cardW - 1.1, h: 1.5, fontFace: FONT_BODY, fontSize: 11, color: "E4D9C8", margin: 0, lineSpacingMultiple: 1.25 });
    });

    s.addText("Terima Kasih", { x: 0.7, y: 6.95, w: 6, h: 0.4, fontFace: FONT_HEAD, fontSize: 14, italic: true, color: "CBB99C", margin: 0 });
}

pres.writeFile({ fileName: "hasil_pembahasan.pptx" }).then(() => {
    console.log("done");
});