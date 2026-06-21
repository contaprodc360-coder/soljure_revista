import React, { useMemo, useState } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { 
  BarChart3, 
  TrendingUp, 
  BookOpen, 
  Layers, 
  Clock, 
  Activity,
  ArrowLeft,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';
import { ExpertiseArea, Editorial } from '../types';

interface MetricsDashboardProps {
  editorials: Editorial[];
  onBack: () => void;
  onFilterWord?: (word: string) => void;
}

// Stop words Spanish list
const SPANISH_STOP_WORDS = new Set([
  'de', 'la', 'el', 'en', 'y', 'que', 'los', 'un', 'una', 'del', 'con', 'por', 'para', 'es', 'al', 'se', 'lo', 'su', 'sus', 'como', 
  'esta', 'este', 'las', 'o', 'si', 'sobre', 'entre', 'mas', 'ya', 'nos', 'muy', 'todo', 'todos', 'toda', 'todas', 'otro', 'otra', 
  'otros', 'otras', 'sino', 'pero', 'cada', 'estos', 'estas', 'eso', 'aquello', 'cual', 'cuales', 'quien', 'quienes', 'donde', 
  'cuando', 'porque', 'pues', 'entonces', 'tambien', 'asi', 'bajo', 'ante', 'desde', 'hasta', 'hacia', 'segun', 'sin', 'tras', 
  'mediante', 'durante', 'frente', 'contra', 'esta', 'estan', 'tienen', 'tiene', 'tenemos', 'pueden', 'puede', 'hacer', 'hecho', 
  'anos', 'año', 'años', 'mes', 'meses', 'dia', 'dias', 'caso', 'casos', 'ejemplo', 'ejemplos', 'parte', 'partes', 'forma', 'formas', 
  'manera', 'uso', 'usos', 'punto', 'puntos', 'nivel', 'niveles', 'tipo', 'tipos', 'valor', 'valores', 'cuenta', 'cuentas', 'sistema', 
  'sistemas', 'proceso', 'procesos', 'actividad', 'actividades', 'ademas', 'siguiente', 'siguientes', 'principal', 'principales', 
  'articulo', 'articulos', 'ecuador', 'ecuatoriano', 'ecuatoriana', 'ecuatorianos', 'ecuatorianas', 'bien', 'siempre', 'nunca', 
  'quiza', 'tal', 'tales', 'tanto', 'tanta', 'tantos', 'tantas', 'mientras', 'especialmente', 'respecto', 'adicional', 'adicionales',
  'dentro', 'fuera', 'través', 'traves', 'total', 'sobre,', 'entre,', 'bajo,', 'hacer,', 'cuenta,', 'informacion', 'implementacion',
  'analisis', 'desarrollo', 'control', 'gestion', 'general', 'regimen'
]);

const cleanWord = (word: string): string => {
  return word
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove accents
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"'«»]/g, "") // remove punctuation
    .trim();
};

export default function MetricsDashboard({ editorials, onBack, onFilterWord }: MetricsDashboardProps) {
  const [selectedWord, setSelectedWord] = useState<string | null>(null);

  // 1. Calculate General KPIs
  const totalArticles = editorials.length;

  const uniqueAreas = useMemo(() => {
    const areas = editorials.map(ed => ed.area);
    return new Set(areas).size;
  }, [editorials]);

  const totalReadTime = useMemo(() => {
    return editorials.reduce((acc, ed) => {
      const timeNum = parseInt(ed.readTime) || 0;
      return acc + timeNum;
    }, 0);
  }, [editorials]);

  const complianceIndex = useMemo(() => {
    if (totalArticles === 0) return 0;
    // Calculate percentage of articles containing complete professional components (managerSummary and detailed markdown tables)
    const fullyDocumented = editorials.filter(ed => 
      ed.managerSummary && ed.content.toLowerCase().includes('|')
    ).length;
    return Math.round((fullyDocumented / totalArticles) * 100);
  }, [editorials, totalArticles]);

  // 2. Bar Chart Data (Articles count per Expertise Area)
  const chartData = useMemo(() => {
    return Object.values(ExpertiseArea).map(areaVal => {
      const count = editorials.filter(ed => ed.area === areaVal).length;
      return { 
        name: areaVal, 
        artículos: count 
      };
    });
  }, [editorials]);

  // 3. Word Cloud calculations
  const wordCloudData = useMemo(() => {
    const freqMap: { [key: string]: number } = {};

    editorials.forEach(ed => {
      // Concatenate title, summary, and content (words from content can carry high semantic value)
      const textToAnalyze = `${ed.title} ${ed.summary} ${ed.content}`;
      const words = textToAnalyze.split(/\s+/);

      words.forEach(rawWord => {
        const cleaned = cleanWord(rawWord);
        if (cleaned.length > 3 && !SPANISH_STOP_WORDS.has(cleaned)) {
          freqMap[cleaned] = (freqMap[cleaned] || 0) + 1;
        }
      });
    });

    // Convert map to array and sort
    const sorted = Object.entries(freqMap)
      .map(([word, value]) => ({ 
        text: word.toUpperCase(), 
        value,
        original: word
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 32); // Take top 32 words

    if (sorted.length === 0) return [];

    // Max frequency to normalize sizes
    const maxFreq = sorted[0].value;
    const minFreq = sorted[sorted.length - 1]?.value || 1;

    return sorted.map(item => {
      // Normalize weight between 0.3 and 1.0
      const range = maxFreq - minFreq;
      const weight = range === 0 ? 0.6 : 0.3 + (0.7 * (item.value - minFreq) / range);
      return {
        ...item,
        weight
      };
    });
  }, [editorials]);

  // Handle word selection and filtering
  const handleWordClick = (word: typeof wordCloudData[0]) => {
    setSelectedWord(word.text);
    if (onFilterWord) {
      onFilterWord(word.original);
    }
  };

  return (
    <div className="space-y-12">
      {/* Header and Back navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-brand-border/60 pb-8">
        <div>
          <button 
            onClick={onBack}
            className="flex items-center gap-2 text-brand-slate hover:text-brand-accent transition-colors text-xs font-bold uppercase tracking-[0.2em] mb-4 group"
          >
            <ArrowLeft size={14} className="transform group-hover:-translate-x-1 transition-transform" /> Volver a ediciones
          </button>
          <h1 className="text-4xl font-serif font-black text-brand-navy uppercase tracking-tight">
            Dashboard de Métricas
          </h1>
          <p className="text-brand-slate text-sm font-light mt-1">
            Análisis corporativo, de contenido jurisprudencial y especialidad de SOLJURE.
          </p>
        </div>

        <div className="flex items-center gap-4 bg-white border border-brand-border px-5 py-3 rounded-lg shadow-sm">
          <Activity className="text-brand-accent animate-pulse" size={20} />
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-brand-navy uppercase tracking-[0.25em]">Sincronización</span>
            <span className="text-xs text-brand-slate font-medium">Bases de datos en vivo</span>
          </div>
        </div>
      </div>

      {/* KPI Cards Bento Box Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* KPI 1 */}
        <div className="bg-white border border-brand-border p-6 rounded-xl shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-[3px] bg-brand-navy"></div>
          <div className="flex justify-between items-start mb-4">
            <span className="text-[10px] font-bold text-brand-slate uppercase tracking-widest">Total Artículos</span>
            <div className="p-2 bg-brand-bg rounded-md text-brand-navy group-hover:bg-brand-navy group-hover:text-white transition-colors duration-300">
              <BookOpen size={16} />
            </div>
          </div>
          <p className="text-4xl font-serif font-black text-brand-navy">{totalArticles}</p>
          <div className="flex items-center gap-1.5 mt-2 text-[10px] font-semibold text-emerald-600">
            <TrendingUp size={12} />
            <span>Actualizado en vivo</span>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="bg-white border border-brand-border p-6 rounded-xl shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-[3px] bg-brand-accent"></div>
          <div className="flex justify-between items-start mb-4">
            <span className="text-[10px] font-bold text-brand-slate uppercase tracking-widest">Áreas Cubiertas</span>
            <div className="p-2 bg-brand-bg rounded-md text-brand-navy group-hover:bg-brand-accent group-hover:text-white transition-colors duration-300">
              <Layers size={16} />
            </div>
          </div>
          <p className="text-4xl font-serif font-black text-brand-navy">{uniqueAreas}/6</p>
          <div className="flex items-center gap-1.5 mt-2 text-[10px] text-brand-slate">
            <span>Todas las áreas normativas</span>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="bg-white border border-brand-border p-6 rounded-xl shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-[3px] bg-brand-corporate"></div>
          <div className="flex justify-between items-start mb-4">
            <span className="text-[10px] font-bold text-brand-slate uppercase tracking-widest">Volumen Lectura</span>
            <div className="p-2 bg-brand-bg rounded-md text-brand-navy group-hover:bg-brand-corporate group-hover:text-white transition-colors duration-300">
              <Clock size={16} />
            </div>
          </div>
          <p className="text-4xl font-serif font-black text-brand-navy">{totalReadTime} <span className="text-sm font-sans font-normal text-brand-slate">min</span></p>
          <div className="flex items-center gap-1.5 mt-2 text-[10px] text-brand-slate">
            <span>Tiempo promedio estimado</span>
          </div>
        </div>

        {/* KPI 4 */}
        <div className="bg-white border border-brand-border p-6 rounded-xl shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-[3px] bg-emerald-600"></div>
          <div className="flex justify-between items-start mb-4">
            <span className="text-[10px] font-bold text-brand-slate uppercase tracking-widest">Índice Integridad</span>
            <div className="p-2 bg-brand-bg rounded-md text-brand-navy group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-300">
              <CheckCircle2 size={16} />
            </div>
          </div>
          <p className="text-4xl font-serif font-black text-brand-navy">{complianceIndex}%</p>
          <div className="flex items-center gap-1.5 mt-2 text-[10px] text-brand-slate">
            <span>Con tablas y sumario gerencial</span>
          </div>
        </div>
      </div>

      {/* Main Charts & Analytics Block */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Recharts Bar Chart Area */}
        <div className="lg:col-span-7 bg-white border border-brand-border p-8 rounded-xl shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <BarChart3 className="text-brand-accent" size={18} />
                <h2 className="text-lg font-serif font-black text-brand-navy uppercase tracking-wider">
                  Distribución por Área
                </h2>
              </div>
              <span className="text-[9px] font-black uppercase tracking-[0.15em] bg-brand-bg px-3 py-1 border border-brand-border text-brand-navy rounded-full">
                Cantidad de Ediciones
              </span>
            </div>
            <p className="text-xs text-brand-slate mb-8 font-light leading-relaxed">
              Resumen visual de los artículos de inteligencia corporativa clasificados según las ramas normativas del Ecuador para el análisis estratégico.
            </p>
          </div>

          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fill: '#475569', fontSize: 9, fontWeight: 'bold' }}
                  axisLine={{ stroke: '#E2E8F0' }}
                  tickLine={{ stroke: '#E2E8F0' }}
                  height={50}
                  interval={0}
                  // Clean up or truncate names if too long
                  tickFormatter={(val) => {
                    if (val === "Auditoría Interna y Externa") return "Auditoría";
                    if (val === "Procesal Administrativo") return "Procesal";
                    if (val === "Finanzas y Mercados") return "Finanzas";
                    return val;
                  }}
                />
                <YAxis 
                  allowDecimals={false}
                  tick={{ fill: '#475569', fontSize: 10 }}
                  axisLine={{ stroke: '#E2E8F0' }}
                  tickLine={{ stroke: '#E2E8F0' }}
                />
                <Tooltip 
                  cursor={{ fill: 'rgba(181, 148, 65, 0.04)' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-brand-navy text-white text-xs p-4 rounded border border-white/10 shadow-2xl space-y-1">
                          <p className="font-bold underline decoration-brand-accent underline-offset-4">{payload[0].payload.name}</p>
                          <p className="font-light text-brand-accent/90">{payload[0].value} {payload[0].value === 1 ? 'artículo' : 'artículos'}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar 
                  dataKey="artículos" 
                  radius={[4, 4, 0, 0]}
                  maxBarSize={45}
                >
                  {chartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.artículos > 0 ? '#B59441' : '#E2E8F0'} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Word Cloud Area */}
        <div className="lg:col-span-5 bg-white border border-brand-border p-8 rounded-xl shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <TrendingUp className="text-brand-corporate" size={18} />
                <h2 className="text-lg font-serif font-black text-brand-navy uppercase tracking-wider">
                  Nube de Temas Normativos
                </h2>
              </div>
              <span className="text-[9px] font-black uppercase tracking-[0.15em] bg-emerald-50 px-3 py-1 border border-emerald-200 text-emerald-700 rounded-full">
                Temas Clave
              </span>
            </div>
            <p className="text-xs text-brand-slate mb-8 font-light leading-relaxed">
              Palabras clave y temas más recurrentes en el contenido entero de la biblioteca. <span className="font-semibold text-brand-accent">Haz clic en cualquier palabra</span> para aplicar un filtro instantáneo en la revista.
            </p>
          </div>

          {/* Word Cloud Container */}
          <div className="min-h-80 bg-brand-bg/30 p-6 rounded-lg border border-brand-border/40 flex flex-wrap gap-x-4 gap-y-3 justify-center items-center content-center relative overflow-hidden">
            {wordCloudData.length === 0 ? (
              <span className="text-xs text-brand-slate uppercase font-semibold">No hay suficientes datos normativos para procesar</span>
            ) : (
              wordCloudData.map((word) => {
                // Return colors proportionally
                let colorClass = 'text-brand-navy';
                if (word.weight > 0.8) {
                  colorClass = 'text-brand-accent font-black'; // Primary gold
                } else if (word.weight > 0.6) {
                  colorClass = 'text-brand-navy font-bold'; // Deep navy
                } else if (word.weight > 0.4) {
                  colorClass = 'text-brand-corporate font-semibold'; // Corporate blue
                } else {
                  colorClass = 'text-brand-slate font-medium opacity-80'; // Muted slate
                }

                // Inline size based on weight (from 11px to 26px)
                const fontSize = 10 + Math.round(word.weight * 16);

                return (
                  <button
                    key={word.text}
                    onClick={() => handleWordClick(word)}
                    className={`${colorClass} hover:scale-115 hover:-rotate-1 cursor-pointer transition-all duration-300 transform inline-block py-0.5 px-1.5 rounded-sm hover:bg-brand-accent/5`}
                    style={{ fontSize: `${fontSize}px` }}
                    title={`Frecuencia de aparición: ${word.value} veces`}
                  >
                    {word.text}
                  </button>
                );
              })
            )}

            {selectedWord && (
              <div className="absolute bottom-3 right-3 flex items-center gap-2 bg-brand-navy text-white text-[9px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-md shadow-lg animate-fade-in">
                <span>Filtro: {selectedWord}</span>
                <button 
                  onClick={() => setSelectedWord(null)} 
                  className="font-black text-brand-accent ml-1 hover:text-white"
                >
                  X
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Suggested focus section */}
      <div className="bg-gradient-to-br from-[#0F172A] to-[#1E293B] text-white p-8 rounded-xl border border-brand-navy relative overflow-hidden">
        {/* Dynamic decorative backdrop line */}
        <div className="absolute right-0 bottom-0 top-0 w-1/3 bg-radial-gradient from-brand-accent/10 to-transparent pointer-events-none"></div>

        <div className="relative z-10 max-w-3xl">
          <h3 className="text-xl font-serif font-black text-brand-accent uppercase tracking-widest mb-4">
            Recomendaciones de Cobertura Jurídica 2026
          </h3>
          <p className="text-sm font-light text-white/80 leading-relaxed mb-6">
            La analítica interna de SOLJURE sugiere que, para optimizar el alcance de la defensa técnica ante los procesos constitucionales, civiles y penales en el 2026, se amplíe la producción de informes editoriales de la siguiente manera:
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs font-light text-white/70">
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-brand-accent/15 flex items-center justify-center text-brand-accent font-bold mt-0.5 shrink-0">1</div>
              <p>Incrementar la cobertura en **Garantías Jurisdiccionales** para abarcar la repercusión de las nuevas sentencias de la Corte Constitucional del Ecuador.</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-brand-accent/15 flex items-center justify-center text-brand-accent font-bold mt-0.5 shrink-0">2</div>
              <p>Desarrollar análisis procesales de litigio mercantil y laboral integrando los precedentes de casación de la Corte Nacional de Justicia.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
