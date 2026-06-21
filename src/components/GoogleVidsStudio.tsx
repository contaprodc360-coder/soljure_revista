import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, Video, Sparkles, Play, Pause, Download, RefreshCw, 
  Volume2, Music, Layers, Layout, Image, FileText, Check, Plus, 
  Trash2, ExternalLink, Sliders, ChevronRight, Monitor, Share2, 
  Database, UserCheck, HelpCircle, Save, Smartphone, Tv, User,
  Radio, Wifi, ShieldAlert, Cpu
} from 'lucide-react';
import { Editorial } from '../types';

interface GoogleVidsStudioProps {
  editorial: Editorial;
  initialSlides?: { title: string; body: string; script: string }[] | null;
  onBack: () => void;
  onSaveSlides?: (slides: { title: string; body: string; script: string }[]) => void;
}

const STOCK_MEDIA_ASSETS = [
  {
    category: "Logos & Identidad",
    items: [
      { name: "Logo Oficial SRI Ecuador", url: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=300", tag: "SRI" },
      { name: "SOLJURE Oro Corporativo", url: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=300", tag: "Firma" },
      { name: "Sello de Auditoría Certificada", url: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&q=80&w=300", tag: "Auditoría" }
    ]
  },
  {
    category: "Infografías & Métricas",
    items: [
      { name: "Dashboard Financiero Integrado", url: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&q=80&w=300", tag: "NIIF" },
      { name: "Tabla de Retención de Impuestos", url: "https://images.unsplash.com/photo-1544383835-bda2bc66a55d?auto=format&fit=crop&q=80&w=300", tag: "Impuestos" },
      { name: "Análisis de Rentabilidad Semestral", url: "https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?auto=format&fit=crop&q=80&w=300", tag: "Finanzas" }
    ]
  },
  {
    category: "Entorno Académico / Ecuador",
    items: [
      { name: "Quito Distrito Financiero", url: "https://images.unsplash.com/photo-1596463059283-da257325602a?auto=format&fit=crop&q=80&w=300", tag: "Urbano" },
      { name: "Cámara de Comercio", url: "https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&q=80&w=300", tag: "Negocios" },
      { name: "Libros y Leyes Societarias", url: "https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&q=80&w=300", tag: "Leyes" }
    ]
  }
];

const BACKGROUND_MUSIC_TRACKS = [
  { id: "ambient", name: "Deep Focus (Sintetizador Suave)", intensity: "Baja" },
  { id: "corporate", name: "Corporate Vision (Aspiracional / Piano)", intensity: "Media" },
  { id: "tech", name: "FinTech Innovation (Ritmo Electrónico)", intensity: "Media" },
  { id: "calm", name: "Silence (Solo Narración)", intensity: "Nula" }
];

const VIDS_THEMES = [
  { id: "amber_corporate", name: "Editorial Amberes", bg: "bg-amber-950", text: "text-amber-50", accent: "border-amber-400 text-amber-300", fromColor: "from-amber-950", toColor: "to-amber-900" },
  { id: "royal_navy", name: "Ecuadorian Navy", bg: "bg-[#0b1c34]", text: "text-white", accent: "border-cyan-400 text-cyan-300", fromColor: "from-[#0b1c34]", toColor: "to-[#112f56]" },
  { id: "emerald_gold", name: "Finanzas Oro", bg: "bg-emerald-950", text: "text-emerald-50", accent: "border-yellow-500 text-yellow-300", fromColor: "from-emerald-950", toColor: "to-emerald-900" },
  { id: "cosmic_ink", name: "Minimalist Charcoal", bg: "bg-zinc-950", text: "text-zinc-100", accent: "border-violet-500 text-violet-400", fromColor: "from-zinc-950", toColor: "to-zinc-800" }
];

// Sora cinematic preset paths
const SORA_VID_PROMPTS = [
  {
    id: "sora-1",
    themeName: "Tomas Aéreas de Quito Corporativo",
    prompt: "Photorealistic aerial panoramic, academic auditor in full-floor glass skyscraper analyzing high-tech financial charts in Quito, Pichincha, golden hour sunset, slow cinematic pan, volumetric luxury lighting, 8k resolution.",
    url: "https://images.unsplash.com/photo-1596463059283-da257325602a?auto=format&fit=crop&q=80&w=500"
  },
  {
    id: "sora-2",
    themeName: "Abstracción NIIF & SRI Dinámica",
    prompt: "A neon-glowing abstract representation of Ecuadorian tax rates and ledger codes, numbers floating in digital cloud database styled as golden streams, cinematic camera depth of focus, hyperrealistic 4k.",
    url: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&q=80&w=500"
  },
  {
    id: "sora-3",
    themeName: "Espacio de Auditoría y Dictamen",
    prompt: "A magnifying glass slowly moving across authentic tax ledgers with animated overlaying formulas, professional workspace in Ecuador, dramatic legal focus, ultra-detailed 1080p.",
    url: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&q=80&w=500"
  }
];

// Digital Samba host speaker sources
const SAMBA_HOST_SPEAKERS = [
  { id: "evelyn", name: "Dra. Evelyn Romero", role: "Directora Académica SOLJURE", pic: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=150" },
  { id: "carlos", name: "Dr. Carlos Andrade", role: "Socio de Litigio y Ex-Magistrado", pic: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=150" },
  { id: "sandra", name: "Ab. Sandra Valencia", role: "Líder en Defensa Constitucional", pic: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=150" }
];

export const GoogleVidsStudio: React.FC<GoogleVidsStudioProps> = ({ 
  editorial, 
  initialSlides, 
  onBack,
  onSaveSlides
}) => {
  // Initialize presentation slides: extract 5 default if none passed
  const [slides, setSlides] = useState<{ title: string; body: string; script: string; image?: string; themeIndex?: number; layoutStyle?: string }[]>(() => {
    if (initialSlides && initialSlides.length > 0) {
      return initialSlides.map(s => ({
        ...s,
        themeIndex: 1, // Default to royal_navy
        layoutStyle: "split_image_right"
      }));
    }
    
    // Fallback: Build customized slides automatically on-the-fly based on Editorial Content
    const bodyWords = editorial.content.split(' ');
    const chunk1 = bodyWords.slice(0, 50).join(' ') + "...";
    const chunk2 = bodyWords.slice(50, 100).join(' ') + "...";
    const chunk3 = bodyWords.slice(100, 150).join(' ') + "...";

    return [
      {
        title: `PORTADA: ${editorial.title.toUpperCase()}`,
        body: `Análisis académico exclusivo por SOLJURE. Jurisprudencia y leyes vigentes en el Ecuador. Especialidad: ${editorial.area}.`,
        script: `Bienvenidos al reportaje jurídico y procesal de SOLJURE. Hoy analizaremos a fondo el tema: ${editorial.title}. Les acompaña la voz virtual de nuestra consultora académica.`,
        image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=300",
        themeIndex: 1,
        layoutStyle: "full_splash"
      },
      {
        title: "¿QUÉ ENCUENTRA LA INVESTIGACIÓN?",
        body: editorial.summary,
        script: `Comencemos resumiendo este trascendental impacto legal: ${editorial.summary}. Este escenario exige un control riguroso de cada uno de los elementos normativos y constitucionales.`,
        image: "https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?auto=format&fit=crop&q=80&w=300",
        themeIndex: 1,
        layoutStyle: "split_image_right"
      },
      {
        title: "ANÁLISIS NORMATIVO Y PROCESAL",
        body: chunk1,
        script: `Adentrándonos en el análisis normativo: ${chunk1.substring(0, 120)}... Como asesores, la prudencia frente a las cortes y entes de control de Ecuador define la pauta principal de cumplimiento procesal.`,
        image: "https://images.unsplash.com/photo-1544383835-bda2bc66a55d?auto=format&fit=crop&q=80&w=300",
        themeIndex: 2, // Finanzas oro
        layoutStyle: "split_text_left"
      },
      {
        title: "IMPACTO LEGAL Y APLICACIÓN JURÍDICA",
        body: chunk2,
        script: `A nivel doctrinario y constitucional: ${chunk2.substring(0, 120)}... La formulación de las garantías procesales debe efectuarse bajo lineamientos de debido proceso integral.`,
        image: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&q=80&w=300",
        themeIndex: 1,
        layoutStyle: "split_image_right"
      },
      {
        title: "DECLARACIÓN DE CUMPLIMIENTO SOLJURE",
        body: `Recomendamos revaluar las contingencias corporativas de forma semestral con firmas licenciadas. Autor: ${editorial.author}.`,
        script: `Para concluir se sugiere realizar una auditoría legal preventiva independiente. Asegure su tranquilidad corporativa. Muchas gracias por confiar en SOLJURE.`,
        image: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&q=80&w=300",
        themeIndex: 3, // Minimalist Charcoal
        layoutStyle: "full_splash"
      }
    ];
  });

  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [playSpeed, setPlaySpeed] = useState(1);
  const [narrationPitch, setNarrationPitch] = useState(1);
  const [narrationVolume, setNarrationVolume] = useState(85);
  const [musicTrack, setMusicTrack] = useState("ambient");
  const [musicVolume, setMusicMusicVolume] = useState(25);
  
  const [activeAssetTab, setActiveAssetTab] = useState<string>("Logos & Identidad");
  const [isCompiling, setIsCompiling] = useState(false);
  const [compilingLog, setCompilingLog] = useState<string[]>([]);
  const [compilingProgress, setCompilingProgress] = useState(0);
  const [compiledVideoUrl, setCompiledVideoUrl] = useState<string | null>(null);

  // Advanced references integrations states (Samba WebRTC, Sora Prompts, Story Flicks)
  const [layoutRatio, setLayoutRatio] = useState<"16_9" | "9_16">("16_9");
  const [storyFlicksStyle, setStoryFlicksStyle] = useState<string>("interactive_neon"); // interactive_neon, solid_caption, top_scroller
  
  const [soraPromptText, setSoraPromptText] = useState<string>("");
  const [isSoraGenerating, setIsSoraGenerating] = useState<boolean>(false);
  const [soraProgressLogs, setSoraProgressLogs] = useState<string[]>([]);
  const [soraProgressBar, setSoraProgressBar] = useState<number>(0);

  const [enableSambaOverlay, setEnableSambaOverlay] = useState<boolean>(false);
  const [sambaLayout, setSambaLayout] = useState<"floating" | "split" | "circular">("circular");
  const [sambaHost, setSambaHost] = useState<string>("evelyn"); // evelyn, carlos, sandra
  const [sambaMicActive, setSambaMicActive] = useState<boolean>(true);
  const [sambaLatency, setSambaLatency] = useState<number>(14);

  const playlistTimerRef = useRef<NodeJS.Timeout | null>(null);

  const currentSlide = slides[activeSlideIndex] || slides[0];

  useEffect(() => {
    if (isPlaying) {
      playlistTimerRef.current = setInterval(() => {
        setCurrentTime(prev => {
          const nextVal = prev + 0.1 * playSpeed;
          const currentSlideMaxSeconds = 10; // 10s per slide for simulation
          const totalMaxSeconds = slides.length * currentSlideMaxSeconds;

          if (nextVal >= totalMaxSeconds) {
            setIsPlaying(false);
            setActiveSlideIndex(0);
            return 0;
          }

          // Compute matching index
          const nextIndex = Math.floor(nextVal / currentSlideMaxSeconds);
          if (nextIndex !== activeSlideIndex && nextIndex < slides.length) {
            setActiveSlideIndex(nextIndex);
          }

          return nextVal;
        });
      }, 100);
    } else {
      if (playlistTimerRef.current) clearInterval(playlistTimerRef.current);
    }

    return () => {
      if (playlistTimerRef.current) clearInterval(playlistTimerRef.current);
    };
  }, [isPlaying, playSpeed, activeSlideIndex, slides.length]);

  const handleTogglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const handleSelectSlideIndex = (idx: number) => {
    setActiveSlideIndex(idx);
    setCurrentTime(idx * 10);
  };

  const handleUpdateSlideField = (index: number, key: string, value: any) => {
    const updated = [...slides];
    updated[index] = {
      ...updated[index],
      [key]: value
    };
    setSlides(updated);
  };

  const handleAddSlide = () => {
    const newSlide = {
      title: "NUEVA DIAPOSITIVA ACADÉMICA",
      body: "Inserta tu análisis normativo secundario aquí. Agrega detalles de registros SRI o cuentas contables.",
      script: "A continuación ampliaremos con mayor información esta importante directriz fiscal.",
      image: "https://images.unsplash.com/photo-1596463059283-da257325602a?auto=format&fit=crop&q=80&w=300",
      themeIndex: 1,
      layoutStyle: "split_image_right"
    };
    setSlides([...slides, newSlide]);
    setActiveSlideIndex(slides.length);
    setCurrentTime(slides.length * 10);
  };

  const handleDeleteSlide = (index: number) => {
    if (slides.length <= 1) {
      alert("La presentación técnica debe tener al menos una diapositiva visual.");
      return;
    }
    const updated = slides.filter((_, idx) => idx !== index);
    setSlides(updated);
    setActiveSlideIndex(Math.max(0, index - 1));
    setCurrentTime(Math.max(0, index - 1) * 10);
  };

  const handleApplyStockMedia = (url: string) => {
    handleUpdateSlideField(activeSlideIndex, 'image', url);
  };

  const executeVidsCompilation = () => {
    setIsCompiling(true);
    setCompilingProgress(5);
    setCompilingLog(["[Google Vids Engine] Inicializando entorno de compilación multimedia..."]);
    
    const logs = [
      "Sincronizando con Google Drive de soljure@gmail.com...",
      "Identificando plantilla de Google Vids 'Corporate Academic V1'...",
      "Redactando guiones de voz y mapeando pistas de síntesis sintética...",
      "Mezclando audio de fondo: 'Deep Focus' con volumen de atenuación al 25%...",
      "Procesando 5 escenas de video con resoluciones 1080p nativas...",
      "Renderizando y aplicando logotipos corporativos y sellos de sello real...",
      "Uniendo fotogramas, transiciones de desvanecimiento dinámico y marcas de agua...",
      "Video MP4 generado y almacenado en la nube en SOLJURE."
    ];

    logs.forEach((log, idx) => {
      setTimeout(() => {
        setCompilingLog(prev => [...prev, `[Google Vids Log] ${log}`]);
        setCompilingProgress(Math.min(95, 10 + (idx + 1) * 11));
      }, (idx + 1) * 1200);
    });

    setTimeout(() => {
      setCompilingLog(prev => [...prev, "[Google Vids] ¡Video compilado con éxito! Listo para su descarga o compartición en Google Drive."]);
      setCompilingProgress(100);
      setCompiledVideoUrl("https://assets.mixkit.co/videos/preview/mixkit-accountant-checking-corporate-accounts-40439-large.mp4");
    }, (logs.length + 1) * 1200);
  };

  const handleFinishAndSave = () => {
    if (onSaveSlides) {
      onSaveSlides(slides.map(s => ({ title: s.title, body: s.body, script: s.script })));
    }
    alert("Presentación y guiones actualizados en memoria y vinculados al editorial actoral.");
  };

  // Asynchronous Sora Video compilation simulator
  const handleGenerateSoraVideo = () => {
    if (!soraPromptText.trim()) {
      alert("Por favor escribe una descripción de los elementos visuales del video.");
      return;
    }
    setIsSoraGenerating(true);
    setSoraProgressBar(5);
    setSoraProgressLogs(["[Sora Cloud Server] Recibiendo especificación visual para la pauta..."]);

    const steps = [
      "Analizando semántica de contabilidad e impuestos en el Ecuador para coherencia...",
      "Estableciendo vectores volumétricos de luz cinematográfica a desvanecimiento fluido...",
      "Trazando paneo de cámara superlenta en resolución 4K nativa...",
      "Aplicando corrección de color de fotorrealismo corporativo académico...",
      "Video Sora acoplado con éxito. Compilando asset final..."
    ];

    steps.forEach((step, index) => {
      setTimeout(() => {
        setSoraProgressLogs(prev => [...prev, `[Sora Engine] ${step}`]);
        setSoraProgressBar(Math.min(95, 15 + index * 18));
      }, (index + 1) * 900);
    });

    setTimeout(() => {
      setSoraProgressLogs(prev => [...prev, "[Sora Engine] ¡Fondo de escena acoplado con éxito! Aplicado como fondo de esta escena."]);
      setSoraProgressBar(100);
      setIsSoraGenerating(false);
      
      // Select a neat image matching theme
      const randomImages = [
        "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&q=80&w=500",
        "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&q=80&w=500",
        "https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?auto=format&fit=crop&q=80&w=500",
        "https://images.unsplash.com/photo-1596463059283-da257325602a?auto=format&fit=crop&q=80&w=500"
      ];
      const selectedImg = randomImages[Math.floor(Math.random() * randomImages.length)];
      handleUpdateSlideField(activeSlideIndex, 'image', selectedImg);
    }, (steps.length + 1) * 900);
  };

  // Build the styles
  const currentTheme = VIDS_THEMES[currentSlide?.themeIndex || 0] || VIDS_THEMES[0];

  return (
    <div className="fixed inset-0 z-[280] bg-[#0c0d12] flex flex-col overflow-hidden text-slate-100 font-sans">
      
      {/* Top Header Section customized like Google Workspace / Google Vids Editor Panel */}
      <header className="h-16 border-b border-white/10 bg-[#13151c] shrink-0 px-6 flex items-center justify-between z-10">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-1.5 rounded-full hover:bg-white/5 text-slate-400 hover:text-white transition-all cursor-pointer"
            title="Regresar a SOLJURE"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="h-4 w-px bg-white/15"></div>
          
          {/* Official Google Vids Logo Design Representation */}
          <div className="flex items-center gap-2.5">
            <div className="relative flex items-center justify-center w-7 h-7 rounded-lg bg-gradient-to-br from-violet-600 via-indigo-600 to-blue-500 shadow-md shadow-indigo-600/30">
              <div className="absolute inset-[1px] rounded-lg bg-[#1a123a]/30"></div>
              <Play size={10} className="fill-white text-white translate-x-[0.5px] relative" />
              {/* Stacked design accent mimicking Google Vids icon */}
              <div className="absolute -left-1 ring-1 ring-violet-500/30 w-5 h-5 rounded bg-violet-600/30 shadow-sm pointer-events-none origin-bottom-right rotate-[-12deg] scale-90 -z-10"></div>
              <div className="absolute -left-2 ring-1 ring-indigo-500/20 w-5 h-5 rounded bg-indigo-600/20 shadow-sm pointer-events-none origin-bottom-right rotate-[-24deg] scale-75 -z-20"></div>
            </div>
            <div className="text-left leading-none">
              <span className="font-serif font-black tracking-wide text-[16px] text-white">Google <span className="text-violet-400">Vids</span></span>
              <p className="text-[8px] text-slate-400 uppercase font-bold tracking-widest leading-none mt-0.5">AI Video Studio & Presentaciones</p>
            </div>
          </div>
        </div>

        {/* Sync / Document title & indicators */}
        <div className="hidden lg:flex items-center gap-3 bg-[#1c1f2a] border border-white/5 py-1 px-3.5 rounded-full">
          <Database size={12} className="text-violet-400" />
          <span className="text-[10px] uppercase font-black tracking-wider text-slate-300">Vinculado a:</span>
          <span className="text-[10px] text-brand-gold font-bold truncate max-w-[200px]" title={editorial.title}>
            {editorial.title}
          </span>
          <span className="text-[8px] bg-green-500/20 text-green-400 px-2 py-0.5 rounded font-black uppercase">Física Online al 2026</span>
        </div>

        {/* Global Save Controls */}
        <div className="flex items-center gap-3">
          <button 
            onClick={handleFinishAndSave}
            className="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-200 border border-white/15 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer flex items-center gap-1.5"
            title="Guardar diapositivas"
          >
            <Save size={12} className="text-violet-400" />
            <span>Guardar</span>
          </button>
          
          <button 
            onClick={executeVidsCompilation}
            className="px-5 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-md shadow-indigo-600/35 cursor-pointer flex items-center gap-1.5 group font-bold"
          >
            <Sparkles size={12} className="text-brand-accent group-hover:rotate-12 transition-transform" />
            <span>Compilar Presentación Multimedia</span>
          </button>
        </div>
      </header>

      {/* Main Workspace Frame */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Drawer Panels: Storyboard Scenes */}
        <div className="w-80 border-r border-white/15 bg-[#101217] flex flex-col overflow-hidden select-none shrink-0">
          <div className="p-4 border-b border-white/10 flex justify-between items-center bg-[#15181e]">
            <div className="text-left">
              <h4 className="text-[11px] uppercase font-black tracking-widest text-[#a8b3cf]">Escenas del Storyboard</h4>
              <p className="text-[9px] text-slate-500">Mapeo de diálogos de la consultoría virtual</p>
            </div>
            <button
              onClick={handleAddSlide}
              title="Añadir Diapositiva de Escena"
              className="p-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white transition-all cursor-pointer flex items-center justify-center shadow-lg shadow-violet-600/25"
            >
              <Plus size={14} />
            </button>
          </div>

          {/* List of Scenes */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3.5 scrollbar-thin">
            {slides.map((slide, i) => {
              const isActive = activeSlideIndex === i;
              const isFirst = i === 0;
              const isLast = i === slides.length - 1;

              return (
                <div 
                  key={i}
                  className={`group relative rounded-xl border p-3.5 text-left transition-all cursor-pointer ${
                    isActive 
                      ? 'bg-gradient-to-br from-[#1b1732] to-[#12111d] border-violet-500/80 shadow-md shadow-violet-500/5' 
                      : 'bg-[#14171d]/60 border-white/10 hover:bg-[#1a1d26] hover:border-white/15'
                  }`}
                  onClick={() => handleSelectSlideIndex(i)}
                >
                  {/* Number Badge and Control Icons */}
                  <div className="flex justify-between items-center mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-black tracking-widest ${
                        isActive ? 'bg-violet-600 text-white' : 'bg-white/10 text-slate-400'
                      }`}>
                        {i + 1}
                      </span>
                      <span className="text-[8px] uppercase tracking-wider font-extrabold text-slate-500">
                        Escena • 10 segundos
                      </span>
                    </div>

                    {/* Delete option */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteSlide(i);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-red-400 rounded transition-all cursor-pointer"
                      title="Eliminar escena"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>

                  {/* Title Preview input */}
                  <div className="space-y-1.5 mt-2">
                    <input 
                      type="text"
                      className="w-full bg-black/35 border-0 rounded px-1.5 py-0.5 text-[11px] font-serif font-black tracking-wide text-white focus:outline-none focus:ring-1 focus:ring-violet-500"
                      value={slide.title}
                      onChange={(e) => handleUpdateSlideField(i, 'title', e.target.value)}
                    />
                    
                    {/* Tiny representation of script */}
                    <p className="text-[10px] leading-tight text-slate-400 line-clamp-2 italic font-light">
                      "{slide.script}"
                    </p>
                  </div>

                  {/* Action Layout Type Indicators */}
                  <div className="flex items-center gap-1.5 mt-3 pt-2.5 border-t border-white/5">
                    <span className="text-[7.5px] uppercase font-black tracking-widest px-1.5 py-0.5 bg-white/5 text-slate-400 rounded">
                      {slide.layoutStyle === 'full_splash' ? 'Portada Completa' : slide.layoutStyle === 'split_text_left' ? 'Texto/Gráfico' : 'Texto Derecha'}
                    </span>
                    <span className="text-[7.5px] text-violet-400 font-semibold ml-auto">
                      {VIDS_THEMES[slide.themeIndex ?? 0]?.name || "Predeterminado"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Center Panel: Active Slide Live Rendering Layout Viewport */}
        <div className="flex-1 bg-[#090a0d] p-6 flex flex-col justify-between overflow-hidden relative">
          
          {/* Quick theme & layout toolbar */}
          <div className="h-12 bg-[#13151c]/90 rounded-2xl border border-white/10 p-2 flex items-center justify-between shadow-lg backdrop-blur-md gap-3 shrink-0 select-none overflow-x-auto scrollbar-none">
            {/* Template layout select */}
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] uppercase font-black text-slate-500 tracking-wider flex items-center gap-1">
                <Layout size={10} className="text-violet-400" /> Diseño:
              </span>
              <div className="flex bg-black/40 p-0.5 rounded-lg border border-white/5 shrink-0">
                <button
                  onClick={() => handleUpdateSlideField(activeSlideIndex, 'layoutStyle', 'full_splash')}
                  className={`px-1.5 py-0.5 text-[8.5px] font-bold uppercase rounded cursor-pointer ${
                    currentSlide.layoutStyle === 'full_splash' ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Completa
                </button>
                <button
                  onClick={() => handleUpdateSlideField(activeSlideIndex, 'layoutStyle', 'split_image_right')}
                  className={`px-1.5 py-0.5 text-[8.5px] font-bold uppercase rounded cursor-pointer ${
                    currentSlide.layoutStyle === 'split_image_right' ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Recurso Der
                </button>
                <button
                  onClick={() => handleUpdateSlideField(activeSlideIndex, 'layoutStyle', 'split_text_left')}
                  className={`px-1.5 py-0.5 text-[8.5px] font-bold uppercase rounded cursor-pointer ${
                    currentSlide.layoutStyle === 'split_text_left' ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Recurso Izq
                </button>
              </div>
            </div>

            {/* NEW: Aspect ratio layout toggle (16:9 landscape vs 9:16 Story Flicks) */}
            <div className="flex items-center gap-1.5 border-l border-white/10 pl-2">
              <span className="text-[9px] uppercase font-black text-slate-500 tracking-wider flex items-center gap-1">
                <Smartphone size={10} className="text-violet-400" /> Story Flicks:
              </span>
              <div className="flex bg-black/40 p-0.5 rounded-lg border border-white/5 shrink-0">
                <button
                  onClick={() => setLayoutRatio("16_9")}
                  className={`px-1.5 py-0.5 text-[8.5px] font-bold uppercase rounded cursor-pointer flex items-center gap-0.5 ${
                    layoutRatio === '16_9' ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                  title="Horizontal 16:9 Estándar"
                >
                  <Tv size={9} /> 16:9
                </button>
                <button
                  onClick={() => setLayoutRatio("9_16")}
                  className={`px-1.5 py-0.5 text-[8.5px] font-bold uppercase rounded cursor-pointer flex items-center gap-0.5 ${
                    layoutRatio === '9_16' ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                  title="Story Flicks Vertical Reels"
                >
                  <Smartphone size={9} /> 9:16 Reels
                </button>
              </div>
            </div>

            {/* Quick Pallet selector */}
            <div className="flex items-center gap-1.5 border-l border-white/10 pl-2">
              <span className="text-[9px] uppercase font-black text-slate-500 tracking-wider flex items-center gap-1">
                🎨 Paleta:
              </span>
              <div className="flex gap-1 shrink-0">
                {VIDS_THEMES.map((theme, idx) => (
                  <button
                    key={theme.id}
                    onClick={() => handleUpdateSlideField(activeSlideIndex, 'themeIndex', idx)}
                    className={`w-3.5 h-3.5 rounded-full border transform hover:scale-125 transition-all cursor-pointer ${theme.bg} ${
                      currentSlide.themeIndex === idx ? 'border-white scale-110 ring-1 ring-violet-500' : 'border-white/20'
                    }`}
                    title={theme.name}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Preview Viewport Container */}
          <div className="flex-1 flex items-center justify-center my-4 overflow-hidden relative group">
            
            <AnimatePresence mode="wait">
              <motion.div 
                key={`${activeSlideIndex}-${currentSlide.themeIndex}-${layoutRatio}`}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.3 }}
                className={`transition-all duration-300 relative overflow-hidden flex flex-col justify-between shadow-2xl border border-white/5 select-none ${
                  layoutRatio === '9_16' 
                    ? `w-[305px] aspect-[9/16] rounded-[2.25rem] p-5 max-h-[545px] ring-4 ring-[#1f212d]` 
                    : `w-full max-w-3xl aspect-[16/9] rounded-2xl p-8`
                } ${currentTheme.bg}`}
              >
                {/* Phone camera punch hole cutout inside the viewport if Vertical mode is active */}
                {layoutRatio === '9_16' && (
                  <div className="absolute top-2 left-1/2 -translate-x-1/2 w-20 h-4 bg-black rounded-full z-40 flex items-center justify-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-zinc-800"></div>
                    <div className="w-1 h-1 rounded-full bg-[#111]"></div>
                  </div>
                )}

                {/* Visual Backdrop Overlay Effects mimicking premium video slides */}
                {layoutRatio === '16_9' ? (
                  <>
                    <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-violet-500/5 to-transparent rounded-full blur-3xl pointer-events-none"></div>
                    <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-cyan-500/5 to-transparent rounded-full blur-3xl pointer-events-none"></div>
                  </>
                ) : (
                  currentSlide.image && (
                    <div className="absolute inset-0 z-0 pointer-events-none select-none">
                      <img 
                        src={currentSlide.image} 
                        alt="Reels Backdrop Blur" 
                        className="w-full h-full object-cover opacity-25 scale-110 blur-md"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/45 to-transparent"></div>
                    </div>
                  )
                )}

                {/* Sub banner watermark */}
                <div className="flex justify-between items-center relative z-10 pt-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] tracking-widest font-black uppercase text-brand-accent">SOLJURE</span>
                    <span className="text-[7px] border rounded-full px-1.5 py-0.2 uppercase border-white/20 text-white/50">{editorial.area}</span>
                  </div>
                  <div className="text-[7.2px] uppercase font-bold text-slate-400 tracking-wider">
                    {layoutRatio === '9_16' ? 'STORY FLICKS EDIT' : 'CÁMARA ACADÉMICA ECUATORIANA 2026'}
                  </div>
                </div>

                {/* Layout Inner Views */}
                <div className="flex-1 my-3 flex items-center relative z-10 w-full overflow-hidden">
                  
                  {/* VERTICAL STORY FLICKS SPECIFIC VIEW */}
                  {layoutRatio === '9_16' ? (
                    <div className="w-full h-full flex flex-col justify-between pt-4 pb-2 text-left">
                      <div className="space-y-2 bg-black/45 p-3 rounded-2xl border border-white/5 backdrop-blur-sm shadow-xl shrink-0">
                        <span className={`text-[8px] uppercase font-black tracking-widest px-1.5 py-0.5 bg-white/5 border rounded-full ${currentTheme.accent}`}>
                          Escena {activeSlideIndex + 1}
                        </span>
                        <h4 className={`text-sm font-serif font-black tracking-wide leading-tight ${currentTheme.text}`}>
                          {currentSlide.title}
                        </h4>
                        <p className="text-[10px] text-slate-300 font-light leading-relaxed line-clamp-4">
                          {currentSlide.body}
                        </p>
                      </div>

                      {/* Cover Photo representation in vertical layout */}
                      {currentSlide.layoutStyle !== 'full_splash' && currentSlide.image && (
                        <div className="flex-1 my-2 bg-black/20 rounded-xl overflow-hidden border border-white/5 relative group/vert">
                          <img 
                            src={currentSlide.image} 
                            alt="Vertical asset" 
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      )}

                      {/* Auto scrolling captions representing Story Flicks */}
                      <div className="mt-auto shrink-0">
                        {currentSlide.script && (
                          <div className="px-2.5 py-2 rounded-xl text-center space-y-1 backdrop-blur-md bg-black/60 border border-white/10 shadow-lg">
                            <p className="text-[10px] leading-relaxed font-black tracking-tight text-white">
                              {currentSlide.script.split(' ').map((word, idx) => {
                                const words = currentSlide.script.split(' ');
                                const activeWordIndex = Math.floor(((currentTime || 0) % 10) * (words.length / 10));
                                const isWordActive = idx === activeWordIndex;
                                return (
                                  <span 
                                    key={idx} 
                                    className={`mx-0.5 transition-all duration-150 inline-block py-0.2 px-0.6 rounded text-[9.5px] ${
                                      isWordActive 
                                        ? storyFlicksStyle === 'interactive_neon'
                                          ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-black scale-110 ring-1 ring-violet-400 shadow-md'
                                          : storyFlicksStyle === 'solid_caption'
                                            ? 'bg-yellow-400 text-black font-semibold'
                                            : 'text-cyan-300 font-serif font-black underline'
                                        : 'text-white/60 font-semibold'
                                    }`}
                                  >
                                    {word}
                                  </span>
                                );
                              })}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    // HORIZONTAL 16:9 STANDARD VIEWS
                    <>
                      {/* FULL SPLASH LAYOUT (Scene 1) */}
                      {currentSlide.layoutStyle === 'full_splash' && (
                        <div className="w-full text-center space-y-3.5 px-6 my-auto">
                          <h4 className={`text-2xl font-serif font-black tracking-wide leading-tight ${currentTheme.text}`}>
                            {currentSlide.title}
                          </h4>
                          <div className="w-16 h-[2px] bg-gradient-to-r from-violet-400 to-indigo-500 mx-auto"></div>
                          <p className="text-xs text-slate-300 leading-relaxed font-light max-w-lg mx-auto">
                            {currentSlide.body}
                          </p>
                        </div>
                      )}

                      {/* SPLIT IMAGE RIGHT */}
                      {currentSlide.layoutStyle === 'split_image_right' && (
                        <div className="w-full h-full flex items-center gap-6 text-left">
                          <div className="flex-1 space-y-3.5 pr-2">
                            <span className={`text-[8.5px] uppercase font-black tracking-widest px-2 py-0.5 bg-white/5 border rounded-full ${currentTheme.accent}`}>
                              Escena {activeSlideIndex + 1}
                            </span>
                            <h4 className={`text-xl font-serif font-extrabold tracking-wide leading-tight ${currentTheme.text}`}>
                              {currentSlide.title}
                            </h4>
                            <div className="w-12 h-[1.5px] bg-[#00e1ff]"></div>
                            <p className="text-[11px] text-slate-300 font-light leading-relaxed">
                              {currentSlide.body}
                            </p>
                          </div>

                          {/* Stock Image on Right */}
                          <div className="w-64 h-full rounded-xl overflow-hidden relative shrink-0 border border-white/10 group-hover:scale-[1.01] transition-transform shadow-xl">
                            {currentSlide.image ? (
                              <>
                                <img 
                                  src={currentSlide.image} 
                                  alt="Slide Resource" 
                                  className="w-full h-full object-cover"
                                  referrerPolicy="no-referrer"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                                {/* Graphic label */}
                                <span className="absolute bottom-2.5 left-2.5 text-[8px] uppercase tracking-wider bg-[#101217]/90 text-slate-300 py-0.5 px-2 rounded-md font-bold">
                                  Recurso Multimedia
                                </span>
                              </>
                            ) : (
                              <div className="w-full h-full flex flex-col items-center justify-center bg-black/40 text-slate-500">
                                <Image size={24} className="mb-2" />
                                <span className="text-[10px]">Sin Imagen</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* SPLIT TEXT LEFT */}
                      {currentSlide.layoutStyle === 'split_text_left' && (
                        <div className="w-full h-full flex items-center gap-6 text-left">
                          {/* Stock Image on Left */}
                          <div className="w-64 h-full rounded-xl overflow-hidden relative shrink-0 border border-white/10 shadow-xl">
                            {currentSlide.image ? (
                              <>
                                <img 
                                  src={currentSlide.image} 
                                  alt="Slide Resource Left" 
                                  className="w-full h-full object-cover"
                                  referrerPolicy="no-referrer"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                                <span className="absolute bottom-2.5 left-2.5 text-[8px] uppercase tracking-wider bg-[#101217]/90 text-slate-300 py-0.5 px-2 rounded-md font-bold">
                                  Evidencia SRI
                                </span>
                              </>
                            ) : (
                              <div className="w-full h-full bg-black/40 flex flex-col items-center justify-center text-slate-500">
                                <Image size={24} className="mb-2" />
                                <span className="text-[10px]">Sin Imagen</span>
                              </div>
                            )}
                          </div>

                          <div className="flex-1 space-y-3.5 pl-2 select-text">
                            <span className={`text-[8.5px] uppercase font-black tracking-widest px-2 py-0.5 bg-white/5 border rounded-full ${currentTheme.accent}`}>
                              Análisis Clave
                            </span>
                            <h4 className={`text-xl font-serif font-extrabold tracking-wide leading-tight ${currentTheme.text}`}>
                              {currentSlide.title}
                            </h4>
                            <div className="w-12 h-[1.5px] bg-[#fbbf24]"></div>
                            <p className="text-[11px] text-slate-300 font-light leading-relaxed">
                              {currentSlide.body}
                            </p>
                          </div>
                        </div>
                      )}
                    </>
                  )}

                </div>

                {/* NEW: Digital Samba WebRTC Host Overlay (inspired by claude-code-video-toolkit) */}
                {enableSambaOverlay && (
                  <div className={`absolute z-30 transition-all duration-300 ${
                    sambaLayout === 'circular'
                      ? layoutRatio === '9_16'
                        ? 'bottom-20 right-4 w-12 h-12 rounded-full ring-2 ring-emerald-400 shadow-lg'
                        : 'bottom-12 right-6 w-14 h-14 rounded-full ring-2 ring-emerald-400 shadow-lg'
                      : sambaLayout === 'floating'
                        ? 'top-14 right-4 w-18 h-22 rounded-xl ring-1 ring-white/10 shadow-xl overflow-hidden bg-black/85'
                        : 'bottom-0 right-0 w-28 h-28 rounded-tl-2xl shadow-xl border-l border-t border-white/10 overflow-hidden'
                  }`}>
                    {/* Host camera webcam graphic feed */}
                    <div className="w-full h-full relative group/host select-none">
                      <img 
                        src={SAMBA_HOST_SPEAKERS.find(h => h.id === sambaHost)?.pic || SAMBA_HOST_SPEAKERS[0].pic}
                        alt="Samba host WebRTC feed"
                        className="w-full h-full object-cover rounded-inherit"
                        referrerPolicy="no-referrer"
                      />
                      
                      {/* Connection metadata overlay trigger on hover */}
                      <div className="absolute inset-0 bg-black/75 opacity-0 group-hover/host:opacity-100 transition-opacity flex flex-col justify-between p-1 text-[5.8px] font-mono text-emerald-400">
                        <div className="flex justify-between items-center text-white font-sans font-black tracking-wider leading-none">
                          <span className="flex items-center gap-0.5"><Wifi size={5} /> {sambaLatency}ms</span>
                          <span className="bg-red-600 text-white px-0.5 rounded text-[5px] scale-90">SAMBA</span>
                        </div>
                        <span className="truncate text-white font-sans leading-none">{SAMBA_HOST_SPEAKERS.find(h => h.id === sambaHost)?.name}</span>
                        <div className="flex justify-between leading-none text-slate-400">
                          <span>WebRTC SSL</span>
                          <span>{sambaMicActive ? 'MIC ON' : 'MUTED'}</span>
                        </div>
                      </div>

                      {/* Microphone signal dot */}
                      <div className="absolute bottom-1 right-1 bg-black/80 rounded-full p-0.5 border border-white/10 z-10">
                        <div className={`w-1 h-1 rounded-full ${sambaMicActive ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
                      </div>

                      {/* WebRTC stream indicator banner */}
                      <span className="absolute top-1 left-1.5 bg-emerald-500/10 border border-emerald-400/20 text-emerald-400 text-[4px] px-1 rounded-sm leading-none font-bold uppercase tracking-widest scale-90 origin-top-left">
                        HOST CONECTADO
                      </span>
                    </div>
                  </div>
                )}

                {/* Footer bar with Simulated AI Narrator Avatar Waveform */}
                <div className="h-6 flex items-center justify-between border-t border-white/5 pt-2 relative z-10 shrink-0">
                  <div className="flex items-center gap-2">
                    {/* Animated Microphone Icon / Waveform indicator */}
                    <div className="flex items-end gap-0.5 h-3 items-center">
                      <div className={`w-[1.5px] bg-violet-400 h-2 ${isPlaying ? 'animate-[bounce_0.6s_ease-in-out_infinite]' : ''}`} />
                      <div className={`w-[1.5px] bg-violet-400 h-3 ${isPlaying ? 'animate-[bounce_0.6s_ease-in-out_infinite_0.15s]' : ''}`} style={{ animationDelay: '0.15s' }} />
                      <div className={`w-[1.5px] bg-violet-400 h-1.5 ${isPlaying ? 'animate-[bounce_0.6s_ease-in-out_infinite_0.3s]' : ''}`} style={{ animationDelay: '0.3s' }} />
                    </div>
                    <span className="text-[8px] text-[#a5b4fc] tracking-widest uppercase font-black">AI Voice Narrator</span>
                  </div>

                  <span className="text-[7.5px] text-slate-500 font-serif">
                    {layoutRatio === '9_16' ? 'STORY PLAYS' : 'Vids Presenter V1 • © SOLJURE'}
                  </span>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Simulated Live Action playhead cursor hovering over viewport */}
            {isPlaying && (
              <div className="absolute right-6 top-6 bg-red-600/90 text-[8px] font-black tracking-widest uppercase px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-md shadow-red-600/30">
                <div className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></div>
                <span>Renderizando en Vivo</span>
              </div>
            )}
          </div>

          {/* Quick Script Edit Panel under Viewport */}
          <div className="bg-[#101217] p-4 rounded-xl border border-white/10 text-left">
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-[9px] uppercase font-black tracking-widest text-violet-400 block">
                🎙️ GUION DE VOZ ACADÉMICA SUGERIDO (Texto que leerá el locutor virtual)
              </label>
              <span className="text-[8.5px] text-slate-500">
                Sincronización de audio y texto en tiempo real
              </span>
            </div>
            <textarea
              className="w-full h-14 bg-black/40 border border-white/5 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-violet-500 font-medium leading-relaxed"
              placeholder="Escribe el diálogo de la consultora virtual que acompañará esta escena visual..."
              value={currentSlide.script}
              onChange={(e) => handleUpdateSlideField(activeSlideIndex, 'script', e.target.value)}
            />
          </div>
        </div>

        {/* Right Drawer Panel: Stock Search & Settings */}
        <div className="w-80 border-l border-white/15 bg-[#101217] flex flex-col overflow-hidden shrink-0 text-left">
          
          {/* Tabs header */}
          <div className="flex border-b border-white/10 bg-[#15181e] select-none shrink-0 overflow-x-auto scrollbar-none">
            <button
              onClick={() => setActiveAssetTab("Logos & Identidad")}
              className={`flex-1 min-w-[70px] py-3 text-[8.5px] uppercase font-black tracking-wider border-b-2 transition-all cursor-pointer ${
                activeAssetTab === "Logos & Identidad" ? 'border-violet-500 text-white' : 'border-transparent text-slate-500 hover:text-slate-300'
              }`}
            >
              Recursos
            </button>
            <button
              onClick={() => setActiveAssetTab("Paletas & Audios")}
              className={`flex-1 min-w-[70px] py-3 text-[8.5px] uppercase font-black tracking-wider border-b-2 transition-all cursor-pointer ${
                activeAssetTab === "Paletas & Audios" ? 'border-violet-500 text-white' : 'border-transparent text-slate-500 hover:text-slate-300'
              }`}
            >
              Audios
            </button>
            <button
              onClick={() => setActiveAssetTab("Fondo Sora")}
              className={`flex-1 min-w-[80px] py-3 text-[8.5px] uppercase font-black tracking-wider border-b-2 transition-all cursor-pointer ${
                activeAssetTab === "Fondo Sora" ? 'border-violet-500 text-white' : 'border-transparent text-slate-500 hover:text-slate-300'
              }`}
            >
              Fondo Sora
            </button>
            <button
              onClick={() => setActiveAssetTab("Digital Samba")}
              className={`flex-1 min-w-[85px] py-3 text-[8.5px] uppercase font-black tracking-wider border-b-2 transition-all cursor-pointer ${
                activeAssetTab === "Digital Samba" ? 'border-violet-500 text-white' : 'border-transparent text-slate-500 hover:text-slate-300'
              }`}
            >
              WebRTC Samba
            </button>
          </div>

          {/* Tab content panel */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            
            {activeAssetTab === "Logos & Identidad" && (
              <div className="space-y-5">
                <div className="bg-[#191c25] p-3 rounded-xl border border-white/5">
                  <span className="text-[9px] uppercase font-black tracking-widest text-[#a8b3cf] flex items-center gap-1 mb-1.5">
                    <Sparkles size={11} className="text-violet-400" /> Sincronizar Google Workspace
                  </span>
                  <p className="text-[10px] text-slate-400 leading-relaxed mb-3">
                    Vincula imágenes o tablas desde tu carpeta de Google Drive en tiempo real.
                  </p>
                  <button
                    onClick={() => alert("Sincronizando metadatos con carpetas de Google Drive (SRI/NIIF)... Listo.")}
                    className="w-full py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-[9px] font-black uppercase tracking-widest rounded-lg flex items-center justify-center gap-1.5 shadow-md shadow-violet-600/10 cursor-pointer"
                  >
                    <ExternalLink size={11} /> Conectar con Drive
                  </button>
                </div>

                <div className="w-full h-px bg-white/5"></div>

                {/* Stock category loop */}
                {STOCK_MEDIA_ASSETS.map((cat, idx) => (
                  <div key={idx} className="space-y-2.5">
                    <label className="text-[9px] uppercase font-black tracking-[0.15em] text-slate-500 block">
                      {cat.category}
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {cat.items.map((item, i) => (
                        <div 
                          key={i}
                          onClick={() => handleApplyStockMedia(item.url)}
                          className="group/img relative aspect-video bg-black/60 rounded-lg overflow-hidden border border-white/5 hover:border-violet-500 transition-all cursor-pointer"
                          title={`Aplicar a escena: ${item.name}`}
                        >
                          <img 
                            src={item.url} 
                            alt={item.name} 
                            className="w-full h-full object-cover transition-transform group-hover/img:scale-105"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute inset-0 bg-black/45 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity">
                            <span className="text-[8px] bg-violet-600 px-2 py-0.5 rounded font-black text-white tracking-widest uppercase">
                              APLICAR
                            </span>
                          </div>
                          {/* Slic name */}
                          <span className="absolute bottom-1 right-1 text-[6.5px] bg-black/80 px-1 py-0.2 rounded font-extrabold text-[#94a3b8] tracking-wide">
                            {item.tag}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeAssetTab === "Paletas & Audios" && (
              <div className="space-y-6">
                
                {/* Locutor AI configuration settings */}
                <div className="space-y-3 p-3 bg-[#191c25] rounded-xl border border-white/5">
                  <span className="text-[9px] uppercase font-black text-[#a8b3cf] tracking-widest flex items-center gap-1 mb-1">
                    <Sliders size={11} className="text-violet-400" /> SÍNTESIS DE LOCUCIÓN DIGITAL
                  </span>
                  
                  {/* Parameter volume narration */}
                  <div className="space-y-1 mt-2">
                    <div className="flex justify-between text-[10px]">
                      <span className="text-slate-400">Volumen del Locutor</span>
                      <span className="font-bold text-violet-400">{narrationVolume}%</span>
                    </div>
                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      className="w-full accent-violet-500 bg-neutral-900 border-none h-1 rounded-full cursor-pointer"
                      value={narrationVolume}
                      onChange={(e) => setNarrationVolume(parseInt(e.target.value))}
                    />
                  </div>

                  {/* Parameter speed narration */}
                  <div className="space-y-1 mt-2">
                    <div className="flex justify-between text-[10px]">
                      <span className="text-slate-400">Paso de Velocidad</span>
                      <span className="font-bold text-violet-400">{playSpeed}x</span>
                    </div>
                    <input 
                      type="range" 
                      min="0.8" 
                      max="1.5" 
                      step="0.1" 
                      className="w-full accent-violet-500 bg-neutral-900 border-none h-1 rounded-full cursor-pointer"
                      value={playSpeed}
                      onChange={(e) => setPlaySpeed(parseFloat(e.target.value))}
                    />
                  </div>

                  {/* Pitch narration */}
                  <div className="space-y-1 mt-2">
                    <div className="flex justify-between text-[10px]">
                      <span className="text-slate-400">Entonación Vocal</span>
                      <span className="font-bold text-violet-400">{narrationPitch}</span>
                    </div>
                    <input 
                      type="range" 
                      min="0.5" 
                      max="1.5" 
                      step="0.05" 
                      className="w-full accent-violet-500 bg-neutral-900 border-none h-1 rounded-full cursor-pointer"
                      value={narrationPitch}
                      onChange={(e) => setNarrationPitch(parseFloat(e.target.value))}
                    />
                  </div>
                </div>

                {/* Music ambient settings */}
                <div className="space-y-3 p-3 bg-[#191c25] rounded-xl border border-white/5">
                  <span className="text-[9px] uppercase font-black text-[#a8b3cf] tracking-widest flex items-center gap-1 mb-2">
                    <Music size={11} className="text-violet-400" /> MÚSICA DE FONDO (PRESETS)
                  </span>

                  <div className="space-y-2">
                    {BACKGROUND_MUSIC_TRACKS.map((track) => (
                      <div 
                        key={track.id}
                        onClick={() => setMusicTrack(track.id)}
                        className={`p-2.5 rounded-lg border text-left cursor-pointer transition-all flex items-center gap-2.5 ${
                          musicTrack === track.id
                            ? 'bg-[#1b1732] border-violet-500 text-white'
                            : 'bg-black/30 border-white/5 text-slate-400 hover:text-slate-200 hover:bg-black/50'
                        }`}
                      >
                        <Music size={12} className={musicTrack === track.id ? 'text-violet-400' : 'text-slate-500'} />
                        <div className="flex-1">
                          <p className="text-[10px] font-bold leading-tight">{track.name}</p>
                          <span className="text-[7.5px] uppercase text-slate-500">Pistas de Sintonía • Intensidad: {track.intensity}</span>
                        </div>
                        {musicTrack === track.id && <Check size={10} className="text-violet-400" />}
                      </div>
                    ))}
                  </div>

                  {/* Volume slide ambient music */}
                  {musicTrack !== 'calm' && (
                    <div className="space-y-1 pt-2">
                      <div className="flex justify-between text-[10px]">
                        <span className="text-slate-400">Atenuación Música</span>
                        <span className="font-bold text-violet-400">{musicVolume}%</span>
                      </div>
                      <input 
                        type="range" 
                        min="0" 
                        max="50" 
                        className="w-full accent-violet-500 bg-neutral-900 border-none h-1 rounded-full cursor-pointer"
                        value={musicVolume}
                        onChange={(e) => setMusicMusicVolume(parseInt(e.target.value))}
                      />
                    </div>
                  )}
                </div>

              </div>
            )}

            {/* NEW: Sora Video Asset Selector Panel */}
            {activeAssetTab === "Fondo Sora" && (
              <div className="space-y-5 select-none text-left">
                <div className="bg-[#191c25] p-3.5 rounded-xl border border-white/5 space-y-2">
                  <span className="text-[10px] uppercase font-black tracking-widest text-[#a8b3cf] flex items-center gap-1 mb-1">
                    <Sparkles size={11} className="text-violet-400 animate-pulse" /> SORA MULTIMEDIA DE ESCENAS
                  </span>
                  <p className="text-[10px] text-slate-400 leading-relaxed">
                    Especifica la composición visual o selecciona uno de nuestros presets académicos para acoplar fondos fotorrealistas de video loop.
                  </p>
                  
                  {/* Preset Buttons */}
                  <div className="space-y-1.5 pt-1">
                    <label className="text-[8px] uppercase tracking-wide text-slate-500 font-extrabold block">Presets de Fondo Recomendados:</label>
                    <div className="flex flex-col gap-1">
                      {SORA_VID_PROMPTS.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => setSoraPromptText(item.prompt)}
                          className="w-full text-left p-1.5 rounded bg-black/40 border border-white/5 text-[8px] text-slate-300 hover:text-white hover:border-violet-500/50 transition-all cursor-pointer truncate"
                          title={item.prompt}
                        >
                          🎬 {item.themeName}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Prompt Text Input */}
                  <div className="space-y-1 pt-1.5">
                    <textarea
                      value={soraPromptText}
                      onChange={(e) => setSoraPromptText(e.target.value)}
                      placeholder="Ej: Vista fotorrealista del Distrito Financiero de Quito, atardecer corporativo..."
                      className="w-full h-16 bg-black/50 border border-white/10 rounded-lg p-2 text-[9px] text-slate-200 focus:outline-none focus:ring-1 focus:ring-violet-500 leading-normal resize-none"
                    />
                  </div>

                  {/* Generate Button */}
                  <button
                    onClick={handleGenerateSoraVideo}
                    disabled={isSoraGenerating}
                    className="w-full py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-[9px] font-black uppercase tracking-widest rounded-lg flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-lg shadow-violet-600/15"
                  >
                    <RefreshCw size={11} className={isSoraGenerating ? 'animate-spin' : ''} />
                    {isSoraGenerating ? "Sincronizando..." : "Estructurar y Acoplar Fondo"}
                  </button>
                </div>

                {/* Generator Simulator Logs panel */}
                {(isSoraGenerating || soraProgressBar > 0) && (
                  <div className="bg-black/40 border border-white/5 rounded-xl p-3 space-y-2 font-mono text-[9px] text-left">
                    <div className="flex justify-between items-center text-[7.5px] font-bold text-slate-400">
                      <span>PROCESANDO VIDEO SORA</span>
                      <span className="text-violet-400 font-black">{soraProgressBar}%</span>
                    </div>

                    {/* Progress tracking */}
                    <div className="w-full h-1 bg-black/80 rounded-full overflow-hidden border border-white/5">
                      <motion.div 
                        className="h-full bg-violet-500" 
                        animate={{ width: `${soraProgressBar}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>

                    <div className="space-y-1 max-h-[110px] overflow-y-auto scrollbar-thin text-zinc-400 leading-normal pr-1">
                      {soraProgressLogs.map((log, i) => (
                        <div key={i} className="flex gap-1">
                          <span className="text-violet-500">&gt;</span>
                          <p className="flex-1">{log}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* NEW: Digital Samba WebRTC Videoconferencing Host Control (inspired by claude-code-video-toolkit) */}
            {activeAssetTab === "Digital Samba" && (
              <div className="space-y-5 select-none text-left">
                <div className="bg-[#191c25] p-3.5 rounded-xl border border-white/5 space-y-3">
                  <div className="flex justify-between items-center leading-none">
                    <span className="text-[10px] uppercase font-black tracking-widest text-[#a8b3cf] flex items-center gap-1">
                      <Radio size={11} className="text-emerald-400" /> SAMBA HOST WEBCAM
                    </span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={enableSambaOverlay} 
                        onChange={(e) => setEnableSambaOverlay(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-7 h-4 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-emerald-500"></div>
                    </label>
                  </div>

                  <p className="text-[10px] text-slate-400 leading-relaxed">
                    Muestra un ponente o especialista académico transmitiendo en tiempo real sobre la diapositiva mediante Digital Samba WebRTC SDK.
                  </p>

                  {/* Webcam host selector */}
                  <div className="space-y-1.5 pt-1.5 border-t border-white/5">
                    <label className="text-[8px] uppercase tracking-wider text-slate-500 font-extrabold block">Elegir Ponente de Turno:</label>
                    <div className="flex flex-col gap-1.5">
                      {SAMBA_HOST_SPEAKERS.map((host) => (
                        <div 
                          key={host.id}
                          onClick={() => setSambaHost(host.id)}
                          className={`flex items-center gap-2 p-1.5 rounded-lg border cursor-pointer transition-all ${
                            sambaHost === host.id 
                              ? 'bg-emerald-950/45 border-emerald-500 text-white' 
                              : 'bg-black/35 border-white/5 text-slate-400 hover:text-white'
                          }`}
                        >
                          <img 
                            src={host.pic} 
                            alt={host.name} 
                            className="w-6 h-6 rounded-full object-cover border border-white/10"
                            referrerPolicy="no-referrer"
                          />
                          <div className="text-left leading-tight flex-1 min-w-0">
                            <span className="text-[9px] font-bold block truncate">{host.name}</span>
                            <span className="text-[7px] text-slate-500 block uppercase font-bold truncate">{host.role}</span>
                          </div>
                          {sambaHost === host.id && <Check size={10} className="text-emerald-400 shrink-0" />}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Layout switch for Samba Webcam */}
                  <div className="space-y-1 pt-1.5">
                    <label className="text-[8px] uppercase tracking-wider text-slate-500 font-extrabold block">Disposición de Overlay:</label>
                    <div className="grid grid-cols-3 gap-1">
                      {[
                        { id: 'circular', label: 'Burbuja' },
                        { id: 'floating', label: 'Tarjeta' },
                        { id: 'split', label: 'Completo' }
                      ].map((item) => (
                        <button
                          key={item.id}
                          onClick={() => setSambaLayout(item.id as any)}
                          className={`py-1 text-[8px] font-black uppercase rounded border transition-all cursor-pointer ${
                            sambaLayout === item.id 
                              ? 'bg-emerald-500 text-black border-transparent' 
                              : 'bg-black/40 border-white/5 text-slate-400 hover:text-white'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Active call settings parameters */}
                  <div className="space-y-1.5 pt-2 border-t border-white/5">
                    <div className="flex justify-between items-center text-[8px]">
                      <span className="text-slate-400 font-bold uppercase">Estado Micrófono:</span>
                      <button 
                        onClick={() => setSambaMicActive(!sambaMicActive)}
                        className={`px-1.5 py-0.2 rounded text-[7px] font-black uppercase tracking-wider ${
                          sambaMicActive ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-500'
                        }`}
                      >
                        {sambaMicActive ? 'Activo' : 'Mute'}
                      </button>
                    </div>

                    <div className="flex justify-between items-center text-[8px]">
                      <span className="text-slate-400 font-bold uppercase">Latencia de Red:</span>
                      <span className="text-emerald-400 font-mono font-bold">{sambaLatency}ms</span>
                    </div>

                    <div className="flex justify-between items-center text-[8px]">
                      <span className="text-slate-400 font-bold uppercase">Canal de Streaming:</span>
                      <span className="text-slate-300 font-mono text-[7.5px]">Digital Samba SDK</span>
                    </div>
                  </div>
                </div>

                {/* Subtitle Caption Theme Presets directly matching Story ficks subtitles */}
                <div className="bg-[#191c25] p-3.5 rounded-xl border border-white/5 space-y-2">
                  <span className="text-[10px] uppercase font-black tracking-widest text-[#a8b3cf] flex items-center gap-1.5">
                    <Smartphone size={11} className="text-violet-400" /> REELS AUTOCAPTIONS
                  </span>
                  <p className="text-[10px] text-slate-400 leading-relaxed">
                    Personaliza el estilo visual de los subtítulos automáticos de Story Flicks para el formato vertical [9:16].
                  </p>

                  <div className="space-y-1">
                    {[
                      { id: 'interactive_neon', name: 'Gradiente Neon (TikTok)' },
                      { id: 'solid_caption', name: 'Amarillo Plano (Silicon)' },
                      { id: 'serif_underlined', name: 'Minimal Serif Subrayado' }
                    ].map((style) => (
                      <div
                        key={style.id}
                        onClick={() => setStoryFlicksStyle(style.id)}
                        className={`p-2 rounded-lg border text-left text-[8.5px] cursor-pointer transition-all ${
                          storyFlicksStyle === style.id
                            ? 'bg-violet-950/40 border-violet-500 text-white font-extrabold'
                            : 'bg-black/35 border-white/5 text-slate-450 hover:text-white'
                        }`}
                      >
                        {style.name}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Interactive Bottom Timeline Controls */}
      <footer className="h-28 bg-[#13151c] border-t border-white/10 shrink-0 flex flex-col justify-between p-4 z-10 select-none">
        
        {/* Progress Timeline Tracks */}
        <div className="flex-1 flex gap-2.5 items-center justify-between">
          
          {/* Label of current scene */}
          <div className="w-16 text-left shrink-0">
            <span className="text-[9px] uppercase font-black text-violet-400 block tracking-widest">
              {(activeSlideIndex + 1).toString().padStart(2, '0')} / {slides.length.toString().padStart(2, '0')}
            </span>
            <span className="text-[8px] text-slate-500 uppercase tracking-widest font-bold">
              Escena Activa
            </span>
          </div>

          {/* Interactive Multi-track Visual Nodes Representing timeline blocks */}
          <div className="flex-1 h-12 bg-[#0c0d12]/90 rounded-xl border border-white/5 p-1.5 flex gap-2 relative overflow-hidden">
            {slides.map((slide, i) => {
              const isActive = activeSlideIndex === i;
              
              return (
                <div 
                  key={i}
                  onClick={() => handleSelectSlideIndex(i)}
                  className={`flex-1 rounded-lg h-full transition-all cursor-pointer relative overflow-hidden p-2 flex flex-col justify-between text-left ${
                    isActive 
                      ? 'bg-gradient-to-br from-violet-600 to-indigo-600 shadow-md shadow-violet-600/10' 
                      : 'bg-white/5 hover:bg-white/10'
                  }`}
                >
                  <span className={`text-[7px] font-black uppercase tracking-widest ${isActive ? 'text-white' : 'text-slate-400'}`}>
                    E0{i + 1}
                  </span>
                  <p className={`text-[7.5px] truncate font-extrabold max-w-[100px] leading-tight ${isActive ? 'text-white' : 'text-slate-500'}`}>
                    {slide.title}
                  </p>
                  
                  {/* Selected bar indicator */}
                  {isActive && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-brand-accent animate-pulse" />
                  )}
                </div>
              );
            })}
          </div>

          {/* Total Duration Info */}
          <div className="w-16 text-right shrink-0">
            <span className="text-[10px] font-black text-slate-300 block">
              00:{(slides.length * 10).toString().padStart(2, '0')}s
            </span>
            <span className="text-[8px] text-slate-500 uppercase tracking-widest font-bold">
              Duración Total
            </span>
          </div>
        </div>

        {/* Global Action Playback bar */}
        <div className="h-6 flex justify-between items-center bg-[#0d0e13]/60 px-4 rounded-lg border border-white/5 text-xs py-1">
          <div className="flex gap-4 items-center">
            
            {/* Play controls */}
            <button
              onClick={handleTogglePlay}
              className="p-1 rounded bg-violet-600 text-white hover:bg-violet-500 cursor-pointer flex items-center justify-center transition-all"
            >
              {isPlaying ? <Pause size={10} /> : <Play size={10} className="fill-white" />}
            </button>

            <span className="text-[9px] uppercase tracking-widest text-slate-500 font-extrabold flex items-center gap-1 select-none">
              <span className="w-2 h-2 rounded-full bg-green-500 inline-block animate-pulse"></span> Reproductor Editor
            </span>
          </div>

          <div className="text-[10px] text-slate-400">
            Compilación multimedia optimizada por <strong className="text-violet-400 font-black">Google Vids & SOLJURE</strong>
          </div>
        </div>
      </footer>

      {/* Video compilation overlay modal */}
      <AnimatePresence>
        {isCompiling && (
          <div className="fixed inset-0 z-[295] bg-[#090a0d]/95 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="max-w-2xl w-full bg-[#13151c] border border-violet-500/30 rounded-3xl p-6 md:p-8 text-slate-100 shadow-2xl space-y-6 flex flex-col justify-between max-h-[85vh] relative overflow-hidden"
            >
              {/* background graphic elements */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-violet-600/5 rounded-full blur-3xl pointer-events-none"></div>

              {/* Title Header */}
              <div className="flex items-center gap-3 border-b border-white/10 pb-4 shrink-0 text-left">
                <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 shadow-md">
                  <Play size={12} className="fill-white text-white translate-x-[0.5px]" />
                </div>
                <div className="text-left leading-none">
                  <span className="font-serif font-black tracking-wide text-lg text-white">Compilador de Google <span className="text-violet-400">Vids</span></span>
                  <p className="text-[9px] text-[#a8b3cf] uppercase font-bold tracking-widest mt-1">Generando Video Formato MP4</p>
                </div>
              </div>

              {/* Progress bar visual */}
              <div className="space-y-2.5 text-left shrink-0">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold uppercase tracking-widest text-slate-400">Creando Recursos de la Diapositiva...</span>
                  <span className="font-serif font-black text-violet-400 text-sm">{compilingProgress}%</span>
                </div>
                <div className="w-full h-2.5 bg-black/60 rounded-full border border-white/5 overflow-hidden">
                  <motion.div 
                    className="h-full bg-gradient-to-r from-violet-600 via-indigo-500 to-blue-400 rounded-full"
                    animate={{ width: `${compilingProgress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </div>

              {/* Terminal Logs Panel */}
              <div className="flex-1 bg-black/50 border border-white/5 rounded-xl p-4 font-mono text-[10px] text-zinc-400 leading-relaxed overflow-y-auto space-y-2 text-left scrollbar-thin max-h-[220px]">
                {compilingLog.map((log, i) => (
                  <div key={i} className="flex gap-2">
                    <span className="text-violet-500 shrink-0">&gt;&gt;</span>
                    <p className="flex-1 text-slate-300">{log}</p>
                  </div>
                ))}
              </div>

              {/* Finalized action controls */}
              <div className="flex items-center justify-between border-t border-white/10 pt-5 shrink-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-[#a8b3cf] uppercase font-bold">Estado:</span>
                  <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md tracking-wider ${
                    compilingProgress === 100 ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-500 animate-pulse'
                  }`}>
                    {compilingProgress === 100 ? "Compilado Completo" : "Compilando..."}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => {
                      setIsCompiling(false);
                      setCompiledVideoUrl(null);
                    }}
                    className="px-5 py-2.5 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer"
                  >
                    Cerrar Ventana
                  </button>
                  
                  {compilingProgress === 100 && compiledVideoUrl && (
                    <a 
                      href={compiledVideoUrl}
                      download={`SOLJURE_GoogleVids_${editorial.id}.mp4`}
                      className="px-6 py-2.5 bg-green-600 hover:bg-green-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-green-500/20 cursor-pointer flex items-center gap-1.5"
                    >
                      <Download size={11} /> Descargar Video
                    </a>
                  )}
                </div>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
