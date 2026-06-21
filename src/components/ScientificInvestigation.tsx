import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, ExternalLink, Copy, Check, Scale, BookOpen, GraduationCap, 
  Archive, Award, HelpCircle, ArrowRight, Zap, RefreshCw, BookMarked,
  FileText, ShieldAlert, CheckCircle2, ChevronRight, Hash, Database,
  Bookmark, Info, FileSpreadsheet
} from 'lucide-react';
import { ExpertiseArea } from '../types';

interface SearchTarget {
  id: string;
  name: string;
  category: 'jurisprudencia' | 'doctrina' | 'academia';
  institution: string;
  url: string;
  isGetParam: boolean;
  paramName?: string;
  tip: string;
  exactExegesisTip: string;
  badge: {
    text: string;
    colorClass: string;
  };
}

const SEARCH_TARGETS: SearchTarget[] = [
  // 1. JURISPRUDENCIA DE LA REPÚBLICA
  {
    id: 'cnj-sentencias',
    name: 'Buscador General de Sentencias - CNJ',
    category: 'jurisprudencia',
    institution: 'Corte Nacional de Justicia del Ecuador',
    url: 'https://busquedasentencias.cortenacional.gob.ec/',
    isGetParam: false,
    tip: 'Buscador oficial del Sistema de Consulta de Sentencias de Casación de la CNJ de Ecuador. Para mejores resultados, copie la consulta optimizada de abajo y péguela en el campo "Texto / Palabra Clave".',
    exactExegesisTip: 'Filtre por Sala (v.gr., Civil, Penal, Laboral) para acotar la búsqueda adjetiva.',
    badge: { text: 'Casación', colorClass: 'bg-brand-navy text-brand-accent border-brand-accent/30' }
  },
  {
    id: 'cc-sentencias',
    name: 'Buscador Externo de Sentencias y Dictámenes - CC',
    category: 'jurisprudencia',
    institution: 'Corte Constitucional del Ecuador',
    url: 'https://buscador.corteconstitucional.gob.ec/buscador-externo/principal?tab=1',
    isGetParam: false,
    tip: 'Portal oficial de control constitucional para la Acción Extraordinaria de Protección (AEP), Resoluciones Interpretativas e Incumplimientos. Pegue los términos refinados en el casillero de "Contenido".',
    exactExegesisTip: 'Es mandatorio invocar el "Test de Motivación" o "Garantías Jurisdiccionales" al pretender una de estas acciones.',
    badge: { text: 'Constitucional', colorClass: 'bg-[#5c242c] text-[#ffd280] border-[#ffd280]/20' }
  },
  // 2. DOCTRINA Y PRECEDENTES
  {
    id: 'cnj-precedentes',
    name: 'Resoluciones del Pleno de Precedentes Jurisprudenciales',
    category: 'doctrina',
    institution: 'Corte Nacional de Justicia de la República',
    url: 'https://www.cortenacional.gob.ec/cnj/index.php/resoluciones-a/precedentes-jurisprudenciales',
    isGetParam: false,
    tip: 'Registro histórico y vinculante de fallos de triple reiteración aprobados por el Pleno de la Corte Nacional. Rige con carácter mandatorio absoluto y de aplicación imperativa para jueces subordinados (Art. 182 de la CRE).',
    exactExegesisTip: 'Útil para excepciones previas y seguridad jurídica sustantiva.',
    badge: { text: 'Precedentes Mandatorios', colorClass: 'bg-brand-bg text-[#d4af37] border-[#d4af37]/35' }
  },
  {
    id: 'cnj-serviciosb',
    name: 'Producción Editorial, Gacetas y Revistas CNJ',
    category: 'doctrina',
    institution: 'Corte Nacional de Justicia / Biblioteca Judicial',
    url: 'https://www.cortenacional.gob.ec/cnj/index.php/serviciosb/',
    isGetParam: false,
    tip: 'Revistas de producción jurídica científica judicial y Gacetas con el compendio clasificado de fallos y tesis del Ecuador. Ideal para consultas de metodología y doctrina forense de alta jerarquía.',
    exactExegesisTip: 'Secciones ideales: Gaceta de la Corte Nacional, Cuadernos de Trabajo Jurisprudencial.',
    badge: { text: 'Doctrina Oficial', colorClass: 'bg-[#1e1b4b] text-brand-ivory border-brand-border' }
  },
  // 3. SCIENTIFIC INDEXED JOURNALS
  {
    id: 'scielo',
    name: 'Portal de Revistas Científicas - Scielo',
    category: 'academia',
    institution: 'Scientific Electronic Library Online',
    url: 'https://search.scielo.org/?lang=es&count=15&from=1&output=site&sort=&format=summary&fb=&q=',
    isGetParam: true,
    paramName: 'q',
    tip: 'Biblioteca científica que alberga la crema y nata de la indexación latinoamericana. Excelente buscador para el marco doctrinal y metodología de investigación jurídica cualitativa.',
    exactExegesisTip: 'Aplique filtros por país "Ecuador" si requiere analizar exclusivamente regulaciones domésticas.',
    badge: { text: 'Indexada Scielo', colorClass: 'bg-[#ea580c]/10 text-[#ea580c] border-[#ea580c]/20' }
  },
  {
    id: 'redalyc',
    name: 'Buscador de Ciencias Sociales y Jurídicas - Redalyc',
    category: 'academia',
    institution: 'Red de Revistas Científicas de América Latina y España',
    url: 'https://www.redalyc.org/buscador.oa?q=',
    isGetParam: true,
    paramName: 'q',
    tip: 'Repositorio académico internacional multidisciplinario de acceso abierto. Muestra artículos con riguroso referato ciego sobre dogmática penal, procesal civil y teoría general del Estado.',
    exactExegesisTip: 'Soporta operadores lógicos booleanos estándares de amplio alcance.',
    badge: { text: 'Indexada Redalyc', colorClass: 'bg-[#2563eb]/10 text-[#2563eb] border-[#2563eb]/20' }
  },
  {
    id: 'latindex',
    name: 'Directorios de Revistas Científicas - Latindex',
    category: 'academia',
    institution: 'Sistema de Información en Línea para Revistas en Iberoamérica',
    url: 'https://www.latindex.org/latindex/solr/busqueda?q=',
    isGetParam: true,
    paramName: 'q',
    tip: 'Directorio especializado que evalúa la calidad editorial científica de revistas jurídicas de Iberoamérica. Indispensable para validar si un artículo SOLJURE cumple con el rigor de citación formal.',
    exactExegesisTip: 'Busque revistas ecuatorianas acreditadas por el CES y Senescyt.',
    badge: { text: 'Indexada Latindex', colorClass: 'bg-[#16a34a]/10 text-[#16a34a] border-[#16a34a]/20' }
  },
  {
    id: 'dialnet',
    name: 'Base de Datos de Literatura Científica - Dialnet',
    category: 'academia',
    institution: 'Universidad de La Rioja (España)',
    url: 'https://dialnet.unirioja.es/buscar/documentos?querysDismax.DOCUMENTAL_TODO=',
    isGetParam: true,
    paramName: 'querysDismax.DOCUMENTAL_TODO',
    tip: 'Uno de los mayores portales bibliográficos del mundo para el derecho en español. Doctrina de primer orden para argumentación jurídica forense, asimilada de manera directa por la jurisprudencia ecuatoriana.',
    exactExegesisTip: 'Útil para profundizar en principios como Ne bis in idem, debido proceso, e inoponibilidad jurídica corporativa.',
    badge: { text: 'Doctrina Dialnet', colorClass: 'bg-[#3b82f6]/10 text-[#3b82f6] border-[#3b82f6]/20' }
  },
  // 4. ACADEMIA RESPOSITORIES
  {
    id: 'google-scholar',
    name: 'Google Académico / Google Scholar',
    category: 'academia',
    institution: 'Google Science Services',
    url: 'https://scholar.google.com/scholar?q=',
    isGetParam: true,
    paramName: 'q',
    tip: 'El motor de recopilación doctrinal y académica más extenso del planeta. Indexa jurisprudencia, fallos de patentes, tesis de maestrías, libros corporativos de primer orden y críticas de sentencias ecuatorianas.',
    exactExegesisTip: 'Es sumamente útil añadir el año (v.gr., "2026") para rescatar doctrina con reformas legislativas vigentes.',
    badge: { text: 'Académico Google', colorClass: 'bg-brand-slate/10 text-brand-slate border-brand-border' }
  },
  {
    id: 'uce-repositorio',
    name: 'Repositorio Digital - Universidad Central del Ecuador',
    category: 'academia',
    institution: 'Biblioteca de la Universidad Central del Ecuador (UCE)',
    url: 'https://www.dspace.uce.edu.ec/simple-search?query=',
    isGetParam: true,
    paramName: 'query',
    tip: 'Buscador del repositorio de la Facultad de Jurisprudencia de la UCE. Ofrece análisis prácticos de casación, diagnósticos dogmáticos, tesis procesales completas para graduación de abogados y memorias forenses.',
    exactExegesisTip: 'Ingrese descriptores del COGEP o COIP para encontrar enfoques dogmáticos locales de Ecuador.',
    badge: { text: 'Repositorio UCE', colorClass: 'bg-brand-accent/20 text-brand-navy border-brand-accent/30' }
  }
];

export function ScientificInvestigation({ 
  initialQuery = "", 
  initialArea = "TODOS",
  onBack 
}: { 
  initialQuery?: string,
  initialArea?: string,
  onBack?: () => void 
}) {
  const [query, setQuery] = useState(initialQuery);
  const [selectedArea, setSelectedArea] = useState<string>(initialArea);
  const [activeCategory, setActiveCategory] = useState<'todos' | 'jurisprudencia' | 'doctrina' | 'academia'>('todos');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizedQuery, setOptimizedQuery] = useState('');
  
  // Local rules-based Ecuador legal query optimizer
  const handleOptimizeQuery = () => {
    if (!query.trim()) {
      alert("Por favor, ingrese un término o tema de jurisprudencia primero.");
      return;
    }
    
    setIsOptimizing(true);
    
    setTimeout(() => {
      let refined = query.trim();
      const areaLower = selectedArea.toLowerCase();
      
      // Smart Boolean Transformation rules specific to Ecuadorian Forensics
      if (areaLower.includes('laboral') || refined.toLowerCase().includes('trabajo') || refined.toLowerCase().includes('despido')) {
        refined = `("despido ineficaz" OR "estabilidad laboral reforzada") AND ("Art. 195.3" OR "Art. 195") AND ("embarazo" OR "lactancia" OR "dirigente sindical") AND "Código del Trabajo"`;
      } else if (areaLower.includes('constitucional') || refined.toLowerCase().includes('proteccion') || refined.toLowerCase().includes('tutela') || refined.toLowerCase().includes('motivación')) {
        refined = `("Acción Extraordinaria de Protección" OR "AEP") AND "Sentencia 1158-17-EP" AND "test de motivación" AND "tutela judicial efectiva" AND "Art. 76 CRE"`;
      } else if (areaLower.includes('penal') || refined.toLowerCase().includes('prision') || refined.toLowerCase().includes('delito') || refined.toLowerCase().includes('coip')) {
        refined = `("prisión preventiva" AND "medida cautelar excepcional" AND "peligro de fuga") AND ("Art. 534" OR "Resolución 14-2023-CNJ") AND "COIP"`;
      } else if (areaLower.includes('civil') || refined.toLowerCase().includes('casacion') || refined.toLowerCase().includes('cogep')) {
        refined = `("recurso extraordinario de casación" AND "requisitos de procedibilidad" AND "fundamentación autónoma") AND "Art. 268 COGEP" AND "Corte Nacional"`;
      } else if (areaLower.includes('administrativo') || refined.toLowerCase().includes('silencio') || refined.toLowerCase().includes('coa')) {
        refined = `("silencio administrativo positivo" OR "acto presunto") AND ("Código Orgánico Administrativo" OR "COA") AND "término legal" AND "impugnación judicial"`;
      } else if (areaLower.includes('comercial') || refined.toLowerCase().includes('mercantil') || refined.toLowerCase().includes('comercio')) {
        refined = `("título ejecutivo" OR "factura mercantil") AND "aceptación tácita" AND "Art. 201 Código de Comercio" AND "acción ejecutiva"`;
      } else {
        // Generic high-quality legal expansion
        refined = `("${query}" AND "Ecuador") AND ("Art. 76 CRE" OR "debido proceso" OR "seguridad jurídica") AND ("Corte Nacional" OR "Corte Constitucional")`;
      }
      
      setOptimizedQuery(refined);
      setIsOptimizing(false);
    }, 600);
  };

  // Sync optimized query with base query when starting
  useEffect(() => {
    if (initialQuery) {
      handleOptimizeQuery();
    }
  }, [initialQuery]);

  const activeQueryToUse = useMemo(() => {
    return optimizedQuery || query;
  }, [optimizedQuery, query]);

  // Filtered targets
  const filteredTargets = SEARCH_TARGETS.filter(t => 
    activeCategory === 'todos' || t.category === activeCategory
  );

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const executeSearch = (target: SearchTarget) => {
    if (target.isGetParam && target.paramName) {
      const urlEncodedQuery = encodeURIComponent(activeQueryToUse);
      const searchUrl = `${target.url}${urlEncodedQuery}`;
      window.open(searchUrl, '_blank');
    } else {
      // For postal/state engines where we can't easily deep-link via URL query parameters,
      // we navigate them to the landing portal and show a nice toast instructing them to search.
      copyToClipboard(activeQueryToUse, target.id + '_exec');
      window.open(target.url, '_blank');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-10">
      
      {/* Header and Back Button */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 pb-6 border-b border-brand-border">
        <div>
          <h1 className="text-3xl font-serif text-brand-navy flex items-center gap-3">
            <Scale className="text-brand-accent scale-110" /> Buscador Forense y de Investigación Científica
          </h1>
          <p className="text-[10px] uppercase font-bold tracking-[0.2em] text-brand-slate mt-1.5 flex items-center gap-2">
            SOLJURE Ecuador <span className="w-1.5 h-1.5 bg-brand-accent rounded-full animate-ping"></span> Mapeo de Jurisprudencia y Doctrina Universitaria de Alta Gama
          </p>
        </div>
        
        {onBack && (
          <button 
            onClick={onBack}
            className="btn-outline text-[10px] font-bold uppercase tracking-[0.2em] py-2 px-5 text-brand-navy border-brand-border hover:bg-brand-bg transition-all active:scale-95 flex items-center gap-2 self-start md:self-center"
          >
            ← Volver a Ediciones
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Smart Query Controller & Ecuadorian Doctrinal Helper */}
        <div className="lg:col-span-4 space-y-6">
          <div className="p-6 border border-brand-border bg-white rounded-2xl shadow-sm space-y-5">
            <h2 className="text-xs font-black uppercase tracking-[0.25em] text-brand-navy flex items-center gap-2 mb-4">
              <Zap size={14} className="text-brand-accent" /> Panel de Control de Búsqueda
            </h2>
            
            {/* Input Query */}
            <div className="space-y-2">
              <label className="text-[9px] font-bold uppercase tracking-wider text-brand-slate block">Consulta Base o Tema de Análisis</label>
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-slate" size={16} />
                <input 
                  type="text" 
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    if (optimizedQuery) setOptimizedQuery(''); // clear optimized if modified
                  }}
                  placeholder="Ej., despido ineficaz, test de motivacion, prision de fuga..." 
                  className="w-full text-sm py-3 pl-10 pr-4 bg-brand-bg/50 focus:bg-white border border-brand-border/80 focus:border-brand-accent focus:ring-1 focus:ring-brand-accent rounded-xl outline-none text-brand-navy transition-colors font-sans"
                />
              </div>
            </div>

            {/* Area Filter */}
            <div className="space-y-2">
              <label className="text-[9px] font-bold uppercase tracking-wider text-brand-slate block">Materia o Especialidad Forense</label>
              <select 
                value={selectedArea}
                onChange={(e) => {
                  setSelectedArea(e.target.value);
                  if (optimizedQuery) setOptimizedQuery(''); // clear
                }}
                className="w-full text-xs font-bold uppercase tracking-widest p-3 bg-brand-bg/50 border border-brand-border/80 outline-none rounded-xl text-brand-navy focus:border-brand-accent focus:ring-1 focus:ring-brand-accent cursor-pointer transition-colors"
              >
                <option value="TODOS">TODAS LAS DISCIPLINAS</option>
                {Object.values(ExpertiseArea).map((area) => (
                  <option key={area} value={area}>{area.toUpperCase()}</option>
                ))}
              </select>
            </div>

            {/* Smart Refiner Trigger button */}
            <button
              onClick={handleOptimizeQuery}
              disabled={isOptimizing || !query.trim()}
              className={`w-full py-3.5 px-4 text-[10px] font-black uppercase tracking-[0.25em] rounded-xl flex items-center justify-center gap-2.5 transition-all outline-none border focus:ring-2 focus:ring-brand-accent/40 ${
                !query.trim()
                  ? 'bg-brand-slate/15 text-brand-slate border-brand-border/30 cursor-not-allowed'
                  : 'bg-brand-navy text-white hover:bg-brand-navy/95 border-brand-navy shadow-md hover:shadow-lg active:scale-95 cursor-pointer'
              }`}
            >
              {isOptimizing ? (
                <>
                  <RefreshCw size={14} className="animate-spin text-brand-accent" />
                  Estructurando Rigor Procesal...
                </>
              ) : (
                <>
                  <Zap size={14} className="text-brand-accent animate-pulse" />
                  Optimizar Términos Forenses (IA)
                </>
              )}
            </button>

            {/* Display / Edit Optimized Query Formula */}
            <AnimatePresence>
              {(optimizedQuery || query) && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="pt-4 border-t border-brand-border/60 space-y-2 overflow-hidden"
                >
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-brand-slate">Fórmula de Búsqueda Activa</span>
                    {optimizedQuery && (
                      <span className="bg-emerald-500/10 text-emerald-600 text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider">
                        Estructura Optimada
                      </span>
                    )}
                  </div>
                  <div className="relative bg-brand-bg/85 border border-brand-border p-3.5 rounded-xl flex items-start gap-2 group">
                    <textarea 
                      value={activeQueryToUse}
                      onChange={(e) => setOptimizedQuery(e.target.value)}
                      className="w-full text-xs font-mono text-brand-navy bg-transparent border-none outline-none resize-none leading-relaxed h-20"
                      title="Usted puede afinar manualmente esta consulta para adaptarla perfectamente"
                    />
                    <button 
                      onClick={() => copyToClipboard(activeQueryToUse, 'activeFormula')}
                      className="text-brand-slate hover:text-brand-accent p-1 cursor-pointer transition-colors pointer-events-auto"
                      title="Copiar consulta refinada"
                    >
                      {copiedId === 'activeFormula' ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                    </button>
                  </div>
                  <p className="text-[8px] text-brand-slate leading-normal italic">
                    💡 Esta fórmula lógica asegura los máximos resultados en los algoritmos de indexación de la Corte Nacional de Justicia, Corte Constitucional y repositorios académicos.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Quick legal Reference cheat sheet */}
          <div className="p-6 border border-brand-border/60 bg-brand-bg/35 rounded-2xl space-y-4">
            <h3 className="text-xs font-black uppercase tracking-[0.25em] text-brand-navy flex items-center gap-2">
              <BookMarked size={14} className="text-brand-accent animate-pulse" />
              Glosario del Rigor Dogmático
            </h3>
            <p className="text-[10px] text-brand-slate leading-relaxed">
              Términos procesales de alta jerarquía aconsejados por la escuela de posgrado SOLJURE para inyectar en sus búsquedas:
            </p>
            
            <div className="space-y-2.5">
              <div 
                onClick={() => { setQuery("subsunción fáctica del tipo penal"); handleOptimizeQuery(); }}
                className="p-2 border border-brand-border/40 hover:border-brand-accent bg-white rounded-lg cursor-pointer transition-colors text-[10px] flex items-center justify-between"
              >
                <code className="text-brand-navy font-semibold font-mono">"subsunción fáctica"</code>
                <ChevronRight size={12} className="text-brand-slate" />
              </div>
              <div 
                onClick={() => { setQuery("test de motivacion 1158-17-EP"); handleOptimizeQuery(); }}
                className="p-2 border border-brand-border/40 hover:border-brand-accent bg-white rounded-lg cursor-pointer transition-colors text-[10px] flex items-center justify-between"
              >
                <code className="text-brand-navy font-semibold font-mono">"test de motivación"</code>
                <ChevronRight size={12} className="text-brand-slate" />
              </div>
              <div 
                onClick={() => { setQuery("vicios in procedendo nulidad de sentencia"); handleOptimizeQuery(); }}
                className="p-2 border border-brand-border/40 hover:border-brand-accent bg-white rounded-lg cursor-pointer transition-colors text-[10px] flex items-center justify-between"
              >
                <code className="text-brand-navy font-semibold font-mono">"vicios in procedendo"</code>
                <ChevronRight size={12} className="text-brand-slate" />
              </div>
              <div 
                onClick={() => { setQuery("ineficacia de despido mujer lactante"); handleOptimizeQuery(); }}
                className="p-2 border border-brand-border/40 hover:border-brand-accent bg-white rounded-lg cursor-pointer transition-colors text-[10px] flex items-center justify-between"
              >
                <code className="text-brand-navy font-semibold font-mono">"estabilidad reforzada"</code>
                <ChevronRight size={12} className="text-brand-slate" />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Dynamic Database target grid list */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Categoría Navegación */}
          <div className="flex flex-wrap gap-2.5 border-b border-brand-border pb-4">
            <button
              onClick={() => setActiveCategory('todos')}
              className={`px-4 py-2 border rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${
                activeCategory === 'todos'
                  ? 'bg-brand-navy text-white border-brand-navy shadow-sm'
                  : 'bg-white text-brand-navy border-brand-border hover:bg-brand-bg'
              }`}
            >
              Todos los Motores
            </button>
            <button
              onClick={() => setActiveCategory('jurisprudencia')}
              className={`px-4 py-2 border rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${
                activeCategory === 'jurisprudencia'
                  ? 'bg-brand-navy text-white border-brand-navy shadow-sm'
                  : 'bg-white text-brand-navy border-brand-border hover:bg-brand-bg'
              }`}
            >
              Jurisprudencia País (CNJ/CC)
            </button>
            <button
              onClick={() => setActiveCategory('doctrina')}
              className={`px-4 py-2 border rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${
                activeCategory === 'doctrina'
                  ? 'bg-brand-navy text-white border-brand-navy shadow-sm'
                  : 'bg-white text-brand-navy border-brand-border hover:bg-brand-bg'
              }`}
            >
              Doctrina & Precedentes Pleno
            </button>
            <button
              onClick={() => setActiveCategory('academia')}
              className={`px-4 py-2 border rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${
                activeCategory === 'academia'
                  ? 'bg-brand-navy text-white border-brand-navy shadow-sm'
                  : 'bg-white text-brand-navy border-brand-border hover:bg-brand-bg'
              }`}
            >
              Revistas Indexadas & UCE
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filteredTargets.map((target) => {
              const isGet = target.isGetParam;
              return (
                <div 
                  key={target.id}
                  className="bg-white border border-brand-border hover:border-brand-accent/50 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group relative overflow-hidden"
                >
                  <div className="space-y-4">
                    {/* Header Database */}
                    <div className="flex justify-between items-start gap-4">
                      <div className="space-y-1">
                        <span className={`px-2 py-0.5 border text-[7px] font-extrabold uppercase rounded-md ${target.badge.colorClass}`}>
                          {target.badge.text}
                        </span>
                        <h4 className="font-extrabold text-brand-navy text-sm font-sans mt-1.5 leading-snug group-hover:text-brand-accent transition-colors">
                          {target.name}
                        </h4>
                        <p className="text-[9px] font-medium text-brand-slate uppercase tracking-wider">
                          {target.institution}
                        </p>
                      </div>
                      
                      {/* Category Icon indicator */}
                      <span className="p-2.5 bg-brand-bg border border-brand-border/40 rounded-xl text-brand-navy">
                        {target.category === 'jurisprudencia' ? (
                          <Scale size={16} className="text-brand-accent" />
                        ) : target.category === 'doctrina' ? (
                          <Award size={16} className="text-brand-accent" />
                        ) : (
                          <GraduationCap size={16} className="text-brand-accent" />
                        )}
                      </span>
                    </div>

                    <p className="text-xs text-brand-navy leading-relaxed line-clamp-3">
                      {target.tip}
                    </p>

                    {/* Exegesis/Doctrinal Sub-Tip */}
                    <div className="p-3 bg-brand-bg/50 border-l-2 border-brand-accent rounded-r-xl flex items-start gap-2 z-10 relative">
                      <Info size={12} className="text-brand-accent shrink-0 mt-0.5" />
                      <p className="text-[10px] text-brand-navy leading-normal italic">
                        <strong className="text-[9px] uppercase tracking-wider font-bold">Consejo SOLJURE:</strong> {target.exactExegesisTip}
                      </p>
                    </div>
                  </div>

                  {/* Buttons Action bar */}
                  <div className="mt-6 pt-4 border-t border-brand-border/50 flex items-center justify-between gap-3">
                    {/* Copy Query */}
                    <button
                      onClick={() => copyToClipboard(activeQueryToUse, target.id)}
                      className="px-3 py-2 bg-brand-bg hover:bg-brand-border/30 border border-brand-border/60 rounded-xl text-brand-navy text-[10px] font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                      title="Copiar la fórmula optimizada para pegar luego en el portal oficial"
                    >
                      {copiedId === target.id ? (
                        <>
                          <Check size={11} className="text-emerald-500" />
                          <span className="text-emerald-600">¡Copiado!</span>
                        </>
                      ) : (
                        <>
                          <Copy size={11} />
                          <span>Copiar Fórmula</span>
                        </>
                      )}
                    </button>

                    {/* Go seek directly */}
                    <button
                      onClick={() => executeSearch(target)}
                      className={`px-4 py-2 border rounded-xl text-[10px] font-black uppercase tracking-[0.05em] flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95 shadow-sm ${
                        isGet 
                          ? 'bg-brand-navy border-brand-navy text-white hover:bg-brand-navy/90' 
                          : 'bg-brand-accent border-brand-accent text-brand-navy hover:bg-brand-navy hover:border-brand-navy hover:text-white'
                      }`}
                    >
                      <span>{isGet ? 'Buscar' : 'Ir al Portal'}</span>
                      <ExternalLink size={10} />
                    </button>
                  </div>

                  {/* Special Indicator overlay of auto-copy on POST portal redirection */}
                  {!isGet && (
                    <div className="absolute top-2 right-2 flex items-center">
                      <span className="text-[8px] bg-brand-navy/5 text-brand-navy border border-brand-navy/10 px-1.5 py-0.5 rounded-md scale-90" title="Al dar click se auto-copiarán los términos para su comodidad">
                        Auto-Copia al click
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Quick Notice about Iframe constraints */}
          <div className="p-6 border border-amber-500/10 bg-amber-500/[0.02] rounded-2xl flex items-start gap-4">
            <ShieldAlert size={20} className="text-amber-600 shrink-0 mt-1" />
            <div className="space-y-1">
              <h5 className="text-xs font-black uppercase tracking-wider text-amber-800">
                Aviso de Conectividad Gubernamental (iFrame Bypass)
              </h5>
              <p className="text-[11px] text-[#78350f] leading-relaxed">
                Por directrices de seguridad cibernética pública del Estado Ecuatoriano, las páginas de la **Corte Nacional de Justicia** y de la **Corte Constitucional** impiden su incrustación directa en terceras plataformas (puente X-Frame-Options). 
                Para facilitar un flujo unificado y efectivo, el sistema **SOLJURE** copia de forma automática su consulta en el cortapapeles al presionar "Ir al Portal" para que únicamente tenga que presionar <strong>CTRL + V</strong> al llegar al campo correspondiente.
              </p>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
