import React, { useMemo, useState, useEffect } from 'react';
import { 
  Calendar, 
  Search, 
  BookOpen, 
  FileText, 
  Clock, 
  Filter, 
  Tag, 
  RotateCcw, 
  ArrowRight,
  ArrowLeft,
  ChevronRight,
  Sparkles,
  SearchCode,
  CalendarDays,
  Bookmark,
  BookMarked,
  Printer,
  Trash2,
  Play,
  Sliders,
  Layers,
  Award,
  Download,
  List,
  Link,
  Video,
  PlayCircle,
  HelpCircle,
  BookOpenCheck,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Scale
} from 'lucide-react';
import { Ficha, ExpertiseArea, Editorial } from '../types';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface BookCompendiumProps {
  fichas: Ficha[];
  editorials?: Editorial[];
  onBack: () => void;
  onRestore: (ficha: Ficha) => void;
  onDelete?: (fichaId: string) => void;
  isAdmin: boolean;
  onExportWord?: (selectedEds?: Editorial[]) => void;
  onExportPPT?: (selectedEds?: Editorial[]) => void;
  onExportPDF?: (selectedEds?: Editorial[]) => void;
  onExportHTML?: (selectedEds?: Editorial[]) => void;
  onSaveBook?: (title: string, content: string, summary: string, area: ExpertiseArea, author: string, readTime: string) => Promise<void>;
}

export default function BookCompendium({ 
  fichas, 
  editorials = [],
  onBack, 
  onRestore, 
  onDelete, 
  isAdmin,
  onExportWord,
  onExportPPT,
  onExportPDF,
  onExportHTML,
  onSaveBook
}: BookCompendiumProps) {
  // Navigation & Toggle between 'academic_book' and 'chronology'
  const [activeTab, setActiveTab] = useState<'academic_book' | 'chronology'>('academic_book');
  
  // 1. Chronology State
  const [dateSearch, setDateSearch] = useState<string>(''); // YYYY-MM-DD
  const [textSearch, setTextSearch] = useState<string>('');
  const [selectedArea, setSelectedArea] = useState<string>('TODOS');
  const [selectedFicha, setSelectedFicha] = useState<Ficha | null>(null);
  const [quickDateFilter, setQuickDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');

  // 2. Academic Book Navigation State
  const [selectedBookSection, setSelectedBookSection] = useState<string>('portada'); // 'portada', 'indice', 'prologo', 'introduccion', 'capitulo_[id]', 'bibliografia', 'anexos'
  const [voiceStyle, setVoiceStyle] = useState<string>('Profesional y Persuasiva');
  const [isVideoPlaying, setIsVideoPlaying] = useState<boolean>(false);
  const [videoTimestamp, setVideoTimestamp] = useState<string>('00:01:24:12');

  // 3. New Book Saving State
  const [showSaveBookModal, setShowSaveBookModal] = useState(false);
  const [bookSaveTitle, setBookSaveTitle] = useState('');
  const [isSavingBook, setIsSavingBook] = useState(false);

  // Keep a selected ficha as default
  useEffect(() => {
    if (fichas.length > 0 && !selectedFicha) {
      setSelectedFicha(fichas[0]);
    }
  }, [fichas, selectedFicha]);

  // Normalize Spanish accents for searches
  const normalizeText = (text: string) => {
    return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  };

  // Filter fichas based on criteria
  const filteredFichas = useMemo(() => {
    return fichas.filter(ficha => {
      if (selectedArea !== 'TODOS' && ficha.area !== selectedArea) return false;

      if (textSearch.trim()) {
        const queryNorm = normalizeText(textSearch);
        const titleNorm = normalizeText(ficha.title);
        const summaryNorm = normalizeText(ficha.summary);
        const contentNorm = normalizeText(ficha.contentSnapshot);
        const actionNorm = normalizeText(ficha.action);
        if (!titleNorm.includes(queryNorm) && 
            !summaryNorm.includes(queryNorm) && 
            !contentNorm.includes(queryNorm) &&
            !actionNorm.includes(queryNorm)) {
          return false;
        }
      }

      if (dateSearch) {
        if (ficha.generationDate !== dateSearch) return false;
      }

      if (quickDateFilter !== 'all') {
        const fichaDate = new Date(ficha.generationDate);
        const today = new Date();
        today.setHours(0,0,0,0);
        
        if (quickDateFilter === 'today') {
          const fichaStr = ficha.generationDate;
          const todayStr = today.toISOString().split('T')[0];
          if (fichaStr !== todayStr) return false;
        } else if (quickDateFilter === 'week') {
          const oneWeekAgo = new Date();
          oneWeekAgo.setDate(today.getDate() - 7);
          if (fichaDate < oneWeekAgo) return false;
        } else if (quickDateFilter === 'month') {
          const oneMonthAgo = new Date();
          oneMonthAgo.setMonth(today.getMonth() - 1);
          if (fichaDate < oneMonthAgo) return false;
        }
      }

      return true;
    });
  }, [fichas, selectedArea, textSearch, dateSearch, quickDateFilter]);

  // Group filtered fichas by generation date
  const groupedFichas = useMemo(() => {
    const groups: { [date: string]: Ficha[] } = {};
    filteredFichas.forEach(ficha => {
      const dateKey = ficha.generationDate;
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(ficha);
    });
    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
  }, [filteredFichas]);

  // Format date display for headers
  const formatDateHeader = (dateStr: string) => {
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        return d.toLocaleDateString('es-EC', { day: 'numeric', month: 'long', year: 'numeric' });
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  // High quality printing for selected Ficha
  const handlePrintFicha = () => {
    if (!selectedFicha) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Ficha de Inteligencia - ${selectedFicha.title}</title>
          <style>
            body { font-family: 'Georgia', serif; padding: 40px; color: #0f172a; line-height: 1.6; }
            h1 { font-family: 'Playfair Display', 'Times New Roman', serif; text-transform: uppercase; border-bottom: 2px solid #B59441; padding-bottom: 10px; margin-bottom: 5px; }
            .meta { font-family: monospace; font-size: 11px; color: #64748b; margin-bottom: 30px; letter-spacing: 1px; }
            .badge { display: inline-block; background: #f1f5f9; border: 1px solid #cbd5e1; padding: 3px 10px; font-size: 11px; font-weight: bold; font-family: sans-serif; margin-right: 10px; }
            .badge-gold { background: #faf5e6; border: 1px solid #e9d5a1; color: #b59441; }
            .content { font-size: 15px; text-align: justify; }
            .footer { margin-top: 50px; border-top: 1px solid #e2e8f0; padding-top: 20px; font-size: 12px; font-style: italic; text-align: center; color: #64748b; }
          </style>
        </head>
        <body>
          <div class="meta">SOLJURE COMPENDIO // HISTORIAL DE INTELIGENCIA JURÍDICA</div>
          <h1>${selectedFicha.title}</h1>
          <div style="margin-bottom: 30px;">
            <span class="badge badge-gold">${selectedFicha.area}</span>
            <span class="badge">ACCION: ${selectedFicha.action.toUpperCase()}</span>
            <span class="badge">FECHA: ${selectedFicha.generationDate}</span>
          </div>
          <p style="font-weight: bold; font-size: 16px; border-left: 3px solid #B59441; padding-left: 15px; margin-bottom: 35px; color: #1e293b;">
            ${selectedFicha.summary}
          </p>
          <div class="content">
            ${selectedFicha.contentSnapshot.replace(/\n'/g, '<br/>')}
          </div>
          <div class="footer">
            Elaborado por: ${selectedFicha.author}<br/>
            SOLJURE ECUADOR © 2026 - Biblioteca de Inteligencia Jurídica.
          </div>
          <script>window.print();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // High quality printing for the entire Compiled Textbook
  const handlePrintEntireBook = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    // Compile chapters
    let chaptersHtml = '';
    const bookEditorials = editorials.length > 0 ? editorials : [
      {
        id: 'mock_1',
        title: 'REFORMA DE LA CONCILIACIÓN PROCESAL Y DOCTRINA CONSTITUCIONAL',
        summary: 'Directrices estratégicas para la eficacia y defensa jurídica en Ecuador.',
        content: 'El panorama procesal exige un balance preciso entre la doctrina constitucional y la legislación adjetiva civil, laboral y penal ecuatoriana.',
        area: ExpertiseArea.CONSTITUCIONAL,
        author: 'SOLJURE EFICACES',
        date: '02 de Junio de 2026'
      }
    ];

    bookEditorials.forEach((ed, idx) => {
      chaptersHtml += `
        <div class="chapter-page">
          <div class="chapter-num">CAPÍTULO ${idx + 1}</div>
          <h2 class="chapter-title">${ed.title}</h2>
          <p class="chapter-meta">Área Especializada: ${ed.area} | Autor: ${ed.author} | Publicado: ${ed.date}</p>
          <div class="chapter-summary">
            <strong>Sumario Ejecutivo:</strong> ${ed.summary}
          </div>
          <div class="chapter-content">
            ${ed.content.replace(/\n/g, '<br/>')}
          </div>
        </div>
        <hr class="page-break"/>
      `;
    });

    printWindow.document.write(`
      <html>
        <head>
          <title>Compendio de Inteligencia Jurídica y Doctrinal - SOLJURE</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=Inter:wght@300;400;600;700&display=swap');
            body { font-family: 'Inter', sans-serif; padding: 50px; color: #0a1120; line-height: 1.6; }
            .page-break { page-break-after: always; border: none; margin: 30px 0; }
            
            /* Portada Style */
            .cover { height: 95vh; display: flex; flex-direction: column; justify-content: space-between; text-align: center; border: 4px double #B59441; padding: 50px 40px; box-sizing: border-box; background-color: #0c1524; color: #ffffff; border-radius: 8px; }
            .cover-header { font-size: 13px; letter-spacing: 4px; font-weight: 800; color: #B59441; text-transform: uppercase; }
            .cover-body { margin-top: auto; margin-bottom: auto; padding: 20px 0; }
            .cover-title { font-family: 'Playfair Display', serif; font-size: 38px; font-weight: 900; color: #ffffff; text-transform: uppercase; line-height: 1.3; letter-spacing: -0.5px; margin: 0; }
            .cover-subtitle { font-size: 15px; font-style: italic; color: #cbd5e1; margin-top: 25px; line-height: 1.6; max-w: 600px; margin-left: auto; margin-right: auto; }
            .cover-author-box { margin-top: 60px; border-top: 1px solid rgba(255,255,255,0.1); display: inline-block; padding: 20px 40px 0 40px; }
            .cover-author { font-size: 18px; font-weight: 800; color: #B59441; text-transform: uppercase; letter-spacing: 2px; }
            .cover-qualification { font-size: 11px; color: #94a3b8; font-style: italic; margin-top: 4px; text-transform: uppercase; letter-spacing: 1px; }
            .cover-footer { margin-top: auto; font-size: 11px; letter-spacing: 3px; font-weight: bold; color: #94a3b8; }

            /* Table Formatting for Print */
            table { width: 100%; border-collapse: collapse; margin: 25px 0; font-size: 13px; text-align: left; }
            th { background-color: #0F172A; color: #ffffff; padding: 10px 15px; font-weight: bold; text-transform: uppercase; border: 1px solid #E2E8F0; }
            td { padding: 10px 15px; border: 1px solid #E2E8F0; color: #334155; }
            tr:nth-child(even) { background-color: #f8fafc; }
            
            /* Prologo / Intro / Index Styles */
            .section-title { font-family: 'Playfair Display', serif; font-size: 28px; border-bottom: 2px solid #0a1120; padding-bottom: 8px; margin-top: 40px; text-transform: uppercase; }
            .text-justify { text-align: justify; }
            
            /* Chapters */
            .chapter-page { margin-top: 50px; }
            .chapter-num { font-size: 12px; font-weight: 800; letter-spacing: 3px; color: #B59441; }
            .chapter-title { font-family: 'Playfair Display', serif; font-size: 24px; text-transform: uppercase; margin-top: 5px; color: #0a1120; }
            .chapter-meta { font-size: 11px; color: #64748b; font-weight: bold; margin-bottom: 20px; }
            .chapter-summary { background: #f8fafc; border-left: 4px solid #B59441; padding: 15px; margin-bottom: 25px; font-size: 14px; font-style: italic; }
            .chapter-content { font-size: 14px; text-align: justify; color: #334155; }
            
            /* Table of Contents style */
            .toc-item { display: flex; justify-content: space-between; border-bottom: 1px dotted #ccc; padding: 8px 0; font-size: 13px; }
            .toc-dots { flex-grow: 1; border-bottom: 1px dotted #94a3b8; margin: 0 10px; position: relative; top: -5px; }
          </style>
        </head>
        <body>
          <!-- COVER -->
          <div class="cover">
            <div class="cover-header">TRATADO EDITORIAL CORPORATIVO // VOLUMEN I</div>
            <div class="cover-body">
              <h1 class="cover-title">TRATADO PRÁCTICO DE INTELIGENCIA NORMATIVA</h1>
              <p class="cover-subtitle">
                Análisis Crítico de la Normativa Contable, Tributaria y Procedimientos de Auditoría Integral en el Sector Corporativo Ecuatoriano
              </p>
              <div class="cover-author-box">
                <div class="cover-author">ING. COM. SEGUNDO CUENCA C.</div>
                <div class="cover-qualification">Magíster en Auditoría Integral — Autor y Actor Principal // 2026</div>
              </div>
            </div>
            <div class="cover-footer">SOLJURE ECUADOR // COOPERACIÓN JURÍDICA 2026</div>
          </div>
          <hr class="page-break"/>

          <!-- INDEX -->
          <div class="section-title">Índice General de Contenidos</div>
          <div style="margin-top: 30px;">
            <div class="toc-item"><span><strong>Preliminares</strong></span></div>
            <div class="toc-item"><span>Prólogo: Gobernanza Jurídica 2026</span><span class="toc-dots"></span><span>III</span></div>
            <div class="toc-item"><span>Introducción: El Paradigma Constitucional y Procesal</span><span class="toc-dots"></span><span>V</span></div>
            
            <div class="toc-item" style="margin-top: 20px;"><span><strong>Capítulos de Especialidad Académica</strong></span></div>
            ${bookEditorials.map((ed, idx) => `
              <div class="toc-item">
                <span>Capítulo ${idx + 1}: ${ed.title}</span>
                <span class="toc-dots"></span>
                <span>Pág. ${7 + idx * 5}</span>
              </div>
            `).join('')}

            <div class="toc-item" style="margin-top: 20px;"><span><strong>Cierre Académico</strong></span></div>
            <div class="toc-item"><span>Bibliografía Oficial y Legal</span><span class="toc-dots"></span><span>IX</span></div>
            <div class="toc-item"><span>Anexos Básicos Ecuatorianos</span><span class="toc-dots"></span><span>X</span></div>
          </div>
          <hr class="page-break"/>

          <!-- PROLOGO -->
          <div class="section-title">Prólogo</div>
          <div class="text-justify" style="margin-top: 25px; font-size: 14.5px; color: #1e293b;">
            <p>La transformación procesal y el rigor sustantivo se han convertido en pilares irremplazables de la seguridad jurídica en el Ecuador contemporáneo del año 2026. Los profesionales del derecho ya no solo fungen como litigantes, sino como artífices de la estrategia preventiva y la defensa técnica de vanguardia.</p>
            <p>Este Compendio de Inteligencia Jurídica recopila el esfuerzo editorial continuo de SOLJURE, entregando análisis doctrinarios de las variables adjetivas y sustantivas de la legislación ecuatoriana. Representa una guía metódica diseñada por abogados expertos, dirigida a estructurar el patrocinio y la asesoría civil, laboral, penal, tributaria y constitucional de vanguardia.</p>
            <p style="margin-top: 40px; font-weight: bold; text-align: right;">— Dirección General y Académica de SOLJURE</p>
          </div>
          <hr class="page-break"/>

          <!-- INTRODUCCION -->
          <div class="section-title">Introducción General</div>
          <div class="text-justify" style="margin-top: 25px; font-size: 14.5px; color: #1e293b;">
            <p>El marco fiscal regulatorio ecuatoriano ha experimentado de manera histórica constantes transformaciones estructurales. La publicación de reformas a la Ley Orgánica de Régimen Tributario Interno (LORTI), junto con las resoluciones complementarias del SRI, establecen un escenario de alta exigencia metodológica para las empresas de comercio, manufactura y servicios.</p>
            <p>El objetivo central de este texto unificado radica en desentrañar los aspectos más críticos de la normativa fiscal, la aplicación de controles para impuestos diferidos según NIIF para PYMES (Sección 29), las complejidades operativas asociadas a la determinación del impuesto mínimo, y la adecuada auditoría preventiva ante auditorías del SRI. Esperamos que este instrumento metodológico consolide la cultura de la legalidad financiera preventiva en todo el territorio nacional.</p>
          </div>
          <hr class="page-break"/>

          <!-- DYNAMIC CHAPTERS -->
          ${chaptersHtml}

          <!-- BIBLIOGRAPHY -->
          <div class="section-title">Bibliografía Oficial y Fuentes de Consulta</div>
          <div class="text-justify" style="margin-top: 25px; font-size: 13.5px; color: #334155;">
            <p>• Servicio de Rentas Internas del Ecuador (SRI). (2026). <em>Resoluciones vigentes para retenciones de Impuesto a la Renta e Impuesto al Valor Agregado</em>. Registro Oficial de la República de Ecuador.</p>
            <p>• Asamblea Nacional de la República del Ecuador. (2025). <em>Ley Orgánica de Régimen Tributario Interno (LORTI) con sus reformas acumuladas</em>. Corporación de Estudios y Publicaciones.</p>
            <p>• International Accounting Standards Board (IASB). (2024). <em>Normas Internacionales de Información Financiera (NIIF completas y NIIF para PYMES)</em>. IFRS Foundation.</p>
            <p>• Superintendencia de Compañías, Valores y Seguros del Ecuador. (2026). <em>Manual de Procedimientos Contables y Presentación de Estados Financieros Consolidados</em>.</p>
          </div>
          <hr class="page-break"/>

          <!-- ANNEXES -->
          <div class="section-title">Anexos y Guías de Control Metódico</div>
          <div style="margin-top: 25px; font-size: 13px; color: #0f172a;">
            <h3 style="border-bottom: 1px solid #ddd; padding-bottom: 5px;">Anexo A: Tabla Conceptual de Retenciones de Renta (SRI En Vigor)</h3>
            <table style="width: 100%; border-collapse: collapse; margin-top: 10px; margin-bottom: 30px;">
              <thead>
                <tr style="background: #f1f5f9; text-align: left;">
                  <th style="border: 1px solid #cbd5e1; padding: 8px;">Concepto Tributario</th>
                  <th style="border: 1px solid #cbd5e1; padding: 8px;">Código SRI</th>
                  <th style="border: 1px solid #cbd5e1; padding: 8px;">Porcentaje Retención</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style="border: 1px solid #cbd5e1; padding: 8px;">Honorarios Profesionales / Servicios Directos de Docencia</td>
                  <td style="border: 1px solid #cbd5e1; padding: 8px;">303</td>
                  <td style="border: 1px solid #cbd5e1; padding: 8px;">10.00 %</td>
                </tr>
                <tr style="background: #fafaf9;">
                  <td style="border: 1px solid #cbd5e1; padding: 8px;">Servicios predomina el intelecto no profesionales</td>
                  <td style="border: 1px solid #cbd5e1; padding: 8px;">304</td>
                  <td style="border: 1px solid #cbd5e1; padding: 8px;">8.00 %</td>
                </tr>
                <tr>
                  <td style="border: 1px solid #cbd5e1; padding: 8px;">Servicios donde predomina la mano de obra</td>
                  <td style="border: 1px solid #cbd5e1; padding: 8px;">322</td>
                  <td style="border: 1px solid #cbd5e1; padding: 8px;">2.00 %</td>
                </tr>
                <tr style="background: #fafaf9;">
                  <td style="border: 1px solid #cbd5e1; padding: 8px;">Adquisición de bienes de naturaleza mueble o corporal</td>
                  <td style="border: 1px solid #cbd5e1; padding: 8px;">312</td>
                  <td style="border: 1px solid #cbd5e1; padding: 8px;">1.00 %</td>
                </tr>
              </tbody>
            </table>

            <h3 style="border-bottom: 1px solid #ddd; padding-bottom: 5px; margin-top: 20px;">Anexo B: Procedimiento Metódico de Conciliación Tributaria</h3>
            <p style="background: #fdfaf2; padding: 15px; border-left: 3px solid #d97706; margin-top: 10px; font-family: monospace;">
              (+) Utilidad Financiera antes de Participación de Trabajadores<br/>
              (-) 15% Participación de Trabajadores (Deducible)<br/>
              (+) Gastos No Deducibles Locales (Art. 35 LORTI)<br/>
              (+) Amortización de Pérdidas Tributarias no Autorizadas<br/>
              (-) Ingresos Exentos o No Sujetos a IR (Dividendos locales, etc.)<br/>
              (=) Base Imponible para Impuesto a la Renta Régimen General<br/>
              (x) Tarifa de Impuesto Aplicable (25% Estándar, o diferenciada)
            </p>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Parser to convert Spanish or standard format dates safely for sorting and filtering
  const parseDateString = (dateStr: string): Date => {
    if (!dateStr) return new Date();
    
    // Check standard ISO format
    const parsedTime = Date.parse(dateStr);
    if (!isNaN(parsedTime)) {
      return new Date(parsedTime);
    }
    
    const normalized = dateStr.toLowerCase().trim();
    
    // Extract year
    const yearMatch = normalized.match(/\b(20\d{2})\b/);
    const year = yearMatch ? parseInt(yearMatch[1], 10) : 2026;
    
    // Extract day
    const dayMatch = normalized.match(/\b(\d{1,2})\b/);
    const day = dayMatch ? parseInt(dayMatch[1], 10) : 1;
    
    // Month mapping in Spanish
    const months: { [key: string]: number } = {
      ene: 0, enero: 0,
      feb: 1, febrero: 1,
      mar: 2, marzo: 2,
      abr: 3, abril: 3,
      may: 4, mayo: 4,
      jun: 5, junio: 5,
      jul: 6, julio: 6,
      ago: 7, agosto: 7,
      sep: 8, sept: 8, septiembre: 8,
      oct: 9, octubre: 9,
      nov: 10, noviembre: 10,
      dic: 11, diciembre: 11
    };
    
    let month = 0;
    for (const [key, val] of Object.entries(months)) {
      if (normalized.includes(key)) {
        month = val;
        break;
      }
    }
    
    return new Date(year, month, day);
  };

  // Safe raw pool of editorials (including fallbacks)
  const allAvailableEditorials = useMemo<Editorial[]>(() => {
    if (editorials && editorials.length > 0) {
      return editorials;
    }
    return [
      {
        id: 'fallback_1',
        title: 'TRATADO PRÁCTICO FRENTE A LAS AUDITORÍAS INTEGRALES DEL SRI',
        summary: 'Metodología científica y operacional para la prevención del riesgo fiscal en el sector comercial ecuatoriano.',
        content: `### Introducción al Riesgo Fiscal Ecuatoriano
El control tributario en el Ecuador por parte del Servicio de Rentas Internas (SRI) ha implementado algoritmos de cruces automáticos de información, convirtiendo las discrepancias de IVA y Renta en determinaciones fiscales gravosas.

### Control Crítico e Impuestos Diferidos (NIIF para PYMES Sección 29)
Un balance contable robusto exige registrar con precisión matemática las diferencias temporarias que originan activos o pasivos por impuestos diferidos. 

* **Diferencias en Provisiones por Jubilación Patronal:** Se originan por cálculos actuariales que son de deducibilidad condicional.
* **Depreciaciones de Activos Fijos:** Discrepancias directas entre la vida útil contable e impositiva según los límites legislativos actuales.

### Tabla y Ratios de Auditoría Corporativa
| Ratios de Alerta SRI | Fórmula de Control | Valor Crítico de Alerta |
| :--- | :--- | :--- |
| Presión Fiscal Efectiva | Impuesto Causado / Ingresos Brutos | Menor al 1.8% |
| Margen Operativo Fiscal | Utilidad de Operación / Ventas Totales | Por debajo del estándar sectorial |

### Conclusiones y Recomendaciones Metódicas
Toda sociedad mercantil debe someter sus estados financieros a simulacros preventivos de auditoría mínimo una vez al año, asegurando que la conciliación cumpla con la Ley de Régimen Tributario Interno (LORTI).`,
        area: ExpertiseArea.TRIBUTARIO_ADUANERO,
        author: 'SOLJURE EFICACES',
        date: '02 de Junio de 2026',
        readTime: '15 min read'
      },
      {
        id: 'fallback_2',
        title: 'ESTUDIO DOCTRINARIO DE VALORACIÓN PROCESAL BAJO EL COGEP',
        summary: 'Análisis crítico sobre la tutela judicial efectiva y el debido proceso en la práctica de la administración de justicia.',
        content: `### Planteamiento Técnico e Introducción
El debido proceso constituye la garantía procesal de mayor trascendencia en el Ecuador contemporáneo del año 2026, garantizada en la Constitución de la República.

### Determinación Técnica Procesal
La norma procesal COGEP establece directrices claras para la simplificación de términos y la sustanciación de audiencias públicas de forma oral.

### Recomendación y Auditoría Tributaria
La asesoría preventiva en litigación y arbitraje constituye un elemento indiscutible para reducir contingencias y pasivos legales en litigación civil o comercial.`,
        area: ExpertiseArea.CONSTITUCIONAL,
        author: 'SOLJURE CONSULTING',
        date: '02 de Junio de 2026',
        readTime: '12 min de lectura'
      }
    ];
  }, [editorials]);

  // Selected editorial IDs for inclusion in the final book
  const [selectedEditorialIds, setSelectedEditorialIds] = useState<Set<string>>(new Set());

  // Initialize selection with all available ids on mount or update
  useEffect(() => {
    if (allAvailableEditorials && allAvailableEditorials.length > 0) {
      setSelectedEditorialIds(new Set(allAvailableEditorials.map(e => e.id)));
    }
  }, [allAvailableEditorials]);

  // Filtering and sorting state for checking interface
  const [bookSearchQuery, setBookSearchQuery] = useState('');
  const [bookFilterArea, setBookFilterArea] = useState<string>('all');
  const [bookStartDate, setBookStartDate] = useState('');
  const [bookEndDate, setBookEndDate] = useState('');
  const [bookSortType, setBookSortType] = useState<'date_desc' | 'date_asc' | 'title_asc' | 'title_desc' | 'area_asc'>('date_desc');
  
  // UI toggle for the configuration card expansion
  const [showConfigPanel, setShowConfigPanel] = useState(true);

  // Filtered/sorted list for display on selection lists
  const processedSelectorEditorials = useMemo<Editorial[]>(() => {
    let result = [...allAvailableEditorials];

    // Search by title & summary
    if (bookSearchQuery.trim()) {
      const q = bookSearchQuery.toLowerCase();
      result = result.filter(e => 
        e.title.toLowerCase().includes(q) || 
        e.summary.toLowerCase().includes(q)
      );
    }

    // Filter by Area
    if (bookFilterArea !== 'all') {
      result = result.filter(e => e.area === bookFilterArea);
    }

    // Filter by Date Start Range
    if (bookStartDate) {
      const start = new Date(bookStartDate);
      result = result.filter(e => parseDateString(e.date) >= start);
    }

    // Filter by Date End Range
    if (bookEndDate) {
      const end = new Date(bookEndDate);
      end.setHours(23, 59, 59, 999);
      result = result.filter(e => parseDateString(e.date) <= end);
    }

    // Sort according to selection
    result.sort((a, b) => {
      if (bookSortType === 'date_desc') {
        return parseDateString(b.date).getTime() - parseDateString(a.date).getTime();
      }
      if (bookSortType === 'date_asc') {
        return parseDateString(a.date).getTime() - parseDateString(b.date).getTime();
      }
      if (bookSortType === 'title_asc') {
        return a.title.localeCompare(b.title);
      }
      if (bookSortType === 'title_desc') {
        return b.title.localeCompare(a.title);
      }
      if (bookSortType === 'area_asc') {
        return a.area.localeCompare(b.area);
      }
      return 0;
    });

    return result;
  }, [allAvailableEditorials, bookSearchQuery, bookFilterArea, bookStartDate, bookEndDate, bookSortType]);

  // Actual selected editorials, sorted by whatever order is chosen by user
  const bookEditorials = useMemo<Editorial[]>(() => {
    // Take elements that are checked in the selected IDs
    let result = allAvailableEditorials.filter(e => selectedEditorialIds.has(e.id));

    // Sort them according to user preference so the order inside the book is customized!
    result.sort((a, b) => {
      if (bookSortType === 'date_desc') {
        return parseDateString(b.date).getTime() - parseDateString(a.date).getTime();
      }
      if (bookSortType === 'date_asc') {
        return parseDateString(a.date).getTime() - parseDateString(b.date).getTime();
      }
      if (bookSortType === 'title_asc') {
        return a.title.localeCompare(b.title);
      }
      if (bookSortType === 'title_desc') {
        return b.title.localeCompare(a.title);
      }
      if (bookSortType === 'area_asc') {
        return a.area.localeCompare(b.area);
      }
      return 0;
    });

    return result;
  }, [allAvailableEditorials, selectedEditorialIds, bookSortType]);

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* HEADER CONTROLS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-brand-border/60 pb-8">
        <div>
          <button 
            onClick={onBack}
            className="flex items-center gap-2 text-brand-slate hover:text-brand-accent transition-colors text-xs font-bold uppercase tracking-[0.2em] mb-4 group"
          >
            <ArrowLeft size={14} className="transform group-hover:-translate-x-1 transition-transform" /> Volver a ediciones
          </button>
          
          <div className="flex items-center gap-3">
            <BookMarked className="text-brand-accent shrink-0" size={32} />
            <div>
              <h1 className="text-4xl font-serif font-black text-brand-navy uppercase tracking-tight">
                Libro de Inteligencia Normativa
              </h1>
              <p className="text-brand-slate text-sm font-light mt-1">
                Herramienta oficial de compilación corporativa. Genere volúmenes y tratados académicos de sus editoriales.
              </p>
            </div>
          </div>
        </div>

        {/* FORMAT SELECTION TABS */}
        <div className="flex bg-[#0a1120] p-1 border border-white/10 rounded-xl max-w-sm">
          <button
            onClick={() => setActiveTab('academic_book')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${activeTab === 'academic_book' ? 'bg-brand-accent text-brand-navy shadow-md' : 'text-white/60 hover:text-white'}`}
          >
            <BookOpenCheck size={14} /> Libro Académico
          </button>
          <button
            onClick={() => setActiveTab('chronology')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${activeTab === 'chronology' ? 'bg-brand-accent text-brand-navy shadow-md' : 'text-white/60 hover:text-white'}`}
          >
            <List size={14} /> Historial Fichas
          </button>
        </div>
      </div>

      {/* RENDER TAB 1: ACADEMIC BOOK (PORTADA, INDEX, PROLOGO, CHAPTERS, BIBLIOGRAPHY, ANNEXES) */}
      {activeTab === 'academic_book' && (
        <div className="space-y-8">
          
          {/* Quick Actions for compiled volume */}
          <div className="bg-gradient-to-r from-brand-navy to-[#18294a] text-white p-6 rounded-2xl shadow-lg border border-brand-accent/25 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-1 text-center md:text-left">
              <div className="flex items-center gap-2 justify-center md:justify-start">
                <span className="h-2 w-2 rounded-full bg-brand-accent animate-pulse"></span>
                <span className="text-[10px] font-black uppercase tracking-[0.25em] text-brand-accent">SOPORTE DE COMPILACIÓN ACADÉMICA</span>
              </div>
              <h3 className="text-lg font-serif font-black uppercase tracking-tight">Tratado Impreso Unificado</h3>
              <p className="text-white/60 text-[11px] font-light max-w-xl">
                Su compendio se ha estructurado siguiendo un formato de libro de derecho tributario y contabilidad superior. Descargue en un solo clic su tratado de inteligencia normativo.
              </p>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <button
                onClick={handlePrintEntireBook}
                className="px-4 py-2.5 bg-brand-accent hover:bg-brand-accent/90 text-brand-navy font-bold text-[10px] uppercase tracking-widest rounded-lg transition-all shadow-md flex items-center gap-1.5 animate-pulse"
              >
                <Printer size={12} /> Imprimir Libro unificado
              </button>
              {onSaveBook && (
                <button
                  onClick={() => {
                    const defaultTitle = `TRATADO DE INTELIGENCIA UNIFICADO - ${new Date().toLocaleDateString('es-EC', { day: 'numeric', month: 'short', year: 'numeric' }).toUpperCase()}`;
                    setBookSaveTitle(defaultTitle);
                    setShowSaveBookModal(true);
                  }}
                  className="px-4 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-[10px] uppercase tracking-widest rounded-lg transition-all shadow-md flex items-center gap-1.5"
                >
                  <Bookmark size={12} className="text-white shrink-0 animate-pulse" /> Guardar en Historial
                </button>
              )}
              {onExportPDF && (
                <button
                  onClick={() => onExportPDF(bookEditorials)}
                  className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-white border border-white/10 text-[10.5px] font-bold uppercase tracking-widest rounded-lg transition-all"
                >
                  <FileText size={12} className="inline mr-1 text-brand-accent" /> PDF Completo
                </button>
              )}
              {onExportWord && (
                <button
                  onClick={() => onExportWord(bookEditorials)}
                  className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-white border border-white/10 text-[10.5px] font-bold uppercase tracking-widest rounded-lg transition-all"
                >
                  <FileText size={12} className="inline mr-1 text-blue-400" /> Formato Word (.docx)
                </button>
              )}
              {onExportPPT && (
                <button
                  onClick={() => onExportPPT(bookEditorials)}
                  className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-white border border-white/10 text-[10.5px] font-bold uppercase tracking-widest rounded-lg transition-all"
                >
                  <FileText size={12} className="inline mr-1 text-orange-400" /> PowerPoint (.pptx)
                </button>
              )}
              {onExportHTML && (
                <button
                  onClick={() => onExportHTML(bookEditorials)}
                  className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-white border border-white/10 text-[10.5px] font-bold uppercase tracking-widest rounded-lg transition-all"
                >
                  <FileText size={12} className="inline mr-1 text-emerald-400" /> HTML Interactivo
                </button>
              )}
            </div>
          </div>

          {/* CONTROL DE COMPILACIÓN EXCLUSIVA (BUSCADOR, ORDENACIÓN Y SELECCIÓN DE ARTÍCULOS) */}
          <div className="bg-white border border-brand-border rounded-2xl shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-brand-border/40 pb-3">
              <div className="flex items-center gap-2">
                <Sliders className="text-brand-accent h-4 w-4" />
                <h4 className="text-xs font-black uppercase tracking-[0.2em] text-brand-navy">
                  Configuración y Selección de Artículos para Publicación
                </h4>
              </div>
              <button 
                onClick={() => setShowConfigPanel(!showConfigPanel)}
                className="text-xs font-bold text-brand-accent hover:underline uppercase tracking-widest flex items-center gap-1"
              >
                {showConfigPanel ? "Ocultar Ajustes" : "Mostrar Ajustes"}
              </button>
            </div>

            {showConfigPanel && (
              <div className="space-y-6 animate-fade-in text-brand-navy">
                {/* FILTROS DE BÚSQUEDA, ÁREA Y FECHAS */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-brand-bg/40 p-4 rounded-xl border border-brand-border/40">
                  {/* Búsqueda por Título */}
                  <div className="space-y-1 text-left">
                    <label className="text-[9px] font-black uppercase tracking-widest text-brand-slate block">
                      Buscar por Título / Resumen
                    </label>
                    <div className="relative">
                      <Search size={14} className="absolute left-3 top-2.5 text-brand-slate/60" />
                      <input
                        type="text"
                        value={bookSearchQuery}
                        onChange={(e) => setBookSearchQuery(e.target.value)}
                        placeholder="Ej. Auditorías, IVA, NIC..."
                        className="w-full bg-white border border-brand-border rounded-lg pl-9 pr-3 py-2 text-xs text-brand-navy font-bold focus:outline-none focus:border-brand-accent"
                      />
                    </div>
                  </div>

                  {/* Filtrar por Especialidad */}
                  <div className="space-y-1 text-left">
                    <label className="text-[9px] font-black uppercase tracking-widest text-brand-slate block">
                      Filtrar por Área de Especialidad
                    </label>
                    <div className="relative">
                      <Filter size={14} className="absolute left-3 top-2.5 text-brand-slate/60" />
                      <select
                        value={bookFilterArea}
                        onChange={(e) => setBookFilterArea(e.target.value)}
                        className="w-full bg-white border border-brand-border rounded-lg pl-9 pr-3 py-2 text-xs text-brand-navy font-bold focus:outline-none focus:border-brand-accent appearance-none cursor-pointer"
                      >
                        <option value="all">TODAS LAS ÁREAS</option>
                        {Object.values(ExpertiseArea).map((area) => (
                          <option key={area} value={area}>
                            {area.toUpperCase()}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Fecha de Creación Rango */}
                  <div className="space-y-1 text-left">
                    <label className="text-[9px] font-black uppercase tracking-widest text-brand-slate block">
                      Fecha Desde (Rango)
                    </label>
                    <div className="relative">
                      <Calendar size={14} className="absolute left-3 top-2.5 text-brand-slate/60" />
                      <input
                        type="date"
                        value={bookStartDate}
                        onChange={(e) => setBookStartDate(e.target.value)}
                        className="w-full bg-white border border-brand-border rounded-lg pl-9 pr-3 py-2 text-xs text-brand-navy font-bold focus:outline-none focus:border-brand-accent cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Ordenación Avanzada */}
                  <div className="space-y-1 text-left">
                    <label className="text-[9px] font-black uppercase tracking-widest text-brand-slate block">
                      Criterio de Ordenación
                    </label>
                    <div className="relative">
                      <Sliders size={14} className="absolute left-3 top-2.5 text-brand-slate/60" />
                      <select
                        value={bookSortType}
                        onChange={(e) => setBookSortType(e.target.value as any)}
                        className="w-full bg-white border border-brand-border rounded-lg pl-9 pr-3 py-2 text-xs text-brand-navy font-bold focus:outline-none focus:border-brand-accent appearance-none cursor-pointer"
                      >
                        <option value="date_desc">FECHA DE CREACIÓN (MÁS RECIENTES)</option>
                        <option value="date_asc">FECHA DE CREACIÓN (MÁS ANTIGUOS)</option>
                        <option value="title_asc">TÍTULO DE ARTÍCULO (A - Z)</option>
                        <option value="title_desc">TÍTULO DE ARTÍCULO (Z - A)</option>
                        <option value="area_asc">ÁREA CONTABLE (ALFABÉTICO)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* SELECTORES DE ARTÍCULOS CON CHECKBOXES */}
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-3 rounded-lg border border-brand-border/20">
                    <div className="text-xs font-bold text-brand-navy">
                      Sección de Selección de Capítulos (
                      <span className="text-brand-accent font-black font-mono">
                        {bookEditorials.length}
                      </span>{' '}
                      de {allAvailableEditorials.length} incluidos en el libro)
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setSelectedEditorialIds(new Set(allAvailableEditorials.map(e => e.id)));
                        }}
                        className="px-3 py-1 bg-white hover:bg-slate-100 text-brand-navy text-[10px] font-bold border border-brand-border rounded uppercase cursor-pointer"
                      >
                        Seleccionar Todos
                      </button>
                      <button
                        onClick={() => {
                          setSelectedEditorialIds(new Set());
                        }}
                        className="px-3 py-1 bg-white hover:bg-slate-100 text-brand-navy text-[10px] font-bold border border-brand-border rounded uppercase cursor-pointer"
                      >
                        Deseleccionar Todos
                      </button>
                    </div>
                  </div>

                  {/* GRID DE ARTÍCULOS DISPONIBLES DETALLADOS */}
                  {processedSelectorEditorials.length === 0 ? (
                    <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-brand-border/40 text-xs font-bold text-brand-slate uppercase tracking-wide">
                      No se encontraron artículos con los filtros aplicados.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[240px] overflow-y-auto pr-1">
                      {processedSelectorEditorials.map((ed) => {
                        const isChecked = selectedEditorialIds.has(ed.id);
                        return (
                          <div
                            key={ed.id}
                            onClick={() => {
                              const next = new Set(selectedEditorialIds);
                              if (next.has(ed.id)) {
                                next.delete(ed.id);
                              } else {
                                next.add(ed.id);
                              }
                              setSelectedEditorialIds(next);
                            }}
                            className={`flex items-start gap-3 p-3.5 rounded-xl border text-left cursor-pointer transition-all hover:bg-[#FAFBFD] ${
                              isChecked
                                ? 'bg-[#f4f7fc] border-brand-accent/50 shadow-sm'
                                : 'bg-white border-brand-border/60 hover:opacity-90'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {}} // handled by click container
                              className="mt-0.5 h-4 w-4 shrink-0 rounded text-brand-accent focus:ring-brand-accent cursor-pointer accent-brand-accent"
                            />
                            
                            <div className="space-y-1 block min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-[9px] font-bold bg-white text-brand-navy border px-1.5 py-0.2 rounded uppercase">
                                  {ed.area}
                                </span>
                                <span className="text-[9px] font-black text-brand-slate uppercase tracking-wider flex items-center gap-1">
                                  <CalendarDays size={10} className="text-brand-accent" />
                                  {ed.date}
                                </span>
                              </div>
                              <h5 className="font-serif font-black text-[11px] uppercase tracking-tight text-brand-navy line-clamp-1 leading-snug">
                                {ed.title}
                              </h5>
                              <p className="text-[10px] text-brand-slate line-clamp-1 italic">
                                {ed.summary}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Clean Filter indicators */}
                  {(bookSearchQuery || bookFilterArea !== 'all' || bookStartDate || bookEndDate) && (
                    <div className="flex items-center gap-1.5 pt-1.5 flex-wrap">
                      <span className="text-[9px] font-black uppercase text-brand-slate">Filtros Activos:</span>
                      {bookSearchQuery && (
                        <span className="text-[9px] font-bold bg-[#FAFBFD] border border-brand-border/70 rounded px-2 py-1">
                          Búsqueda: "{bookSearchQuery}"
                        </span>
                      )}
                      {bookFilterArea !== 'all' && (
                        <span className="text-[9px] font-bold bg-[#FAFBFD] border border-brand-border/70 rounded px-2 py-1">
                          Área: {bookFilterArea}
                        </span>
                      )}
                      {(bookStartDate || bookEndDate) && (
                        <span className="text-[9px] font-bold bg-[#FAFBFD] border border-brand-border/70 rounded px-2 py-1">
                          Rango de Fechas
                        </span>
                      )}
                      <button
                        onClick={() => {
                          setBookSearchQuery('');
                          setBookFilterArea('all');
                          setBookStartDate('');
                          setBookEndDate('');
                          setBookSortType('date_desc');
                        }}
                        className="text-[9px] font-black text-brand-accent hover:underline uppercase tracking-wider ml-1 cursor-pointer"
                      >
                        Limpiar Todos los Filtros
                      </button>
                    </div>
                  )}

                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* BOOK NAVIGATION INDEX - LEFT PAGE */}
            <div className="col-span-1 lg:col-span-4 bg-[#FAFBFD] border border-brand-border p-6 rounded-2xl shadow-sm space-y-5">
              <div>
                <h3 className="text-xs font-black text-brand-navy uppercase tracking-widest flex items-center gap-2 pb-3 border-b border-brand-border/60">
                  <BookOpen size={15} className="text-brand-accent" /> Estructura Editorial
                </h3>
              </div>

              <div className="space-y-1">
                <button
                  onClick={() => setSelectedBookSection('portada')}
                  className={`w-full text-justify p-3 text-[11px] font-bold uppercase tracking-widest rounded-lg transition-all flex items-center gap-2 border ${selectedBookSection === 'portada' ? 'bg-brand-navy text-white border-brand-navy' : 'bg-white text-brand-slate hover:bg-slate-50 border-brand-border'}`}
                >
                  <Video size={13} className="text-brand-accent" /> Portada Inteligente (Google Vids)
                </button>
                
                <button
                  onClick={() => setSelectedBookSection('indice')}
                  className={`w-full text-justify p-3 text-[11px] font-bold uppercase tracking-widest rounded-lg transition-all flex items-center gap-2 border ${selectedBookSection === 'indice' ? 'bg-brand-navy text-white border-brand-navy' : 'bg-white text-brand-slate hover:bg-slate-50 border-brand-border'}`}
                >
                  <List size={13} className="text-brand-accent" /> Índice General y Capítulos
                </button>

                <button
                  onClick={() => setSelectedBookSection('prologo')}
                  className={`w-full text-justify p-3 text-[11px] font-bold uppercase tracking-widest rounded-lg transition-all flex items-center gap-2 border ${selectedBookSection === 'prologo' ? 'bg-brand-navy text-white border-brand-navy' : 'bg-white text-brand-slate hover:bg-slate-50 border-brand-border'}`}
                >
                  <Award size={13} className="text-brand-accent" /> Prólogo de Auditoría
                </button>

                <button
                  onClick={() => setSelectedBookSection('introduccion')}
                  className={`w-full text-justify p-3 text-[11px] font-bold uppercase tracking-widest rounded-lg transition-all flex items-center gap-2 border ${selectedBookSection === 'introduccion' ? 'bg-brand-navy text-white border-brand-navy' : 'bg-white text-brand-slate hover:bg-slate-50 border-brand-border'}`}
                >
                  <Scale size={13} className="text-brand-accent" /> Introducción Normativa
                </button>

                {/* Chapters header */}
                <div className="pt-3 pb-1">
                  <span className="text-[9px] font-black text-brand-slate uppercase tracking-widest block px-2">Capítulos del Tratado</span>
                </div>

                {bookEditorials.map((ed, idx) => {
                  const sectionId = `chapter_${ed.id}`;
                  const isSelected = selectedBookSection === sectionId;
                  return (
                    <button
                      key={ed.id}
                      onClick={() => setSelectedBookSection(sectionId)}
                      className={`w-full text-justify p-3 rounded-lg transition-all border block ${isSelected ? 'bg-brand-navy text-white border-brand-navy' : 'bg-white text-brand-navy hover:bg-slate-50 border-brand-border/70'}`}
                    >
                      <div className="flex justify-between items-center gap-2">
                        <span className="text-[10px] font-bold text-brand-accent uppercase tracking-widest">Capítulo {idx + 1}</span>
                        <span className="text-[9px] font-semibold bg-brand-bg text-brand-slate border px-1.5 py-0.5 rounded uppercase">{ed.area}</span>
                      </div>
                      <h4 className="font-serif font-black text-[11px] text-left mt-1 line-clamp-2 uppercase leading-snug">
                        {ed.title}
                      </h4>
                    </button>
                  );
                })}

                {/* Final sections header */}
                <div className="pt-3 pb-1">
                  <span className="text-[9px] font-black text-brand-slate uppercase tracking-widest block px-2">Anexos y Doctrina</span>
                </div>

                <button
                  onClick={() => setSelectedBookSection('bibliografia')}
                  className={`w-full text-justify p-3 text-[11px] font-bold uppercase tracking-widest rounded-lg transition-all flex items-center gap-2 border ${selectedBookSection === 'bibliografia' ? 'bg-brand-navy text-white border-brand-navy' : 'bg-white text-brand-slate hover:bg-slate-50 border-brand-border'}`}
                >
                  <FileText size={13} className="text-brand-accent" /> Bibliografía Oficial
                </button>

                <button
                  onClick={() => setSelectedBookSection('anexos')}
                  className={`w-full text-justify p-3 text-[11px] font-bold uppercase tracking-widest rounded-lg transition-all flex items-center gap-2 border ${selectedBookSection === 'anexos' ? 'bg-brand-navy text-white border-brand-navy' : 'bg-white text-brand-slate hover:bg-slate-50 border-brand-border'}`}
                >
                  <Sliders size={13} className="text-brand-accent" /> Anexos Regulatorios
                </button>
              </div>

              {/* Book quick metrics indicator */}
              <div className="p-4 bg-white border border-brand-border rounded-xl space-y-3">
                <div className="flex items-center gap-2">
                  <BookOpenCheck size={16} className="text-brand-accent" />
                  <span className="text-[10px] font-black uppercase tracking-wider text-brand-navy">Resumen del Volumen</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="bg-brand-bg border rounded p-1.5">
                    <div className="text-[10px] font-bold text-brand-slate uppercase">Capítulos</div>
                    <div className="text-base font-black text-brand-navy">{bookEditorials.length}</div>
                  </div>
                  <div className="bg-brand-bg border rounded p-1.5">
                    <div className="text-[10px] font-bold text-brand-slate uppercase font-sans">Especialidades</div>
                    <div className="text-base font-black text-brand-navy">5 Áreas</div>
                  </div>
                </div>
              </div>

            </div>

            {/* SECTION VIEWER - RIGHT PAGE */}
            <div className="col-span-1 lg:col-span-8">
              
              {/* RENDER INDIVIDUAL BOOK SECTION CONTENT */}
              {selectedBookSection === 'portada' && (
                <div className="bg-[#0a1120] border-2 border-brand-accent/40 p-8 md:p-12 rounded-3xl shadow-2xl relative overflow-hidden text-white flex flex-col justify-between min-h-[82vh]">
                  {/* Decorative background grids */}
                  <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:32px_32px] opacity-35"></div>
                  
                  {/* Ambient flare */}
                  <div className="absolute top-1/4 right-1/4 w-80 h-80 bg-brand-accent/10 rounded-full blur-3xl pointer-events-none"></div>

                  {/* Top: Google Vids Video Composition Bar */}
                  <div className="relative z-10 flex items-center justify-between border-b border-white/10 pb-4 mb-6">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse"></div>
                      <span className="text-[9px] font-black uppercase tracking-[0.25em] text-white/50">Google Vids AI Engine Mode // Composition board</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[9px] font-mono font-bold bg-white/5 px-2.5 py-1 tracking-widest rounded border border-white/10 uppercase text-white/80">
                        {videoTimestamp}
                      </span>
                    </div>
                  </div>

                  {/* GOOGLE VIDS VIEWPORT - THE PREVIEW SLIDE FRAME */}
                  <div className="relative z-10 bg-[#070b14] border border-white/10 rounded-2xl overflow-hidden shadow-inner p-1 mb-8">
                    <div className="relative aspect-[16/9] w-full bg-gradient-to-br from-brand-navy to-[#0F172A] rounded-xl flex flex-col justify-between p-6 overflow-hidden md:p-10 group">
                      
                      {/* Grid overlays */}
                      <div className="absolute inset-0 bg-radial-gradient from-transparent to-black/60 pointer-events-none"></div>

                      {/* Top ribbon of the active slide */}
                      <div className="relative z-10 flex justify-between items-start">
                        <span className="text-[8px] font-black bg-brand-accent text-brand-navy px-2 py-0.5 tracking-widest rounded uppercase">
                          SCENE_01_TECHNICAL_TREATISE
                        </span>
                        <div className="flex gap-1.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-white/40"></span>
                          <span className="h-1.5 w-1.5 rounded-full bg-white/40"></span>
                          <span className="h-1.5 w-1.5 rounded-full bg-brand-accent"></span>
                        </div>
                      </div>

                      {/* Dynamic Center Media Layout Representing the technical context */}
                      <div className="relative z-10 my-4 text-center space-y-4">
                        <div className="inline-block p-1 px-3 bg-white/5 border border-white/10 rounded-full backdrop-blur-md mb-2">
                          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-accent flex items-center gap-1">
                            <Sparkles size={10} /> Tratado Técnico y Doctrinal
                          </p>
                        </div>
                        
                        <h2 className="text-2xl md:text-4xl font-serif font-black text-white leading-tight uppercase tracking-tight max-w-2xl mx-auto drop-shadow-md">
                          INTELIGENCIA NORMATIVA ECUADOR
                        </h2>
                        
                        <p className="text-[11px] md:text-xs text-white/70 max-w-xl mx-auto font-light uppercase tracking-widest">
                          Enfoque Analítico de Contabilidad, Tributación y Prácticas de Auditoría Preventiva
                        </p>
                      </div>

                      {/* Google Vids-themed timeline visual overlays */}
                      <div className="relative z-10 flex items-center justify-between border-t border-white/10 pt-4 mt-auto">
                        <div className="flex items-center gap-3">
                          <button 
                            onClick={() => setIsVideoPlaying(!isVideoPlaying)}
                            className="bg-brand-accent hover:bg-white text-brand-navy p-2 rounded-full transition-all text-xs"
                            title="Proyectar Portada"
                          >
                            <Play size={12} fill="currentColor" />
                          </button>
                          <span className="text-[10px] font-mono text-white/50">Simulador Portada Google Vids</span>
                        </div>

                        <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-lg p-1 text-[9px] font-bold">
                          <span className="px-2 text-white/50">VOZ:</span>
                          <select 
                            value={voiceStyle} 
                            onChange={(e) => setVoiceStyle(e.target.value)}
                            className="bg-transparent text-brand-accent focus:outline-none cursor-pointer outline-none font-bold"
                          >
                            <option value="Profesional y Persuasiva" className="bg-[#0a1120] text-white">Pref. Profesional</option>
                            <option value="Jovial y Dinámica" className="bg-[#0a1120] text-white">Pref. Jovial</option>
                            <option value="Instruccional/Aula" className="bg-[#0a1120] text-white">Pref. Aula académica</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Timeline Multi-Slots Preview Bar representing Vids media tracks */}
                    <div className="p-3 bg-white/5 grid grid-cols-4 gap-2 text-center rounded-b-xl border-t border-white/10">
                      <div className="bg-white/5 border border-brand-accent/20 rounded p-1 p-2 group hover:border-brand-accent transition-all cursor-pointer">
                        <span className="text-[8px] font-bold text-brand-accent block">DIAPOSITIVA 1</span>
                        <span className="text-[9px] text-white/60 font-serif font-bold tracking-tight line-clamp-1">PORTADA EDITORIAL</span>
                      </div>
                      <div className="bg-white/5 border border-white/5 rounded p-1 p-2 group hover:border-brand-accent transition-all cursor-pointer">
                        <span className="text-[8px] font-bold text-white/40 block">DIAPOSITIVA 2</span>
                        <span className="text-[9px] text-white/60 font-serif font-bold tracking-tight line-clamp-1">SUMARIO DE MARCO</span>
                      </div>
                      <div className="bg-white/5 border border-white/5 rounded p-1 p-2 group hover:border-brand-accent transition-all cursor-pointer">
                        <span className="text-[8px] font-bold text-white/40 block">DIAPOSITIVA 3</span>
                        <span className="text-[9px] text-white/60 font-serif font-bold tracking-tight line-clamp-1">CASOS TRIBUTARIOS</span>
                      </div>
                      <div className="bg-white/5 border border-white/5 rounded p-1 p-2 group hover:border-brand-accent transition-all cursor-pointer">
                        <span className="text-[8px] font-bold text-white/40 block">DIAPOSITIVA 4</span>
                        <span className="text-[9px] text-white/60 font-serif font-bold tracking-tight line-clamp-1">CONCILIACIONES</span>
                      </div>
                    </div>
                  </div>

                  {/* Title and details block for physical cover book */}
                  <div className="relative z-10 text-center md:text-left border-t border-white/10 pt-6 mt-6 space-y-4">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                      <div>
                        <p className="text-brand-accent text-xs font-bold uppercase tracking-widest">Tratado Máster y Compilación</p>
                        <h1 className="text-2xl font-serif font-black uppercase text-white tracking-tight mt-1 leading-snug">
                          TRATADO PRÁCTICO DE INTELIGENCIA NORMATIVA
                        </h1>
                        <p className="text-xs text-white/60 mt-1">
                          Volumen I — Publicaciones Especiales sobre LORTI, NIIF para PYMES y Control de Procesos de Auditoría Preventiva
                        </p>
                      </div>
                      <div className="shrink-0 text-center md:text-right">
                        <span className="text-[10px] font-black uppercase tracking-widest text-[#B59441] block">DIRECTOR Y AUTOR PRINCIPAL</span>
                        <span className="text-xs text-white font-bold tracking-[0.1em] uppercase block">ING. COM. SEGUNDO CUENCA</span>
                        <span className="text-[9px] text-brand-accent font-black block tracking-wider mt-0.5">AÑO EDITORIAL 2026</span>
                      </div>
                    </div>
                  </div>

                </div>
              )}

              {selectedBookSection === 'indice' && (
                <div className="bg-white border-2 border-[#D7C9A4] p-8 md:p-12 rounded-3xl shadow-xl min-h-[82vh] relative">
                  <div className="border-b-2 border-brand-navy pb-4 mb-6 flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-navy">Índice del Tratado Académico</span>
                    <span className="text-[9px] font-black bg-brand-navy text-white px-2.5 py-1 tracking-widest rounded">SOLJURE // EDICIÓN JURÍDICA I</span>
                  </div>

                  <h2 className="text-3xl font-serif font-black text-brand-navy uppercase tracking-tight leading-snug mb-10 text-center">
                    Tabla de Contenidos Generales
                  </h2>

                  <div className="space-y-6 max-w-2xl mx-auto text-brand-navy/90 font-sans text-sm">
                    
                    {/* Preliminares */}
                    <div>
                      <h4 className="font-bold text-xs uppercase tracking-[0.15em] text-[#B59441] border-b border-brand-border pb-1 mb-3">Preliminares</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between items-baseline group cursor-pointer" onClick={() => setSelectedBookSection('portada')}>
                          <span className="font-semibold group-hover:text-brand-accent transition-colors">Diseño Portada Google Vids</span>
                          <span className="flex-1 mx-2 border-b border-dotted border-slate-300"></span>
                          <span className="font-mono text-xs">Pág. I</span>
                        </div>
                        <div className="flex justify-between items-baseline group cursor-pointer" onClick={() => setSelectedBookSection('prologo')}>
                          <span className="font-semibold group-hover:text-brand-accent transition-colors">Prólogo: Gobernanza Normativa y Digital</span>
                          <span className="flex-1 mx-2 border-b border-dotted border-slate-300"></span>
                          <span className="font-mono text-xs">Pág. III</span>
                        </div>
                        <div className="flex justify-between items-baseline group cursor-pointer" onClick={() => setSelectedBookSection('introduccion')}>
                          <span className="font-semibold group-hover:text-brand-accent transition-colors">Introducción General: Entorno LORTI</span>
                          <span className="flex-1 mx-2 border-b border-dotted border-slate-300"></span>
                          <span className="font-mono text-xs">Pág. V</span>
                        </div>
                      </div>
                    </div>

                    {/* Capítulos */}
                    <div>
                      <h4 className="font-bold text-xs uppercase tracking-[0.15em] text-[#B59441] border-b border-brand-border pb-1 mb-3">Capítulos de Doctrina Científica</h4>
                      <div className="space-y-4">
                        {bookEditorials.map((ed, idx) => (
                          <div 
                            key={ed.id} 
                            className="flex justify-between items-baseline group cursor-pointer"
                            onClick={() => setSelectedBookSection(`chapter_${ed.id}`)}
                          >
                            <div className="pr-4">
                              <span className="font-bold text-[10px] text-brand-accent block uppercase">Capítulo {idx+1}</span>
                              <span className="font-semibold group-hover:text-brand-accent transition-colors block leading-snug">{ed.title}</span>
                              <span className="text-[10px] text-brand-slate font-medium uppercase mt-0.5 block">{ed.area} (Redactada por {ed.author})</span>
                            </div>
                            <span className="flex-1 border-b border-dotted border-slate-300 relative top-[-4px]"></span>
                            <span className="font-mono text-xs text-brand-navy">Pág. {7 + idx * 5}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Cierre */}
                    <div>
                      <h4 className="font-bold text-xs uppercase tracking-[0.15em] text-[#B59441] border-b border-brand-border pb-1 mb-3">Cierre Académico y Materiales</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between items-baseline group cursor-pointer" onClick={() => setSelectedBookSection('bibliografia')}>
                          <span className="font-semibold group-hover:text-brand-accent transition-colors">Bibliografía de Textos Legales y NIIF</span>
                          <span className="flex-1 mx-2 border-b border-dotted border-slate-300"></span>
                          <span className="font-mono text-xs">Pág. IX</span>
                        </div>
                        <div className="flex justify-between items-baseline group cursor-pointer" onClick={() => setSelectedBookSection('anexos')}>
                          <span className="font-semibold group-hover:text-brand-accent transition-colors">Anexos: Tabla Retenciones e Instructivos</span>
                          <span className="flex-1 mx-2 border-b border-dotted border-slate-300"></span>
                          <span className="font-mono text-xs">Pág. X</span>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              )}

              {selectedBookSection === 'prologo' && (
                <div className="bg-white border-2 border-[#D7C9A4] p-8 md:p-12 rounded-3xl shadow-xl min-h-[82vh] relative">
                  <div className="border-b-2 border-brand-navy pb-4 mb-6 flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-navy">Prólogo de Entrada</span>
                    <span className="text-[9px] font-black bg-brand-navy text-white px-2.5 py-1 tracking-widest rounded">SOLJURE // EDICIÓN JURÍDICA I</span>
                  </div>

                  <h2 className="text-3xl font-serif font-black text-brand-navy uppercase tracking-tight leading-snug mb-8">
                    Prólogo Editorial: Rigor y Doctrina de Defensa Legal en 2026
                  </h2>

                  <div className="prose prose-sm text-justify text-[#1e293b] leading-relaxed space-y-4">
                    <p>La defensa constitucional, el debido proceso y la rigurosidad procesal tributaria se han convertido en pilares irremplazables de la gobernanza corporativa en el Ecuador contemporáneo del año 2026. Los profesionales del derecho ya no solo fungen como litigantes coyunturales, sino como artífices de la estrategia preventiva y la seguridad jurídica de las organizaciones de vanguardia.</p>
                    <p>En este sentido, la celeridad impositiva liderada por el Servicio de Rentas Internas y las inspecciones de las cortes requiren respuestas sistemáticas soportadas bajo un enfoque conceptual impecable. El presente Tratado busca de forma exhaustiva rellenar el histórico vacío doctrinal que a menudo separa la aplicación pragmática de la ley del análisis procesal científico vanguardista.</p>
                    <p>Cada sección del presente volumen es el resultado de una minuciosa recopilación dogmática y jurisprudencial estructurada con herramientas de inteligencia jurídica avanzada, logrando una síntesis inmutable de las bases procesales aplicables en territorio ecuatoriano.</p>
                    
                    <div className="pt-20 text-right space-y-1">
                      <p className="font-serif font-black text-brand-navy uppercase tracking-wider">Dr. Segundo Cuenca C.</p>
                      <p className="text-xs text-brand-slate font-medium uppercase font-mono">Socio Fundador & Magistrado Consultor de Litigio</p>
                      <p className="text-[10px] text-[#B59441] font-black uppercase tracking-widest mt-1">DIRECCIÓN GENERAL SOLJURE ECUADOR</p>
                    </div>
                  </div>
                </div>
              )}

              {selectedBookSection === 'introduccion' && (
                <div className="bg-white border-2 border-[#D7C9A4] p-8 md:p-12 rounded-3xl shadow-xl min-h-[82vh] relative">
                  <div className="border-b-2 border-brand-navy pb-4 mb-6 flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-navy font-mono">Preliminares de Estudio</span>
                    <span className="text-[9px] font-black bg-brand-navy text-white px-2.5 py-1 tracking-widest rounded">SOLJURE // EDICIÓN JURÍDICA I</span>
                  </div>

                  <h2 className="text-3xl font-serif font-black text-brand-navy uppercase tracking-tight leading-snug mb-8">
                    Introducción Técnica General
                  </h2>

                  <div className="prose prose-sm text-justify text-[#1e293b] leading-relaxed space-y-4">
                    <p>Frecuentemente, el sector industrial ecuatoriano subestima las discrepancias impositivas resultantes de un deficiente control operativo. La introducción de este Tratado tiene por objeto definir el marco teórico bajo el cual se estructuran cada uno de los capítulos doctrinales presentados en este volumen.</p>
                    <p>La Ley Orgánica de Régimen Tributario Interno (LORTI) define que la contabilidad llevada con apego a los principios contables aprobados en el país servirá de base oficial para la declaración de tributos. Sin embargo, en caso de discrepancia expresa, son las normas fiscales las que gobiernan el cálculo del impuesto consolidable o causado.</p>
                    <p>A lo largo de este libro, profundizaremos en el análisis del Impuesto Diferido, los ratios de riesgo que utiliza el SRI para priorizar auditorías presenciales y la adecuada valuación técnica basándonos en NIC 2 y NIIF para PYMES. Instamos al lector profesional a estudiar estas metodologías no solo como un reglamento estricto, sino como un escudo científico indispensable para la sustentabilidad operativa corporativa.</p>
                  </div>
                </div>
              )}

               {/* RENDER CHAPTER CASE */}
               {selectedBookSection.startsWith('chapter_') && (() => {
                 const chapterId = selectedBookSection.replace('chapter_', '');
                 const matchedChapter = bookEditorials.find(e => e.id === chapterId);
                 if (!matchedChapter) {
                   return (
                     <div className="bg-white border-2 border-dashed border-brand-border p-8 md:p-12 rounded-3xl shadow-xl min-h-[82vh] flex flex-col items-center justify-center text-center">
                       <AlertTriangle className="text-brand-accent mb-3 h-12 w-12 animate-bounce" />
                       <h3 className="text-lg font-serif font-black text-brand-navy uppercase mb-2">Este capítulo no está seleccionado</h3>
                       <p className="text-xs text-brand-slate max-w-sm leading-relaxed mb-4">
                         Para ver, imprimir o exportar este capítulo, por favor actívelo marcando su casilla en el panel de control superior de la página.
                       </p>
                     </div>
                   );
                 }
                 return (
                  <div className="bg-white border-2 border-[#D7C9A4] p-8 md:p-12 rounded-3xl shadow-xl min-h-[82vh] relative flex flex-col justify-between">
                    
                    <div>
                      {/* Chapter metadata ribbon */}
                      <div className="border-b-2 border-brand-navy pb-4 mb-6 flex flex-wrap justify-between items-center gap-2">
                        <div className="flex items-center gap-2">
                          <Bookmark size={14} className="text-[#B59441]" />
                          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-navy font-mono">Especialidad de Tratado</span>
                        </div>
                        <span className="text-[9px] font-black bg-brand-navy text-white px-2.5 py-1 tracking-widest rounded uppercase">
                          {matchedChapter.area} // {matchedChapter.date || '02 de Junio de 2026'}
                        </span>
                      </div>

                      <div className="space-y-4 mb-6">
                        <p className="text-xs uppercase tracking-widest font-black text-[#B59441]">Capítulo de Estudio</p>
                        <h2 className="text-3xl font-serif font-black text-brand-navy uppercase tracking-tight leading-snug">
                          {matchedChapter.title}
                        </h2>
                        <p className="text-xs text-brand-slate font-medium italic">
                          Por {matchedChapter.author || 'Dirección de Inteligencia SOLJURE'} // ID: #{matchedChapter.id}
                        </p>
                      </div>

                      {/* Summary callout banner */}
                      <div className="bg-[#FAF8F3] border-l-4 border-[#B59441] p-5 rounded-r-xl mb-8">
                        <span className="text-[9px] font-black text-[#B59441] uppercase tracking-widest block mb-2">Sumario Analítico</span>
                        <p className="text-xs text-brand-navy font-semibold leading-relaxed">
                          {matchedChapter.summary}
                        </p>
                      </div>

                      {/* Main chapter content */}
                      <div className="prose prose-sm max-w-none text-justify border-t border-brand-border/40 pt-6 leading-relaxed">
                        <div className="markdown-body text-xs font-light text-slate-800 leading-relaxed font-sans space-y-4">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {matchedChapter.content}
                          </ReactMarkdown>
                        </div>
                      </div>
                    </div>

                    {/* Footer buttons specific to this chapter */}
                    <div className="mt-12 pt-6 border-t border-brand-border/60 flex flex-wrap gap-4 items-center justify-between bg-brand-bg/60 p-4 rounded-xl">
                      <div className="flex items-center gap-2">
                        <Clock size={12} className="text-brand-slate" />
                        <span className="text-[9px] font-bold text-brand-slate uppercase tracking-widest">
                          Autoría Oficial de Publicación SOLJURE
                        </span>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={handlePrintEntireBook}
                          className="flex items-center gap-1 bg-white border border-brand-border hover:border-brand-accent p-2 px-3 text-[10px] font-black uppercase tracking-widest rounded"
                        >
                          <Printer size={11} /> Descargar Tratado
                        </button>
                      </div>
                    </div>

                  </div>
                );
              })()}

              {selectedBookSection === 'bibliografia' && (
                <div className="bg-white border-2 border-[#D7C9A4] p-8 md:p-12 rounded-3xl shadow-xl min-h-[82vh] relative">
                  <div className="border-b-2 border-brand-navy pb-4 mb-6 flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-navy">Referencias Académicas</span>
                    <span className="text-[9px] font-black bg-brand-navy text-white px-2.5 py-1 tracking-widest rounded">SOLJURE // EDICIÓN JURÍDICA I</span>
                  </div>

                  <h2 className="text-3xl font-serif font-black text-brand-navy uppercase tracking-tight leading-snug mb-8 text-center">
                    Bibliografía Oficial y Legal
                  </h2>

                  <div className="space-y-6 text-justify text-[#334155] font-sans text-xs max-w-2xl mx-auto leading-relaxed">
                    <div className="pl-6 -indent-6">
                      <span className="font-bold">Ecuador, Servicio de Rentas Internas (SRI). (2026).</span> 
                      {' '}<em>Resoluciones de Régimen Simplificado para Impuesto a la Renta de Sociedades y Personas Naturales</em>. Boletín Oficial del Registro del Estado Ecuatoriano.
                    </div>
                    
                    <div className="pl-6 -indent-6">
                      <span className="font-bold">Ecuador, Asamblea Nacional del Ecuador. (2025).</span> 
                      {' '}<em>Ley Orgánica de Régimen Tributario Interno (LORTI) con sus reformas legales integradas</em>. Editorial de Jurisprudencia de la CEP.
                    </div>

                    <div className="pl-6 -indent-6">
                      <span className="font-bold">International Financial Reporting Standards Foundation (IFRS). (2025).</span> 
                      {' '}<em>Normas Internacionales de Información Financiera (NIIF completas) e Instructivo NIIF PYMES para entidades comerciales</em>. Londres, Reino Unido: IFRS Publication Dept.
                    </div>

                    <div className="pl-6 -indent-6">
                      <span className="font-bold">Superintendencia de Compañías, Valores y Seguros de la República de Ecuador. (2026).</span> 
                      {' '}<em>Guía para presentación unificada de memorias técnicas, notas a estados financieros corporativos y auditorías externas anuales</em>. Quito, Ecuador.
                    </div>

                    <div className="pl-6 -indent-6">
                      <span className="font-bold">Mendoza, J. C., &amp; Ortiz, M. A. (2024).</span> 
                      {' '}<em>Análisis Práctico del Impuesto Diferido en las Organizaciones de Comercio al Por Mayor bajo el Convenio NIC 12 del Ecuador</em>. Revista de Investigaciones Contables Americanas, 18(3), 145-168.
                    </div>
                  </div>
                </div>
              )}

              {selectedBookSection === 'anexos' && (
                <div className="bg-white border-2 border-[#D7C9A4] p-8 md:p-12 rounded-3xl shadow-xl min-h-[82vh] relative">
                  <div className="border-b-2 border-brand-navy pb-4 mb-6 flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-navy">Anexos Instrumentales</span>
                    <span className="text-[9px] font-black bg-brand-navy text-white px-2.5 py-1 tracking-widest rounded">SOLJURE // EDICIÓN JURÍDICA I</span>
                  </div>

                  <h2 className="text-3xl font-serif font-black text-brand-navy uppercase tracking-tight leading-snug mb-8">
                    Anexos Básicos Ecuatorianos
                  </h2>

                  <div className="space-y-8 text-black/90 font-sans text-xs">
                    <div>
                      <h3 className="font-bold text-sm text-[#B59441] border-b pb-1 mb-4">Tabla General Conceptual de Retenciones de Renta (2026)</h3>
                      <div className="border border-brand-border rounded-xl overflow-hidden shadow-sm">
                        <table className="w-full text-justify text-xs text-brand-navy">
                          <thead>
                            <tr className="bg-brand-bg text-[10px] font-bold text-brand-slate uppercase tracking-wider text-left">
                              <th className="p-3 border-r border-[#E2E8F0]">Transacción Contable</th>
                              <th className="p-3 border-r border-[#E2E8F0] text-center">Código SRI</th>
                              <th className="p-3">Porcentaje Aplicable</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            <tr>
                              <td className="p-3 border-r border-[#E2E8F0]">Honorarios profesionales a personas naturales residentes</td>
                              <td className="p-3 border-r border-[#E2E8F0] text-center font-mono">303</td>
                              <td className="p-3 font-bold">10.00 %</td>
                            </tr>
                            <tr className="bg-slate-50">
                              <td className="p-3 border-r border-[#E2E8F0]">Servicios profesionales prestados por sociedades nacionales</td>
                              <td className="p-3 border-r border-[#E2E8F0] text-center font-mono font-sans font-medium">304</td>
                              <td className="p-3 font-bold">8.00 %</td>
                            </tr>
                            <tr>
                              <td className="p-3 border-r border-[#E2E8F0]">Servicios de mano de obra independiente</td>
                              <td className="p-3 border-r border-[#E2E8F0] text-center font-mono">322</td>
                              <td className="p-3 font-bold">2.00 %</td>
                            </tr>
                            <tr className="bg-slate-50">
                              <td className="p-3 border-r border-[#E2E8F0]">Adquisiciones de bienes muebles e insumos industriales</td>
                              <td className="p-3 border-r border-[#E2E8F0] text-center font-mono">312</td>
                              <td className="p-3 font-bold">1.00 %</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-bold text-sm text-[#B59441] border-b pb-1 mb-3">Instructivo Impositivo de Conciliación de Renta</h3>
                      <div className="bg-[#FAF8F3] border-l-4 border-brand-accent p-4 font-mono text-[10.5px] text-brand-navy leading-normal space-y-1">
                        <p>(+) UTILIDAD FINANCIERA DEL EJERCICIO ACUMULADA</p>
                        <p>(-) 15% PARTICIPACIÓN DE TRABAJADORES (REGLA DE DEDUCIBILIDAD)</p>
                        <p>(+) GASTOS NO DEDUCIBLES LOCALES (Art. 35 LORTI, Ej. IVA en compras imputado al costo sin derecho tributario)</p>
                        <p>(+) AMORTIZACIONES NO AUTORIZADAS POR EL SERVICIO DE RENTAS</p>
                        <p>(-) INGRESOS EXENTOS (Ej. dividendos distribuidos que ya tributaron en origen sociedad)</p>
                        <p className="border-t border-dashed border-slate-300 pt-1 font-bold">(=) BASE IMPONIBLE TOTAL IMPUESTO A LA RENTA</p>
                        <p className="font-bold">(*) TARIFA DEL IMPUESTO (25% GENERAL DE SOCIEDADES COMERCIALES)</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>

          </div>

        </div>
      )}

      {/* RENDER TAB 2: ORIGINAL CHRONOLOGY (FICHAS TIMELINE LOG) */}
      {activeTab === 'chronology' && (
        <div className="space-y-8 animate-fade-in">
          
          {/* INTERACTIVE FILTERS GRID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-brand-bg/55 border border-brand-border p-5 rounded-xl shadow-sm">
            {/* Date Selector */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-brand-navy/60 block">Buscar por Fecha de Generación</label>
              <div className="relative">
                <input 
                  type="date"
                  className="w-full bg-white border border-brand-border rounded-lg text-xs py-2.5 pl-9 pr-4 text-brand-navy font-medium focus:outline-none focus:border-brand-accent"
                  value={dateSearch}
                  onChange={(e) => {
                    setDateSearch(e.target.value);
                    setQuickDateFilter('all'); // override presets
                  }}
                />
                <Calendar className="absolute left-3 top-3.5 text-brand-slate" size={14} />
                {dateSearch && (
                  <button 
                    onClick={() => setDateSearch('')}
                    className="absolute right-3 top-3 text-[10px] font-bold text-brand-accent hover:text-brand-navy"
                  >
                    Limpiar
                  </button>
                )}
              </div>
            </div>

            {/* Text Keyword Search */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-brand-navy/60 block">Búsqueda de Texto</label>
              <div className="relative">
                <input 
                  type="text"
                  placeholder="Ej. NIIF, Retenciones, SRI..."
                  className="w-full bg-white border border-brand-border rounded-lg text-xs py-2.5 pl-9 pr-4 text-brand-navy placeholder:text-brand-slate/50 font-medium focus:outline-none focus:border-brand-accent"
                  value={textSearch}
                  onChange={(e) => setTextSearch(e.target.value)}
                />
                <Search className="absolute left-3 top-3 text-brand-slate" size={14} />
              </div>
            </div>

            {/* Area Normativa Filter */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-brand-navy/60 block">Rama Especialidad</label>
              <select 
                className="w-full bg-[#0a1120] border border-brand-border rounded-lg text-xs py-2.5 px-3 text-white font-medium focus:outline-none focus:border-brand-accent cursor-pointer"
                value={selectedArea}
                onChange={(e) => setSelectedArea(e.target.value)}
              >
                <option value="TODOS" className="bg-[#0a1120] text-white">Todas las áreas</option>
                {Object.values(ExpertiseArea).map((area) => (
                  <option key={area} value={area} className="bg-[#0a1120] text-white">{area}</option>
                ))}
              </select>
            </div>

            {/* Stats indicator */}
            <div className="flex items-center gap-4 bg-white/70 border border-brand-border rounded-lg px-4 py-2 self-end">
              <div className="p-2.5 bg-brand-navy text-white rounded-md">
                <BookOpen size={16} />
              </div>
              <div>
                <div className="text-[10px] font-black uppercase tracking-wider text-brand-slate">Fichas Filtradas</div>
                <div className="text-xl font-bold text-brand-navy">{filteredFichas.length} / {fichas.length} Encontradas</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* LEFT INDEX COLUMN: CHRONOLOGY TIMELINE */}
            <div className="col-span-1 lg:col-span-5 bg-[#FAFBFD] border border-brand-border p-6 rounded-2xl shadow-sm space-y-6 max-h-[85vh] overflow-y-auto">
              <div className="border-b border-brand-border/60 pb-4">
                <h3 className="text-sm font-serif font-black text-brand-navy uppercase tracking-widest flex items-center gap-2">
                  <CalendarDays size={16} className="text-brand-accent" /> Índice del Libro por Fechas
                </h3>
                <p className="text-[11px] text-brand-slate font-light mt-1">
                  Fichas y registros de la cronología editorial corporativa.
                </p>
              </div>

              <div className="space-y-6">
                {groupedFichas.length === 0 ? (
                  <div className="py-20 text-center px-4">
                    <div className="w-12 h-12 rounded-full border border-brand-border flex items-center justify-center mx-auto text-brand-slate mb-4">
                      <SearchCode size={22} />
                    </div>
                    <h4 className="text-sm font-bold text-brand-navy">Ninguna Ficha Coincide</h4>
                    <p className="text-xs text-brand-slate mt-1 max-w-xs mx-auto">Prueba limpiando los filtros para volver a desplegar la cronología histórica.</p>
                  </div>
                ) : (
                  groupedFichas.map(([dateKey, items]) => (
                    <div key={dateKey} className="space-y-3">
                      {/* Date label header */}
                      <div className="flex items-center gap-2 sticky top-0 bg-[#FAFBFD]/95 py-2 z-10 border-b border-brand-border">
                        <span className="w-1.5 h-1.5 rounded-full bg-brand-accent"></span>
                        <span className="text-[11px] font-black uppercase tracking-[0.18em] text-brand-navy">
                          {formatDateHeader(dateKey)}
                        </span>
                        <span className="text-[9px] font-semibold bg-brand-bg text-brand-slate border border-brand-border px-2 py-0.5 rounded-full ml-auto">
                          {items.length} {items.length === 1 ? 'ficha' : 'fichas'}
                        </span>
                      </div>

                      {/* Items loop */}
                      <div className="space-y-2.5">
                        {items.map((ficha) => {
                          const isSelected = selectedFicha?.id === ficha.id;
                          return (
                            <div
                              key={ficha.id}
                              onClick={() => setSelectedFicha(ficha)}
                              className={`p-4 rounded-xl border text-left cursor-pointer transition-all duration-300 transform ${
                                isSelected 
                                  ? 'bg-white border-brand-accent shadow-md translate-x-1' 
                                  : 'bg-white border-brand-border/80 hover:border-brand-accent/50 hover:shadow-xs'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-3 mb-2">
                                <span className="text-[9px] font-black uppercase tracking-widest text-brand-accent bg-brand-accent/5 px-2.5 py-1 rounded border border-brand-accent/15">
                                  {ficha.area}
                                </span>
                                <span className="text-[9px] font-bold text-brand-slate uppercase flex items-center gap-1">
                                  <Clock size={10} /> {ficha.readTime}
                                </span>
                              </div>

                              <h4 className="font-serif font-black text-xs text-brand-navy uppercase leading-relaxed tracking-tight group-hover:text-brand-accent line-clamp-2">
                                {ficha.title}
                              </h4>

                              <p className="text-[11px] text-brand-slate font-light line-clamp-2 mt-2">
                                {ficha.summary}
                              </p>

                              <div className="flex items-center justify-between border-t border-brand-border/40 mt-3 pt-3">
                                <div className="flex items-center gap-1.5">
                                  <span className="w-1 cursor-default shrink-0 inline-block h-3 bg-brand-corporate rounded-xs"></span>
                                  <span className="text-[9px] font-black text-brand-slate uppercase tracking-wider">{ficha.action}</span>
                                </div>
                                <ChevronRight size={14} className={`text-brand-slate transition-transform duration-300 ${isSelected ? 'text-brand-accent translate-x-0.5' : ''}`} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* RIGHT PAGE: DETAILED CHROMATIC FICHA VIEWER */}
            <div className="col-span-1 lg:col-span-7">
              {selectedFicha ? (
                <div className="bg-white border-2 border-[#D7C9A4] p-8 md:p-12 rounded-3xl shadow-xl relative overflow-hidden flex flex-col justify-between min-h-[75vh] bg-[radial-gradient(#F9F7F1_1px,transparent_1px)] bg-[size:24px_24px]">
                  
                  {/* Top Ribbon */}
                  <div className="w-full flex items-center justify-between border-b-2 border-brand-navy pb-6 mb-6">
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.25em] text-brand-navy">
                      <Bookmark size={12} className="text-brand-accent" /> SOLJURE COMPENDIO REGISTRO
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-black bg-brand-navy text-white px-2.5 py-1 tracking-widest rounded uppercase">
                        REGISTRO FECHA: {selectedFicha.generationDate}
                      </span>
                      {isAdmin && onDelete && (
                        <button
                          onClick={() => {
                            if (confirm("¿Estás seguro de que deseas eliminar permanentemente esta ficha del historial del libro?")) {
                              onDelete(selectedFicha.id);
                              setSelectedFicha(fichas.filter(f => f.id !== selectedFicha.id)[0] || null);
                            }
                          }}
                          className="p-1 px-2 text-red-500 hover:text-red-700 hover:bg-red-55 text-xs rounded transition-colors"
                          title="Eliminar Ficha"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Body Ficha */}
                  <div className="flex-1 space-y-6">
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="text-[9px] font-bold text-brand-accent uppercase tracking-widest border border-brand-accent/30 bg-brand-accent/5 px-3 py-1 rounded">
                          Rama: {selectedFicha.area}
                        </span>
                        <span className="text-[9px] font-bold text-brand-slate uppercase tracking-widest border border-brand-border bg-brand-bg px-3 py-1 rounded">
                          Historial de: {selectedFicha.action}
                        </span>
                      </div>

                      <h2 className="text-3xl font-serif font-black text-brand-navy uppercase tracking-tight leading-snug">
                        {selectedFicha.title}
                      </h2>
                      
                      <p className="text-xs text-brand-slate font-medium italic">
                        Redactado por {selectedFicha.author} // ID Ficha: #{selectedFicha.id}
                      </p>
                    </div>

                    <div className="bg-[#FAF8F3] border-l-4 border-brand-accent p-5 rounded-r-xl">
                      <span className="text-[9px] font-black text-brand-accent uppercase tracking-widest block mb-2">Sumario Corporativo</span>
                      <p className="text-xs text-brand-navy font-semibold leading-relaxed">
                        {selectedFicha.summary}
                      </p>
                    </div>

                    <div className="prose prose-sm font-sans text-brand-navy/85 max-w-none text-justify border-t border-brand-border/40 pt-6 leading-relaxed">
                      <div className="markdown-body text-xs font-light text-slate-800 leading-relaxed font-sans space-y-4 font-normal">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {selectedFicha.contentSnapshot}
                        </ReactMarkdown>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Actions Bar */}
                  <div className="mt-12 pt-6 border-t border-brand-border/60 flex flex-wrap gap-4 items-center justify-between bg-brand-bg/50 p-4 rounded-xl">
                    <div className="flex items-center gap-2">
                      <Clock size={12} className="text-brand-slate" />
                      <span className="text-[10px] font-bold text-brand-slate uppercase tracking-widest">
                        Registro Inmutable SOLJURE
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={handlePrintFicha}
                        className="flex items-center gap-1.5 px-3 py-2 bg-white border border-brand-border hover:border-brand-accent hover:text-brand-accent font-bold text-[10px] tracking-widest rounded transition-all shadow-sm uppercase"
                      >
                        <Printer size={12} /> Imprimir Ficha
                      </button>

                      <button
                        onClick={() => onRestore(selectedFicha)}
                        className="flex items-center gap-1.5 px-4 py-2 bg-brand-navy text-white hover:bg-brand-navy/90 font-bold text-[10px] tracking-widest rounded transition-all shadow-md group uppercase"
                      >
                        <RotateCcw size={12} className="group-hover:rotate-180 transition-transform duration-500" /> Convertir a Proyecto <ArrowRight size={10} />
                      </button>
                    </div>
                  </div>

                </div>
              ) : (
                <div className="bg-[#FAFBFD] border border-brand-border p-12 rounded-3xl min-h-[75vh] flex flex-col items-center justify-center text-center">
                  <BookOpen size={48} className="text-brand-slate mb-4 animate-pulse" />
                  <h3 className="text-lg font-serif font-black text-brand-navy uppercase tracking-widest">Libro de Registro Terminado</h3>
                  <p className="text-xs text-brand-slate max-w-sm mt-2 font-light">Selecciona cualquier ficha histórica en el índice izquierdo para abrir su registro y restaurarla en el editor.</p>
                </div>
              )}
            </div>

          </div>

        </div>
      )}

      {showSaveBookModal && (
        <div className="fixed inset-0 z-[300] bg-brand-navy/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border-2 border-brand-accent rounded-2xl p-6 md:p-8 max-w-md w-full text-brand-navy shadow-2xl relative">
            <h3 className="text-lg font-serif font-black tracking-wide text-brand-navy uppercase mb-1">
              Guardar Libro en el Historial
            </h3>
            <p className="text-[10px] text-brand-slate uppercase font-bold tracking-widest mb-4">
              Registro histórico del compendio
            </p>
            
            <div className="space-y-4 text-left">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-brand-navy/60 block mb-1.5 font-bold">
                  Título del Libro Compilado
                </label>
                <input 
                  type="text"
                  value={bookSaveTitle}
                  onChange={(e) => setBookSaveTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-brand-border rounded-lg text-xs p-3 text-brand-navy font-bold focus:outline-none focus:border-brand-accent"
                  placeholder="Ingrese el título del libro..."
                />
              </div>

              <div className="bg-brand-bg p-4 rounded-xl border border-brand-border/40 text-[11px] leading-relaxed space-y-2">
                <p className="font-bold text-brand-accent">
                  📊 Detalles de la Compilación:
                </p>
                <ul className="list-disc list-inside space-y-1 text-xs text-brand-slate">
                  <li><strong>Capítulos:</strong> {bookEditorials.length} artículos unificados</li>
                  <li><strong>Área del Historial:</strong> Práctica Contable</li>
                  <li><strong>Autor Principal:</strong> ING. COM. SEGUNDO CUENCA C</li>
                </ul>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-6 border-t border-brand-border/20 mt-6 font-bold uppercase">
              <button
                onClick={() => setShowSaveBookModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-brand-navy rounded-lg text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                disabled={isSavingBook}
                onClick={async () => {
                  if (!bookSaveTitle.trim()) {
                    alert("Por favor, ingrese un título válido.");
                    return;
                  }
                  setIsSavingBook(true);
                  try {
                    let compiledContent = `# ${bookSaveTitle.toUpperCase()}\n\n`;
                    compiledContent += `**TRATADO DE INTELIGENCIA JURÍDICA Y PREVENCIÓN REGULATORIA - EDICIÓN UNIFICADA**\n\n`;
                    compiledContent += `*Compilado e histórico de SOLJURE*\n\n`;
                    compiledContent += `---\n\n`;

                    bookEditorials.forEach((ed, idx) => {
                      compiledContent += `## CAPÍTULO ${idx + 1}: ${ed.title.toUpperCase()}\n\n`;
                      compiledContent += `**Área de Especialidad:** ${ed.area} | **Autor:** ${ed.author} | **Tiempo Estimado:** ${ed.readTime}\n\n`;
                      compiledContent += `> ${ed.summary}\n\n`;
                      compiledContent += `${ed.content}\n\n`;
                      compiledContent += `---\n\n`;
                    });

                    const chaptersList = bookEditorials.map((ed, idx) => `Cap. ${idx + 1}: ${ed.title}`).join(' | ');
                    const summaryStr = `Compendio técnico unificado con ${bookEditorials.length} capítulos técnicos normativos. Capítulos compilados: ${chaptersList}`;

                    if (onSaveBook) {
                      await onSaveBook(
                        bookSaveTitle,
                        compiledContent,
                        summaryStr,
                        ExpertiseArea.CONSTITUCIONAL,
                        "SOLJURE EFICACES",
                        `${bookEditorials.length * 10} min`
                      );
                    }
                    setShowSaveBookModal(false);
                  } catch (err) {
                    console.error(err);
                    alert("Ocurrió un error al guardar el libro.");
                  } finally {
                    setIsSavingBook(false);
                  }
                }}
                className="px-5 py-2 bg-brand-navy text-white hover:bg-brand-accent rounded-lg text-[10px] font-black uppercase tracking-widest transition-all shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isSavingBook ? 'Guardando...' : 'Confirmar Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
