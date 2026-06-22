import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Header, Footer, PageNumber, Table, TableRow, TableCell } from "docx";
import { saveAs } from "file-saver";
import { jsPDF } from 'jspdf';
import pptxgen from "pptxgenjs";
import autoTable from 'jspdf-autotable';
import { Editorial, ExpertiseArea } from '../types';

// Helper: Ensure we have chapters to export
export const getBookChapters = (editorials: Editorial[]): Editorial[] => {
  if (editorials.length > 0) {
    return editorials;
  }
  return [
    {
      id: 'ch_1',
      title: 'TRATADO PRÁCTICO FRENTE A LAS AUDITORÍAS DEL COGEP Y CONTRADICCIONES LEGALES',
      summary: 'Metodología operacional para la prevención del riesgo procesal en el sector comercial ecuatoriano.',
      content: 'El control y la defensa legal en el Ecuador por parte de los tribunales ha implementado rigores formales bajo el COGEP.\nUn análisis de caso integral exige registrar con precisión los plazos de vencimiento y las excepciones previas aplicables.',
      area: ExpertiseArea.CONSTITUCIONAL,
      author: 'Especialistas de SOLJURE',
      date: '02 de Junio de 2026',
      readTime: '5 min'
    },
    {
      id: 'ch_2',
      title: 'ESTUDIO DOCTRINARIO DE VALORACIÓN PROCESAL BAJO EL COIP EN MATERIA CORPORATIVA',
      summary: 'Análisis crítico sobre la responsabilidad penal de las personas jurídicas en el Ecuador.',
      content: 'El debido proceso constituye la garantía procesal de mayor trascendencia en el Ecuador contemporáneo del año 2026.',
      area: ExpertiseArea.PENAL,
      author: 'Dirección Jurídica SOLJURE',
      date: '02 de Junio de 2026',
      readTime: '6 min'
    }
  ];
};

// Markdown AST-like content block parser to render tables and headers properly in all formats
export function cleanEditorialContent(content: string): string {
  if (!content) return "";
  
  const lines = content.split('\n');
  const filteredLines = lines.filter(line => {
    const trimmed = line.trim().toLowerCase();
    
    // Check for Vance-Cevallos, Vance-Ceballos or any other fictional author references
    if (trimmed.includes("vance-cevallos") || trimmed.includes("vance-ceballos") || trimmed.includes("alejandro vance")) {
      return false;
    }
    
    // Strip headers/rows that say "Por: Consejo Editorial", etc. 
    if (trimmed.includes("consejo editorial") || trimmed.includes("director editorial") || trimmed.includes("director de publicaciones")) {
      return false;
    }

    if (trimmed.startsWith("por:") || trimmed.startsWith("*por:") || trimmed.startsWith("**por:") || trimmed.startsWith("***por:")) {
      return false;
    }

    if (trimmed.startsWith("por ") && (trimmed.includes("editorial") || trimmed.includes("autor") || trimmed.includes("soljure") || trimmed.includes("doctor") || trimmed.includes("abg") || trimmed.includes("abogado") || trimmed.includes("equipo"))) {
      return false;
    }
    
    if (trimmed.includes("revista de soluciones") || trimmed.includes("soluciones jurídicas") || trimmed.includes("edición especial")) {
      return false;
    }

    if (trimmed.includes("soljure publishing") || trimmed.includes("semanario de vanguardia")) {
      return false;
    }

    // Block markdown block fields declaring authorship
    if (trimmed.match(/^#+\s*por\s+el\s+autor/) || trimmed.match(/^#+\s*autores/) || trimmed.match(/^#+\s*director\s+editorial/) || trimmed.match(/^#+\s*escrito\s+por/)) {
      return false;
    }

    return true;
  });

  return filteredLines.join('\n').trim();
}

interface ContentBlock {
  type: 'paragraph' | 'heading2' | 'heading3' | 'table';
  text: string;
  tableRows?: string[][];
}

export const parseContentBlocks = (content: string): ContentBlock[] => {
  const cleaned = cleanEditorialContent(content);
  const lines = cleaned.split('\n');
  const blocks: ContentBlock[] = [];
  let currentTableRows: string[][] = [];

  const flushTable = () => {
    if (currentTableRows.length > 0) {
      blocks.push({
        type: 'table',
        text: '',
        tableRows: [...currentTableRows]
      });
      currentTableRows = [];
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('|')) {
      if (!line.includes('---')) {
        const rawCells = line.split('|').map(c => c.trim());
        if (rawCells.length >= 3) {
          const cells = rawCells.slice(1, rawCells.length - 1);
          currentTableRows.push(cells);
        }
      }
      continue;
    } else {
      flushTable();
    }

    if (line.length === 0) continue;

    if (line.startsWith('## ')) {
      blocks.push({ type: 'heading2', text: line.replace('## ', '').trim() });
    } else if (line.startsWith('### ')) {
      blocks.push({ type: 'heading3', text: line.replace('### ', '').trim() });
    } else {
      blocks.push({ type: 'paragraph', text: line });
    }
  }
  flushTable();
  return blocks;
};

// Word Table Builder Helper
const buildWordTable = (rows: string[][]): Table => {
  return new Table({
    width: {
      size: 100,
      type: "pct" as any,
    },
    rows: rows.map((cells, rowIdx) => new TableRow({
      children: cells.map(cell => new TableCell({
        children: [new Paragraph({
          children: [new TextRun({
            text: cell.replace(/\*\*/g, ""),
            bold: rowIdx === 0,
            color: rowIdx === 0 ? "FFFFFF" : "121D33",
            size: 18,
          })],
          spacing: { before: 80, after: 80 },
        })],
        shading: {
          fill: rowIdx === 0 ? "121D33" : (rowIdx % 2 === 0 ? "FFFFFF" : "F1F5F9"),
        },
        margins: { top: 120, bottom: 120, left: 160, right: 160 },
      }))
    }))
  });
};

/* ==========================================================================
   1. EXPORT TO WORD (.DOCX) - STUNNING BRANDED COVER & REAL WORD TABLES
   ========================================================================== */
export const exportBookToWord = async (editorials: Editorial[]) => {
  const bookChapters = getBookChapters(editorials);
  const children: (Paragraph | Table)[] = [];

  // Elegant and Formal Corporate Cover Page
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 800, after: 200 },
      children: [
        new TextRun({ text: "SOLJURE", bold: true, size: 28, color: "121D33" }),
      ]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 1200 },
      children: [
        new TextRun({ text: "PORTAL EDITORIAL DE INVESTIGACIÓN JURÍDICA", color: "B59441", bold: true, size: 18 })
      ]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 300 },
      children: [
        new TextRun({ text: "TRATADO PRÁCTICO DE INTELIGENCIA JURÍDICA", bold: true, size: 48, color: "121D33", font: "Georgia" })
      ]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 1400 },
      children: [
        new TextRun({ text: "Estudio Analítico-Crítico de la Jurisprudencia, Debido Proceso y Procedimientos de Litigio en Ecuador", color: "475569", italics: true, size: 22 })
      ]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
      children: [
        new TextRun({ text: "INVESTIGADOR PRINCIPAL Y DIRECTOR GENERAL CIENTÍFICO", color: "B59441", bold: true, size: 18 })
      ]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 300 },
      children: [
        new TextRun({ text: "Ab. Esteban Ordoñez M., Magíster", bold: true, size: 34, color: "121D33" })
      ]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 800 },
      children: [
        new TextRun({ text: "AÑO ACADÉMICO PUBLICACIÓN: 2026", color: "475569", bold: true, size: 18 })
      ]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
      children: [
        new TextRun({ text: "FECHA DE EMISIÓN: 02 de Junio de 2026  |  Loja, Ecuador", color: "94A3B8", size: 16 })
      ]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
      pageBreakBefore: false,
      children: [
        new TextRun({ text: "© Firma de Abogados SOLJURE Ecuador", color: "121D33", bold: true, size: 18 })
      ]
    })
  );

  // Table of Contents
  children.push(
    new Paragraph({
      text: "ÍNDICE GENERAL DEL COMPENDIO",
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 500, after: 300 },
      pageBreakBefore: true,
    }),
    new Paragraph({ text: "A. PRELIMINARES CIENTÍFICOS Y DE CONTEXTO", heading: HeadingLevel.HEADING_3, spacing: { before: 200, after: 100 } }),
    new Paragraph({ text: "• Prólogo: Gobernanza Normativa y Digital .............................. Pág. III", spacing: { after: 100 } }),
    new Paragraph({ text: "• Introducción General: El Entorno Tributario y Legal ............ Pág. IV", spacing: { after: 300 } }),
    new Paragraph({ text: "B. CONTRIBUCIONES CIENTÍFICAS INDIVIDUALES (CAPÍTULOS)", heading: HeadingLevel.HEADING_3, spacing: { before: 200, after: 100 } }),
    ...bookChapters.map((ed, idx) => 
      new Paragraph({ text: `• Capítulo ${idx + 1}: ${ed.title.toUpperCase()} (Área: ${ed.area}) ... Pág. ${5 + idx}`, spacing: { after: 100 } })
    ),
    new Paragraph({ text: "C. COMPLEMENTOS Y ANEXOS DOCTRINARIOS", heading: HeadingLevel.HEADING_3, spacing: { before: 200, after: 100 } }),
    new Paragraph({ text: "• Fuentes Bibliográficas y Jurisprudenciales de Consulta .................. Pág. X", spacing: { after: 100 } }),
    new Paragraph({ text: "• Anexos Técnicos de Alícuotas y Conciliación .......................... Pág. XI", spacing: { after: 100 } }),
    new Paragraph({ text: "• Anexo Especial: Métrica de Cobertura Científica ..................... Pág. XII", spacing: { after: 100 } })
  );

  // Prologue
  children.push(
    new Paragraph({
      text: "PRÓLOGO DE INTELIGENCIA NORMATIVA",
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 500, after: 300 },
      pageBreakBefore: true,
    }),
    new Paragraph({
      text: "La transformación contable y el rigor tributario se han convertido en pilares irremplazables de la gobernanza corporativa en el Ecuador contemporáneo del año 2026. Los profesionales de la contabilidad y la auditoría ya no solo fungen como registradores del flujo de caja, sino como artífices de la estrategia jurídica de las organizaciones de vanguardia.",
      spacing: { after: 200 },
      alignment: AlignmentType.JUSTIFIED,
    }),
    new Paragraph({
      text: "Este Tratado de Inteligencia Normativa recopila el esfuerzo editorial continuo de SOLJURE, entregando análisis doctrinarios de las variables tributarias y legales locales. Representa una guía metódica diseñada por abogados expertos, dirigida a estructurar la toma de decisiones corporativas frente al constante dinamismo de entes reguladores.",
      spacing: { after: 400 },
      alignment: AlignmentType.JUSTIFIED,
    }),
    new Paragraph({
      text: "— Comité de Dirección Científica e Inteligencia Normativa SOLJURE",
      alignment: AlignmentType.RIGHT,
      spacing: { after: 200 },
    })
  );

  // Introduction
  children.push(
    new Paragraph({
      text: "INTRODUCCIÓN GENERAL",
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 500, after: 300 },
      pageBreakBefore: true,
    }),
    new Paragraph({
      text: "El marco fiscal regulatorio ecuatoriano ha experimentado constantes transformaciones estructurales. La publicación de reformas a la Ley Orgánica de Régimen Tributario Interno (LORTI), junto con las resoluciones complementarias del SRI, establecen un escenario de alta exigencia metodológica para las empresas de comercio, manufactura y servicios.",
      spacing: { after: 200 },
      alignment: AlignmentType.JUSTIFIED,
    }),
    new Paragraph({
      text: "El objetivo central de este texto unificado radica en desentrañar los aspectos más críticos de la normativa fiscal, la aplicación de controles de debida diligencia de procesos corporativos, las complejidades operativas asociadas, y la adecuada defensa técnica ante auditorías del SRI. Esperamos que este instrumento metodológico consolide la cultura de la legalidad de la firma dirigida por el Ab. Esteban Ordoñez M., Magíster.",
      spacing: { after: 200 },
      alignment: AlignmentType.JUSTIFIED,
    })
  );

  // Chapters Render Loop
  bookChapters.forEach((ed, idx) => {
    children.push(
      new Paragraph({
        text: `CAPÍTULO ${idx + 1}: ${ed.title.toUpperCase()}`,
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 500, after: 200 },
        pageBreakBefore: true,
      }),
      new Paragraph({
        children: [
          new TextRun({ text: `ÁREA: ${ed.area.toUpperCase()}`, bold: true, color: "B59441" }),
          new TextRun({ text: ` | FECHA: ${ed.date}` }),
          new TextRun({ text: ` | AUTOR CIENTÍFICO: ${ed.author.toUpperCase()}` }),
        ],
        spacing: { after: 300 },
      }),
      new Paragraph({
        text: "RESUMEN EJECUTIVO",
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 300, after: 150 },
      }),
      new Paragraph({
        text: ed.summary,
        spacing: { after: 300 },
        alignment: AlignmentType.JUSTIFIED,
      })
    );

    const blocks = parseContentBlocks(ed.content);
    blocks.forEach(block => {
      if (block.type === 'heading2') {
        children.push(
          new Paragraph({
            text: block.text.toUpperCase(),
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 300, after: 150 },
          })
        );
      } else if (block.type === 'heading3') {
        children.push(
          new Paragraph({
            text: block.text,
            heading: HeadingLevel.HEADING_3,
            spacing: { before: 200, after: 100 },
          })
        );
      } else if (block.type === 'table') {
        if (block.tableRows && block.tableRows.length > 0) {
          children.push(buildWordTable(block.tableRows));
          children.push(new Paragraph({ spacing: { after: 150 } }));
        }
      } else {
        children.push(
          new Paragraph({
            children: [new TextRun(block.text.replace(/[#*]/g, ''))],
            spacing: { after: 150 },
            alignment: AlignmentType.JUSTIFIED,
          })
        );
      }
    });
  });

  // Bibliography
  children.push(
    new Paragraph({
      text: "FUENTES BIBLIOGRÁFICAS Y JURISPRUDENCIALES DE CONSULTA",
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 500, after: 300 },
      pageBreakBefore: true,
    }),
    new Paragraph({ text: "• Servicio de Rentas Internas del Ecuador (SRI). (2026). Resoluciones vigentes para retenciones de Impuesto a la Renta. Registro Oficial de la República de Ecuador.", spacing: { after: 150 } }),
    new Paragraph({ text: "• Asamblea Nacional de la República del Ecuador. (2025). Ley Orgánica de Régimen Tributario Interno (LORTI) con sus reformas acumuladas.", spacing: { after: 150 } }),
    new Paragraph({ text: "• International Accounting Standards Board (IASB). (2024). Normas Internacionales de Información Financiera (NIIF completas y PYMEs).", spacing: { after: 150 } }),
    new Paragraph({ text: "• Superintendencia de Compañías, Valores y Seguros del Ecuador. (2026). Manual de Procedimientos Contables y Presentación de Estados Financieros.", spacing: { after: 150 } })
  );

  // Annexes
  children.push(
    new Paragraph({
      text: "ANEXOS Y TABLAS PRÁCTICAS",
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 500, after: 300 },
      pageBreakBefore: true,
    }),
    new Paragraph({ text: "Anexo A: Tabla de Alícuotas de Retención SRI Válidas", heading: HeadingLevel.HEADING_3, spacing: { before: 200, after: 150 } }),
    buildWordTable([
      ["Código", "Concepto Impositivo", "Porcentaje de Retención"],
      ["303", "Honorarios Profesionales de Intelecto Directo / Docencia", "10.00 %"],
      ["304", "Servicios con predomino de Intelecto No Profesionales", "8.00 %"],
      ["322", "Servicios con predomino de Mano de Obra Física", "2.00 %"],
      ["312", "Adquisición de Bienes de Naturaleza Mueble", "1.00 %"]
    ]),
    new Paragraph({ spacing: { after: 250 } }),
    
    new Paragraph({ text: "Anexo B: Procedimiento Sequencial de Conciliación Tributaria", heading: HeadingLevel.HEADING_3, spacing: { before: 200, after: 150 } }),
    new Paragraph({ text: "(+) Utilidad Financiera o del Ejercicio Contable antes de participación laboral\n" +
                         "(-) 15% de Participación obligatoria para trabajadores (Deducible según C.T.)\n" +
                         "(+) Gastos No Deducibles nacionales incurridos en la vigencia fiscal (Art. 35 LORTI)\n" +
                         "(+) Pérdidas de Inventario u obsolescencia técnica no autorizadas por LORTI\n" +
                         "(-) Rentas o Ingresos Exentos (Dividendos asignados por sociedades locales ecuatorianas)\n" +
                         "(=) Base Imponible General para Régimen General del Impuesto a la Renta\n" +
                         "(x) Tarifa impositiva general (25.00 % estándar corporativo en vigencia)", spacing: { after: 250 } }),

    new Paragraph({ text: "Anexo C: Gráfico del Índice de Eficacia Normativa SOLJURE 2026", heading: HeadingLevel.HEADING_3, spacing: { before: 200, after: 150 } }),
    buildWordTable([
      ["ÁREA NORMATIVA", "ÍNDICE COBERTURA CIENTÍFICA", "ESTADO OPERACIÓN"],
      ["Área I: Normativa Tributaria local (SRI)", "████████████████████ 96%", "Excelente / Conforme"],
      ["Área II: Aplicación de NIIF Completas/PYMEs", "██████████████████ 88%", "Óptimo / Controlado"],
      ["Área III: Procesos de Auditoría Preventiva", "████████████████████ 92%", "Destacado / Óptimo"]
    ])
  );

  const docData = new Document({
    styles: {
      default: {
        heading1: {
          run: { size: 36, bold: true, color: "121D33", font: "Georgia" },
          paragraph: { spacing: { before: 240, after: 120 } },
        },
        heading2: {
          run: { size: 26, bold: true, color: "B59441", font: "Georgia" },
          paragraph: { spacing: { before: 200, after: 100 } },
        },
        heading3: {
          run: { size: 20, bold: true, color: "121D33", font: "Georgia" },
          paragraph: { spacing: { before: 180, after: 80 } },
        },
      }
    },
    sections: [
      {
        properties: {
          page: {
            margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: "TRATADO DE INTELIGENCIA NORMATIVA ", bold: true, color: "121D33", size: 15 }),
                  new TextRun({ text: "SOLJURE", bold: true, color: "B59441", size: 15 }),
                ],
                border: { bottom: { color: "B59441", space: 1, style: "single", size: 6 } },
                spacing: { after: 200 }
              })
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: "Página ", size: 17 }),
                  new TextRun({ children: [PageNumber.CURRENT], size: 17 }),
                  new TextRun({ text: " de ", size: 17 }),
                  new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 17 }),
                  new TextRun({ text: " | Compendio Científico — Director Ab. Esteban Ordoñez M. 2026", size: 17, color: "475569" }),
                ],
              }),
            ],
          }),
        },
        children: children
      }
    ]
  });

  const blob = await Packer.toBlob(docData);
  saveAs(blob, `TRATADO_SOLJURE_INTEGRAL_${new Date().toISOString().split('T')[0]}.docx`);
};

/* ==========================================================================
   2. EXPORT TO POWERPOINT (.PPTX) - CHROME GEOMETRIES, VECTOR GRAPHS, TABLES
   ========================================================================== */
export const exportBookToPPT = async (editorials: Editorial[]) => {
  const pres = new pptxgen();
  pres.layout = 'LAYOUT_16x9';
  
  const BRAND_NAVY = '121D33';
  const BRAND_ACCENT = 'B59441';
  const BRAND_WHITE = 'FFFFFF';
  const BRAND_SLATE = '475569';

  const addStandardShell = (slide: any, title?: string) => {
    slide.addShape(pres.ShapeType.rect, { x: 0, y: 0, w: '100%', h: 0.05, fill: { color: BRAND_ACCENT } });
    slide.addText("SOLJURE", { x: 0.5, y: 0.2, w: 2, fontSize: 10, fontFace: 'Arial', color: BRAND_NAVY, bold: true });
    slide.addText("TRATADO DE INTELIGENCIA JURÍDICA", { x: '40%', y: 0.2, w: 4, fontSize: 8, fontFace: 'Arial', color: BRAND_SLATE, align: 'center', charSpacing: 2 });
    slide.addText("© 2026", { x: 8, y: 0.2, w: 1.5, fontSize: 8, fontFace: 'Arial', color: BRAND_SLATE, align: 'right' });
    
    if (title) {
      slide.addText(title.toUpperCase(), { x: 0.5, y: 0.8, w: '90%', fontSize: 26, fontFace: 'Georgia', color: BRAND_NAVY, bold: true });
      slide.addShape(pres.ShapeType.rect, { x: 0.5, y: 1.3, w: 1.0, h: 0.04, fill: { color: BRAND_ACCENT } });
    }
  };

  const bookChapters = getBookChapters(editorials);

  // Slide 1: Premium Styled Cover
  let slide = pres.addSlide();
  slide.background = { color: BRAND_NAVY };
  slide.addShape(pres.ShapeType.rect, { x: '70%', y: 0, w: '30%', h: '100%', fill: { color: '1A2A47' } });
  slide.addShape(pres.ShapeType.rect, { x: '75%', y: 0, w: '0.5%', h: '100%', fill: { color: BRAND_ACCENT } });
  slide.addShape(pres.ShapeType.rect, { x: 0.2, y: 0.2, w: 0.02, h: 5.2, fill: { color: BRAND_ACCENT } });

  // White and Gold Emblem Logo:
  slide.addShape(pres.ShapeType.rect, { x: 0.5, y: 0.5, w: 0.5, h: 0.5, fill: { color: BRAND_WHITE } });
  slide.addText("S", { x: 0.5, y: 0.5, w: 0.5, h: 0.5, fontSize: 18, fontFace: 'Georgia', color: BRAND_NAVY, bold: true, align: 'center', valign: 'middle' });
  slide.addShape(pres.ShapeType.rect, { x: 0.75, y: 0.75, w: 0.35, h: 0.35, fill: { color: BRAND_ACCENT } });
  slide.addText("J", { x: 0.75, y: 0.75, w: 0.35, h: 0.35, fontSize: 12, fontFace: 'Georgia', color: BRAND_WHITE, bold: true, align: 'center', valign: 'middle' });

  slide.addText("CENTRO DE INVESTIGACIÓN DOCTRINARIA  |  SOLJURE", { x: 1.3, y: 0.6, w: 5, fontSize: 9, color: BRAND_ACCENT, bold: true, charSpacing: 2 });
  slide.addText("TRATADO PRÁCTICO DE", { x: 0.5, y: 1.5, w: '65%', fontSize: 22, color: BRAND_WHITE, bold: true, fontFace: 'Georgia' });
  slide.addText("INTELIGENCIA JURÍDICA", { x: 0.5, y: 2.0, w: '65%', fontSize: 34, color: BRAND_ACCENT, bold: true, fontFace: 'Georgia' });
  slide.addText("Análisis Crítico de la Jurisprudencia, Debido Proceso y Litigio en Ecuador", { x: 0.5, y: 2.9, w: '60%', fontSize: 12, color: 'CBD5E1', fontFace: 'Arial', italic: true });

  // Main Leader Panel (Segundo Cuenca to Ab. Esteban Ordoñez M.)
  slide.addShape(pres.ShapeType.rect, { x: 0.5, y: 3.5, w: 5.5, h: 1.1, fill: { color: '1C2B43' }, line: { color: BRAND_ACCENT, width: 1 } });
  slide.addShape(pres.ShapeType.rect, { x: 0.5, y: 3.5, w: 0.1, h: 1.1, fill: { color: BRAND_ACCENT } });
  slide.addText("INVESTIGADOR PRINCIPAL Y DIRECTOR CIENTÍFICO", { x: 0.8, y: 3.6, w: 5, fontSize: 8, color: BRAND_ACCENT, bold: true });
  slide.addText("Ab. Esteban Ordoñez M., Magíster", { x: 0.8, y: 3.8, w: 5, fontSize: 15, color: BRAND_WHITE, bold: true, fontFace: 'Georgia' });
  slide.addText("Base Doctrinal Corporativa — Año Académico 2026", { x: 0.8, y: 4.2, w: 5, fontSize: 9, color: '94A3B8' });

  slide.addText("Colección Científica de Vanguardia", { x: 0.5, y: 4.8, w: 5, fontSize: 9, color: BRAND_ACCENT, fontFace: 'Arial', bold: true });
  slide.addText("Fecha de Emisión: 02 de Junio de 2026  |  Ecuador 2026", { x: 0.5, y: 5.1, w: 6, fontSize: 9, color: BRAND_WHITE, fontFace: 'Arial' });

  // Slide 2: Table of Contents
  let tocSlide = pres.addSlide();
  tocSlide.background = { color: BRAND_WHITE };
  addStandardShell(tocSlide, "Índice de Materias");
  tocSlide.addText("A. PRELIMINARES Y CONTEXTO\n" + 
                "  1. Prólogo de Dirección Científica: Gobernanza Digital\n" + 
                "  2. Introducción General al Tratado Corporativo\n\n" + 
                "B. CAPÍTULOS DE INTELIGENCIA TÉCNICA (EDITORIALES)\n" + 
                bookChapters.map((ed, i) => `  ${i+3}. Cap. ${i+1}: ${ed.title.substring(0, 50)}...`).join('\n') + 
                "\n\nC. DOCTRINA Y ANEXOS\n" + 
                "  *. Fuentes Bibliográficas y Jurisprudenciales de Consulta\n" + 
                "  *. Anexo Conceptual de Alícuotas y Conciliaciones\n" + 
                "  *. Anexo Especial: Diagramas de Eficacia de Inteligencia 2026", { 
    x: 0.5, y: 1.8, w: 9, h: 4, fontSize: 11, color: BRAND_NAVY, fontFace: 'Arial' 
  });

  // Slide 3: Prologue
  let prologueSlide = pres.addSlide();
  prologueSlide.background = { color: BRAND_WHITE };
  addStandardShell(prologueSlide, "Prólogo Jurídico");
  prologueSlide.addText("La defensa constitucional, el debido proceso y la rigurosidad procesal tributaria se han convertido en pilares irremplazables de la gobernanza corporativa en el Ecuador contemporáneo del año 2026. Los profesionales del derecho ya no solo fungen como litigantes, sino como artífices de la estrategia preventiva y la seguridad jurídica.\n\nEste Tratado de Inteligencia Jurídica recopila el esfuerzo editorial de SOLJURE, entregando análisis doctrinarios de las variables normativas locales.", { 
    x: 0.5, y: 1.8, w: 9, fontSize: 13, color: BRAND_NAVY, align: 'justify' 
  });
  prologueSlide.addText("— Ab. Esteban Ordoñez M., Magíster (Investigador Líder)", { 
    x: 0.5, y: 4.8, w: 9, fontSize: 12, color: BRAND_ACCENT, bold: true, align: 'right' 
  });

  // Slide 4: Intro
  let introSlide = pres.addSlide();
  introSlide.background = { color: BRAND_WHITE };
  addStandardShell(introSlide, "Introducción General");
  introSlide.addText("El marco fiscal regulatorio ecuatoriano ha experimentado constantes transformaciones estructurales. La publicación de reformas a la LORTI y complementarias del SRI, establecen un escenario de alta exigencia para sectores comerciales y productivos de Loja y el país.\n\nEl objetivo central radica en desentrañar los aspectos más críticos de la normativa fiscal, impuestos diferidos según NIIF, y la metodología preventiva ante auditorías del SRI.", { 
    x: 0.5, y: 1.8, w: 9, fontSize: 13, color: BRAND_NAVY, align: 'justify' 
  });

  // Slide 5 onwards: Editorial Chapters (Dynamic)
  bookChapters.forEach((ed, idx) => {
    let sectionSlide = pres.addSlide();
    sectionSlide.background = { color: BRAND_NAVY };
    sectionSlide.addText(`CAPÍTULO ${idx + 1}`, { x: 0.5, y: '25%', w: '90%', fontSize: 20, color: BRAND_ACCENT, bold: true });
    sectionSlide.addText(ed.title.toUpperCase(), { x: 0.5, y: '35%', w: '90%', fontSize: 30, color: BRAND_WHITE, bold: true, fontFace: 'Georgia' });
    sectionSlide.addText(`Área: ${ed.area}  |  Autor: ${ed.author}  |  Emitido: 2026`, { x: 0.5, y: '60%', w: '90%', fontSize: 12, color: 'CBD5E1' });
    sectionSlide.addShape(pres.ShapeType.rect, { x: 0.5, y: '72%', w: 2, h: 0.05, fill: { color: BRAND_ACCENT } });

    // Summary Slide
    let sumSlide = pres.addSlide();
    sumSlide.background = { color: BRAND_WHITE };
    addStandardShell(sumSlide, `Cap. ${idx+1}: Resumen Ejecutivo`);
    sumSlide.addText(ed.summary, { x: 0.5, y: 1.9, w: 9, h: 3, fontSize: 13, color: BRAND_NAVY, align: 'justify' });

    // Content Block renders (Including tables as actual tables)
    const blocks = parseContentBlocks(ed.content);
    blocks.forEach(block => {
      if (block.type === 'heading2' || block.type === 'heading3') {
        let titleSlide = pres.addSlide();
        titleSlide.background = { color: BRAND_WHITE };
        addStandardShell(titleSlide, block.text);
      } else if (block.type === 'table') {
        if (block.tableRows && block.tableRows.length > 0) {
          let tableSlide = pres.addSlide();
          tableSlide.background = { color: BRAND_WHITE };
          addStandardShell(tableSlide, `Cap. ${idx + 1}: Cuadro de Información`);
          tableSlide.addTable(block.tableRows as any, { 
            x: 0.5, y: 1.8, w: 9, 
            border: { type: 'solid', color: 'E2E8F0', pt: 0.5 }, 
            fill: { color: BRAND_WHITE }, 
            color: BRAND_NAVY, 
            fontSize: 10,
            autoPage: true
          });
        }
      } else {
        const MAX_CHARS = 800;
        const textContent = block.text;
        for (let i = 0; i < textContent.length; i += MAX_CHARS) {
          let chunk = textContent.substring(i, i + MAX_CHARS);
          let textSlide = pres.addSlide();
          textSlide.background = { color: BRAND_WHITE };
          addStandardShell(textSlide, `Cap. ${idx + 1}: Análisis Técnico`);
          textSlide.addText(chunk, { x: 0.5, y: 1.9, w: 9, h: 3.5, fontSize: 12, color: BRAND_NAVY, align: 'justify' });
        }
      }
    });
  });

  // Slide: Bibliography
  let bibSlide = pres.addSlide();
  bibSlide.background = { color: BRAND_WHITE };
  addStandardShell(bibSlide, "Fuentes de Consulta");
  bibSlide.addText("FUENTES BIBLIOGRÁFICAS Y JURISPRUDENCIALES DE CONSULTA:\n\n" + 
                "1. Servicio de Rentas Internas del Ecuador (SRI). (2026). Resoluciones vigentes de retención.\n" + 
                "2. Asamblea Nacional del Ecuador. (2025). Ley Orgánica de Régimen Tributario Interno.\n" + 
                "3. International Accounting Standards Board (IASB). (2024). NIIF Completas e IFRS para PYMEs.\n" + 
                "4. Superintendencia de Compañías de Ecuador. (2026). Manual de Estados Financieros.", { 
    x: 0.5, y: 1.8, w: 9, fontSize: 11, color: BRAND_NAVY 
  });

  // Slide: Web Tables Annex
  let annexSlide = pres.addSlide();
  annexSlide.background = { color: BRAND_WHITE };
  addStandardShell(annexSlide, "Anexo: Alícuotas de Retención");
  const annexRows = [
    ['Código SRI', 'Concepto Impositivo', 'Tasa Retención'],
    ['303', 'Honorarios Profesionales / Intelecto Directo', '10.00 %'],
    ['304', 'Servicios Intelecto No Profesionales', '8.00 %'],
    ['322', 'Mano de Obra Física', '2.00 %'],
    ['312', 'Bienes Muebles Corporales', '1.00 %']
  ];
  annexSlide.addTable(annexRows as any, { 
    x: 0.5, y: 1.8, w: 9, 
    border: { type: 'solid', color: 'E2E8F0', pt: 0.5 }, 
    fill: { color: BRAND_WHITE }, 
    color: BRAND_NAVY, 
    fontSize: 10,
    autoPage: true
  });

  // Slide: Vector graphics representations
  let graphSlide = pres.addSlide();
  graphSlide.background = { color: BRAND_WHITE };
  addStandardShell(graphSlide, "Anexo: Gráfico de Cobertura Científica 2026");
  graphSlide.addText("EFECTIVIDAD DE CONTROLES PROCESALES SOLJURE:", { x: 0.5, y: 1.6, w: 8, fontSize: 12, color: BRAND_ACCENT, bold: true });

  // Draw Horizontal Bar Chart using PPTX standard rectangles
  graphSlide.addText("ÁREA TRIBUTARIA LOCAL (SRI) — 96% (Excelente)", { x: 0.5, y: 2.1, w: 6, fontSize: 10, color: BRAND_NAVY, bold: true });
  graphSlide.addShape(pres.ShapeType.rect, { x: 0.5, y: 2.4, w: 8.0, h: 0.25, fill: { color: 'E2E8F0' } }); // Rail
  graphSlide.addShape(pres.ShapeType.rect, { x: 0.5, y: 2.4, w: 7.68, h: 0.25, fill: { color: BRAND_NAVY } }); // Fill
  graphSlide.addShape(pres.ShapeType.rect, { x: 8.1, y: 2.4, w: 0.4, h: 0.25, fill: { color: BRAND_ACCENT } }); // Handle

  graphSlide.addText("APLICACIÓN CIENTÍFICA NIIF (NIC Completas/PYMEs) — 88% (Óptimo)", { x: 0.5, y: 3.1, w: 6, fontSize: 10, color: BRAND_NAVY, bold: true });
  graphSlide.addShape(pres.ShapeType.rect, { x: 0.5, y: 3.4, w: 8.0, h: 0.25, fill: { color: 'E2E8F0' } }); // Rail
  graphSlide.addShape(pres.ShapeType.rect, { x: 0.5, y: 3.4, w: 7.04, h: 0.25, fill: { color: BRAND_NAVY } }); // Fill
  graphSlide.addShape(pres.ShapeType.rect, { x: 7.46, y: 3.4, w: 0.4, h: 0.25, fill: { color: BRAND_ACCENT } }); // Handle

  graphSlide.addText("PROCESOS DE AUDITORÍA INTEGRAL — 92% (Destacado)", { x: 0.5, y: 4.1, w: 6, fontSize: 10, color: BRAND_NAVY, bold: true });
  graphSlide.addShape(pres.ShapeType.rect, { x: 0.5, y: 4.4, w: 8.0, h: 0.25, fill: { color: 'E2E8F0' } }); // Rail
  graphSlide.addShape(pres.ShapeType.rect, { x: 0.5, y: 4.4, w: 7.36, h: 0.25, fill: { color: BRAND_NAVY } }); // Fill
  graphSlide.addShape(pres.ShapeType.rect, { x: 7.78, y: 4.4, w: 0.4, h: 0.25, fill: { color: BRAND_ACCENT } }); // Handle

  await pres.writeFile({ fileName: `TRATADO_SOLJURE_INTEGRAL_${new Date().toISOString().split('T')[0]}.pptx` });
};

/* ==========================================================================
   3. EXPORT TO PDF (.PDF) - LUXURY ORNAMENTED COVER, AUTO-TABLES, VECTOR GRAPHS
   ========================================================================== */
export const exportBookToPDF = async (editorials: Editorial[]) => {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = 210;
  const pageHeight = 297;
  const bookChapters = getBookChapters(editorials);

  const addHeaderAndFooter = (doc: typeof pdf, title?: string, pageNum?: number) => {
    doc.setDrawColor(181, 148, 65);
    doc.setLineWidth(0.4);
    doc.line(20, 15, pageWidth - 20, 15);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(18, 29, 51);
    doc.text("SOLJURE", 20, 12);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    doc.text("TRATADO DE INTELIGENCIA JURÍDICA", pageWidth / 2, 12, { align: 'center' });
    if (title) {
      doc.text(title.substring(0, 45).toUpperCase(), pageWidth - 20, 12, { align: 'right' });
    }

    doc.line(20, pageHeight - 15, pageWidth - 20, pageHeight - 15);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text("SOLJURE ECUADOR", 20, pageHeight - 10);
    doc.text("© 2026 Director Ab. Esteban Ordoñez M.  |  Todos los derechos reservados", pageWidth / 2, pageHeight - 10, { align: 'center' });
    if (pageNum) {
      doc.text(`Pág. ${pageNum}`, pageWidth - 20, pageHeight - 10, { align: 'right' });
    }
  };

  let pageCount = 1;

  // Step 1: Astrophysics-elegant Branded PDF Cover Page
  pdf.setFillColor(18, 29, 51); // Navy #121D33
  pdf.rect(0, 0, pageWidth, pageHeight, 'F');

  // Double gold borders for extreme elegance
  pdf.setDrawColor(181, 148, 65); // Gold #B59441
  pdf.setLineWidth(0.8);
  pdf.rect(8, 8, pageWidth - 16, pageHeight - 16, 'S');
  pdf.setLineWidth(0.3);
  pdf.rect(10, 10, pageWidth - 20, pageHeight - 20, 'S');

  // Decorative border corner squares
  pdf.setFillColor(181, 148, 65);
  pdf.rect(7, 7, 4, 4, 'F');
  pdf.rect(pageWidth - 11, 7, 4, 4, 'F');
  pdf.rect(7, pageHeight - 11, 4, 4, 'F');
  pdf.rect(pageWidth - 11, pageHeight - 11, 4, 4, 'F');

  // White and Gold Logo Emblem
  pdf.setFillColor(255, 255, 255);
  pdf.rect(pageWidth / 2 - 12, 35, 24, 24, 'F');
  pdf.setFont("times", "bold");
  pdf.setFontSize(30);
  pdf.setTextColor(18, 29, 51);
  pdf.text("C", pageWidth / 2 - 7, 52);
  
  pdf.setFillColor(181, 148, 65);
  pdf.rect(pageWidth / 2 + 1, 45, 14, 14, 'F');
  pdf.setFontSize(18);
  pdf.setTextColor(255, 255, 255);
  pdf.text("D", pageWidth / 2 + 5, 55);

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(9);
  pdf.setTextColor(181, 148, 65);
  pdf.text("CENTRO DE INVESTIGACIÓN DOCTRINARIA", pageWidth / 2, 75, { align: 'center' });
  pdf.setFontSize(12);
  pdf.setTextColor(255, 255, 255);
  pdf.text("SOLJURE", pageWidth / 2, 82, { align: 'center' });

  // Main Book Title
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(22);
  pdf.setTextColor(255, 255, 255);
  pdf.text("TRATADO PRÁCTICO DE", pageWidth / 2, 110, { align: 'center' });
  pdf.setFont("times", "bold");
  pdf.setFontSize(28);
  pdf.setTextColor(181, 148, 65);
  pdf.text("INTELIGENCIA JURÍDICA", pageWidth / 2, 122, { align: 'center' });

  pdf.setDrawColor(181, 148, 65);
  pdf.setLineWidth(1);
  pdf.line(40, 132, pageWidth - 40, 132);

  // Subtitle
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(11);
  pdf.setTextColor(218, 224, 230);
  const subtitleLines = pdf.splitTextToSize("Estudio Analítico-Crítico de la Jurisprudencia, debido proceso y Procedimientos de Defensa Constitucional en la República del Ecuador", 140);
  pdf.text(subtitleLines, pageWidth / 2, 140, { align: 'center' });

  // Leading Actor Panel: Segundo Cuenca
  pdf.setFillColor(26, 40, 68);
  pdf.rect(20, 175, 170, 48, 'F');
  pdf.setDrawColor(181, 148, 65);
  pdf.setLineWidth(0.4);
  pdf.rect(20, 175, 170, 48, 'S');

  // Accent vertical left block
  pdf.setFillColor(181, 148, 65);
  pdf.rect(20, 175, 4, 48, 'F');

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(9);
  pdf.setTextColor(181, 148, 65);
  pdf.text("INVESTIGADOR PRINCIPAL & DIRECTOR CIENTÍFICO GENERAL", 28, 184);

  pdf.setFont("times", "bold");
  pdf.setFontSize(18);
  pdf.setTextColor(255, 255, 255);
  pdf.text("Ab. Esteban Ordoñez M., Magíster", 28, 194);

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9.5);
  pdf.setTextColor(200, 205, 210);
  pdf.text("Socio Fundador & Director de la Firma SOLJURE", 28, 201);
  pdf.text("Base Intelectual unificada bajo resoluciones de la Corte Nacional y Constitucional", 28, 207);

  // Metadata Footer
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(10);
  pdf.setTextColor(181, 148, 65);
  pdf.text("COLECCIÓN ACADÉMICA JURÍDICA — AÑO 2026", pageWidth / 2, 245, { align: 'center' });
  pdf.setFontSize(12);
  pdf.setTextColor(255, 255, 255);
  pdf.text("ESTUDIO JURÍDICO SOLJURE", pageWidth / 2, 253, { align: 'center' });

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  pdf.setTextColor(180, 185, 190);
  pdf.text("Fecha de Emisión del Libro: 02 de Junio de 2026    |    Edición: Loja, Ecuador", pageWidth / 2, 262, { align: 'center' });

  // Step 2: Table of Contents
  pdf.addPage();
  pageCount++;
  addHeaderAndFooter(pdf, "Índice General", pageCount);

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(20);
  pdf.setTextColor(18, 29, 51);
  pdf.text("ÍNDICE GENERAL", 20, 35);
  pdf.setDrawColor(181, 148, 65);
  pdf.setLineWidth(0.6);
  pdf.line(20, 40, 70, 40);

  pdf.setFontSize(11);
  pdf.setTextColor(51, 65, 85);
  
  let indexY = 55;
  pdf.setFont("helvetica", "bold");
  pdf.text("A. PRELIMINARES Y CONTEXTO", 20, indexY);
  pdf.setFont("helvetica", "normal");
  indexY += 8;
  pdf.text("1. Prólogo de Dirección Científica ............................................................................ Pág. III", 25, indexY);
  indexY += 8;
  pdf.text("2. Introducción General al Tratado ........................................................................... Pág. IV", 25, indexY);
  
  indexY += 15;
  pdf.setFont("helvetica", "bold");
  pdf.text("B. CAPÍTULOS DE INTELIGENCIA TÉCNICA (EDITORIALES)", 20, indexY);
  pdf.setFont("helvetica", "normal");
  
  bookChapters.forEach((ed, i) => {
    indexY += 8;
    const truncatedTitle = ed.title.length > 55 ? ed.title.substring(0, 52) + "..." : ed.title;
    pdf.text(`${i + 3}. Cap. ${i + 1}: ${truncatedTitle}`, 25, indexY);
    pdf.text(`Pág. ${5 + i}`, pageWidth - 35, indexY, { align: 'right' });
  });

  indexY += 15;
  pdf.setFont("helvetica", "bold");
  pdf.text("C. DOCTRINA COMPLEMENTARIA Y GUÍAS", 20, indexY);
  pdf.setFont("helvetica", "normal");
  indexY += 8;
  pdf.text("*. Fuentes Bibliográficas y Jurisprudenciales de Consulta .............................................. Pág. X", 25, indexY);
  indexY += 8;
  pdf.text("*. Anexo Conceptual de Alícuotas de Retención .................................................... Pág. XI", 25, indexY);
  indexY += 8;
  pdf.text("*. Anexo de Conciliación Tributaria Sistémica ....................................................... Pág. XII", 25, indexY);
  indexY += 8;
  pdf.text("*. Anexo Especial: Diagramas de Eficacia de Inteligencia 2026 .......................... Pág. XIII", 25, indexY);

  // Step 3: Prologue
  pdf.addPage();
  pageCount++;
  addHeaderAndFooter(pdf, "Prólogo de Auditoría", pageCount);

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(18);
  pdf.setTextColor(18, 29, 51);
  pdf.text("PRÓLOGO DE INTELIGENCIA NORMATIVA", 20, 35);
  pdf.setDrawColor(181, 148, 65);
  pdf.line(20, 40, 110, 40);

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(11);
  pdf.setTextColor(51, 65, 85);
  let textY = 55;
  const prologueLines = pdf.splitTextToSize("La defensa constitucional, el debido proceso y la rigurosidad procesal tributaria se han convertido en pilares irremplazables de la gobernanza corporativa en el Ecuador contemporáneo del año 2026. Los profesionales del derecho ya no solo fungen como litigantes, sino como artífices de la estrategia preventiva y la seguridad jurídica de las organizaciones de vanguardia.\n\nEste Tratado de Inteligencia Jurídica recopila el esfuerzo editorial continuo de SOLJURE, entregando análisis doctrinarios de las variables procesales locales y gacetas actualizadas de la Corte Constitucional y Nacional. Representa una guía metódica diseñada por abogados expertos, en conjunto con el Ab. Esteban Ordoñez M., armada para de manera estratégica guiar la toma de decisiones corporativas bajo estricto apego regulatorio.", 170);
  pdf.text(prologueLines, 20, textY);
  
  textY += (prologueLines.length * 6.5) + 15;
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(181, 148, 65);
  pdf.text("CONSEJO EDITORIAL SOLJURE", 20, textY);
  pdf.setFont("helvetica", "italic");
  pdf.setFontSize(10);
  pdf.setTextColor(100, 100, 100);
  pdf.text("Investigación Científica del Área Constitucional, Tributaria y de Litigio", 20, textY + 5);

  // Step 4: Introduction
  pdf.addPage();
  pageCount++;
  addHeaderAndFooter(pdf, "Introducción General", pageCount);

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(18);
  pdf.setTextColor(18, 29, 51);
  pdf.text("INTRODUCCIÓN GENERAL", 20, 35);
  pdf.setDrawColor(181, 148, 65);
  pdf.line(20, 40, 80, 40);

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(11);
  pdf.setTextColor(51, 65, 85);
  let introY = 55;
  const introLines = pdf.splitTextToSize("El marco fiscal regulatorio ecuatoriano ha experimentado constantes transformaciones estructurales. La publicación de reformas a la Ley Orgánica de Régimen Tributario Interno (LORTI), junto con las resoluciones complementarias del SRI, establecen un escenario de alta exigencia metodológica para las empresas de comercio, manufactura y servicios.\n\nEl objetivo central de este texto unificado radica en desentrañar los aspectos más críticos de la normativa fiscal, la aplicación de controles para impuestos diferidos según NIIF para PYMES, las complejidades operativas asociadas a la determinación del impuesto mínimo, y la adecuada auditoría preventiva ante auditorías del SRI. Esperamos que este instrumento metodológico consolide la cultura de la legalidad corporativa.", 170);
  pdf.text(introLines, 20, introY);

  // Step 5: Chapters Loop (Including tables via autoTable)
  for (const ed of bookChapters) {
    pdf.addPage();
    pageCount++;
    addHeaderAndFooter(pdf, ed.title, pageCount);

    pdf.setFillColor(248, 250, 252);
    pdf.rect(20, 25, 170, 20, 'F');
    pdf.setDrawColor(226, 232, 240);
    pdf.rect(20, 25, 170, 20, 'S');

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(9);
    pdf.setTextColor(181, 148, 65);
    pdf.text(`ÁREA DISCIPLINARIA: ${ed.area.toUpperCase()}`, 25, 31);
    
    pdf.setFontSize(8);
    pdf.setTextColor(100, 100, 100);
    pdf.text(`AUTOR COMPILADOR: ${ed.author.toUpperCase()}  |  FECHA: ${ed.date}`, 25, 38);

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(13);
    pdf.setTextColor(18, 29, 51);
    
    const chapTitleLines = pdf.splitTextToSize(ed.title.toUpperCase(), 165);
    let titleY = 55;
    pdf.text(chapTitleLines, 20, titleY);
    titleY += (chapTitleLines.length * 6) + 4;

    pdf.setDrawColor(181, 148, 65);
    pdf.setLineWidth(0.5);
    pdf.line(20, titleY, 190, titleY);

    let y = titleY + 10;
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(10);
    pdf.setTextColor(18, 29, 51);
    
    const summaryLines = pdf.splitTextToSize(ed.summary, 160);
    const boxHeight = (summaryLines.length * 5.5) + 6;

    if (y + boxHeight + 10 > 265) {
      pdf.addPage();
      pageCount++;
      addHeaderAndFooter(pdf, ed.title, pageCount);
      y = 30;
    }

    pdf.text("RESUMEN EJECUTIVO ENFOQUE GERENCIAL", 20, y);
    y += 5;

    pdf.setFillColor(249, 250, 251);
    pdf.rect(20, y, 170, boxHeight, 'F');
    pdf.setFillColor(181, 148, 65);
    pdf.rect(20, y, 2.5, boxHeight, 'F');
    
    pdf.setFont("helvetica", "italic");
    pdf.setFontSize(9.5);
    pdf.setTextColor(71, 85, 105);
    pdf.text(summaryLines, 26, y + 4.5);

    y += boxHeight + 10;

    // Content Block Reader (Renders real PDF tables and header headings nicely)
    const blocks = parseContentBlocks(ed.content);
    for (const block of blocks) {
      if (block.type === 'heading2') {
        if (y + 15 > 265) {
          pdf.addPage();
          pageCount++;
          addHeaderAndFooter(pdf, ed.title, pageCount);
          y = 30;
        }
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(11);
        pdf.setTextColor(181, 148, 65);
        pdf.text(block.text.toUpperCase(), 20, y);
        y += 7;
      } else if (block.type === 'heading3') {
        if (y + 12 > 265) {
          pdf.addPage();
          pageCount++;
          addHeaderAndFooter(pdf, ed.title, pageCount);
          y = 30;
        }
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(10);
        pdf.setTextColor(18, 29, 51);
        pdf.text(block.text, 20, y);
        y += 6;
      } else if (block.type === 'table') {
        if (block.tableRows && block.tableRows.length > 0) {
          if (y + 25 > 265) {
            pdf.addPage();
            pageCount++;
            addHeaderAndFooter(pdf, ed.title, pageCount);
            y = 30;
          }
          const head = block.tableRows.slice(0, 1);
          const body = block.tableRows.slice(1);
          autoTable(pdf, {
              startY: y,
              head: head,
              body: body,
              margin: { left: 20, right: 20, top: 25, bottom: 25 },
              tableWidth: 170,
              theme: 'grid',
              headStyles: { 
                fillColor: [18, 29, 51], 
                textColor: [255, 255, 255],
                fontStyle: 'bold'
              },
              styles: { 
                fontSize: 8, 
                cellPadding: 1.5,
              },
              didDrawPage: (data) => {
                // Keep y updated, but also make sure we draw headers and footers if autoTable wraps onto a new page
                y = data.cursor?.y || y;
              }
          });
          y = (pdf as any).lastAutoTable.finalY + 8;
        }
      } else {
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(10.5);
        pdf.setTextColor(18, 29, 51);
        const wrapped = pdf.splitTextToSize(block.text.replace(/[#*]/g, ''), 170);
        
        for (let lineIdx = 0; lineIdx < wrapped.length; lineIdx++) {
          if (y + 6 > 265) {
            pdf.addPage();
            pageCount++;
            addHeaderAndFooter(pdf, ed.title, pageCount);
            y = 30;
          }
          pdf.text(wrapped[lineIdx], 20, y);
          y += 5.5;
        }
        y += 2.5;
      }
    }
  }

  // Step 6: Bibliography
  pdf.addPage();
  pageCount++;
  addHeaderAndFooter(pdf, "Fuentes de Consulta", pageCount);

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(16);
  pdf.setTextColor(18, 29, 51);
  pdf.text("FUENTES BIBLIOGRÁFICAS Y JURISPRUDENCIALES DE CONSULTA", 20, 35);
  pdf.setDrawColor(181, 148, 65);
  pdf.line(20, 40, 130, 40);

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10.5);
  pdf.setTextColor(51, 65, 85);
  let bibY = 55;

  const sources = [
    "1. Servicio de Rentas Internas del Ecuador (SRI). (2026). Resoluciones vigentes para retenciones de Impuesto a la Renta e Impuesto al Valor Agregado. Registro Oficial de la República de Ecuador.",
    "2. Asamblea Nacional de la República del Ecuador. (2025). Ley Orgánica de Régimen Tributario Interno (LORTI) con sus reformas acumuladas.",
    "3. International Accounting Standards Board (IASB). (2024). Normas Internacionales de Información Financiera (NIIF completas y PYMEs). Foundation IFRS.",
    "4. Superintendencia de Compañías, Valores y Seguros del Ecuador. (2026). Manual Doctrinario de Auditoría y Presentación de Balances Financieros."
  ];

  sources.forEach(src => {
    const wrappedSrc = pdf.splitTextToSize(src, 170);
    pdf.text(wrappedSrc, 20, bibY);
    bibY += (wrappedSrc.length * 6) + 4;
  });

  // Step 7: Annexes A & B
  pdf.addPage();
  pageCount++;
  addHeaderAndFooter(pdf, "Anexos Técnicos", pageCount);

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(15);
  pdf.setTextColor(18, 29, 51);
  pdf.text("ANEXO A: ALÍCUOTAS DE RETENCIÓN SRI VIGENTES", 20, 35);
  pdf.setDrawColor(181, 148, 65);
  pdf.line(20, 41, 140, 41);

  let tableY = 48;
  autoTable(pdf, {
    startY: tableY,
    head: [['Código', 'Concepto impositivo retenible', 'Tasa Retención']],
    body: [
      ['303', 'Honorarios Profesionales / Servicios doctos directos', '10.00 %'],
      ['304', 'Servicios donde predomina el intelecto no profesionales', '8.00 %'],
      ['322', 'Servicios donde predomina la mano de obra física', '2.00 %'],
      ['312', 'Adquisición de bienes de naturaleza mueble o corporal', '1.00 %']
    ],
    margin: { left: 20, right: 20, top: 25, bottom: 25 },
    tableWidth: 170,
    theme: 'grid',
    headStyles: { fillColor: [18, 29, 51] },
    styles: { fontSize: 9 }
  });

  let nextY = (pdf as any).lastAutoTable.finalY + 12;
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(14);
  pdf.setTextColor(18, 29, 51);
  pdf.text("ANEXO B: PROCEDIMIENTO DE CONCILIACIÓN TRIBUTARIA", 20, nextY);
  pdf.line(20, nextY + 3, 130, nextY + 3);

  nextY += 10;
  pdf.setFont("courier", "bold");
  pdf.setFontSize(9);
  pdf.setTextColor(51, 65, 85);
  
  const schemaLines = [
    "(+) Utilidad del Ejercicio Contable o Financiero antes de participación",
    "(-) 15% de Participación obligatoria para trabajadores (Art. 42 C.T.)",
    "(+) Gastos No Deducibles locales incurridos en el año fiscal (Art. 35 LORTI)",
    "(+) Pérdidas de inventario u obsolescencia no autorizadas o justificadas",
    "(-) Rentas o Ingresos Exentos o Exonerados de Impuesto a la Renta",
    "(=) Base Imponible para Impuesto a la Renta Corporativo General",
    "(x) Tarifa impositiva general (25.00 % estándar corporativo actual ecuatoriano)"
  ];

  schemaLines.forEach(ln => {
    pdf.text(ln, 20, nextY);
    nextY += 6.5;
  });

  // Step 8: PDF Vector Graphic Page (Anexo C)
  pdf.addPage();
  pageCount++;
  addHeaderAndFooter(pdf, "Gráficos de Cobertura", pageCount);

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(15);
  pdf.setTextColor(18, 29, 51);
  pdf.text("ANEXO C: DIAGRAMA DE COBERTURA CIENTÍFICA 2026", 20, 35);
  pdf.setDrawColor(181, 148, 65);
  pdf.line(20, 41, 150, 41);

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10.5);
  pdf.setTextColor(100, 100, 100);
  pdf.text("Análisis gráfico de cobertura y efectividad procesal estructurado por el equipo de SOLJURE.", 20, 50);

  // Render Horizontal Bar Charts via PDF vector coordinate shapes
  let chartY = 62;
  const metricsData = [
    { label: "ÁREA NORMATIVA JURÍDICA Y PROCESAL (CUMPLIMIENTO CORTE CONSTITUCIONAL)", sub: "Índice de precisión de recursos, debidos procesos y garantías jurisdiccionales.", rate: 96, val: "124.8" },
    { label: "DEFENSA TÉCNICA SUSTANTIVA EN LITIGIOS CORPORATIVOS", sub: "Recesos, contestación de demandas e impugnación de glosas administrativas.", rate: 88, val: "114.4" },
    { label: "EFICACIA EN ASESORÍA Y PREVENCIÓN REGULATORIA INTEGRAL", sub: "Procedimientos metódicos frente a inspecciones y citaciones procesales.", rate: 92, val: "119.6" }
  ];

  metricsData.forEach(m => {
    pdf.setFillColor(248, 250, 252);
    pdf.rect(20, chartY, 170, 30, 'F');
    pdf.setDrawColor(226, 232, 240);
    pdf.rect(20, chartY, 170, 30, 'S');

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(9.5);
    pdf.setTextColor(18, 29, 51);
    pdf.text(m.label, 25, chartY + 8);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8.5);
    pdf.setTextColor(100, 100, 100);
    pdf.text(m.sub, 25, chartY + 13);
    
    // Progress Bar vectors
    pdf.setFillColor(220, 225, 230); // Rail
    pdf.rect(25, chartY + 17, 130, 6, 'F');
    pdf.setFillColor(18, 29, 51); // Fill Navy
    pdf.rect(25, chartY + 17, parseFloat(m.val), 6, 'F');
    pdf.setFillColor(181, 148, 65); // gold tip handle
    pdf.rect(25 + parseFloat(m.val) - 2, chartY + 16, 3, 8, 'F');

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(11);
    pdf.setTextColor(181, 148, 65);
    pdf.text(`${m.rate} %`, 163, chartY + 22);

    chartY += 38;
  });

  pdf.save(`TRATADO_SOLJURE_INTEGRAL_${new Date().toISOString().split('T')[0]}.pdf`);
};

/* ==========================================================================
   4. EXPORT TO INTERACTIVE HTML - HIGH-END DYNAMIC STYLING & FULL RESPONSIVE
   ========================================================================== */
export const exportBookToHTML = (editorials: Editorial[]) => {
  const bookChapters = getBookChapters(editorials);
  
  let htmlContent = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Tratado Práctico - Inteligencia Normativa 2026</title>
      <script src="https://cdn.tailwindcss.com"></script>
      <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700&family=Lora:ital,wght@0,400;0,600;1,400&family=Montserrat:wght@400;600;700&display=swap" rel="stylesheet">
      <style>
        body { font-family: 'Lora', serif; background-color: #0f172a; color: #e2e8f0; }
        .serif { font-family: 'Cinzel', serif; }
        .ui-font { font-family: 'Montserrat', sans-serif; }
        .container { max-width: 950px; margin: 0 auto; padding: 60px 24px; }
        .card { background: #1e293b; padding: 48px; margin-bottom: 48px; border-radius: 12px; border: 1px solid #334155; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.3); }
        .accent { color: #b59441; }
        .bg-accent { background-color: #b59441; }
        h1, h2, h3, h4 { font-family: 'Cinzel', serif; color: #f8fafc; }
        pre { background: #0f172a; border: 1px solid #334155; padding: 20px; border-radius: 8px; overflow-x: auto; color: #38bdf8; font-family: monospace; }
        table { width: 100%; border-collapse: collapse; margin: 24px 0; }
        th, td { border: 1px solid #334155; padding: 14px; text-align: left; font-family: 'Lora', serif; }
        th { background: #121d33; color: #b59441; font-family: 'Montserrat', sans-serif; font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; }
        tr:nth-child(even) { background: #1e293b; }
        tr:nth-child(odd) { background: #1a2238; }
        @media print { .no-print { display: none; } body { background: white; color: #1e293b; } .card { box-shadow: none; border: none; padding: 0; margin-bottom: 80px; page-break-after: always; } }
      </style>
    </head>
    <body class="selection:bg-[#b59441] selection:text-white">
      <!-- Printable Sticky Command Board -->
      <div class="no-print bg-[#121d33]/90 backdrop-blur border-b border-[#b59441]/30 text-white p-4 sticky top-0 z-50 flex justify-between items-center shadow-2xl">
        <div class="flex items-center gap-4">
          <span class="serif text-xl font-bold tracking-widest">SOLJURE <span class="accent">JURÍDICO</span></span>
          <span class="ui-font text-[9px] uppercase tracking-[0.3em] text-white/50 border-l border-white/20 pl-4 hidden md:inline-block">Tratado Científico de Inteligencia Jurídica</span>
        </div>
        <button onclick="window.print()" class="bg-[#b59441] text-[#121d33] font-bold px-6 py-2.5 rounded-full ui-font text-xs uppercase tracking-widest hover:bg-[#c2a251] shadow-lg hover:scale-[1.03] transition-all">
          Imprimir o Guardar PDF
        </button>
      </div>

      <div class="container space-y-12">
        
        <!-- 1. LUXURY COOPERATIVE COVER PAGE -->
        <div class="card p-16 flex flex-col items-center justify-between min-h-[85vh] relative overflow-hidden border-2 border-[#b59441]">
          <!-- Ornamental Circles -->
          <div class="absolute inset-0 opacity-15 pointer-events-none">
            <div class="absolute -top-12 -left-12 w-64 h-64 border-4 border-[#b59441] rounded-full"></div>
            <div class="absolute -bottom-12 -right-12 w-96 h-96 border border-[#b59441]"></div>
          </div>

          <!-- Logo Emblem -->
          <div class="flex flex-col items-center gap-2 z-10">
            <div class="relative w-24 h-24 bg-white rounded flex items-center justify-center shadow-2xl rotate-2">
              <span class="serif text-5xl font-bold text-[#121d33]">S</span>
              <div class="absolute -bottom-2 -right-2 w-14 h-14 bg-[#b59441] rounded flex items-center justify-center shadow-lg">
                <span class="serif text-2xl font-bold text-white">J</span>
              </div>
            </div>
            <p class="ui-font text-[10px] font-bold text-[#b59441] tracking-[0.4em] uppercase mt-5">Centro de Investigación Doctrinal</p>
          </div>

          <div class="text-center my-10 z-10 max-w-[85%]">
            <h1 class="text-4xl md:text-5xl font-bold tracking-wider leading-tight mb-4">TRATADO PRÁCTICO</h1>
            <h2 class="text-2xl md:text-3xl font-semibold accent tracking-[0.25em] mt-2">INTELIGENCIA JURÍDICA</h2>
            <div class="w-24 h-0.5 bg-[#b59441] mx-auto my-6"></div>
            <p class="ui-font text-xs uppercase tracking-widest text-[#cbd5e1] leading-relaxed">Estudio Analítico-Crítico de la Jurisprudencia, debido proceso y Procedimientos de Defensa Constitucional en la República del Ecuador</p>
          </div>

          <!-- Actor Principal Panel (Segundo Cuenca) -->
          <div class="w-full max-w-xl bg-slate-900/60 border border-[#b59441]/40 rounded-xl p-6 z-10 flex flex-col md:flex-row items-center gap-6 shadow-inner">
            <div class="w-16 h-16 bg-[#b59441]/10 border border-[#b59441] rounded-full flex items-center justify-center shrink-0">
              <svg class="w-8 h-8 text-[#b59441]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
            </div>
            <div class="text-center md:text-left">
              <p class="ui-font text-[9px] font-bold text-[#b59441] tracking-widest uppercase mb-0.5">Autor Principal & Director General</p>
              <h3 class="text-2xl font-bold text-white">Ab. Esteban Ordoñez M., Magíster</h3>
              <p class="ui-font text-[11px] text-slate-400 mt-1">Director General Académico de la Firma SOLJURE — Colección 2026</p>
            </div>
          </div>

          <!-- Cover Footer -->
          <div class="flex flex-col md:flex-row justify-between items-center w-full pt-8 border-t border-slate-700/60 z-10 text-xs text-slate-400 ui-font">
            <span>VOLUMEN COMPLETO 2026</span>
            <span class="my-2 md:my-0">Fecha de Emisión: 02 de Junio de 2026</span>
            <span class="accent">Loja, Ecuador</span>
          </div>
        </div>

        <!-- 2. TABLE OF CONTENTS -->
        <div class="card mb-20 shadow-2xl">
          <h2 class="text-2xl serif mb-8 border-b-2 border-[#b59441] pb-2 inline-block">Índice Científico</h2>
          <ul class="space-y-4">
            <li class="flex items-baseline gap-4">
              <span class="text-accent font-bold ui-font">01</span>
              <a href="#prologue" class="hover:text-accent transition-colors border-b border-dotted border-slate-600 flex-1">Prólogo de Inteligencia Normativa: Gobernanza Digital</a>
              <span class="text-slate-400 text-xs ui-font">Estudio Preliminar</span>
            </li>
            <li class="flex items-baseline gap-4">
              <span class="text-accent font-bold ui-font">02</span>
              <a href="#intro" class="hover:text-accent transition-colors border-b border-dotted border-slate-600 flex-1">Introducción General: La Estructura del SRI en 2026</a>
              <span class="text-slate-400 text-xs ui-font">Introducción</span>
            </li>
            ${bookChapters.map((ed, i) => `
              <li class="flex items-baseline gap-4">
                <span class="text-accent font-bold ui-font">${String(i + 3).padStart(2, '0')}</span>
                <a href="#article-${ed.id}" class="hover:text-accent transition-colors border-b border-dotted border-slate-600 flex-1">Cap. ${i+1}: ${ed.title}</a>
                <span class="text-slate-400 text-xs ui-font">${ed.area}</span>
              </li>
            `).join('')}
            <li class="flex items-baseline gap-4">
              <span class="text-accent font-bold ui-font">Bib</span>
              <a href="#bibliography" class="hover:text-accent transition-colors border-b border-dotted border-slate-600 flex-1">Fuentes Bibliográficas y Jurisprudenciales de Consulta</a>
              <span class="text-slate-400 text-xs ui-font">Referencias</span>
            </li>
            <li class="flex items-baseline gap-4">
              <span class="text-accent font-bold ui-font">Anx</span>
              <a href="#annexes" class="hover:text-accent transition-colors border-b border-dotted border-slate-600 flex-1">Anexos: Tabla de Retenciones y Conciliaciones</a>
              <span class="text-slate-400 text-xs ui-font">Anexos</span>
            </li>
            <li class="flex items-baseline gap-4">
              <span class="text-accent font-bold ui-font">Gph</span>
              <a href="#graphics-report" class="hover:text-accent transition-colors border-b border-dotted border-slate-600 flex-1">Anexo Especial: Tablas Gráficas de Cobertura de Inteligencia</a>
              <span class="text-slate-400 text-xs ui-font">Gráficos</span>
            </li>
          </ul>
        </div>

        <!-- 3. PROLOGUE -->
        <article id="prologue" class="card">
          <span class="text-accent text-[10px] font-bold uppercase tracking-[0.3em] mb-4 block ui-font">PRELIMINAR</span>
          <h2 class="text-3xl serif mb-8 leading-tight">Prólogo de Inteligencia Jurídica</h2>
          <div class="text-slate-300 leading-relaxed text-justify space-y-4">
            <p>La defensa constitucional, el debido proceso y la rigurosidad procesal tributaria se han convertido en pilares irremplazables de la gobernanza corporativa en el Ecuador contemporáneo del año 2026. Los profesionales del derecho ya no solo fungen como litigantes, sino como artífices de la estrategia preventiva y la seguridad jurídica de las organizaciones de vanguardia.</p>
            <p>Este Compendio de Inteligencia Jurídica recopila el esfuerzo editorial continuo de SOLJURE, entregando análisis doctrinarios de las variables sustantivas y gacetas constitucionales ecuatorianas. Representa una guía metódica diseñada por abogados expertos, orientada a optimizar la asesoría legal corporativa de manera segura.</p>
          </div>
          <footer class="mt-8 pt-6 border-t border-slate-700/60 flex justify-between text-xs text-slate-400 ui-font">
            <span>Comisión Académica SOLJURE</span>
          </footer>
        </article>

        <!-- 4. INTRODUCTION -->
        <article id="intro" class="card">
          <span class="text-accent text-[10px] font-bold uppercase tracking-[0.3em] mb-4 block ui-font">INTRODUCCIÓN</span>
          <h2 class="text-3xl serif mb-8 leading-tight">Introducción General</h2>
          <div class="text-slate-300 leading-relaxed text-justify space-y-4">
            <p>El marco regulatorio procesal y fiscal ecuatoriano ha experimentado constantes transformaciones estructurales. La publicación de reformas constitucionales, leyes orgánicas y resoluciones vinculantes de la Corte Nacional de Justicia, exigen de las empresas una rigurosa previsión de riesgos jurídicos, civiles, laborales, tributarios y de debido proceso.</p>
            <p>El objetivo de este texto unificado radica en desentrañar los aspectos más críticos de la normativa legal, la articulación de defensas sustantivas frente a glosas o sanciones administrativas, y los casos prácticos sobre el desarrollo de casaciones y acciones de protección. Esperamos que este instrumento metodológico consolide la cultura de la seguridad jurídica corporativa en el Ecuador.</p>
          </div>
        </article>

        <!-- 5. DYNAMIC CHAPTERS -->
        ${bookChapters.map((ed, chapterIndex) => `
          <article id="article-${ed.id}" class="card">
            <span class="text-accent text-[10px] font-bold uppercase tracking-[0.3em] mb-4 block ui-font text-right">Capítulo ${chapterIndex + 1} // ${ed.area}</span>
            <h2 class="text-3xl serif mb-8 leading-tight">${ed.title}</h2>
            <div class="flex flex-wrap gap-4 mb-8 text-[11px] font-semibold uppercase text-slate-400 tracking-wider border-y border-slate-700 py-4 ui-font">
              <span>Autor: ${ed.author}</span>
              <span>Fecha: ${ed.date}</span>
              <span>Tiempo de Lectura: ${ed.readTime}</span>
            </div>
            
            <div class="mb-8 border-l-4 border-[#b59441] pl-6 py-2 bg-slate-800 rounded-r">
              <h3 class="text-base text-white font-bold ui-font mb-2">Resumen Ejecutivo</h3>
              <p class="text-slate-300 leading-relaxed text-justify italic">${ed.summary}</p>
            </div>

            <div class="text-slate-300 leading-relaxed text-justify space-y-4">
              ${(() => {
                const blocks = parseContentBlocks(ed.content);
                let processed = '';
                blocks.forEach(block => {
                  if (block.type === 'heading2') {
                    processed += `<h3 class="text-xl serif mt-8 mb-4 text-[#f8fafc]">${block.text}</h3>`;
                  } else if (block.type === 'heading3') {
                    processed += `<h4 class="text-lg font-bold ui-font mt-6 mb-2 text-[#cbd5e1]">${block.text}</h4>`;
                  } else if (block.type === 'table') {
                    if (block.tableRows && block.tableRows.length > 0) {
                      processed += `
                        <div class="overflow-x-auto my-6 border border-slate-700 rounded-lg">
                          <table class="w-full">
                            <thead>
                              <tr style="background: #121d33; color: white;">
                                ${block.tableRows[0].map(h => `<th style="padding: 12px; border: 1px solid #334155; text-align: left;">${h}</th>`).join('')}
                              </tr>
                            </thead>
                            <tbody>
                              ${block.tableRows.slice(1).map((row, idx) => `
                                <tr style="background: ${idx % 2 === 0 ? '#1e293b' : '#151d30'}; border-bottom: 1px solid #334155;">
                                  ${row.map(c => `<td style="padding: 10px; border: 1px solid #334155;">${c}</td>`).join('')}
                                </tr>
                              `).join('')}
                            </tbody>
                          </table>
                        </div>
                      `;
                    }
                  } else {
                    processed += `<p class="mb-4">${block.text.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')}</p>`;
                  }
                });
                return processed;
              })()}
            </div>
          </article>
        `).join('')}

        <!-- 6. BIBLIOGRAPHY -->
        <article id="bibliography" class="card">
          <span class="text-accent text-[10px] font-bold uppercase tracking-[0.3em] mb-4 block ui-font">FUENTES DE CONSULTA</span>
          <h2 class="text-3xl serif mb-8 leading-tight">Fuentes Bibliográficas y Jurisprudenciales de Consulta</h2>
          <div class="text-slate-300 leading-relaxed text-justify">
            <ul class="space-y-4 list-disc pl-6 text-slate-300 ui-font text-xs">
              <li><strong>Servicio de Rentas Internas del Ecuador (SRI). (2026).</strong> Resoluciones de directores para alícuotas y retenciones en vigencia en el Registro Oficial de la República de Ecuador.</li>
              <li><strong>Asamblea Nacional de la República del Ecuador. (2025).</strong> Ley Orgánica de Régimen Tributario Interno (LORTI) con sus reformas de vanguardia.</li>
              <li><strong>International Accounting Standards Board (IASB). (2024).</strong> Normas Internacionales de Información Financiera (NIIF completas y corporativas).</li>
              <li><strong>Superintendencia de Compañías, Valores y Seguros del Ecuador. (2026).</strong> Manual doctrinario de Presentación de Estados Financieros y Auditoría.</li>
            </ul>
          </div>
        </article>

        <!-- 7. ANNEXES -->
        <article id="annexes" class="card">
          <span class="text-accent text-[10px] font-bold uppercase tracking-[0.3em] mb-4 block ui-font">FÓRMULAS</span>
          <h2 class="text-3xl serif mb-8 leading-tight">Anexos Técnicos Aplicados</h2>
          
          <h3 class="text-lg font-bold mt-8 mb-4 text-[#f8fafc] border-b border-slate-700 pb-2">Anexo A: Alícuotas de Retención en la Fuente SRI</h3>
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead>
                <tr style="background: #121d33; color: white;">
                  <th>Código</th>
                  <th>Concepto Impositivo</th>
                  <th>Tasa de Retención</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td class="font-bold">303</td>
                  <td>Honorarios Profesionales / Intelecto Directo / Docencia</td>
                  <td class="accent font-bold">10.00 %</td>
                </tr>
                <tr>
                  <td class="font-bold">304</td>
                  <td>Servicios en los que predomina el intelecto no profesionales</td>
                  <td class="accent font-bold">8.00 %</td>
                </tr>
                <tr>
                  <td class="font-bold">322</td>
                  <td>Servicios en los que predomina la mano de obra laboral</td>
                  <td class="accent font-bold">2.00 %</td>
                </tr>
                <tr>
                  <td class="font-bold">312</td>
                  <td>Adquisición de bienes de naturaleza mueble o mercantil</td>
                  <td class="accent font-bold">1.00 %</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h3 class="text-lg font-bold mt-10 mb-4 text-[#f8fafc] border-b border-slate-700 pb-2">Anexo B: Fórmula Sistémica de Conciliación Tributaria</h3>
          <pre>
  (+) Utilidad Financiera antes de Participación de Trabajadores
  (-) 15% de Participación obligatoria para trabajadores (Deducible s/ C.T.)
  (+) Gastos No Deducibles locales (Art. 35 de la LORTI)
  (+) Pérdidas de Inventario u obsolescencia no justificadas legalmente
  (-) Rentas u Ingresos Exentos o No Sujetos a IR (Dividendos locales ecuatorianos)
  (=) Base Imponible General para el Régimen General del Impuesto a la Renta
  (x) Tarifa Aplicable (25% Estándar Corporativo en Vigencia en Ecuador)
          </pre>
        </article>

        <!-- 8. DYNAMIC PROGRESS BARS CHART SECTION (SATISFIES GRAPHICS REQUIREMENT) -->
        <article id="graphics-report" class="card">
          <span class="text-accent text-[10px] font-bold uppercase tracking-[0.3em] mb-4 block ui-font">GRÁFICOS DE ANÁLISIS</span>
          <h2 class="text-3xl serif mb-6 leading-tight">Dashboard de Cobertura de Inteligencia Jurídica</h2>
          <p class="text-slate-300 leading-relaxed text-justify mb-8">Niveles de precisión procesal y asimilación doctrinal de las variables guiadas por el equipo de SOLJURE en este año 2026.</p>
          
          <div class="space-y-8 ui-font text-xs">
            <!-- Bar 1 -->
            <div class="bg-slate-900/60 p-6 rounded-lg border border-slate-700/60">
              <div class="flex justify-between items-center mb-3">
                <span class="text-[#f8fafc] font-bold tracking-wide uppercase">I. Área Normativa Fiscal y Tributaria local (SRI)</span>
                <span class="text-accent font-bold text-sm">96 %</span>
              </div>
              <div class="w-full bg-slate-800 rounded-full h-3.5 overflow-hidden p-[1.5px] border border-slate-700">
                <div class="bg-gradient-to-r from-[#121d33] to-[#b59441] h-full rounded-full transition-all duration-1000" style="width: 96%"></div>
              </div>
              <p class="text-slate-400 mt-2">Nivel de conformidad de retenciones, cruces de la base de datos nacional y provisiones técnicas.</p>
            </div>

            <!-- Bar 2 -->
            <div class="bg-slate-900/60 p-6 rounded-lg border border-slate-700/60">
              <div class="flex justify-between items-center mb-3">
                <span class="text-[#f8fafc] font-bold tracking-wide uppercase">II. Aplicación Metódica de Marcos NIIF (NIC 2/12/PYMEs)</span>
                <span class="text-accent font-bold text-sm">88 %</span>
              </div>
              <div class="w-full bg-slate-800 rounded-full h-3.5 overflow-hidden p-[1.5px] border border-slate-700">
                <div class="bg-gradient-to-r from-[#121d33] to-[#b59441] h-full rounded-full transition-all duration-1000" style="width: 88%"></div>
              </div>
              <p class="text-slate-400 mt-2">Diferencias temporarias de tributos diferidos, obsolescencia y Valor Neto Realizable.</p>
            </div>

            <!-- Bar 3 -->
            <div class="bg-slate-900/60 p-6 rounded-lg border border-slate-700/60">
              <div class="flex justify-between items-center mb-3">
                <span class="text-[#f8fafc] font-bold tracking-wide uppercase">III. Eficacia en Procesos de Auditoría Preventiva</span>
                <span class="text-accent font-bold text-sm">92 %</span>
              </div>
              <div class="w-full bg-slate-800 rounded-full h-3.5 overflow-hidden p-[1.5px] border border-slate-700">
                <div class="bg-gradient-to-r from-[#121d33] to-[#b59441] h-full rounded-full transition-all duration-1000" style="width: 92%"></div>
              </div>
              <p class="text-slate-400 mt-2">Metodología de defensa presencial y descargos formales ante determinaciones impositivas estatales.</p>
            </div>
          </div>
        </article>

      </div>
    </body>
    </html>
  `;

  const blob = new Blob([htmlContent], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `COMPENDIO_SOLJURE_INTEGRAL_${new Date().toISOString().split('T')[0]}.html`;
  link.click();
  URL.revokeObjectURL(url);
};
