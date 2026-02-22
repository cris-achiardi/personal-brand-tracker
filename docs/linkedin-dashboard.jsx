import { useState, useMemo } from "react";

const RAW_POSTS = [
  { id: 1, name: "Creé mi primer plugin para Figma.", date: "2025-12-15", likes: 94, comments: 4, shares: 8, engagement: 106, thumbnail: "https://media.licdn.com/dms/image/v2/D4D05AQH74UX2mmppCg/videocover-high/B4DZsiodEKG0Bc-/0/1765812626250", url: "https://www.linkedin.com/feed/update/urn:li:activity:7406355264498515968/" },
  { id: 2, name: "Cómo implementar diseño con IA. Probablemente usaste AI Studio para crear algo.", date: "2025-12-07", likes: 8, comments: 3, shares: 1, engagement: 12, thumbnail: "https://media.licdn.com/dms/image/v2/D4E22AQFi7s1PvYW2hQ/feedshare-shrink_480/B4EZr49Y41KMAs-/0/1765113434077", url: "https://www.linkedin.com/feed/update/urn:li:activity:7403422342141411328/" },
  { id: 3, name: "Mi nuevo panita Hosh ki Tsunoda acaba de lanzar un template para crear Figma Plugins en Cursor.", date: "2025-12-22", likes: 32, comments: 2, shares: 5, engagement: 39, thumbnail: "https://media.licdn.com/dms/image/v2/D4E22AQGmiLoKTA0KPA/feedshare-shrink_480/B4EZtHj0T4HMAY-/0/1766432131249", url: "https://www.linkedin.com/feed/update/urn:li:activity:7408953356796465152/" },
  { id: 4, name: "Hay varias herramientas avanzando en cómo sistematizar flujos de diseño a código.", date: "2025-12-22", likes: 49, comments: 0, shares: 5, engagement: 54, thumbnail: "https://media.licdn.com/dms/image/v2/D4E22AQGkJ5gjORzq3Q/feedshare-shrink_1280/B4EZtGexjiGcAs-/0/1766414031763", url: "https://www.linkedin.com/feed/update/urn:li:activity:7408877442754424832/" },
  { id: 5, name: "La conceptualización, diseño e implementación de un design system ya no es un nice to have.", date: "2025-08-07", likes: 3, comments: 0, shares: 0, engagement: 3, thumbnail: "", url: "https://www.linkedin.com/feed/update/urn:li:activity:7359313995368988674/" },
  { id: 6, name: "Ya está publicado mi segundo plugin para Figma.", date: "2026-02-03", likes: 80, comments: 9, shares: 7, engagement: 96, thumbnail: "https://media.licdn.com/dms/image/v2/D4D05AQGQjKsZKsCnHA/videocover-low/B4DZwk9gw9LABU-/0/1770146649774", url: "https://www.linkedin.com/feed/update/urn:li:activity:7424533418946002944/" },
  { id: 7, name: "Ever fallen into an icon search rabbit hole?", date: "2025-12-31", likes: 20, comments: 5, shares: 3, engagement: 28, thumbnail: "https://media.licdn.com/dms/image/v2/D4D05AQFA43sLwQumiA/videocover-low/B4DZtz.8NdH4BU-/0/1767177441797", url: "https://www.linkedin.com/feed/update/urn:li:activity:7412079471329005568/" },
  { id: 8, name: "En sistemas de diseño agénticos, la infraestructura no solo debe ofrecer un mapa para encontrar componentes.", date: "2026-01-21", likes: 11, comments: 1, shares: 1, engagement: 13, thumbnail: "https://media.licdn.com/dms/image/v2/D4D22AQFwDST_CRVUVg/feedshare-shrink_1280/B4DZvg8qH8HgAc-/0/1769005556920", url: "https://www.linkedin.com/feed/update/urn:li:activity:7419747089921957888/" },
  { id: 9, name: "Siempre me ha llamado la atención la falta de estandarización en Diseño.", date: "2026-01-19", likes: 53, comments: 2, shares: 7, engagement: 62, thumbnail: "https://media.licdn.com/dms/image/v2/D4D22AQE5zRI8x3iK-w/feedshare-shrink_480/B4DZvWblYwGUAs-/0/1768829114318", url: "https://www.linkedin.com/feed/update/urn:li:activity:7419007032550215680/" },
  { id: 10, name: "Al crear un prompt, más detalle no significa un mejor output.", date: "2025-12-03", likes: 2, comments: 0, shares: 0, engagement: 2, thumbnail: "https://media.licdn.com/dms/image/v2/D4E22AQEtMY8UlBHt2Q/feedshare-shrink_800/B4EZrj2A00IUAg-/0/1764759179817", url: "https://www.linkedin.com/feed/update/urn:li:activity:7401936493109202944/" },
  { id: 11, name: "Un Design System AI-Ready tiene toda la data que necesita para medir su adopción.", date: "2025-11-20", likes: 6, comments: 0, shares: 0, engagement: 6, thumbnail: "https://media.licdn.com/dms/image/v2/D4E22AQE55wgE8P7wMA/feedshare-shrink_800/B4EZqg6JhpGUAg-/0/1763636189720", url: "https://www.linkedin.com/feed/update/urn:li:activity:7397226331522105344/" },
  { id: 12, name: "Las capas de un Design System AI-Ready.", date: "2025-11-21", likes: 10, comments: 0, shares: 0, engagement: 10, thumbnail: "https://media.licdn.com/dms/image/v2/D4E22AQG9CwvyQpJA-g/feedshare-shrink_1280/B4EZqmuNyPIIAs-/0/1763733725775", url: "https://www.linkedin.com/feed/update/urn:li:activity:7397635425034608640/" },
  { id: 13, name: "¿Qué hace a un Design System AI-Ready?", date: "2025-11-19", likes: 98, comments: 4, shares: 8, engagement: 110, thumbnail: "https://media.licdn.com/dms/image/v2/D4E22AQEFglUefTKD5A/feedshare-shrink_2048_1536/B4EZqbvltkGoAw-/0/1763549535620", url: "https://www.linkedin.com/feed/update/urn:li:activity:7396862876176568320/" },
  { id: 14, name: "Los sistemas de diseño tratan fundamentalmente de codificar decisiones de diseño y contratos.", date: "2026-01-10", likes: 27, comments: 4, shares: 1, engagement: 32, thumbnail: "https://media.licdn.com/dms/image/v2/D4D22AQHHPTX2_-LR5w/feedshare-shrink_800/B4DZuoJznfGkAg-/0/1768052702061", url: "https://www.linkedin.com/feed/update/urn:li:activity:7415750525100593152/" },
  { id: 15, name: "Creé skills para Claude y terminé construyendo un pipeline RAG para mi Design System.", date: "2025-11-18", likes: 4, comments: 0, shares: 0, engagement: 4, thumbnail: "https://media.licdn.com/dms/image/v2/D4E22AQHfVckTRoj4Tw/feedshare-shrink_480/B4EZqXMwp2KYAY-/0/1763473296937", url: "https://www.linkedin.com/feed/update/urn:li:activity:7396543109452484609/" },
  { id: 16, name: "Con Diana Wolosin le dimos forma a nuestra visión de un agentic design system.", date: "2025-12-18", likes: 27, comments: 3, shares: 0, engagement: 30, thumbnail: "https://media.licdn.com/dms/image/v2/D4E22AQGqVq3fexFLzA/feedshare-shrink_1280/B4EZsxE8VvKoAs-/0/1766054939374", url: "https://www.linkedin.com/feed/update/urn:li:activity:7407371299066650625/" },
  { id: 17, name: "I created an AI ideation skill for Claude based on my 3 step framework.", date: "2025-10-24", likes: 4, comments: 0, shares: 0, engagement: 4, thumbnail: "https://media.licdn.com/dms/image/v2/D4E22AQGv79pMuW-dFg/feedshare-shrink_1280/B4EZoXGZ.gKgAs-/0/1761324147105", url: "https://www.linkedin.com/feed/update/urn:li:activity:7387528919962394624/" },
  { id: 18, name: "What's the real ROI of an agentic design system? Trust.", date: "2025-12-29", likes: 20, comments: 3, shares: 0, engagement: 23, thumbnail: "https://media.licdn.com/dms/image/v2/D4D05AQEglquz6xvIqA/videocover-low/B4DZtqLsz_IYBQ-/0/1767013013547", url: "https://www.linkedin.com/feed/update/urn:li:activity:7411389789146378240/" },
  { id: 19, name: "Creé una skill de ideación para Claude Code basado en mi framework de 3 pasos.", date: "2025-10-24", likes: 10, comments: 2, shares: 0, engagement: 12, thumbnail: "https://media.licdn.com/dms/image/v2/D4E22AQEEsaFoP7rT7g/feedshare-shrink_2048_1536/B4EZoX5g4IJgA0-/0/1761337544744", url: "https://www.linkedin.com/feed/update/urn:li:activity:7387585112680480769/" },
  { id: 20, name: "Prueba rápida conectando Claude Code al MCP de Figma.", date: "2025-08-07", likes: 2, comments: 0, shares: 0, engagement: 2, thumbnail: "https://media.licdn.com/dms/image/v2/D4E05AQH6eDzl6kzDFQ/videocover-high/B4EZiB1zoqHgCI-/0/1754525025925", url: "https://www.linkedin.com/feed/update/urn:li:activity:7359011344957730817/" },
  { id: 21, name: "Un ejemplo rápido usando Claude Code para generar una calculadora nutricional.", date: "2025-08-22", likes: 1, comments: 0, shares: 0, engagement: 1, thumbnail: "https://media.licdn.com/dms/image/v2/D4E22AQGFO6k5dF66DQ/feedshare-shrink_800/B4EZjTSOl.HIAg-/0/1755891428734", url: "https://www.linkedin.com/feed/update/urn:li:activity:7364742445705641986/" },
  { id: 22, name: "Con esta skill para Claude genera Variables de Figma en minutos.", date: "2025-11-17", likes: 242, comments: 2, shares: 28, engagement: 272, thumbnail: "https://media.licdn.com/dms/image/v2/D4E05AQE273w4zqcg5w/videocover-low/B4EZqR_YuYGoBU-/0/1763385909943", url: "https://www.linkedin.com/feed/update/urn:li:activity:7396176764034785281/" },
  { id: 23, name: "Hace unos días publiqué un plugin con Claude Skills y pasó las 500 descargas.", date: "2025-11-15", likes: 24, comments: 2, shares: 1, engagement: 27, thumbnail: "https://media.licdn.com/dms/image/v2/D4E22AQELHBpPlmPJAQ/feedshare-shrink_480/B4EZqI6Mb4KYAY-/0/1763233549132", url: "https://www.linkedin.com/feed/update/urn:li:activity:7395537532731531265/" },
  { id: 24, name: "Miren quien se colo de último momento a la AI Design Systems Conference 2026.", date: "2026-02-16", likes: 41, comments: 8, shares: 1, engagement: 50, thumbnail: "https://media.licdn.com/dms/image/v2/D4D22AQHeYdSH2ORBlg/feedshare-shrink_480/B4DZxmZiiQHIAw-/0/1771244497284", url: "https://www.linkedin.com/feed/update/urn:li:activity:7429137883019763714/" },
  { id: 25, name: "Settings en las Variables de Figma que ayudan en flujos de diseño a código.", date: "2025-11-26", likes: 69, comments: 12, shares: 5, engagement: 86, thumbnail: "https://media.licdn.com/dms/image/v2/D4E22AQG2OKIijdsqpg/feedshare-shrink_480/B4EZrAcBBUHoAY-/0/1764165162286", url: "https://www.linkedin.com/feed/update/urn:li:activity:7399445002189172736/" },
  { id: 26, name: "Crea variables de Figma rápidamente desde un screenshot usando un LLM", date: "2025-10-22", likes: 91, comments: 5, shares: 11, engagement: 107, thumbnail: "https://media.licdn.com/dms/image/v2/D4E05AQFHvGqJlk7usQ/videocover-low/B4EZoJbHTQKkB4-/0/1761094699485", url: "https://www.linkedin.com/feed/update/urn:li:activity:7386566570023559169/" },
  { id: 27, name: "Usa Luckino para importar y exportar variables de Figma entre proyectos.", date: "2025-10-14", likes: 18, comments: 0, shares: 1, engagement: 19, thumbnail: "https://media.licdn.com/dms/image/v2/D5622AQEMIITWuwZQqA/feedshare-shrink_1280/B56ZnjK8NjHIA0-/0/1760452920867", url: "https://www.linkedin.com/feed/update/urn:li:activity:7383874731751636992/" },
  { id: 28, name: "One of the hardest things I've ever vibe-coded: a looping logo animation.", date: "2025-08-29", likes: 3, comments: 1, shares: 0, engagement: 4, thumbnail: "https://media.licdn.com/dms/image/v2/D4E05AQEqcUIqYe_OPA/videocover-low/B4EZj2CfQ3GUA4-/0/1756474514845", url: "https://www.linkedin.com/feed/update/urn:li:activity:7367188101435248641/" },
  { id: 29, name: "Cursor acaba de lanzar un editor visual en el browser tab.", date: "2025-12-11", likes: 50, comments: 10, shares: 1, engagement: 61, thumbnail: "https://media.licdn.com/dms/image/v2/D4D05AQEuoxMr0c_kEg/videocover-high/B4DZsOwarXH4BU-/0/1765479134447", url: "https://www.linkedin.com/feed/update/urn:li:activity:7404956234149515264/" },
  { id: 30, name: "Quiero hacer videos de spec-coding. Así que obvio me hice un screen-recorder con Claude Code!", date: "2025-08-05", likes: 8, comments: 0, shares: 0, engagement: 8, thumbnail: "https://media.licdn.com/dms/image/v2/D5622AQHDkav4Zs_47w/feedshare-shrink_480/B56Zh6xOU0G4Ac-/0/1754406382169", url: "https://www.linkedin.com/feed/update/urn:li:activity:7358513712334344193/" },
  { id: 31, name: "Use Claude Code + Pencil para diseñar un plugin de Figma.", date: "2026-01-26", likes: 83, comments: 18, shares: 13, engagement: 114, thumbnail: "https://media.licdn.com/dms/image/v2/D4D05AQFrEsE9YoZULQ/videocover-low/B4DZv6oTt0JYBQ-/0/1769436452647", url: "https://www.linkedin.com/feed/update/urn:li:activity:7421554615202234368/" },
  { id: 32, name: "Las últimas 2 semanas he estado obsesionado mal con Claude Code.", date: "2025-08-04", likes: 4, comments: 2, shares: 0, engagement: 6, thumbnail: "https://media.licdn.com/dms/image/v2/D4E1FAQGXKWLpEux_IA/feedshare-document-cover-images_800/B4EZh1RVdSHIBE-/0/1754314138817", url: "https://www.linkedin.com/feed/update/urn:li:activity:7358129859434291201/" },
  { id: 33, name: "Acabo de publicar la v2 de Code Syntax Generator.", date: "2025-12-18", likes: 22, comments: 1, shares: 1, engagement: 24, thumbnail: "https://media.licdn.com/dms/image/v2/D4D05AQFpl7YNW8o1mA/videocover-high/B4DZsxmNYDKQBY-/0/1766063660070", url: "https://www.linkedin.com/feed/update/urn:li:activity:7407407895186837504/" },
  { id: 34, name: "Quedan un par de cupos para mañana! 2 horitas donde usaremos herramientas y procesos de diseño con IA.", date: "2026-02-13", likes: 21, comments: 4, shares: 1, engagement: 26, thumbnail: "https://media.licdn.com/dms/image/v2/D4D22AQGIkxiuGx93Jw/feedshare-shrink_480/B4DZxXYAGRI8As-/0/1770992435871", url: "https://www.linkedin.com/feed/update/urn:li:activity:7428080662286528513/" },
  { id: 35, name: "El sábado pasado fue la techton, un evento organizado por las comunidades tech en beneficio a bomberos.", date: "2026-01-30", likes: 5, comments: 1, shares: 0, engagement: 6, thumbnail: "", url: "https://www.linkedin.com/feed/update/urn:li:activity:7422975699038130177/" },
  { id: 36, name: "How about a unified memory that can be fed with documents and integrations?", date: "2025-09-01", likes: 0, comments: 0, shares: 0, engagement: 0, thumbnail: "", url: "https://www.linkedin.com/feed/update/urn:li:activity:7368238484806967297/" },
  { id: 37, name: "La falta de determinismo en la UI generativa tiene un costo oculto: el Drift Tax.", date: "2026-01-14", likes: 27, comments: 8, shares: 2, engagement: 37, thumbnail: "https://media.licdn.com/dms/image/v2/D4E05AQHLsCp6SiJUgg/videocover-low/B4EZu8cToAI4BU-/0/1768393097286", url: "https://www.linkedin.com/feed/update/urn:li:activity:7417178252617850880/" },
  { id: 38, name: "La metadata para la IA es la capa semántica que ayuda al modelo a entender tu Design System.", date: "2025-10-30", likes: 12, comments: 2, shares: 0, engagement: 14, thumbnail: "https://media.licdn.com/dms/image/v2/D4D22AQHqAUveNgafDA/feedshare-shrink_2048_1536/B4DZo2K5oRIkA0-/0/1761845419161", url: "https://www.linkedin.com/feed/update/urn:li:activity:7389715293264236545/" },
  { id: 39, name: "Does AI-ready infrastructure just make AI a better user of design systems?", date: "2026-01-02", likes: 6, comments: 0, shares: 1, engagement: 7, thumbnail: "https://media.licdn.com/dms/image/v2/D4D22AQFUjQic4x98Dg/feedshare-shrink_2048_1536/B4DZt.qCp9IYAw-/0/1767356510154", url: "https://www.linkedin.com/feed/update/urn:li:activity:7412830486147883009/" },
  { id: 40, name: "Ayer les comentaba de Pencil. Hoy hice una prueba rápida directo en la repo de nuestro design system.", date: "2026-01-22", likes: 130, comments: 18, shares: 14, engagement: 162, thumbnail: "https://media.licdn.com/dms/image/v2/D4D05AQHj2L7XLGDNNA/videocover-low/B4DZvmBqpfJoBQ-/0/1769090773430", url: "https://www.linkedin.com/feed/update/urn:li:activity:7420104697681838080/" },
  { id: 41, name: "Un detalle del skill-creator que encontré el otro día justo en una charla.", date: "2025-12-01", likes: 5, comments: 2, shares: 0, engagement: 7, thumbnail: "https://media.licdn.com/dms/image/v2/D4E22AQHAEqGSFhuukA/feedshare-shrink_800/B4EZraLUJmHoAk-/0/1764596991071", url: "https://www.linkedin.com/feed/update/urn:li:activity:7401256223460839425/" },
  { id: 42, name: "Algunas features de Figma en el día a día las dejamos en el olvido, pero pueden ser clave al dar contexto a la IA.", date: "2025-10-10", likes: 2, comments: 2, shares: 0, engagement: 4, thumbnail: "https://media.licdn.com/dms/image/v2/D4E05AQFVCKcfW8Sqeg/videocover-high/B4EZnN7WNSGcCA-/0/1760096519669", url: "https://www.linkedin.com/feed/update/urn:li:activity:7382379909769240576/" },
  { id: 43, name: "Demo completa de nuestro proyecto con Nemo para la hackaton de Into Design Systems.", date: "2026-02-12", likes: 66, comments: 9, shares: 10, engagement: 85, thumbnail: "https://media.licdn.com/dms/image/v2/D4D05AQG8v2XUxCd5vg/videocover-low/B4DZxSFmuHGQBY-/0/1770903752584", url: "https://www.linkedin.com/feed/update/urn:li:activity:7427708951468752896/" },
  { id: 44, name: "Con Nemo le metimos más de 30hrs reales a nuestro proyecto para la Hackaton de Into Design Systems.", date: "2026-02-08", likes: 77, comments: 9, shares: 3, engagement: 89, thumbnail: "https://media.licdn.com/dms/image/v2/D4D05AQEiZ5Bv8MisOw/videocover-high/B4DZw9mu1XG4BY-/0/1770560093994", url: "https://www.linkedin.com/feed/update/urn:li:activity:7426267382148665344/" },
  { id: 45, name: "¿La IA reemplazará equipos completos? Depende. De quién esté a cargo.", date: "2025-08-04", likes: 1, comments: 0, shares: 0, engagement: 1, thumbnail: "", url: "https://www.linkedin.com/feed/update/urn:li:activity:7358182831501549574/" },
  { id: 46, name: "Me la paso sistematizando y optimizando la forma en que trabajo con IA.", date: "2025-12-01", likes: 10, comments: 2, shares: 0, engagement: 12, thumbnail: "https://media.licdn.com/dms/image/v2/D4E22AQEGsmgPxNEQEg/feedshare-shrink_2048_1536/B4EZrZzEszIUA0-/0/1764590638232", url: "https://www.linkedin.com/feed/update/urn:li:activity:7401229578737700864/" },
  { id: 47, name: "Claude Skills para flujos de diseño listas para usar!", date: "2025-11-13", likes: 27, comments: 0, shares: 3, engagement: 30, thumbnail: "https://media.licdn.com/dms/image/v2/D5605AQEgDC9KZFd-EA/videocover-high/B56Zp.FoR4JQBU-/0/1763051999343", url: "https://www.linkedin.com/feed/update/urn:li:activity:7394776081515515905/" },
];

// ── TAGGING ───────────────────────────────────────────────────────────────────
function detectLang(name) {
  const en = /\b(the |a |an |of |is |are |was |for |that|this|with|have|has |what|how |about|just|ever|does|make|real|only|one |been|into|can |you |your|our |my |we |they|it )\b/i;
  return (name.match(en) || []).length >= 2 ? "EN" : "ES";
}
function detectType(name) {
  const n = name.toLowerCase();
  if (/creé|publiqué|acabo de|ya está|hice |made|built|created|just |launched|published|v2|primer plugin|segundo plugin|skill.*listas|lanzar un template/.test(n)) return "demo";
  if (/qué hace|cómo |settings|usa |features|flujo|capas|desde un|rápida|rápido|import|export|usar!/.test(n)) return "framework";
  if (/hackaton|techton|conference|cupos|evento|panita|se colo|nemo|diana/.test(n)) return "announcement";
  return "observation";
}

const TYPE_META = {
  demo:         { label: "Demo",     color: "#e8ff47", bg: "rgba(232,255,71,0.1)" },
  framework:    { label: "How-to",   color: "#74b9ff", bg: "rgba(116,185,255,0.1)" },
  observation:  { label: "Take",     color: "#fd79a8", bg: "rgba(253,121,168,0.1)" },
  announcement: { label: "Announce", color: "#a29bfe", bg: "rgba(162,155,254,0.1)" },
};

const DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const POSTS = RAW_POSTS.map(p => {
  const d = new Date(p.date + "T12:00:00");
  return { ...p, lang: detectLang(p.name), type: detectType(p.name), dow: DAYS[d.getDay()], month: `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`, monthLabel: `${MONTHS[d.getMonth()]} ${String(d.getFullYear()).slice(2)}` };
});

// ── COMPUTED ──────────────────────────────────────────────────────────────────
function useInsights() {
  return useMemo(() => {
    // By type
    const byType = {};
    POSTS.forEach(p => {
      if (!byType[p.type]) byType[p.type] = { count: 0, eng: 0, shares: 0 };
      byType[p.type].count++; byType[p.type].eng += p.engagement; byType[p.type].shares += p.shares;
    });
    const typeAvgs = Object.entries(byType).map(([t, v]) => ({ type: t, avg: Math.round(v.eng / v.count), count: v.count, shares: v.shares })).sort((a,b) => b.avg - a.avg);

    // By lang
    const byLang = {};
    POSTS.forEach(p => {
      if (!byLang[p.lang]) byLang[p.lang] = { count: 0, eng: 0 };
      byLang[p.lang].count++; byLang[p.lang].eng += p.engagement;
    });
    const langAvgs = Object.entries(byLang).map(([l,v]) => ({ lang: l, avg: Math.round(v.eng/v.count), count: v.count }));

    // By DOW
    const byDow = {};
    DAYS.forEach(d => byDow[d] = { count: 0, eng: 0 });
    POSTS.forEach(p => { byDow[p.dow].count++; byDow[p.dow].eng += p.engagement; });
    const dowData = DAYS.map(d => ({ day: d, count: byDow[d].count, avg: byDow[d].count ? Math.round(byDow[d].eng / byDow[d].count) : 0 }));

    // Type x DOW matrix (Mon/Wed/Thu only — the meaningful ones)
    const typeDay = {};
    POSTS.forEach(p => {
      const k = `${p.type}_${p.dow}`;
      if (!typeDay[k]) typeDay[k] = { count: 0, total: 0 };
      typeDay[k].count++; typeDay[k].total += p.engagement;
    });
    const typeDayMatrix = Object.entries(typeDay).map(([k, v]) => {
      const [type, day] = k.split("_");
      return { type, day, avg: Math.round(v.total / v.count), count: v.count };
    });

    // By month
    const byMonth = {};
    POSTS.forEach(p => {
      if (!byMonth[p.month]) byMonth[p.month] = { count: 0, eng: 0, label: p.monthLabel };
      byMonth[p.month].count++; byMonth[p.month].eng += p.engagement;
    });
    const monthData = Object.entries(byMonth).sort().map(([m, v]) => ({ month: m, label: v.label, count: v.count, avg: Math.round(v.eng / v.count), total: v.eng }));

    // Growth
    const sorted = [...POSTS].sort((a,b) => new Date(a.date) - new Date(b.date));
    const mid = Math.floor(sorted.length / 2);
    const earlyAvg = Math.round(sorted.slice(0,mid).reduce((s,p) => s+p.engagement, 0) / mid);
    const lateAvg = Math.round(sorted.slice(mid).reduce((s,p) => s+p.engagement, 0) / (sorted.length - mid));

    // Share leaders
    const shareLeaders = [...POSTS].sort((a,b) => b.shares - a.shares).slice(0,3);

    // Best slot: type x day for demo/framework on Mon/Wed
    const bestSlots = typeDayMatrix.filter(t => ["demo","framework"].includes(t.type) && ["Mon","Wed","Thu"].includes(t.day) && t.count >= 1).sort((a,b) => b.avg - a.avg).slice(0,4);

    return { typeAvgs, langAvgs, dowData, typeDayMatrix, monthData, earlyAvg, lateAvg, shareLeaders, bestSlots };
  }, []);
}

// ── SPARKLINE ─────────────────────────────────────────────────────────────────
function Sparkline({ data, color = "#e8ff47" }) {
  if (!data.length) return null;
  const max = Math.max(...data, 1);
  const W = 100, H = 32;
  const pts = data.map((v,i) => `${(i/Math.max(data.length-1,1))*W},${H-(v/max)*(H-2)}`).join(" ");
  const area = `0,${H} ${pts} ${W},${H}`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width:"100%", height:H, display:"block" }} preserveAspectRatio="none">
      <defs><linearGradient id="sg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity="0.2"/><stop offset="100%" stopColor={color} stopOpacity="0"/></linearGradient></defs>
      <polygon points={area} fill="url(#sg)"/>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round"/>
    </svg>
  );
}

// ── DOW CHART ─────────────────────────────────────────────────────────────────
function DowChart({ dowData, typeDayMatrix, activeType }) {
  const maxAvg = Math.max(...dowData.map(d => d.avg), 1);
  const BAD_DAY = "Fri";
  const GOOD_DAYS = ["Mon","Wed"];

  return (
    <div>
      <div style={{ display:"flex", gap:4, alignItems:"flex-end", height:80 }}>
        {dowData.map(d => {
          const pct = d.avg / maxAvg;
          const isBad = d.day === BAD_DAY;
          const isGood = GOOD_DAYS.includes(d.day);
          const color = isBad ? "#ff6b6b" : isGood ? "#e8ff47" : "rgba(255,255,255,0.25)";
          // overlay type avg for active type
          const typeStat = activeType !== "all" ? typeDayMatrix.find(t => t.type === activeType && t.day === d.day) : null;
          const typeH = typeStat ? Math.round((typeStat.avg / maxAvg) * 68) : 0;
          return (
            <div key={d.day} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:3 }}>
              {typeStat && (
                <div style={{ width:"100%", height:typeH, background: TYPE_META[activeType]?.color, borderRadius:"3px 3px 0 0", opacity:0.6, minHeight:2 }} />
              )}
              <div style={{ width:"100%", height: Math.max(Math.round(pct * 68), 2), background: color, borderRadius: typeStat ? "0" : "3px 3px 0 0", opacity: d.count === 0 ? 0.15 : 1 }} />
              <div style={{ fontSize:9, fontFamily:"'DM Mono', monospace", color: isGood ? "#e8ff47" : isBad ? "#ff6b6b" : "rgba(255,255,255,0.3)", letterSpacing:0.5 }}>{d.day}</div>
              <div style={{ fontSize:8, fontFamily:"'DM Mono', monospace", color:"rgba(255,255,255,0.25)" }}>{d.avg}</div>
            </div>
          );
        })}
      </div>
      <div style={{ fontSize:10, color:"rgba(255,255,255,0.25)", fontStyle:"italic", marginTop:8, lineHeight:1.5 }}>
        Fri avg: <span style={{color:"#ff6b6b"}}>8</span> · Mon avg: <span style={{color:"#e8ff47"}}>57</span> · every post over 100 eng went out Mon, Wed, or Thu
      </div>
    </div>
  );
}

// ── MONTHLY CHART ─────────────────────────────────────────────────────────────
function MonthlyChart({ monthData }) {
  const maxAvg = Math.max(...monthData.map(m => m.avg), 1);
  return (
    <div>
      <div style={{ display:"flex", gap:4, alignItems:"flex-end", height:64 }}>
        {monthData.map(m => {
          const pct = m.avg / maxAvg;
          const isNov = m.month === "2025-11";
          return (
            <div key={m.month} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:3 }}>
              <div style={{ width:"100%", height: Math.max(Math.round(pct*52),2), background: isNov ? "#e8ff47" : "rgba(255,255,255,0.18)", borderRadius:"3px 3px 0 0", position:"relative" }}>
                {isNov && <div style={{ position:"absolute", top:-14, left:"50%", transform:"translateX(-50%)", fontSize:9, color:"#e8ff47", fontFamily:"'DM Mono', monospace", whiteSpace:"nowrap" }}>peak</div>}
              </div>
              <div style={{ fontSize:8, fontFamily:"'DM Mono', monospace", color: isNov ? "#e8ff47" : "rgba(255,255,255,0.25)", letterSpacing:0.3 }}>{m.label}</div>
            </div>
          );
        })}
      </div>
      <div style={{ fontSize:10, color:"rgba(255,255,255,0.25)", fontStyle:"italic", marginTop:6 }}>avg engagement per month</div>
    </div>
  );
}

// ── INSIGHT CARD ──────────────────────────────────────────────────────────────
function InsightCard({ emoji, title, accent, children }) {
  return (
    <div style={{ background:"rgba(255,255,255,0.025)", border:"1px solid rgba(255,255,255,0.06)", borderTop:`2px solid ${accent}`, borderRadius:10, padding:"14px 16px", flex:"1 1 200px" }}>
      <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:12 }}>
        <span>{emoji}</span>
        <span style={{ fontSize:10, fontFamily:"'DM Mono', monospace", color:"rgba(255,255,255,0.3)", textTransform:"uppercase", letterSpacing:1.5 }}>{title}</span>
      </div>
      {children}
    </div>
  );
}

function Bar({ pct, color, h=4 }) {
  return (
    <div style={{ height:h, background:"rgba(255,255,255,0.06)", borderRadius:2, overflow:"hidden" }}>
      <div style={{ height:"100%", width:`${pct}%`, background:color, borderRadius:2, transition:"width 0.5s" }}/>
    </div>
  );
}

function Pill({ label, color, bg }) {
  return <span style={{ fontSize:9, fontFamily:"'DM Mono', monospace", color, background:bg, padding:"2px 6px", borderRadius:4, letterSpacing:0.5 }}>{label}</span>;
}

function StatCard({ label, value, accent="#e8ff47" }) {
  return (
    <div style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:10, padding:"14px 16px", flex:"1 1 100px" }}>
      <div style={{ fontSize:22, fontWeight:700, color:accent, fontFamily:"'DM Mono', monospace", letterSpacing:-1 }}>{value}</div>
      <div style={{ fontSize:10, color:"rgba(255,255,255,0.3)", marginTop:3, textTransform:"uppercase", letterSpacing:1 }}>{label}</div>
    </div>
  );
}

// ── POST CARD ─────────────────────────────────────────────────────────────────
function PostCard({ post, maxEng }) {
  const [err, setErr] = useState(false);
  const tm = TYPE_META[post.type];
  const dowColor = post.dow === "Fri" ? "#ff6b6b" : ["Mon","Wed"].includes(post.dow) ? "#e8ff47" : "rgba(255,255,255,0.3)";
  return (
    <a href={post.url} target="_blank" rel="noopener noreferrer"
      style={{ display:"flex", gap:12, padding:"11px 13px", borderRadius:9, background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.055)", textDecoration:"none", transition:"all 0.15s", alignItems:"flex-start" }}
      onMouseEnter={e => { e.currentTarget.style.background="rgba(232,255,71,0.04)"; e.currentTarget.style.borderColor="rgba(232,255,71,0.15)"; e.currentTarget.style.transform="translateY(-1px)"; }}
      onMouseLeave={e => { e.currentTarget.style.background="rgba(255,255,255,0.02)"; e.currentTarget.style.borderColor="rgba(255,255,255,0.055)"; e.currentTarget.style.transform="none"; }}
    >
      <div style={{ width:56, height:56, borderRadius:7, overflow:"hidden", flexShrink:0, background:"rgba(255,255,255,0.05)", display:"flex", alignItems:"center", justifyContent:"center" }}>
        {post.thumbnail && !err ? <img src={post.thumbnail} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} onError={() => setErr(true)}/> : <span style={{ fontSize:16 }}>📝</span>}
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ display:"flex", gap:4, marginBottom:5, flexWrap:"wrap", alignItems:"center" }}>
          <Pill label={tm.label} color={tm.color} bg={tm.bg}/>
          <Pill label={post.lang} color={post.lang==="ES"?"#e8ff47":"#74b9ff"} bg="rgba(255,255,255,0.05)"/>
          <span style={{ fontSize:9, fontFamily:"'DM Mono', monospace", color:dowColor, marginLeft:2 }}>{post.dow}</span>
        </div>
        <div style={{ fontSize:12, color:"rgba(255,255,255,0.8)", lineHeight:1.45, marginBottom:7, display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", overflow:"hidden" }}>{post.name}</div>
        <div style={{ display:"flex", gap:10, alignItems:"center", flexWrap:"wrap" }}>
          <span style={{ fontSize:10, color:"rgba(255,255,255,0.2)", fontFamily:"'DM Mono', monospace" }}>{new Date(post.date).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"2-digit"})}</span>
          {[["♥",post.likes,"#ff6b6b"],["💬",post.comments,"#74b9ff"],["↗",post.shares,"#a29bfe"]].map(([icon,val,color]) => (
            <span key={icon} style={{ display:"flex", alignItems:"center", gap:3, fontSize:10, color:"rgba(255,255,255,0.4)", fontFamily:"'DM Mono', monospace" }}>
              <span style={{ fontSize:9, color }}>{icon}</span>{val}
            </span>
          ))}
          <span style={{ marginLeft:"auto", fontSize:10, color:"rgba(232,255,71,0.55)", fontFamily:"'DM Mono', monospace" }}>{post.engagement} eng</span>
        </div>
        <div style={{ height:3, background:"rgba(255,255,255,0.05)", borderRadius:2, marginTop:5, overflow:"hidden" }}>
          <div style={{ height:"100%", width:`${(post.engagement/maxEng)*100}%`, background:"linear-gradient(90deg,#e8ff47,#b5cc2a)", borderRadius:2 }}/>
        </div>
      </div>
    </a>
  );
}

// ── MAIN ──────────────────────────────────────────────────────────────────────
const SORT_OPTS = [{k:"date",l:"Date"},{k:"engagement",l:"Eng"},{k:"likes",l:"Likes"},{k:"comments",l:"Cmts"},{k:"shares",l:"Shares"}];

export default function Dashboard() {
  const [sort, setSort] = useState("date");
  const [dir, setDir] = useState("desc");
  const [search, setSearch] = useState("");
  const [typeF, setTypeF] = useState("all");
  const [langF, setLangF] = useState("all");
  const [chart, setChart] = useState("engagement");
  const [dowType, setDowType] = useState("all"); // for DOW overlay

  const ins = useInsights();

  const filtered = useMemo(() => {
    let d = POSTS.filter(p =>
      (typeF === "all" || p.type === typeF) &&
      (langF === "all" || p.lang === langF) &&
      (!search || p.name.toLowerCase().includes(search.toLowerCase()))
    );
    d.sort((a,b) => {
      const va = sort === "date" ? new Date(a.date) : a[sort];
      const vb = sort === "date" ? new Date(b.date) : b[sort];
      return dir === "desc" ? vb - va : va - vb;
    });
    return d;
  }, [sort, dir, search, typeF, langF]);

  const maxEng = Math.max(...POSTS.map(p => p.engagement));
  const totalEng = POSTS.reduce((s,p) => s+p.engagement, 0);
  const totalLikes = POSTS.reduce((s,p) => s+p.likes, 0);
  const totalShares = POSTS.reduce((s,p) => s+p.shares, 0);
  const avgEng = Math.round(totalEng / POSTS.length);
  const topPost = POSTS.reduce((a,b) => a.engagement > b.engagement ? a : b);
  const maxTypeAvg = Math.max(...ins.typeAvgs.map(t => t.avg));
  const growth = (ins.lateAvg / Math.max(ins.earlyAvg,1)).toFixed(1);
  const esL = ins.langAvgs.find(l => l.lang === "ES");
  const enL = ins.langAvgs.find(l => l.lang === "EN");

  const toggleSort = k => { if (sort===k) setDir(d => d==="desc"?"asc":"desc"); else { setSort(k); setDir("desc"); } };
  const chartData = POSTS.sort((a,b) => new Date(a.date)-new Date(b.date)).map(p => p[chart]);

  const btnBase = (active, color="#e8ff47") => ({
    background: active ? `rgba(${color==="#e8ff47"?"232,255,71":color==="#74b9ff"?"116,185,255":color==="#a29bfe"?"162,155,254":"255,255,255"},0.1)` : "rgba(255,255,255,0.02)",
    border: `1px solid ${active ? color : "rgba(255,255,255,0.07)"}`,
    borderRadius:6, padding:"5px 9px",
    color: active ? color : "rgba(255,255,255,0.3)",
    fontSize:10, cursor:"pointer", fontFamily:"'DM Mono', monospace",
  });

  return (
    <div style={{ minHeight:"100vh", background:"#090a0c", color:"#fff", fontFamily:"'DM Sans', sans-serif", padding:"24px 18px", maxWidth:920, margin:"0 auto" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet"/>

      {/* Header */}
      <div style={{ marginBottom:24 }}>
        <div style={{ fontSize:10, color:"#e8ff47", fontFamily:"'DM Mono', monospace", letterSpacing:2, textTransform:"uppercase", marginBottom:4 }}>LinkedIn Analytics</div>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", flexWrap:"wrap", gap:10 }}>
          <div>
            <h1 style={{ margin:0, fontSize:22, fontWeight:700, letterSpacing:-0.5 }}>@cristian-morales-achiardi</h1>
            <p style={{ margin:"3px 0 0", fontSize:11, color:"rgba(255,255,255,0.28)" }}>47 posts · Aug 2025 — Feb 2026</p>
          </div>
          <div style={{ display:"flex", gap:6 }}>
            {["engagement","shares"].map(m => (
              <button key={m} onClick={() => setChart(m)} style={btnBase(chart===m, m==="shares"?"#a29bfe":"#e8ff47")}>{m}</button>
            ))}
          </div>
        </div>
        <div style={{ marginTop:10 }}><Sparkline data={chartData} color={chart==="shares"?"#a29bfe":"#e8ff47"}/></div>
      </div>

      {/* Stats */}
      <div style={{ display:"flex", gap:8, marginBottom:18, flexWrap:"wrap" }}>
        <StatCard label="Total eng" value={totalEng.toLocaleString()}/>
        <StatCard label="Avg / post" value={avgEng}/>
        <StatCard label="Likes" value={totalLikes.toLocaleString()} accent="#ff6b6b"/>
        <StatCard label="Shares" value={totalShares} accent="#a29bfe"/>
        <StatCard label="Growth" value={`${growth}×`} accent="#fd79a8"/>
      </div>

      {/* ── PATTERNS ── */}
      <div style={{ marginBottom:18 }}>
        <div style={{ fontSize:10, color:"rgba(255,255,255,0.25)", fontFamily:"'DM Mono', monospace", letterSpacing:2, textTransform:"uppercase", marginBottom:10 }}>Patterns</div>
        <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>

          {/* Post type */}
          <InsightCard emoji="📊" title="Type vs engagement" accent="#e8ff47">
            {ins.typeAvgs.map(t => {
              const tm = TYPE_META[t.type];
              return (
                <div key={t.type} style={{ marginBottom:9 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                    <Pill label={tm.label} color={tm.color} bg={tm.bg}/>
                    <span style={{ fontSize:10, color:"rgba(255,255,255,0.35)", fontFamily:"'DM Mono', monospace" }}>{t.avg} avg · {t.count}p</span>
                  </div>
                  <Bar pct={(t.avg/maxTypeAvg)*100} color={tm.color}/>
                </div>
              );
            })}
          </InsightCard>

          {/* DOW */}
          <InsightCard emoji="📅" title="Day of week" accent="#e8ff47">
            <div style={{ display:"flex", gap:5, marginBottom:10 }}>
              {["all","demo","framework"].map(t => (
                <button key={t} onClick={() => setDowType(t)} style={{ ...btnBase(dowType===t, t==="all"?"#fff":TYPE_META[t]?.color), padding:"3px 7px", fontSize:9 }}>
                  {t==="all"?"All":TYPE_META[t].label}
                </button>
              ))}
            </div>
            <DowChart dowData={ins.dowData} typeDayMatrix={ins.typeDayMatrix} activeType={dowType}/>
          </InsightCard>

          {/* Monthly */}
          <InsightCard emoji="📆" title="Monthly avg eng" accent="#74b9ff">
            <MonthlyChart monthData={ins.monthData}/>
            <div style={{ marginTop:10, fontSize:11, color:"rgba(255,255,255,0.28)", fontStyle:"italic", lineHeight:1.5 }}>
              Nov 2025 breakout: Figma variables skill post. Feb 2026 avg is highest but only 5 posts so far.
            </div>
          </InsightCard>

          {/* Best slots */}
          <InsightCard emoji="🎯" title="Best posting slots" accent="#a29bfe">
            <div style={{ fontSize:11, color:"rgba(255,255,255,0.3)", marginBottom:10, lineHeight:1.5 }}>
              Type × day combos with highest avg engagement
            </div>
            {ins.bestSlots.map((s,i) => {
              const tm = TYPE_META[s.type];
              const dowColor = s.day==="Mon"?"#e8ff47":s.day==="Wed"?"#74b9ff":"rgba(255,255,255,0.5)";
              return (
                <div key={i} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
                  <span style={{ fontSize:9, color:"rgba(255,255,255,0.2)", fontFamily:"'DM Mono', monospace", minWidth:12 }}>{i+1}</span>
                  <Pill label={tm.label} color={tm.color} bg={tm.bg}/>
                  <span style={{ fontSize:11, fontWeight:600, color:dowColor, fontFamily:"'DM Mono', monospace" }}>{s.day}</span>
                  <span style={{ marginLeft:"auto", fontSize:12, fontWeight:700, color:"#e8ff47", fontFamily:"'DM Mono', monospace" }}>{s.avg}</span>
                  <span style={{ fontSize:10, color:"rgba(255,255,255,0.2)", fontFamily:"'DM Mono', monospace" }}>avg</span>
                </div>
              );
            })}
            <div style={{ marginTop:8, fontSize:10, color:"rgba(255,255,255,0.2)", fontStyle:"italic" }}>
              Demo on Fri averages 5. Same post on Mon: 164.
            </div>
          </InsightCard>

          {/* Language split */}
          <InsightCard emoji="🌐" title="Language split" accent="#74b9ff">
            {[esL,enL].filter(Boolean).map(l => {
              const color = l.lang==="ES"?"#e8ff47":"#74b9ff";
              const pct = Math.round((l.count/POSTS.length)*100);
              return (
                <div key={l.lang} style={{ marginBottom:10 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                    <span style={{ fontSize:13, fontWeight:600, color, fontFamily:"'DM Mono', monospace" }}>{l.lang}</span>
                    <span style={{ fontSize:10, color:"rgba(255,255,255,0.35)", fontFamily:"'DM Mono', monospace" }}>{l.avg} avg · {l.count}p ({pct}%)</span>
                  </div>
                  <Bar pct={pct} color={color}/>
                </div>
              );
            })}
            {esL && enL && <div style={{ marginTop:8, fontSize:11, color:"rgba(255,255,255,0.28)", fontStyle:"italic", lineHeight:1.5 }}>ES gets <span style={{color:"#e8ff47"}}>{Math.round(esL.avg/Math.max(enL.avg,1))}×</span> more engagement than EN.</div>}
          </InsightCard>

          {/* Spread leaders */}
          <InsightCard emoji="↗" title="Spread leaders" accent="#a29bfe">
            {ins.shareLeaders.map((p,i) => (
              <div key={p.id} style={{ display:"flex", gap:8, marginBottom:9, alignItems:"flex-start" }}>
                <span style={{ fontSize:10, color:"rgba(255,255,255,0.15)", fontFamily:"'DM Mono', monospace", minWidth:12, marginTop:1 }}>{i+1}</span>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:11, color:"rgba(255,255,255,0.7)", lineHeight:1.4, marginBottom:2, display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", overflow:"hidden" }}>{p.name}</div>
                  <span style={{ fontSize:10, color:"#a29bfe", fontFamily:"'DM Mono', monospace" }}>{p.shares} shares · {p.engagement} eng</span>
                </div>
              </div>
            ))}
            <div style={{ marginTop:4, fontSize:10, color:"rgba(255,255,255,0.22)", fontStyle:"italic" }}>Shares = your audience thinks their network needs this.</div>
          </InsightCard>

          {/* Growth */}
          <InsightCard emoji="📈" title="Growth inflection" accent="#fd79a8">
            <div style={{ display:"flex", gap:20, marginBottom:12, alignItems:"flex-end" }}>
              <div>
                <div style={{ fontSize:20, fontWeight:700, color:"rgba(255,255,255,0.2)", fontFamily:"'DM Mono', monospace" }}>{ins.earlyAvg}</div>
                <div style={{ fontSize:9, color:"rgba(255,255,255,0.2)", fontFamily:"'DM Mono', monospace", marginTop:2 }}>EARLY AVG</div>
              </div>
              <div style={{ color:"#fd79a8", fontSize:14, marginBottom:4 }}>→</div>
              <div>
                <div style={{ fontSize:20, fontWeight:700, color:"#fd79a8", fontFamily:"'DM Mono', monospace" }}>{ins.lateAvg}</div>
                <div style={{ fontSize:9, color:"rgba(253,121,168,0.45)", fontFamily:"'DM Mono', monospace", marginTop:2 }}>RECENT AVG</div>
              </div>
              <div style={{ marginLeft:"auto" }}>
                <div style={{ fontSize:30, fontWeight:700, color:"#e8ff47", fontFamily:"'DM Mono', monospace", lineHeight:1 }}>{growth}×</div>
              </div>
            </div>
            <div style={{ fontSize:11, color:"rgba(255,255,255,0.28)", fontStyle:"italic", lineHeight:1.6 }}>Inflection ~Nov 2025. Switched from observations to demos and tool releases.</div>
          </InsightCard>

        </div>
      </div>

      {/* Top post */}
      <div style={{ background:"rgba(232,255,71,0.05)", border:"1px solid rgba(232,255,71,0.15)", borderRadius:9, padding:"9px 13px", marginBottom:18, display:"flex", alignItems:"center", gap:10 }}>
        <span>🏆</span>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:9, color:"rgba(232,255,71,0.5)", fontFamily:"'DM Mono', monospace", letterSpacing:1, marginBottom:1 }}>TOP POST · DEMO · ES · MON</div>
          <div style={{ fontSize:12, color:"#fff", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{topPost.name}</div>
        </div>
        <div style={{ textAlign:"right", flexShrink:0 }}>
          <div style={{ fontSize:20, fontWeight:700, color:"#e8ff47", fontFamily:"'DM Mono', monospace" }}>{topPost.engagement}</div>
          <div style={{ fontSize:9, color:"rgba(255,255,255,0.2)", fontFamily:"'DM Mono', monospace" }}>ENG</div>
        </div>
      </div>

      {/* Controls */}
      <div style={{ display:"flex", gap:7, marginBottom:10, flexWrap:"wrap", alignItems:"center" }}>
        <input type="text" placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)}
          style={{ flex:1, minWidth:140, background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:7, padding:"7px 11px", color:"#fff", fontSize:12, outline:"none", fontFamily:"'DM Sans', sans-serif" }}/>
        <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
          {["all","demo","framework","observation","announcement"].map(f => {
            const tm = f!=="all"?TYPE_META[f]:null;
            const active = typeF===f;
            return <button key={f} onClick={() => setTypeF(f)} style={{ ...btnBase(active, tm?.color||"#fff"), background:active&&tm?tm.bg:active?"rgba(255,255,255,0.08)":"rgba(255,255,255,0.02)", borderColor:active&&tm?tm.color:active?"rgba(255,255,255,0.3)":"rgba(255,255,255,0.07)", color:active&&tm?tm.color:active?"#fff":"rgba(255,255,255,0.3)" }}>{f==="all"?"All":TYPE_META[f].label}</button>;
          })}
        </div>
        <div style={{ display:"flex", gap:4 }}>
          {["all","ES","EN"].map(f => {
            const active = langF===f;
            const color = f==="ES"?"#e8ff47":f==="EN"?"#74b9ff":"#fff";
            return <button key={f} onClick={() => setLangF(f)} style={{ ...btnBase(active,color) }}>{f==="all"?"ES+EN":f}</button>;
          })}
        </div>
        <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
          {SORT_OPTS.map(({k,l}) => (
            <button key={k} onClick={() => toggleSort(k)} style={{ ...btnBase(sort===k), display:"flex", alignItems:"center", gap:3 }}>
              {l}{sort===k&&<span style={{fontSize:8}}>{dir==="desc"?"↓":"↑"}</span>}
            </button>
          ))}
        </div>
      </div>

      <div style={{ fontSize:10, color:"rgba(255,255,255,0.18)", fontFamily:"'DM Mono', monospace", marginBottom:10 }}>{filtered.length} of {POSTS.length} posts</div>

      <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
        {filtered.map(post => <PostCard key={post.id} post={post} maxEng={maxEng}/>)}
        {filtered.length===0 && <div style={{ textAlign:"center", padding:40, color:"rgba(255,255,255,0.12)", fontFamily:"'DM Mono', monospace", fontSize:11 }}>no posts match</div>}
      </div>
    </div>
  );
}
