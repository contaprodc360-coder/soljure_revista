import { marked } from 'marked';
import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import '@hyperframes/player';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'hyperframes-player': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & {
        src?: string;
        srcdoc?: string;
        autoplay?: boolean | string;
        loop?: boolean | string;
        muted?: boolean | string;
        volume?: number | string;
        poster?: string;
        controls?: boolean | string;
        class?: string;
        id?: string;
        'playback-rate'?: string;
      }, HTMLElement>;
    }
  }
}

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'hyperframes-player': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & {
        src?: string;
        srcdoc?: string;
        autoplay?: boolean | string;
        loop?: boolean | string;
        muted?: boolean | string;
        volume?: number | string;
        poster?: string;
        controls?: boolean | string;
        class?: string;
        id?: string;
        'playback-rate'?: string;
      }, HTMLElement>;
    }
  }
}

import { motion, AnimatePresence, useScroll, useSpring } from 'motion/react';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Header, Footer, PageNumber } from "docx";
import { saveAs } from "file-saver";
import { 
  BookOpen, 
  History,
  Image as ImageIcon,
  PenTool, 
  ChevronRight, 
  Search, 
  Sparkles, 
  Layout,
  Maximize2,
  FileText,
  User,
  Users,
  Calendar,
  Clock,
  RefreshCw,
  Maximize,
  Download,
  Upload,
  Book,
  ChevronLeft,
  ChevronUp,
  ArrowLeft,
  ArrowRight,
  Share,
  Facebook,
  Copy,
  Zap,
  LogIn,
  LogOut,
  ShieldCheck,
  Trash2,
  Volume2,
  VolumeX,
  PlayCircle,
  Play,
  Smartphone,
  Video,
  Globe,
  Menu,
  Share2,
  Rocket,
  Twitter,
  Linkedin,
  Mail,
  Mic,
  X,
  Lock,
  Eye,
  EyeOff,
  Check,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Scale
} from 'lucide-react';
import { ExpertiseArea, Editorial, Ficha } from './types';
import { exportBookToWord, exportBookToPPT, exportBookToPDF, exportBookToHTML } from './utils/bookExporter';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import pptxgen from "pptxgenjs";
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth, loginWithGoogle, logout, loginWithEmailAndPassword, registerWithEmailAndPassword } from './lib/firebase';
import { 
  subscribeToEditorials, 
  saveEditorial, 
  deleteEditorialFromDb, 
  subscribeToFichas, 
  deleteFichaFromDb,
  saveFicha
} from './services/dbService';
import { 
  getTechnicalAssistantAdvice, 
  expandEditorialTopic, 
  generatePracticalCase,
  refineContent, 
  humanizeContent, 
  generateVideoPromoScript, 
  generateStorySlidesContent, 
  generateSpeech,
  generateFullEditorial,
  generateAutoTopicForArea
} from './services/geminiService';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import autoTable from 'jspdf-autotable';
import MetricsDashboard from './components/MetricsDashboard';
import BookCompendium from './components/BookCompendium';
import { GoogleVidsStudio } from './components/GoogleVidsStudio';
import { ServicesShowcase } from './components/ServicesShowcase';
import { CaseStudies } from './components/CaseStudies';
import { ScientificInvestigation } from './components/ScientificInvestigation';
import { getEditorialImage } from './utils/imageHelper';
import ImageCustomizerModal from './components/ImageCustomizerModal';
import { INITIAL_EDITORIALS } from './data/initialEditorials';

function Logo({ light = false }: { light?: boolean }) {
  return (
    <div className="flex items-center gap-3 group cursor-pointer">
      <div className="relative">
        <div className={`w-11 h-11 ${light ? 'bg-white' : 'bg-brand-navy'} flex items-center justify-center rounded-sm transform group-hover:rotate-6 transition-transform duration-500 shadow-xl`}>
          <span className={`font-serif font-black text-2xl ${light ? 'text-brand-navy' : 'text-white'}`}>S</span>
        </div>
        <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-brand-accent flex items-center justify-center rounded-sm shadow-lg transform group-hover:-rotate-12 transition-transform duration-500 border-2 border-white/10">
          <span className="text-white font-serif font-black text-lg">J</span>
        </div>
      </div>
      <div className="flex flex-col">
        <h1 className={`text-2xl font-serif font-bold tracking-tight leading-none ${light ? 'text-white' : 'text-brand-navy'}`}>
          SOLJURE <span className="text-brand-accent">EFICACES</span>
        </h1>
        <span className={`text-[9px] font-bold uppercase tracking-[0.4em] mt-1 ${light ? 'text-white/60' : 'text-brand-slate'}`}>
          SOLUCIONES JURÍDICAS COMPROBADAS
        </span>
      </div>
    </div>
  );
}

export function parseEditorialDateToISO(dateStr: string): string {
  if (!dateStr) return new Date().toISOString().split('T')[0];
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
  
  try {
    const normalized = dateStr.toLowerCase().replace(/de/g, '').replace(/\s+/g, ' ').trim();
    const parts = normalized.split(' ');
    
    let day = 1;
    let month = 4; // May as default (index 4 is May)
    let year = 2026;
    
    if (parts.length >= 3) {
      day = parseInt(parts[0]) || 1;
      const mStr = parts[1];
      year = parseInt(parts[2]) || 2026;
      
      const months: { [key: string]: number } = {
        ene: 0, enero: 0, feb: 1, febrero: 1, mar: 2, marzo: 2,
        abr: 3, abril: 3, may: 4, mayo: 4, jun: 5, junio: 5,
        jul: 6, julio: 6, ago: 7, agosto: 7, sep: 8, septiembre: 8,
        oct: 9, octubre: 9, nov: 10, noviembre: 10, dic: 11, diciembre: 11
      };
      
      for (const [key, val] of Object.entries(months)) {
        if (mStr.startsWith(key)) {
          month = val;
          break;
        }
      }
    }
    
    const d = new Date(year, month, day);
    const yStr = d.getFullYear();
    const mVal = String(d.getMonth() + 1).padStart(2, '0');
    const dVal = String(d.getDate()).padStart(2, '0');
    return `${yStr}-${mVal}-${dVal}`;
  } catch {
    return new Date().toISOString().split('T')[0];
  }
}

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

export default function App() {
  const [userProfileImage, setUserProfileImage] = useState<string | null>(localStorage.getItem('soljure_host_image'));

  const handleProfileImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setUserProfileImage(base64String);
        localStorage.setItem('contapro_host_image', base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const getHostImage = (type: 'masculine' | 'feminine') => {
    if (userProfileImage) return userProfileImage;
    if (user?.photoURL) return user.photoURL;
    return type === 'masculine' 
      ? "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=400" 
      : "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400";
  };

  const [view, setView] = useState<'magazine' | 'editor' | 'report' | 'metrics' | 'book' | 'services' | 'case-study' | 'investigation'>('magazine');
  const [investigationQuery, setInvestigationQuery] = useState('');
  const [investigationArea, setInvestigationArea] = useState('TODOS');
  const [selectedEditorial, setSelectedEditorial] = useState<Editorial | null>(null);
  const [editorials, setEditorials] = useState<Editorial[]>([]);
  const [fichas, setFichas] = useState<Ficha[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchStartDate, setSearchStartDate] = useState('');
  const [searchEndDate, setSearchEndDate] = useState('');
  const [selectedSearchTags, setSelectedSearchTags] = useState<string[]>([]);
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  const [isRegeneratingAll, setIsRegeneratingAll] = useState(false);
  const [showConfirmRegen, setShowConfirmRegen] = useState(false);
  const [regStatus, setRegStatus] = useState<Record<string, {
    status: 'pending' | 'topic' | 'generating' | 'saving' | 'success' | 'error';
    topic?: string;
    errorMessage?: string;
  }>>({});

  const [initialVersionId, setInitialVersionId] = useState<string | null>(null);
  const [activeVersionFichaId, setActiveVersionFichaId] = useState<string | null>(null);

  useEffect(() => {
    if (editorials.length > 0) {
      const params = new URLSearchParams(window.location.search);
      const urlEditorialId = params.get('editorialId');
      const urlVersionId = params.get('versionId');
      if (urlEditorialId) {
        const found = editorials.find(e => e.id === urlEditorialId);
        if (found) {
          setSelectedEditorial(found);
          setView('magazine');
          if (urlVersionId) {
            setInitialVersionId(urlVersionId);
            setActiveVersionFichaId(urlVersionId);
          }
        }
      }
    }
  }, [editorials]);

  // Reset version when editorial changes (unless initializing the deep-linked version)
  useEffect(() => {
    if (selectedEditorial) {
      if (initialVersionId) {
        setActiveVersionFichaId(initialVersionId);
        setInitialVersionId(null); // consume it once
      } else {
        setActiveVersionFichaId(null);
      }
    } else {
      setActiveVersionFichaId(null);
    }
  }, [selectedEditorial]);

  const isAdmin = (
    user?.email === 'soljure@gmail.com' || 
    user?.email === 'admin@soljure.com' || 
    user?.email === 'contaprodc360@gmail.com' || 
    user?.email === 'admin@contaprodc.com'
  );

  useEffect(() => {
    if (!isAdmin) {
      setView('magazine');
    }
  }, [isAdmin]);

  const [showPublishModal, setShowPublishModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [globalVoiceType, setGlobalVoiceType] = useState<'masculine' | 'feminine'>('masculine');
  const [selectedArea, setSelectedArea] = useState<string>('TODOS');

  const handleLogoutAction = async () => {
    localStorage.removeItem('soljure_master_user');
    await logout();
    setUser(null);
  };

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currUser) => {
      const storedMasterUser = localStorage.getItem('soljure_master_user');
      if (storedMasterUser) {
        setUser(JSON.parse(storedMasterUser));
      } else {
        setUser(currUser);
      }
      setLoading(false);
    });

    const unsubscribeData = subscribeToEditorials((data) => {
      // Create a merged list where Firestore data takes precedence over INITIAL_EDITORIALS by ID
      const merged = [...data];
      INITIAL_EDITORIALS.forEach(initial => {
        if (!merged.some(m => m.id === initial.id)) {
          merged.push(initial);
        }
      });
      
      // Optional: sort by date (though titles might be enough for now)
      setEditorials(merged.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    });

    const unsubscribeFichas = subscribeToFichas((data) => {
      setFichas(data);
    });

    return () => {
      unsubscribeAuth();
      unsubscribeData();
      unsubscribeFichas();
    };
  }, []);

  const parsedFichas = useMemo(() => {
    const hasFichaIds = new Set(fichas.map(f => f.editorialId));
    
    const syntheticFichas: Ficha[] = [];
    editorials.forEach((ed) => {
      if (!hasFichaIds.has(ed.id)) {
        syntheticFichas.push({
          id: `synth_${ed.id}`,
          editorialId: ed.id,
          title: ed.title || 'Sin Título',
          summary: ed.summary || 'Análisis técnico regulatorio.',
          contentSnapshot: ed.content || '',
          area: ed.area,
          author: ed.author || 'ING. COM. SEGUNDO CUENCA C',
          generationDate: parseEditorialDateToISO(ed.date),
          readTime: ed.readTime || '5 min',
          action: 'Publicación Original',
          authorId: 'system',
          createdAt: { seconds: new Date(parseEditorialDateToISO(ed.date)).getTime() / 1000, nanoseconds: 0 }
        });
      }
    });

    const combined = [...fichas, ...syntheticFichas];
    
    return combined.sort((a, b) => b.generationDate.localeCompare(a.generationDate));
  }, [fichas, editorials]);

  const exportLibrary = () => {
    const data = JSON.stringify(editorials, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `CONTAPRO_LIBRARY_BACKUP_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const importLibrary = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string);
        if (Array.isArray(imported)) {
          if (confirm(`¿Deseas importar ${imported.length} artículos?`)) {
            if (isAdmin && confirm('¿Deseas subir estos artículos a la base de datos en línea también?')) {
               for (const item of imported) {
                 await saveEditorial(item);
               }
            } else {
              setEditorials([...imported, ...editorials]);
            }
          }
        }
      } catch (err) {
        alert("Error al procesar el archivo. Asegúrate de que sea un JSON válido de CONTAPRO.");
      }
    };
    reader.readAsText(file);
  };

  const [isExportingConsolidated, setIsExportingConsolidated] = useState(false);

  const exportConsolidatedWord = async (customEditorials?: Editorial[]) => {
    setIsExportingConsolidated(true);
    try {
      await exportBookToWord(customEditorials || editorials);
    } catch (err) {
      console.error("Word Export Error:", err);
      alert("Error al exportar a Word.");
    } finally {
      setIsExportingConsolidated(false);
    }
  };

  const exportConsolidatedHTML = (customEditorials?: Editorial[]) => {
    try {
      exportBookToHTML(customEditorials || editorials);
    } catch (err) {
      console.error("HTML Export Error:", err);
      alert("Error al exportar a HTML.");
    }
  };

  const exportConsolidatedPPT = async (customEditorials?: Editorial[]) => {
    setIsExportingConsolidated(true);
    try {
      await exportBookToPPT(customEditorials || editorials);
    } catch (err) {
      console.error("PPT Export Error:", err);
      alert("Error al exportar a PPTX.");
    } finally {
      setIsExportingConsolidated(false);
    }
  };

  const exportConsolidatedPDF = async (customEditorials?: Editorial[]) => {
    setIsExportingConsolidated(true);
    try {
      await exportBookToPDF(customEditorials || editorials);
    } catch (err) {
      console.error("PDF Export Error:", err);
      alert("Error al exportar a PDF.");
    } finally {
      setIsExportingConsolidated(false);
    }
  };

  const filteredEditorials = editorials.filter(ed => {
    const matchesSearch = ed.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      ed.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ed.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ed.area.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesArea = selectedArea === 'TODOS' || ed.area === selectedArea;
    
    // Date Filtering
    const edDateISO = parseEditorialDateToISO(ed.date);
    const matchesStartDate = !searchStartDate || edDateISO >= searchStartDate;
    const matchesEndDate = !searchEndDate || edDateISO <= searchEndDate;
    
    // Tag Filtering
    const matchesTags = selectedSearchTags.every(tag => {
      const tagLower = tag.toLowerCase();
      return ed.title.toLowerCase().includes(tagLower) ||
        ed.summary.toLowerCase().includes(tagLower) ||
        ed.content.toLowerCase().includes(tagLower);
    });
    
    return matchesSearch && matchesArea && matchesStartDate && matchesEndDate && matchesTags;
  });

  const filteredFichas = useMemo(() => {
    return parsedFichas.filter(f => {
      const matchesSearch = f.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
        f.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.contentSnapshot.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.area.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesArea = selectedArea === 'TODOS' || f.area === selectedArea;
      
      // Date Filtering
      const fDateISO = f.generationDate;
      const matchesStartDate = !searchStartDate || fDateISO >= searchStartDate;
      const matchesEndDate = !searchEndDate || fDateISO <= searchEndDate;
      
      // Tag Filtering
      const matchesTags = selectedSearchTags.every(tag => {
        const tagLower = tag.toLowerCase();
        return f.title.toLowerCase().includes(tagLower) ||
          f.summary.toLowerCase().includes(tagLower) ||
          f.contentSnapshot.toLowerCase().includes(tagLower);
      });
      
      return matchesSearch && matchesArea && matchesStartDate && matchesEndDate && matchesTags;
    });
  }, [parsedFichas, selectedArea, searchTerm, searchStartDate, searchEndDate, selectedSearchTags]);

  const handleSaveEditorial = async (newEditorial: Editorial) => {
    try {
      const savedId = await saveEditorial(newEditorial);
      // Ensure we have the ID for new editorials
      const editorialToSync = { ...newEditorial, id: newEditorial.id || savedId };
      
      setSearchTerm('');
      setSelectedEditorial(editorialToSync); // Sync back to magazine view
      setView('magazine');
    } catch (error) {
      console.error("Error saving editorial:", error);
      alert("No se pudo guardar el artículo. Verifica tu conexión.");
    }
  };

  const handleRegenerateAllCategories = async () => {
    if (isRegeneratingAll) return;
    
    const categories = Object.values(ExpertiseArea);
    const initialStatus: Record<string, {
      status: 'pending' | 'topic' | 'generating' | 'saving' | 'success' | 'error';
      topic?: string;
      errorMessage?: string;
    }> = {};
    categories.forEach(cat => {
      initialStatus[cat] = { status: 'pending' };
    });
    
    setRegStatus(initialStatus);
    setIsRegeneratingAll(true);

    const promises = categories.map(async (cat, idx) => {
      // Stagger slightly to make dynamic UI updates elegant and prevent rate limits
      await new Promise(resolve => setTimeout(resolve, idx * 900));

      try {
        setRegStatus(prev => ({
          ...prev,
          [cat]: { status: 'topic' }
        }));
        
        const existingTitles = editorials.filter(e => e.area === cat).map(e => e.title);
        const topic = await generateAutoTopicForArea(cat, existingTitles);
        
        setRegStatus(prev => ({
          ...prev,
          [cat]: { status: 'generating', topic }
        }));
        
        const generated = await generateFullEditorial(topic, cat);
        
        setRegStatus(prev => ({
          ...prev,
          [cat]: { status: 'saving', topic: generated.title }
        }));
        
        const newEditorial: Editorial = {
          id: 'gen_' + Math.random().toString(36).substr(2, 9),
          title: generated.title,
          summary: generated.summary,
          managerSummary: generated.managerSummary || '',
          content: generated.content,
          author: "ING. COM. SEGUNDO CUENCA C, MAGISTER EN AUDITORIA INTEGRAL",
          date: new Date().toLocaleDateString('es-EC', { day: 'numeric', month: 'short', year: 'numeric' }),
          area: cat,
          readTime: `${Math.ceil(generated.content.split(' ').length / 200)} min`
        };

        await saveEditorial(newEditorial);

        setRegStatus(prev => ({
          ...prev,
          [cat]: { status: 'success', topic: generated.title }
        }));
      } catch (err: any) {
        console.error(`Error regenerating category ${cat}:`, err);
        setRegStatus(prev => ({
          ...prev,
          [cat]: { 
            status: 'error', 
            errorMessage: err instanceof Error ? err.message : String(err) 
          }
        }));
      }
    });

    await Promise.all(promises);
  };

  const handleUpdateEditorial = async (updatedEditorial: Editorial) => {
    try {
      await saveEditorial(updatedEditorial);
      setEditorials(prev => prev.map(ed => ed.id === updatedEditorial.id ? updatedEditorial : ed));
      // CRITICAL: Update the selected editorial in parent state too
      if (selectedEditorial?.id === updatedEditorial.id) {
        setSelectedEditorial(updatedEditorial);
      }
    } catch (error) {
      console.error("Error updating editorial:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-bg">
        <div className="flex flex-col items-center gap-4">
          <Logo />
          <div className="w-12 h-1 border-2 border-brand-accent border-t-transparent animate-spin rounded-full"></div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-brand-slate animate-pulse">Cargando Inteligencia...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="glass-nav px-6 md:px-12 py-4 flex justify-between items-center sticky top-0 z-50">
        <div onClick={() => { setView('magazine'); setSelectedEditorial(null); setSearchTerm(''); }} className="z-50 scale-90 md:scale-100 origin-left">
          <Logo />
        </div>
        
        {/* Desktop Navigation */}
        <div className="hidden lg:flex gap-12 items-center">
          <div className="flex gap-10 font-bold text-[10px] uppercase tracking-[0.3em] text-brand-slate">
            <button 
              onClick={() => { setView('magazine'); setSelectedEditorial(null); }}
              className={`hover:text-brand-accent transition-all pb-1 border-b-2 hover:translate-y-[-1px] ${view === 'magazine' ? 'text-brand-navy border-brand-accent' : 'border-transparent'}`}
            >
              Ediciones
            </button>
            <button 
              onClick={() => { 
                setView('investigation'); 
                setSelectedEditorial(null);
                setInvestigationQuery('');
                setInvestigationArea('TODOS');
              }}
              className={`hover:text-brand-accent transition-all pb-1 border-b-2 hover:translate-y-[-1px] ${view === 'investigation' ? 'text-brand-navy border-brand-accent' : 'border-transparent'}`}
            >
              Investigación
            </button>
            {isAdmin && (
              <>
                <button 
                  onClick={() => { setView('metrics'); setSelectedEditorial(null); }}
                  className={`hover:text-brand-accent transition-all pb-1 border-b-2 hover:translate-y-[-1px] ${view === 'metrics' ? 'text-brand-navy border-brand-accent' : 'border-transparent'}`}
                >
                  Métricas
                </button>
                <button 
                  onClick={() => { setView('book'); setSelectedEditorial(null); }}
                  className={`hover:text-brand-accent transition-all pb-1 border-b-2 hover:translate-y-[-1px] ${view === 'book' ? 'text-brand-navy border-brand-accent' : 'border-transparent'}`}
                >
                  Libro Historial
                </button>
              </>
            )}
            <button 
              onClick={() => { setView('services'); setSelectedEditorial(null); }}
              className={`hover:text-brand-accent transition-all pb-1 border-b-2 hover:translate-y-[-1px] ${view === 'services' ? 'text-brand-navy border-brand-accent' : 'border-transparent'}`}
            >
              Servicios
            </button>
            <button 
              onClick={() => { setView('case-study'); setSelectedEditorial(null); }}
              className={`hover:text-brand-accent transition-all pb-1 border-b-2 hover:translate-y-[-1px] ${view === 'case-study' ? 'text-brand-navy border-brand-accent' : 'border-transparent'}`}
            >
              Casos de Estudio
            </button>
            <button 
              onClick={() => {
                setView('services'); 
                setSelectedEditorial(null);
                setTimeout(() => {
                  const el = document.getElementById('solicitud-servicio-form');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }, 100);
              }}
              className={`hover:text-brand-accent transition-all pb-1 border-b-2 hover:translate-y-[-1px] border-transparent`}
            >
              Contacto
            </button>
          </div>

          {isAdmin && <div className="h-6 w-px bg-brand-border mx-2" />}

          <div className="flex items-center gap-6">
              {view === 'magazine' && !selectedEditorial && (
                <div className="flex items-center gap-2">
                  <div className="relative group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-slate group-focus-within:text-brand-accent transition-colors" size={14} />
                    <input 
                      type="text"
                      placeholder="TEMA, TÍTULO, CONTENIDO..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="bg-brand-bg/50 border border-brand-border rounded-full py-2 pl-9 pr-4 text-[10px] font-bold tracking-widest focus:outline-none focus:border-brand-accent focus:bg-white transition-all w-48 focus:w-80"
                    />
                  </div>
                  <button 
                    onClick={() => {
                      if (!searchTerm) alert("Ingresa un término para buscar.");
                    }}
                    className="p-2.5 bg-brand-navy text-white rounded-full hover:bg-brand-accent transition-all shadow-sm"
                    title="Ejecutar Búsqueda"
                  >
                    <Search size={14} />
                  </button>
                </div>
              )}
              
              <div className="flex gap-2">
                {isAdmin && (
                  <>
                    <button 
                      onClick={() => setShowPublishModal(true)}
                      className="btn-secondary flex items-center gap-2 text-brand-corporate border-brand-accent/40 bg-brand-accent/5 hover:bg-brand-accent hover:text-white"
                      title="Compartir y publicar esta aplicación"
                    >
                      <Smartphone size={14} /> Publicar
                    </button>
                    
                    <button 
                      onClick={() => {
                        setSelectedEditorial(null);
                        setView('editor');
                      }}
                      className="btn-primary"
                    >
                      <PenTool size={14} />
                      Nueva Editorial
                    </button>
                  </>
                )}
              </div>

              {user ? (
                <div className="flex items-center gap-4 pl-4 border-l border-brand-border">
                  <div className="flex flex-col items-end gap-0.5">
                    <span className="text-[10px] font-bold text-brand-navy">{user.displayName || user.email?.split('@')[0]}</span>
                    <span className="text-[8px] text-brand-slate font-medium truncate max-w-[150px]" title={user.email || ''}>{user.email}</span>
                    <span className="text-[8px] text-brand-slate font-black uppercase tracking-widest opacity-60">
                      {isAdmin ? 'Administrador' : 'Lector'}
                    </span>
                  </div>
                  <button 
                    onClick={handleLogoutAction}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 font-black text-[9px] uppercase tracking-wider rounded border border-red-200 transition-all cursor-pointer"
                    title="Cerrar sesión para ingresar con otra cuenta"
                  >
                    <LogOut size={11} />
                    <span>Salir</span>
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => setShowLoginModal(true)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-brand-navy hover:bg-brand-accent text-white font-serif font-black text-xs uppercase tracking-[0.25em] rounded-lg transition-all duration-300 ml-4 shadow-md border border-brand-accent/30 hover:scale-[1.03] active:scale-95 cursor-pointer"
                >
                  <LogIn size={14} className="text-brand-accent" />
                  <span>Acceder</span>
                </button>
              )}
            </div>
          </div>

        {/* Mobile Toggle & Direct Access Button */}
        <div className="flex lg:hidden items-center gap-3">
          {user ? (
            <div className="flex items-center gap-2 pl-3 border-l border-brand-border/30">
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-bold text-brand-navy max-w-[100px] truncate">{user.displayName || user.email?.split('@')[0]}</span>
                <span className="text-[7.5px] text-brand-slate uppercase font-black tracking-widest opacity-60">
                  {isAdmin ? 'Admin' : 'Lector'}
                </span>
              </div>
              <button 
                onClick={handleLogoutAction}
                className="flex items-center justify-center p-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg border border-red-200 transition-all cursor-pointer"
                title="Cerrar Sesión"
              >
                <LogOut size={12} />
              </button>
            </div>
          ) : (
            <button 
              onClick={() => setShowLoginModal(true)}
              className="flex items-center gap-1.5 px-4.5 py-2.5 bg-brand-navy hover:bg-brand-accent text-white font-serif font-black text-[10px] uppercase tracking-[0.2em] rounded-lg transition-all duration-300 shadow-md border border-brand-accent/30 cursor-pointer hover:scale-[1.03] active:scale-95"
            >
              <LogIn size={12} className="text-brand-accent" />
              <span>Acceder</span>
            </button>
          )}

          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2.5 text-brand-navy z-50 bg-white shadow-sm border border-brand-border rounded-lg flex items-center justify-center cursor-pointer"
            title="Menu"
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile Menu Drawer */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <>
              {/* Overlay */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsMobileMenuOpen(false)}
                className="fixed inset-0 bg-brand-navy/60 backdrop-blur-sm z-40 lg:hidden"
              />
              {/* Drawer */}
              <motion.div 
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed right-0 top-0 h-full w-[80%] max-w-sm bg-[#0a1120] z-50 shadow-2xl lg:hidden p-8 flex flex-col pt-24 border-l border-white/10"
              >
                <div className="flex flex-col gap-8">
                  <button 
                    onClick={() => { setView('magazine'); setSelectedEditorial(null); setIsMobileMenuOpen(false); }}
                    className={`text-left font-bold text-xs uppercase tracking-[0.3em] transition-colors ${view === 'magazine' ? 'text-brand-accent' : 'text-white/80 hover:text-white'}`}
                  >
                    Ediciones
                  </button>

                  <button 
                    onClick={() => { 
                      setView('investigation'); 
                      setSelectedEditorial(null); 
                      setIsMobileMenuOpen(false);
                      setInvestigationQuery('');
                      setInvestigationArea('TODOS');
                    }}
                    className={`text-left font-bold text-xs uppercase tracking-[0.3em] transition-colors ${view === 'investigation' ? 'text-brand-accent' : 'text-white/80 hover:text-white'}`}
                  >
                    Investigación
                  </button>

                  {isAdmin && (
                    <>
                      <button 
                        onClick={() => { setView('metrics'); setSelectedEditorial(null); setIsMobileMenuOpen(false); }}
                        className={`text-left font-bold text-xs uppercase tracking-[0.3em] transition-colors ${view === 'metrics' ? 'text-brand-accent' : 'text-white/80 hover:text-white'}`}
                      >
                        Métricas
                      </button>

                      <button 
                        onClick={() => { setView('book'); setSelectedEditorial(null); setIsMobileMenuOpen(false); }}
                        className={`text-left font-bold text-xs uppercase tracking-[0.3em] transition-colors ${view === 'book' ? 'text-brand-accent' : 'text-white/80 hover:text-white'}`}
                      >
                        Libro Historial
                      </button>
                    </>
                  )}

                  <button 
                    onClick={() => { setView('services'); setSelectedEditorial(null); setIsMobileMenuOpen(false); }}
                    className={`text-left font-bold text-xs uppercase tracking-[0.3em] transition-colors ${view === 'services' ? 'text-brand-accent' : 'text-white/80 hover:text-white'}`}
                  >
                    Servicios
                  </button>

                  <button 
                    onClick={() => { setView('case-study'); setSelectedEditorial(null); setIsMobileMenuOpen(false); }}
                    className={`text-left font-bold text-xs uppercase tracking-[0.3em] transition-colors ${view === 'case-study' ? 'text-brand-accent' : 'text-white/80 hover:text-white'}`}
                  >
                    Casos de Estudio
                  </button>

                  <button 
                    onClick={() => { 
                      setView('services'); 
                      setSelectedEditorial(null);
                      setIsMobileMenuOpen(false); 
                      setTimeout(() => {
                        const el = document.getElementById('solicitud-servicio-form');
                        if (el) el.scrollIntoView({ behavior: 'smooth' });
                      }, 200);
                    }}
                    className="text-left font-bold text-xs uppercase tracking-[0.3em] text-white/80 hover:text-brand-accent transition-colors"
                  >
                    Contacto
                  </button>

                  {isAdmin && (
                    <>
                      <div className="h-px bg-white/10 w-full" />

                      <button 
                        onClick={() => { setShowPublishModal(true); setIsMobileMenuOpen(false); }}
                        className="flex items-center gap-3 text-white/90 hover:text-brand-accent font-bold text-sm uppercase tracking-[0.2em] transition-colors"
                      >
                        <Smartphone size={18} className="text-brand-accent" /> Publicar en Web
                      </button>

                      <button 
                        onClick={() => { setSelectedEditorial(null); setView('editor'); setIsMobileMenuOpen(false); }}
                        className="flex items-center gap-3 text-white/90 hover:text-brand-accent font-bold text-sm uppercase tracking-[0.2em] transition-colors"
                      >
                        <PenTool size={18} className="text-brand-accent" /> Nueva Editorial
                      </button>
                    </>
                  )}

                  <div className="h-px bg-white/10 w-full" />

                  {user ? (
                    <div className="space-y-6">
                      <div className="flex items-center gap-4">
                         <div className="w-10 h-10 bg-white/5 rounded-sm flex items-center justify-center border border-white/10">
                            <User size={20} className="text-brand-accent" />
                         </div>
                         <div className="flex flex-col">
                            <span className="text-xs font-bold text-white">{user.displayName || user.email?.split('@')[0]}</span>
                            <span className="text-[10px] text-white/60 font-medium truncate max-w-[180px]">{user.email}</span>
                            <span className="text-[9px] text-brand-accent uppercase font-black tracking-widest mt-0.5">{isAdmin ? 'Administrador' : 'Lector'}</span>
                         </div>
                      </div>
                      <button 
                        onClick={() => { handleLogoutAction(); setIsMobileMenuOpen(false); }}
                        className="flex items-center gap-3 px-4 py-2.5 bg-red-950/40 border border-red-500/20 rounded-lg text-red-300 hover:bg-red-900/30 font-bold text-xs uppercase tracking-[0.2em] w-full justify-center transition-colors cursor-pointer"
                      >
                        <LogOut size={16} className="text-red-400" /> Cerrar Sesión (Salir)
                      </button>
                    </div>
                  ) : (
                    <button 
                      onClick={() => { setShowLoginModal(true); setIsMobileMenuOpen(false); }}
                      className="flex items-center justify-center gap-3 w-full py-3 bg-brand-accent hover:bg-white text-brand-navy font-serif font-black text-xs uppercase tracking-[0.25em] rounded-lg transition-all duration-300 shadow-md border border-brand-accent/30 cursor-pointer animate-pulse"
                    >
                      <LogIn size={16} className="text-brand-navy" />
                      <span>Acceder</span>
                    </button>
                  )}
                  
                  {/* Mobile Search Bar */}
                  <div className="mt-4">
                    <div className="relative group">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={16} />
                      <input 
                        type="text"
                        placeholder="BUSCAR..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-sm py-3 pl-10 pr-4 text-[10px] font-bold tracking-widest focus:outline-none focus:border-brand-accent transition-all text-white placeholder:text-white/30"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-auto">
                  <Logo />
                  <p className="mt-4 text-[9px] text-white/40 uppercase tracking-widest leading-loose">
                    Biblioteca de Inteligencia Normativa<br />
                    SOLJURE ECUADOR © 2026
                  </p>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </nav>

      <main className="max-w-7xl mx-auto px-8 py-16">
        <AnimatePresence mode="wait">
          {view === 'magazine' ? (
            <motion.div 
              key="magazine"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {selectedEditorial ? (
                <EditorialViewer 
                  editorial={selectedEditorial} 
                  onBack={() => setSelectedEditorial(null)} 
                  isAdmin={isAdmin}
                  onEdit={() => setView('editor')}
                  onUpdate={handleUpdateEditorial}
                  onDelete={async () => {
                    if (selectedEditorial?.id) {
                      await deleteEditorialFromDb(selectedEditorial.id);
                      setSelectedEditorial(null);
                    }
                  }}
                  onNext={() => {
                    const idx = editorials.findIndex(e => e.id === selectedEditorial.id);
                    if (idx !== -1 && idx < editorials.length - 1) {
                      setSelectedEditorial(editorials[idx + 1]);
                      window.scrollTo(0, 0);
                    }
                  }}
                  onPrev={() => {
                    const idx = editorials.findIndex(e => e.id === selectedEditorial.id);
                    if (idx > 0) {
                      setSelectedEditorial(editorials[idx - 1]);
                      window.scrollTo(0, 0);
                    }
                  }}
                  hasPrev={editorials.findIndex(e => e.id === selectedEditorial.id) > 0}
                  hasNext={editorials.findIndex(e => e.id === selectedEditorial.id) < editorials.length - 1}
                  getHostImage={getHostImage}
                  handleProfileImageUpload={handleProfileImageUpload}
                  fichas={parsedFichas}
                  activeVersionFichaId={activeVersionFichaId}
                  setActiveVersionFichaId={setActiveVersionFichaId}
                  setShowPublishModal={setShowPublishModal}
                  onInvestigate={(query, area) => {
                    setInvestigationQuery(query);
                    setInvestigationArea(area);
                    setView('investigation');
                    setSelectedEditorial(null); // Switch to investigation tab and exit single-article view
                    window.scrollTo(0, 0);
                  }}
                />
              ) : (
                <MagazineView 
                  editorials={filteredEditorials} 
                  allEditorials={editorials}
                  fichas={filteredFichas}
                  allFichas={parsedFichas}
                  searchTerm={searchTerm}
                  searchStartDate={searchStartDate}
                  onSearchStartDateChange={setSearchStartDate}
                  searchEndDate={searchEndDate}
                  onSearchEndDateChange={setSearchEndDate}
                  selectedSearchTags={selectedSearchTags}
                  onSelectedSearchTagsChange={setSelectedSearchTags}
                  onSelect={(ed, versionId) => {
                    setSelectedEditorial(ed);
                    if (versionId) {
                      setActiveVersionFichaId(versionId);
                    } else {
                      setActiveVersionFichaId(null);
                    }
                  }} 
                  onExport={exportLibrary}
                  onImport={importLibrary}
                  onExportConsolidatedWord={exportConsolidatedWord}
                  onExportConsolidatedPPT={exportConsolidatedPPT}
                  onExportConsolidatedPDF={exportConsolidatedPDF}
                  onExportConsolidatedHTML={() => setView('report')}
                  getHostImage={getHostImage}
                  handleProfileImageUpload={handleProfileImageUpload}
                  globalVoiceType={globalVoiceType}
                  selectedArea={selectedArea}
                  onAreaChange={setSelectedArea}
                  onActivateGenerator={() => {
                    setSelectedEditorial(null);
                    setView('editor');
                  }}
                  isAdmin={isAdmin}
                  onRegenerateAll={() => setShowConfirmRegen(true)}
                />
              )}
            </motion.div>
          ) : view === 'report' ? (
            <motion.div
              key="report"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <FullReportViewer 
                editorials={editorials} 
                onBack={() => setView('magazine')} 
                onSelect={(ed) => {
                  setSelectedEditorial(ed);
                  setView('magazine');
                }}
              />
            </motion.div>
          ) : view === 'metrics' ? (
            <motion.div 
              key="metrics"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <MetricsDashboard 
                editorials={editorials} 
                onBack={() => setView('magazine')} 
                onFilterWord={(word) => {
                  setSearchTerm(word);
                  setView('magazine');
                }}
              />
            </motion.div>
          ) : view === 'book' ? (
            <motion.div 
              key="book"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <BookCompendium 
                fichas={parsedFichas} 
                editorials={editorials}
                onBack={() => setView('magazine')} 
                isAdmin={isAdmin}
                onDelete={async (fichaId) => {
                  await deleteFichaFromDb(fichaId);
                }}
                onRestore={(ficha) => {
                  const matchedEditorial = editorials.find(e => e.id === ficha.editorialId);
                  const restoredEd: Editorial = matchedEditorial ? {
                    ...matchedEditorial,
                    title: ficha.title,
                    summary: ficha.summary,
                    content: ficha.contentSnapshot,
                    area: ficha.area,
                    author: ficha.author,
                    readTime: ficha.readTime
                  } : {
                    id: ficha.editorialId || Math.random().toString(36).substr(2, 9),
                    title: ficha.title,
                    summary: ficha.summary,
                    managerSummary: '',
                    content: ficha.contentSnapshot,
                    area: ficha.area,
                    author: ficha.author,
                    date: new Date().toLocaleDateString('es-EC', { day: 'numeric', month: 'short', year: 'numeric' }),
                    readTime: ficha.readTime
                  };
                  setSelectedEditorial(restoredEd);
                  setView('editor');
                }}
                onExportWord={exportConsolidatedWord}
                onExportPPT={exportConsolidatedPPT}
                onExportPDF={exportConsolidatedPDF}
                onExportHTML={exportConsolidatedHTML}
                onSaveBook={async (title, content, summary, area, author, readTime) => {
                  try {
                    await saveFicha({
                      editorialId: 'compiled_book_' + Date.now(),
                      title,
                      summary,
                      contentSnapshot: content,
                      area,
                      author,
                      generationDate: new Date().toISOString().split('T')[0],
                      readTime,
                      action: 'Compilación de Libro'
                    });
                    alert('¡Libro unificado guardado en el historial de fichas de manera exitosa!');
                  } catch (err) {
                    console.error("Error al guardar libro:", err);
                    alert('No se pudo guardar el libro en el historial.');
                  }
                }}
              />
            </motion.div>
          ) : view === 'case-study' ? (
            <motion.div 
              key="case-study"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <CaseStudies />
            </motion.div>
          ) : view === 'investigation' ? (
            <motion.div 
              key="investigation"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <ScientificInvestigation 
                initialQuery={investigationQuery}
                initialArea={investigationArea}
                onBack={() => setView('magazine')}
              />
            </motion.div>
          ) : view === 'services' ? (
            <motion.div 
              key="services"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <ServicesShowcase />
            </motion.div>
          ) : (
            <motion.div 
              key="editor"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
            >
              <EditorialStudio 
                key={selectedEditorial?.id || 'new'} 
                onSave={handleSaveEditorial} 
                initialEditorial={selectedEditorial} 
                editorials={editorials}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <AnimatePresence>
        {showConfirmRegen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[290] bg-brand-navy/90 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowConfirmRegen(false)}
          >
            <motion.div 
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-white border-2 border-brand-accent rounded-2xl p-6 md:p-8 max-w-lg w-full text-brand-navy shadow-2xl relative"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-brand-accent/10 text-brand-accent rounded-full border border-brand-accent/30">
                  <Sparkles size={24} className="text-brand-gold animate-pulse" />
                </div>
                <div className="text-left">
                  <h3 className="text-xl font-serif font-black tracking-wide text-brand-navy">GENERAR TODO EN 1 CLIC</h3>
                  <p className="text-[10px] text-brand-slate uppercase font-bold tracking-widest">Confirmación de Acción Inteligente</p>
                </div>
              </div>

              <div className="w-12 h-[2px] bg-brand-accent mb-4"></div>

              <div className="space-y-3.5 text-left mb-6">
                <p className="text-xs text-brand-navy/85 leading-relaxed font-medium text-left">
                  <strong>¿Estás seguro de que deseas volver a compilar e inaugurar nuevos estudios y artículos para las áreas técnicas?</strong>
                </p>
                <div className="bg-brand-bg p-4 rounded-xl border border-brand-border/40 text-brand-navy/85 text-[11px] leading-relaxed space-y-2">
                  <p className="font-bold text-brand-accent flex items-center gap-1">
                    <span>💡</span> ¿Qué pasará a continuación?
                  </p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Nuestro sistema compilará temas normativos ecuatorianos de contingencia académica reales al año 2026.</li>
                    <li>Se estructurarán monografías técnicas exhaustivas de más de 800 palabras para cada especialidad.</li>
                    <li>Se incorporará un caso práctico contable detallado con asientos de diario y cuentas contables representativas.</li>
                    <li>Los artículos publicados serán almacenados de forma directa en el sistema en línea de SOLJURE.</li>
                  </ul>
                </div>
                <p className="text-[10px] text-brand-slate italic text-left">
                  * Este proceso podría demorar alrededor de 30-45 segundos en total debido a la compilación coordinada en paralelo del motor de redacción.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-brand-border/20">
                <button
                  onClick={() => setShowConfirmRegen(false)}
                  className="px-5 py-2.5 bg-brand-bg hover:bg-brand-border/20 text-brand-navy rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  onClick={async () => {
                    setShowConfirmRegen(false);
                    await handleRegenerateAllCategories();
                  }}
                  className="px-6 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-indigo-500/20 flex items-center gap-2 cursor-pointer"
                >
                  <Zap size={12} className="text-brand-accent" />
                  <span>Sí, Generar y Publicar</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
        {isRegeneratingAll && (
          <CategoryRegenerationModal 
            key="category-regeneration-overlay"
            regStatus={regStatus}
            onClose={() => {
              const allDone = Object.values(regStatus).every(item => item.status === 'success' || item.status === 'error');
              if (allDone) {
                setIsRegeneratingAll(false);
              } else {
                alert("Por favor espera a que se complete el proceso para asegurar la persistencia en la base de datos.");
              }
            }}
          />
        )}
        {showPublishModal && (
          <PublishModal 
            key="publish-modal-overlay"
            onClose={() => setShowPublishModal(false)} 
            appUrl={window.location.origin}
          />
        )}
        {showLoginModal && (
          <LoginModal 
            key="login-modal-overlay"
            onClose={() => setShowLoginModal(false)}
            onBypass={(mockUser) => {
              localStorage.setItem('contapro_master_user', JSON.stringify(mockUser));
              setUser(mockUser);
              setShowLoginModal(false);
            }} 
          />
        )}
      </AnimatePresence>

      <footer className="border-t border-brand-border mt-24 py-20 bg-brand-navy text-white text-center">
        <div className="max-w-7xl mx-auto px-8">
          <div className="flex justify-center mb-12">
             <Logo light />
          </div>
          <p className="text-brand-accent text-xs mb-4 tracking-[0.3em] font-bold uppercase">Inteligencia Jurídica • Excelencia Jurídica Eficaz</p>
          <div className="w-12 h-[1px] bg-white/10 mx-auto mb-6"></div>
          <p className="text-white/40 text-[10px] tracking-widest font-light">© 2026 SOLJURE. TODOS LOS DERECHOS RESERVADOS.</p>
        </div>
      </footer>
    </div>
  );
}

function MagazineView({ 
  editorials, 
  allEditorials = [],
  fichas = [],
  allFichas = [],
  searchTerm = '',
  searchStartDate = '',
  onSearchStartDateChange,
  searchEndDate = '',
  onSearchEndDateChange,
  selectedSearchTags = [],
  onSelectedSearchTagsChange,
  onSelect, 
  onExport, 
  onImport,
  onExportConsolidatedWord,
  onExportConsolidatedPPT,
  onExportConsolidatedPDF,
  onExportConsolidatedHTML,
  getHostImage,
  handleProfileImageUpload,
  globalVoiceType,
  selectedArea,
  onAreaChange,
  onActivateGenerator,
  isAdmin = false,
  onRegenerateAll
}: { 
  editorials: Editorial[], 
  allEditorials?: Editorial[],
  fichas?: Ficha[],
  allFichas?: Ficha[],
  searchTerm?: string,
  searchStartDate?: string,
  onSearchStartDateChange?: (d: string) => void,
  searchEndDate?: string,
  onSearchEndDateChange?: (d: string) => void,
  selectedSearchTags?: string[],
  onSelectedSearchTagsChange?: (tags: string[]) => void,
  onSelect: (e: Editorial, versionId?: string) => void,
  onExport: () => void,
  onImport: (e: React.ChangeEvent<HTMLInputElement>) => void,
  onExportConsolidatedWord: () => void,
  onExportConsolidatedPPT: () => void,
  onExportConsolidatedPDF: () => void,
  onExportConsolidatedHTML: () => void,
  getHostImage: (type: 'masculine' | 'feminine') => string,
  handleProfileImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void,
  globalVoiceType: 'masculine' | 'feminine',
  selectedArea: string,
  onAreaChange: (area: string) => void,
  onActivateGenerator: () => void,
  isAdmin?: boolean,
  onRegenerateAll?: () => void
}) {
  const areas = ['TODOS', ...Object.values(ExpertiseArea)];
  const [viewTab, setViewTab] = useState<'main' | 'history'>('main');
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);

  useEffect(() => {
    if (!isAdmin) {
      setViewTab('main');
    }
  }, [isAdmin]);

  const getAreaCount = (area: string) => {
    if (viewTab === 'main') {
      return allEditorials.filter(ed => {
        const matchesSearch = !searchTerm ? true : (
          ed.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
          ed.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
          ed.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
          ed.area.toLowerCase().includes(searchTerm.toLowerCase())
        );
        const matchesArea = area === 'TODOS' || ed.area === area;
        
        // Date / Tag Filtering
        const edDateISO = parseEditorialDateToISO(ed.date);
        const matchesStartDate = !searchStartDate || edDateISO >= searchStartDate;
        const matchesEndDate = !searchEndDate || edDateISO <= searchEndDate;
        const matchesTags = selectedSearchTags.every(tag => {
          const tagLower = tag.toLowerCase();
          return ed.title.toLowerCase().includes(tagLower) ||
            ed.summary.toLowerCase().includes(tagLower) ||
            ed.content.toLowerCase().includes(tagLower);
        });

        return matchesSearch && matchesArea && matchesStartDate && matchesEndDate && matchesTags;
      }).length;
    } else {
      return allFichas.filter(f => {
        const matchesSearch = !searchTerm ? true : (
          f.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
          f.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
          f.contentSnapshot.toLowerCase().includes(searchTerm.toLowerCase()) ||
          f.area.toLowerCase().includes(searchTerm.toLowerCase())
        );
        const matchesArea = area === 'TODOS' || f.area === area;

        // Date / Tag Filtering
        const fDateISO = f.generationDate;
        const matchesStartDate = !searchStartDate || fDateISO >= searchStartDate;
        const matchesEndDate = !searchEndDate || fDateISO <= searchEndDate;
        const matchesTags = selectedSearchTags.every(tag => {
          const tagLower = tag.toLowerCase();
          return f.title.toLowerCase().includes(tagLower) ||
            f.summary.toLowerCase().includes(tagLower) ||
            f.contentSnapshot.toLowerCase().includes(tagLower);
        });

        return matchesSearch && matchesArea && matchesStartDate && matchesEndDate && matchesTags;
      }).length;
    }
  };

  return (
    <div className="space-y-16">
      <header className="mb-20 overflow-hidden rounded-sm relative">
        <div className="absolute inset-0 bg-brand-navy/90 z-10"></div>
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center mix-blend-overlay opacity-30"></div>
        
        <div className="relative z-20 py-16 px-12 text-center">
          <span className="text-brand-accent text-xs font-bold uppercase tracking-[0.5em] mb-6 block drop-shadow-md">Semanario de Inteligencia Jurídica</span>
          <h2 className="text-7xl font-serif font-bold mb-8 leading-tight text-white drop-shadow-lg">
            SOLJURE <span className="text-brand-accent">EFICACES</span>
          </h2>
          <div className="w-24 h-[2px] bg-brand-accent mx-auto mb-8"></div>
          <p className="text-brand-bg/80 text-xl leading-relaxed font-light max-w-3xl mx-auto italic">
            "La precisión jurídica y la estricta vigencia normativa guían la eficacia de nuestra asesoría legal."
          </p>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-brand-accent to-transparent"></div>
      </header>

      {/* Banner de Asistencia y Redacción Editorial Profesional */}
      {isAdmin && (
        <div className="bg-gradient-to-r from-[#0f172a] via-[#121b2d] to-[#1e293b] text-white rounded-2xl p-8 border border-brand-accent/20 shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 mb-12">
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand-accent/5 rounded-full blur-3xl pointer-events-none"></div>
          <div className="relative z-10 space-y-3 max-w-3xl">
            <div className="flex items-center gap-2">
              <div className="bg-brand-accent/10 px-3 py-1 rounded-full border border-brand-accent/30 flex items-center gap-1.5 animate-pulse">
                <Sparkles size={11} className="text-brand-accent" />
                <span className="text-[9px] uppercase font-black tracking-widest text-brand-accent">Soporte Editorial Especializado</span>
              </div>
              <span className="text-[9px] uppercase font-bold tracking-widest text-white/40">Exclusivo Editores & Directores</span>
            </div>
            <h3 className="text-2xl font-serif font-extrabold text-white">Consola de Redacción y Compilación Académica</h3>
            <p className="text-xs text-white/70 leading-relaxed font-light">
              Permite estructurar artículos de alto impacto (más de 800 palabras) sobre normativas NIIF vigentes, reformas del SRI ecuatoriano y auditorías integrales al 2026. Diseñado para redactores, consultores y directores de CONTAPRO DC.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 relative z-10 w-full md:w-auto shrink-0 justify-end">
            {onRegenerateAll && (
              <button
                onClick={onRegenerateAll}
                className="px-6 py-4 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-xl shadow-indigo-500/20 group flex items-center justify-center gap-2 cursor-pointer active:scale-95 duration-200 border border-violet-500/30"
                title="Volver a compilar y sincronizar las publicaciones académicas en un solo clic"
              >
                <Zap size={14} className="group-hover:scale-125 transition-transform text-brand-accent" />
                <span>Compilar Ediciones Académicas</span>
              </button>
            )}

            <button
              onClick={onActivateGenerator}
              className="px-6 py-4 bg-brand-accent text-brand-navy hover:bg-brand-accent/90 font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-xl shadow-brand-accent/20 group flex items-center justify-center gap-2 cursor-pointer active:scale-95 duration-200"
            >
              <Sparkles size={14} className="group-hover:rotate-12 transition-transform text-brand-navy" />
              <span>Consola de Redacción</span>
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform text-brand-navy" />
            </button>
          </div>
        </div>
      )}

      {/* Menu Interactivo de Categorías */}
      <div className="flex flex-wrap justify-center items-center gap-2 mb-12">
        {areas.map((area) => {
          const count = getAreaCount(area);
          return (
            <button
              key={area}
              id={`area-filter-${area.toLowerCase().replace(/\s+/g, '-')}`}
              onClick={() => onAreaChange(area)}
              className={`px-5 py-3 rounded-md text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 border flex items-center gap-2 group
                ${selectedArea === area 
                  ? 'bg-brand-navy text-white border-brand-navy shadow-lg shadow-brand-navy/10 scale-105' 
                  : 'bg-white text-brand-navy border-brand-border hover:border-brand-accent hover:text-brand-accent'}`}
            >
              <span>{area}</span>
              <span className={`px-1.5 py-0.5 rounded-md text-[8px] font-black tracking-normal transition-all duration-300
                ${selectedArea === area
                  ? 'bg-brand-accent text-brand-navy font-black'
                  : 'bg-brand-bg text-brand-navy/50 group-hover:bg-brand-accent group-hover:text-brand-navy'}`}
              >
                {count}
              </span>
            </button>
          );
        })}
        {selectedArea !== 'TODOS' && (
          <button
            id="clear-area-filters-btn"
            onClick={() => onAreaChange('TODOS')}
            className="px-5 py-3 rounded-md text-[10px] font-black uppercase tracking-[0.2em] bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-all duration-300 flex items-center gap-1.5 shadow-sm ml-2 animate-in fade-in slide-in-from-left-2 duration-300"
            title="Limpiar filtros y mostrar todo"
          >
            <X size={12} className="text-red-500" />
            Limpiar Filtros
          </button>
        )}

        <button
          key="adv-search-toggle"
          id="advanced-search-toggle-btn"
          onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
          className={`px-5 py-3 rounded-md text-[10px] font-black uppercase tracking-[0.15em] transition-all duration-350 border flex items-center gap-2 cursor-pointer active:scale-95
            ${showAdvancedSearch 
              ? 'bg-brand-accent text-brand-navy border-brand-accent shadow-md font-black' 
              : 'bg-white text-brand-navy border-brand-border hover:border-brand-accent hover:text-brand-accent'}`}
        >
          <Search size={12} className={showAdvancedSearch ? 'text-brand-navy' : 'text-brand-accent'} />
          <span>Búsqueda Avanzada</span>
          {(searchStartDate || searchEndDate || selectedSearchTags.length > 0) && (
            <span className="w-2 h-2 rounded-full bg-red-500 block shrink-0 animate-pulse" />
          )}
        </button>
      </div>

      {showAdvancedSearch && (
        <div id="advanced-search-filters-panel" className="bg-white border-2 border-brand-accent/40 rounded-xl p-8 shadow-2xl text-left space-y-6 animate-in fade-in slide-in-from-top-4 duration-300 max-w-5xl mx-auto">
          <div className="flex justify-between items-center border-b border-brand-border pb-4">
            <h3 className="text-xs font-serif font-black text-brand-navy uppercase tracking-widest flex items-center gap-2">
              <Search size={14} className="text-brand-accent animate-bounce" />
              Búsqueda Jurídica Avanzada
            </h3>
            <button 
              onClick={() => {
                onSearchStartDateChange?.('');
                onSearchEndDateChange?.('');
                onSelectedSearchTagsChange?.([]);
              }}
              className="text-[9px] font-black tracking-widest uppercase text-red-600 hover:text-red-800 transition-all flex items-center gap-1 bg-red-50 px-3 py-2 rounded-md cursor-pointer border border-red-100"
              title="Restaurar valores de búsqueda iniciales"
            >
              <RotateCcw size={10} />
              Limpiar Criterios
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-brand-navy">
            {/* Rango de Fechas */}
            <div className="space-y-3 bg-[#fafbfc] p-5 rounded-lg border border-brand-border/40">
              <span className="text-[10px] font-black uppercase tracking-widest text-[#121d33] flex items-center gap-1.5">
                <Calendar size={12} className="text-brand-accent" />
                Rango de Fechas de Publicación
              </span>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[9px] font-bold uppercase tracking-wider text-brand-slate block mb-1">Desde:</label>
                  <input 
                    type="date"
                    value={searchStartDate}
                    onChange={(e) => onSearchStartDateChange?.(e.target.value)}
                    className="w-full bg-white border border-brand-border rounded p-2.5 text-xs outline-none focus:border-brand-accent font-bold text-brand-navy font-mono"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-bold uppercase tracking-wider text-brand-slate block mb-1">Hasta:</label>
                  <input 
                    type="date"
                    value={searchEndDate}
                    onChange={(e) => onSearchEndDateChange?.(e.target.value)}
                    className="w-full bg-white border border-brand-border rounded p-2.5 text-xs outline-none focus:border-brand-accent font-bold text-brand-navy font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Tags de Metadatos */}
            <div className="space-y-3 bg-[#fafbfc] p-5 rounded-lg border border-brand-border/40">
              <span className="text-[10px] font-black uppercase tracking-widest text-[#121d33] flex items-center gap-1.5">
                <FileText size={12} className="text-brand-accent" />
                Filtrar por Metadatos (#Hashtags)
              </span>
              <div className="flex flex-wrap gap-2 pt-1 font-mono">
                {['#jurídico', '#constitución', '#procedimiento', '#civil', '#laboral', '#tributario', '#casación', '#penal', '#societario'].map((tag) => {
                  const isSelected = selectedSearchTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => {
                        if (isSelected) {
                          onSelectedSearchTagsChange?.(selectedSearchTags.filter(t => t !== tag));
                        } else {
                          onSelectedSearchTagsChange?.([...selectedSearchTags, tag]);
                        }
                      }}
                      className={`px-3 py-1.5 rounded-full text-[10px] font-extrabold tracking-wider border cursor-pointer transition-all ${
                        isSelected 
                          ? 'bg-brand-accent text-brand-navy border-brand-accent font-black shadow-md scale-105' 
                          : 'bg-white text-brand-navy border-brand-border hover:border-brand-accent'
                      }`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          
          {(searchStartDate || searchEndDate || selectedSearchTags.length > 0) && (
            <div className="bg-brand-accent/5 border border-brand-accent/20 p-3 rounded-lg flex items-center justify-between text-[10px] font-bold text-brand-navy">
              <div className="flex items-center gap-2">
                <Check className="text-brand-accent" size={14} />
                <span>
                  Filtros activos: {searchStartDate && `desde [${searchStartDate}] `} {searchEndDate && `hasta [${searchEndDate}] `} {selectedSearchTags.length > 0 && `etiquetas (${selectedSearchTags.join(', ')})`}
                </span>
              </div>
              <span className="text-brand-navy font-black uppercase tracking-wider text-[8px]">Filtro en Funcionamiento</span>
            </div>
          )}
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6 bg-brand-bg/20 p-6 rounded-lg border border-brand-border/20 backdrop-blur-sm">
        <div className="flex flex-col">
          <h2 className="text-xl font-serif font-black text-brand-navy uppercase tracking-[0.1em]">
            Biblioteca de Ediciones
            <div className="h-0.5 w-full bg-brand-accent mt-1"></div>
          </h2>
          <p className="text-[11px] text-brand-slate uppercase font-bold tracking-widest mt-3 opacity-70">
            {viewTab === 'main' ? `Total: ${editorials.length} artículos principales` : `Total: ${fichas.length} ediciones y versiones`}
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-4">
          {/* Consolidated Actions */}
          <div className="flex bg-[#0f172a] p-1.5 rounded-md shadow-2xl border border-white/5">
            <div className="flex items-center px-4 border-r border-white/10 mr-1">
              <span className="text-[10px] font-black text-brand-accent uppercase tracking-[0.2em] whitespace-nowrap">Informe Completo:</span>
            </div>
            <button 
              onClick={onExportConsolidatedWord}
              title="Exportar Todo a Word"
              className="p-2.5 text-white/50 hover:text-brand-accent hover:bg-white/5 rounded-md transition-all"
            >
              <FileText size={16} />
            </button>
            <button 
              onClick={onExportConsolidatedPDF}
              title="Exportar Todo a PDF"
              className="p-2.5 text-white/50 hover:text-brand-accent hover:bg-white/5 rounded-md transition-all"
            >
               <FileText size={16} />
            </button>
            <button 
              onClick={onExportConsolidatedPPT}
              title="Exportar Todo a PPTX"
              className="p-2.5 text-white/50 hover:text-brand-accent hover:bg-white/5 rounded-md transition-all"
            >
              <Maximize2 size={16} />
            </button>
            <button 
              onClick={onExportConsolidatedHTML}
              title="Ver Página de Informe Interactivo"
              className="p-2.5 text-white/50 hover:text-brand-accent hover:bg-white/5 rounded-md transition-all"
            >
              <Layout size={16} />
            </button>
          </div>

          {isAdmin && (
            <>
              <div className="h-10 w-[1px] bg-brand-border/50 mx-2 hidden lg:block"></div>

              <div className="flex items-center gap-3">
                <label className="cursor-pointer group">
                  <input type="file" accept=".json" onChange={onImport} className="hidden" />
                  <div className="flex items-center gap-2 px-5 py-3 border border-brand-border bg-white text-brand-navy rounded-md hover:bg-brand-navy hover:text-white transition-all text-xs font-black tracking-widest uppercase shadow-sm">
                    <Upload size={14} className="group-hover:-translate-y-1 transition-transform" /> Importar JSON
                  </div>
                </label>
                <button 
                  onClick={onExport}
                  className="flex items-center gap-2 px-5 py-3 border-2 border-brand-navy text-brand-navy bg-transparent rounded-md hover:bg-brand-navy hover:text-white transition-all text-xs font-black tracking-widest uppercase shadow-sm"
                >
                  <Download size={14} /> Backup JSON
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Selector de Pestañas: Ediciones Principales vs Historial Completo */}
      {isAdmin && (
        <div className="flex justify-center border-b border-brand-border/30 pb-3 mb-10">
          <button
            onClick={() => setViewTab('main')}
            className={`px-8 py-3.5 text-xs font-black uppercase tracking-[0.2em] border-b-2 transition-all duration-300 flex items-center gap-2 ${
              viewTab === 'main'
                ? 'border-brand-accent text-brand-navy font-bold'
                : 'border-transparent text-brand-slate/60 hover:text-brand-navy'
            }`}
          >
            📖 Ediciones Principales ({editorials.length})
          </button>
          <button
            onClick={() => setViewTab('history')}
            className={`px-8 py-3.5 text-xs font-black uppercase tracking-[0.2em] border-b-2 transition-all duration-300 flex items-center gap-2 ${
              viewTab === 'history'
                ? 'border-brand-accent text-brand-navy font-bold'
                : 'border-transparent text-brand-slate/60 hover:text-brand-navy'
            }`}
          >
            <History size={14} className="text-brand-accent animate-pulse" />
            Historial y Versiones ({fichas.length})
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {viewTab === 'main' ? (
          editorials.map((ed) => (
            <div 
              key={ed.id} 
              className="flex flex-col bg-white border border-brand-border p-8 rounded-2xl shadow-sm hover:shadow-[0_40px_100px_-20px_rgba(0,0,0,0.08)] transition-all duration-700 group cursor-pointer relative overflow-hidden h-full min-h-[480px]"
              onClick={() => onSelect(ed)}
            >
              {/* Hover bar */}
              <div className="absolute top-0 left-0 w-full h-1 bg-brand-accent scale-x-0 group-hover:scale-x-100 transition-transform duration-700 origin-left"></div>

              <div className="flex justify-between items-center mb-6 relative z-10">
                <div className="px-4 py-1.5 border border-brand-border rounded-lg bg-brand-bg/50 text-brand-navy/60 group-hover:bg-brand-navy group-hover:text-white transition-colors duration-500">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em]">
                    {ed.area}
                  </span>
                </div>
                <span className="text-brand-slate/40 text-[10px] font-bold uppercase tracking-widest">{ed.readTime}</span>
              </div>

              {/* Cover Image */}
              <div className="w-full aspect-[16/10] overflow-hidden rounded-xl mb-6 relative bg-brand-bg select-none border border-brand-border/10">
                <img 
                  src={ed.imageUrl || getEditorialImage(ed.title, ed.area)} 
                  alt={ed.title} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  referrerPolicy="no-referrer"
                />
              </div>

              <div className="flex-1 relative z-10">
                <h3 className="text-2xl font-serif font-black mb-6 text-brand-navy leading-tight group-hover:text-brand-corporate transition-colors decoration-brand-accent/30 underline-offset-4 decoration-2">
                  {ed.title}
                </h3>
                <p className="text-brand-slate text-base leading-normal line-clamp-4 font-light opacity-80">
                  {ed.summary}
                </p>
              </div>

              <div className="mt-12 pt-8 border-t border-brand-border/50 flex items-center justify-between relative z-10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg transition-all duration-700 group-hover:rotate-12 bg-brand-navy text-white group-hover:bg-brand-accent">
                    <User size={22} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase text-brand-slate font-black tracking-[0.3em] opacity-60">Analista</span>
                    <span className="text-sm font-bold text-brand-navy group-hover:text-brand-accent transition-colors">
                      {(ed.author.includes("Rosales") || ed.author.includes("Francisco")) 
                        ? "ING. COM. SEGUNDO CUENCA C, MAGISTER EN AUDITORIA INTEGRAL" 
                        : ed.author}
                    </span>
                  </div>
                </div>
                
                <div className="w-12 h-12 rounded-2xl border border-brand-border flex items-center justify-center transition-all duration-500 hover:scale-110 group-hover:border-brand-accent group-hover:bg-brand-accent/10">
                  <ChevronRight size={24} className="text-brand-border group-hover:text-brand-accent" />
                </div>
              </div>
            </div>
          ))
        ) : (
          fichas.map((ficha) => {
            const parent = allEditorials.find(e => e.id === ficha.editorialId);
            const dateDisplay = ficha.generationDate ? new Date(ficha.generationDate).toLocaleDateString('es-EC', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
            return (
              <div 
                key={ficha.id} 
                className="flex flex-col bg-brand-navy/[0.01] border border-brand-border border-dashed p-8 rounded-2xl shadow-sm hover:shadow-[0_45px_100px_-20px_rgba(0,0,0,0.08)] transition-all duration-700 group cursor-pointer relative overflow-hidden h-full min-h-[480px]"
                onClick={() => {
                  if (parent) {
                    onSelect(parent, ficha.id);
                  } else {
                    onSelect({
                      id: ficha.editorialId,
                      title: ficha.title,
                      summary: ficha.summary,
                      content: ficha.contentSnapshot,
                      author: ficha.author,
                      date: ficha.generationDate,
                      area: ficha.area,
                      readTime: ficha.readTime
                    });
                  }
                }}
              >
                {/* Hover bar */}
                <div className="absolute top-0 left-0 w-full h-1 bg-brand-accent scale-x-0 group-hover:scale-x-100 transition-transform duration-700 origin-left"></div>

                <div className="flex justify-between items-center mb-10 relative z-10">
                  <div className="flex gap-2">
                    <div className="px-3 py-1 border border-brand-border rounded-lg bg-white text-brand-navy/60 group-hover:bg-brand-navy group-hover:text-white transition-colors duration-500">
                      <span className="text-[9px] font-black uppercase tracking-[0.15em]">
                        {ficha.area}
                      </span>
                    </div>
                    <div className="px-3 py-1 border border-brand-accent/30 rounded-lg bg-brand-accent/5 text-brand-accent font-black">
                      <span className="text-[9px] uppercase tracking-[0.15em]">
                        {ficha.action || 'Modificación'}
                      </span>
                    </div>
                  </div>
                  <span className="text-brand-slate/40 text-[10px] font-bold uppercase tracking-widest">{ficha.readTime || '5 min'}</span>
                </div>

                <div className="flex-1 relative z-10">
                  {parent && (
                    <span className="text-[9px] font-extrabold uppercase tracking-widest text-brand-slate/40 block mb-3">
                      Versión de: {parent.title}
                    </span>
                  )}
                  <h3 className="text-xl font-serif font-black mb-6 text-brand-navy leading-tight group-hover:text-brand-accent transition-colors underline-offset-4 decoration-2">
                    {ficha.title}
                  </h3>
                  <p className="text-brand-slate text-sm leading-normal line-clamp-4 font-light opacity-80">
                    {ficha.summary}
                  </p>
                </div>

                <div className="mt-12 pt-8 border-t border-brand-border/50 flex items-center justify-between relative z-10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-md transition-all duration-700 bg-brand-navy/10 text-brand-navy group-hover:bg-brand-accent group-hover:text-white">
                      <Calendar size={18} />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[8px] uppercase text-brand-slate font-black tracking-[0.3em] opacity-65">F. Generación</span>
                      <span className="text-xs font-bold text-brand-navy group-hover:text-brand-accent transition-colors uppercase">
                        {dateDisplay || ficha.generationDate}
                      </span>
                    </div>
                  </div>
                  
                  <div className="w-10 h-10 rounded-xl border border-brand-border flex items-center justify-center transition-all duration-500 hover:scale-110 group-hover:border-brand-accent group-hover:bg-brand-accent/10">
                    <ChevronRight size={20} className="text-brand-border group-hover:text-brand-accent" />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
}

const generateHyperframesHTML = (
  slide: any,
  voiceType: 'masculine' | 'feminine',
  avatarUrl: string,
  isPlaying: boolean,
  accentColor: string = '#b59441'
) => {
  const isCover = slide?.type === 'cover';
  const isCta = slide?.type === 'cta';
  
  const escapedTitle = (slide?.title || slide?.type || '').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  const escapedContent = (slide?.content || slide?.body || '').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  const escapedVoice = (slide?.voice || '').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  const escapedAuthor = (slide?.author || 'SOLJURE').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Hyperframe Content</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&family=Playfair+Display:ital,wght@0,700;1,400&family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet">
  <style>
    body {
      font-family: 'Inter', sans-serif;
      overflow: hidden;
      margin: 0;
      padding: 0;
      width: 1080px;
      height: 1920px;
      background: #09090b;
      color: #fafafa;
    }
    .font-serif {
      font-family: 'Playfair Display', serif;
    }
    .font-mono {
      font-family: 'JetBrains Mono', monospace;
    }
    .ambient-bg {
      position: absolute;
      inset: 0;
      background: radial-gradient(circle at 50% 30%, rgba(15, 23, 42, 0.9) 0%, #09090b 100%);
      z-index: 0;
    }
    .ball {
      position: absolute;
      border-radius: 50%;
      filter: blur(140px);
      mix-blend-mode: screen;
      opacity: 0.15;
      animation: drift 20s infinite ease-in-out;
    }
    @keyframes drift {
      0%, 100% { transform: translateY(0) scale(1); }
      50% { transform: translateY(-300px) scale(1.3); }
    }
    .avatar-ring {
      animation: ripple 3s infinite ease-out;
    }
    @keyframes ripple {
      0% { transform: scale(1); opacity: 0.8; }
      100% { transform: scale(1.4); opacity: 0; }
    }
  </style>
</head>
<body class="relative flex flex-col justify-between items-center p-24 select-none">
  
  <div class="ambient-bg"></div>
  <div class="ball bg-amber-500 w-[600px] h-[600px] top-[-100px] left-[-100px]" style="animation-delay: 0s;"></div>
  <div class="ball bg-blue-600 w-[500px] h-[500px] bottom-[-100px] right-[-100px]" style="animation-delay: -5s;"></div>

  <div class="w-full flex justify-between items-center z-10 border-b border-white/5 pb-8">
    <div class="flex items-center gap-4">
      <div class="w-16 h-16 bg-[#0f172a] rounded-2xl flex items-center justify-center border border-amber-500/20">
        <span class="text-amber-500 text-2xl font-extrabold font-mono">SJ</span>
      </div>
      <div>
        <h4 class="text-xs uppercase font-black tracking-[0.3em] text-white">SOLJURE</h4>
        <p class="text-[10px] uppercase tracking-[0.2em] text-amber-500 font-bold">Virtual Host Presentation</p>
      </div>
    </div>
    <div class="px-6 py-2 bg-white/5 border border-white/10 rounded-full text-xs font-mono text-white/60">
      HyperFrame 0.6
    </div>
  </div>

  <div class="w-full flex-1 flex flex-col items-center justify-center z-10 py-12 gap-16">
    
    <div class="relative flex flex-col items-center">
      <div class="relative w-72 h-72 rounded-[3.5rem] overflow-hidden border-4 border-amber-500/30 shadow-[0_25px_60px_rgba(0,0,0,0.8)] z-10 bg-[#121214]">
        <img src="${avatarUrl}" class="w-full h-full object-cover transition-transform duration-1000 ${isPlaying ? 'scale-105' : 'scale-100'}" alt="AI Presenter" />
      </div>
      
      <div class="absolute inset-0 bg-amber-500/10 rounded-[3.5rem] avatar-ring z-0 border border-amber-500/50" style="animation-delay: 0s; display: ${isPlaying ? 'block' : 'none'}"></div>
      <div class="absolute inset-0 bg-blue-500/10 rounded-[3.5rem] avatar-ring z-0 border border-blue-500/30" style="animation-delay: 1.5s; display: ${isPlaying ? 'block' : 'none'}"></div>

      <div class="absolute bottom-[-20px] bg-black/60 border border-white/10 px-6 py-2.5 rounded-full flex items-center gap-2 backdrop-blur-md text-[11px] font-mono tracking-widest text-[#b59441] uppercase z-20">
        <span class="w-1.5 h-1.5 rounded-full bg-rose-600 animate-ping"></span>
        \${playing ? 'Reproduciendo' : (playing = ${isPlaying}) ? 'Reproduciendo' : 'Listo'}
      </div>
    </div>

    <div class="w-full max-w-4xl text-center flex flex-col items-center gap-6">
      ${isCover ? `
        <h1 class="text-7xl font-serif font-bold text-white leading-tight">${escapedTitle}</h1>
        <div class="w-32 h-1 bg-amber-500 rounded-full my-4"></div>
        <p class="text-amber-500 text-lg uppercase font-black tracking-[0.4em]">Por ${escapedAuthor}</p>
      ` : isCta ? `
        <div class="p-12 bg-white/5 border border-white/10 rounded-[3rem] shadow-2xl relative overflow-hidden flex flex-col items-center gap-8 w-full max-w-sm">
          <svg class="w-12 h-12 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          <h2 class="text-3xl font-serif font-bold text-white leading-relaxed">${escapedContent}</h2>
          <div class="px-10 py-5 bg-amber-500 text-brand-navy rounded-full text-sm uppercase tracking-[0.3em] font-black shadow-lg">
            SOLJURE
          </div>
        </div>
      ` : `
        <span class="text-amber-500 text-sm font-black uppercase tracking-[0.4em] mb-4">${escapedTitle}</span>
        <div class="px-8 py-10 bg-white/5 border border-white/10 rounded-[3rem] shadow-2xl relative overflow-hidden backdrop-blur-md">
          <p class="text-3xl font-serif italic text-white/95 leading-relaxed">
            "${escapedContent}"
          </p>
        </div>
      `}
    </div>

  </div>

  <div class="w-full bg-black/40 border border-white/5 p-8 rounded-[2rem] z-10 backdrop-blur-md">
    <div class="text-xs uppercase font-bold text-white/30 tracking-[0.15em] mb-3 font-mono">Teleprompter Subtitles</div>
    <p id="subtitles" class="text-xl leading-relaxed text-amber-500/90 font-mono tracking-wide">
      ${escapedVoice}
    </p>
  </div>

  <div class="absolute bottom-32 left-0 right-0 flex justify-center items-end h-16 gap-1 px-20 overflow-hidden pointer-events-none opacity-40 z-0">
    <div class="w-1.5 bg-gradient-to-t from-blue-600 via-amber-500 to-amber-300 rounded-t-full transition-all duration-300" style="height: ${isPlaying ? '24px' : '4px'}; animation: ${isPlaying ? 'bounce-bar 1s infinite alternate' : 'none'};"></div>
    <div class="w-1.5 bg-gradient-to-t from-blue-600 via-amber-500 to-amber-300 rounded-t-full transition-all duration-300" style="height: ${isPlaying ? '42px' : '4px'}; animation: ${isPlaying ? 'bounce-bar 1.3s infinite alternate' : 'none'}; animation-delay: -0.2s;"></div>
    <div class="w-1.5 bg-gradient-to-t from-blue-600 via-amber-500 to-amber-300 rounded-t-full transition-all duration-300" style="height: ${isPlaying ? '16px' : '4px'}; animation: ${isPlaying ? 'bounce-bar 0.8s infinite alternate' : 'none'}; animation-delay: -0.4s;"></div>
    <div class="w-1.5 bg-gradient-to-t from-blue-600 via-amber-500 to-amber-300 rounded-t-full transition-all duration-300" style="height: ${isPlaying ? '32px' : '4px'}; animation: ${isPlaying ? 'bounce-bar 1.1s infinite alternate' : 'none'}; animation-delay: -0.1s;"></div>
    <div class="w-1.5 bg-gradient-to-t from-blue-600 via-amber-500 to-amber-300 rounded-t-full transition-all duration-300" style="height: ${isPlaying ? '28px' : '4px'}; animation: ${isPlaying ? 'bounce-bar 0.7s infinite alternate' : 'none'}; animation-delay: -0.3s;"></div>
    <div class="w-1.5 bg-gradient-to-t from-blue-600 via-amber-500 to-amber-300 rounded-t-full transition-all duration-300" style="height: ${isPlaying ? '48px' : '4px'}; animation: ${isPlaying ? 'bounce-bar 1.4s infinite alternate' : 'none'}; animation-delay: -0.5s;"></div>
  </div>

  <style>
    @keyframes bounce-bar {
      0% { transform: scaleY(0.3); }
      100% { transform: scaleY(1.3); }
    }
  </style>

  <script>
    let playing = ${isPlaying};
    
    window.addEventListener('message', (event) => {
      const msg = event.data;
      if (msg.source === 'hf-parent' && msg.type === 'control') {
        if (msg.action === 'play') {
          playing = true;
          setVisualState(true);
        } else if (msg.action === 'pause') {
          playing = false;
          setVisualState(false);
        }
      }
    });

    function setVisualState(isPlay) {
      const ripples = document.querySelectorAll('.avatar-ring');
      ripples.forEach(el => el.style.display = isPlay ? 'block' : 'none');
    }

    window.parent.postMessage({
      source: 'hf-child',
      type: 'ready',
      duration: 8,
      compositionSize: { width: 1080, height: 1920 }
    }, '*');
  </script>
</body>
</html>
  `;
};

const SocialStoryOverlay = ({ 
  editorial, 
  onClose,
  voiceStyle,
  setVoiceStyle,
  onExportPPT,
  onDownloadAudio,
  onDownloadVideo,
  voiceType,
  setVoiceType,
  getHostImage,
  handleProfileImageUpload
}: { 
  editorial: Editorial, 
  onClose: () => void,
  voiceStyle: string,
  setVoiceStyle: (style: string) => void,
  onExportPPT: () => void,
  onDownloadAudio: (slides?: any[]) => void,
  onDownloadVideo: (slides?: any[]) => void,
  voiceType: 'masculine' | 'feminine',
  setVoiceType: (type: 'masculine' | 'feminine') => void,
  getHostImage: (type: 'masculine' | 'feminine') => string,
  handleProfileImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
}) => {
  const [currentSlide, setCurrentSlide] = useState(-1);
  const [isNarrationPlaying, setIsNarrationPlaying] = useState(false);
  const [speechRate, setSpeechRate] = useState(1.0);
  const [speechPitch, setSpeechPitch] = useState(1.0);

  const [playMode, setPlayMode] = useState<'standard' | 'hyperframes'>('hyperframes');
  const [showCodeEditor, setShowCodeEditor] = useState(false);
  const [editedHtml, setEditedHtml] = useState('');

  useEffect(() => {
    setEditedHtml("");
    setShowCodeEditor(false);
  }, [currentSlide]);

  const voiceStyles = [
    'Profesional',
    'Dinámica y Ágil',
    'Educativa/Taller',
    'Profesional, Jovial y Persuasiva'
  ];
  
  // Custom podcast-themed background matching the prompt's vibe
  const podcastBg = "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?q=80&w=1200&auto=format&fit=crop";

  const slides = React.useMemo(() => [
    { 
      type: 'cover', 
      title: editorial.title, 
      author: editorial.author, 
      image: getHostImage(voiceType),
      voice: `Hola, les habla ${editorial.author}. Hoy les presento mi análisis estratégico titulado: ${editorial.title}. Este estudio ha sido preparado para brindarles claridad técnica en el complejo panorama financiero actual.` 
    },
    { 
      type: 'summary', 
      title: 'Visión Estratégica', 
      content: editorial.summary, 
      image: "https://images.unsplash.com/photo-1454165833767-027ffea70288?q=80&w=800&auto=format&fit=crop",
      voice: `En mi visión estratégica, considero fundamental comprender el impacto de las normativas vigentes. En este artículo, exploro conceptos que considero pilares para su gestión: ${editorial.summary}. Estos elementos son herramientas clave para su toma de decisiones.` 
    },
    { 
      type: 'highlight', 
      title: 'Management Insight', 
      content: editorial.managerSummary, 
      image: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=800&auto=format&fit=crop",
      voice: `Como experto, destaco para la alta gerencia este punto crítico: ${editorial.managerSummary}. Identifico aquí una oportunidad valiosa para optimizar sus procesos y fortalecer su estructura financiera frente a los desafíos del mercado ecuatoriano.` 
    },
    { 
      type: 'details', 
      title: 'Análisis Técnico', 
      content: editorial.content.split('\n')[0].substring(0, 150) + "...", 
      image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=800&auto=format&fit=crop",
      voice: `Al profundizar en el detalle técnico, mi análisis considera el marco normativo actual y las mejores prácticas contables y tributarias. Busco asegurar que su empresa opere con absoluta excelencia técnica y transparencia.` 
    },
    { 
      type: 'advice', 
      title: 'Recomendación Pro', 
      content: "Implemente controles internos rigurosos y mantenga su software contable actualizado.", 
      image: "https://images.unsplash.com/photo-1520333781090-e2ad16cab81d?q=80&w=800&auto=format&fit=crop",
      voice: `Mi recomendación personal es directa: implementen sistemas de control interno rigurosos y mantengan su software contable actualizado con las últimas reformas. En mi experiencia, la prevención es siempre la mejor inversión.` 
    },
    { 
      type: 'cta', 
      content: "Le invitamos a visitar ContaPro DC para el análisis completo.", 
      image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=800&auto=format&fit=crop",
      voice: `Les invito cordialmente a visitar mi portal en ContaPro DC para leer este análisis en su totalidad. Accedan ahora a nuestra biblioteca de inteligencia técnica. Sigamos transformando los datos en decisiones inteligentes.` 
    }
  ], [editorial]);

  const playNarration = useCallback((text: string) => {
    window.speechSynthesis.cancel();
    
    // Clean text for better fluency
    const cleanText = text
      .replace(/#{1,6}\s?/g, '')
      .replace(/\*\*|__/g, '')
      .replace(/\*|_/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/- /g, '. ')
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    
    // Select voice with prioritized quality and locale
    const voices = window.speechSynthesis.getVoices();
    
    const sortedVoices = [...voices].sort((a, b) => {
      const aName = a.name.toLowerCase();
      const bName = b.name.toLowerCase();
      const aLang = a.lang.toLowerCase();
      const bLang = b.lang.toLowerCase();

      const getScore = (voice: SpeechSynthesisVoice) => {
        const name = voice.name.toLowerCase();
        const lang = voice.lang.toLowerCase();
        let score = 0;

        // Base score for Spanish
        if (lang.includes('es')) score += 100;
        
        // Priority for Latin American / Neutral Spanish / International
        if (lang.includes('419') || lang.includes('intl') || lang.includes('mx') || lang.includes('us') || lang.includes('co')) {
          score += 60;
        }
        
        // Quality indicators - Neural/Natural are significant upgrades
        if (name.includes('natural')) score += 80;
        if (name.includes('neural')) score += 80;
        if (name.includes('premium')) score += 50;
        if (name.includes('multilingual')) score += 30;
        if (name.includes('google')) score += 20;
        if (name.includes('online')) score += 15;

        // Gender matching
        if (voiceType === 'feminine') {
          if (name.match(/paulina|sabina|monica|daria|helena|laura|marisol|female|mujer/)) score += 40;
        } else {
          if (name.match(/diego|raul|jorge|enrique|pablo|mateo|male|hombre/)) score += 40;
        }

        return score;
      };

      return getScore(b) - getScore(a);
    });

    const selectedVoice = sortedVoices[0] && sortedVoices[0].lang.includes('es') ? sortedVoices[0] : voices.find(v => v.lang.includes('es'));
    
    if (selectedVoice) {
      utterance.voice = selectedVoice;
      const isHighQuality = selectedVoice.name.toLowerCase().match(/natural|neural|google|online|premium/);
      
      // Dynamic adjustments based on voice quality, gender AND voice style
      let baseRate = speechRate * (isHighQuality ? 1.05 : 0.98);
      let basePitch = speechPitch * (voiceType === 'feminine' ? (isHighQuality ? 1.05 : 1.08) : (isHighQuality ? 0.98 : 1.0));

      // Apply style presets
      if (voiceStyle === 'Dinámica y Ágil') {
        baseRate *= 1.15;
        basePitch *= 1.04;
      } else if (voiceStyle === 'Educativa/Taller') {
        baseRate *= 0.90; // Slower and more articulated
        basePitch *= 1.02;
      } else if (voiceStyle === 'Profesional, Jovial y Persuasiva') {
        basePitch *= 1.10;
        baseRate *= 1.04;
      } else if (voiceStyle === 'Profesional') {
        baseRate *= 1.0;
        basePitch *= 1.0; // Standard authority
      }
      
      utterance.rate = Math.min(Math.max(baseRate, 0.5), 1.8);
      utterance.pitch = Math.min(Math.max(basePitch, 0.5), 1.5);
    } else {
      utterance.lang = 'es-419';
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
    }
    
    utterance.volume = 1;    
    utterance.onstart = () => setIsNarrationPlaying(true);
    utterance.onend = () => {
      setIsNarrationPlaying(false);
      // Auto-advance after narration with zero delay for perfectly fluid transitions
      setTimeout(() => {
        setCurrentSlide((prev) => (prev + 1) % slides.length);
      }, 0);
    };
    
    window.speechSynthesis.speak(utterance);
  }, [slides.length, voiceStyle, voiceType, speechRate, speechPitch]);

  useEffect(() => {
    if (currentSlide >= 0) {
      playNarration(slides[currentSlide].voice);
    }
    return () => window.speechSynthesis.cancel();
  }, [currentSlide, playNarration, slides]);

  const slide = currentSlide >= 0 ? slides[currentSlide] : null;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] bg-black flex items-center justify-center p-0 lg:p-0 overflow-hidden"
    >
      {/* Cinematic Studio Background */}
      <div className="absolute inset-0 z-0">
        <motion.div
          key="podcast-bg"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.4 }}
          transition={{ duration: 2 }}
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${podcastBg})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-navy via-brand-navy/60 to-transparent"></div>
        
        {/* Animated Bokeh / Lights */}
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.1, 0.3, 0.1],
            x: [0, 50, 0],
            y: [0, -20, 0]
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-accent/20 rounded-full blur-[100px]"
        />
      </div>

      <button onClick={onClose} className="absolute top-8 right-8 text-white/40 hover:text-white z-[210] p-3 hover:bg-white/10 rounded-full transition-all border border-white/10 backdrop-blur-md">
        <X size={24} />
      </button>

      <div className="social-story-container bg-[#0a0a0b] rounded-[40px] shadow-[0_50px_100px_-20px_rgba(0,0,0,1)] relative overflow-hidden flex flex-col scale-90 md:scale-100 border-[12px] border-[#1a1a1c]">
        {currentSlide === -1 ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex-1 flex flex-col items-center justify-center p-12 text-center relative"
          >
            {/* Visual Header */}
            <div className="absolute top-0 left-0 right-0 h-48 bg-gradient-to-b from-brand-accent/10 to-transparent"></div>
            
            <div className="relative z-10 w-full max-w-sm mb-12">
              <div className="flex justify-center mb-8">
                <div className="relative">
                  <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-brand-accent shadow-2xl relative z-10 bg-brand-navy group/avatar">
                    <label className="cursor-pointer block w-full h-full">
                      <img 
                        src={getHostImage(voiceType)} 
                        alt="Avatar"
                        className="w-full h-full object-cover transition-all duration-500 hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/avatar:opacity-100 flex items-center justify-center transition-opacity z-20">
                        <Upload size={24} className="text-white" />
                      </div>
                      <input type="file" className="hidden" onChange={handleProfileImageUpload} accept="image/*" />
                    </label>
                  </div>
                  <motion.div 
                    animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute inset-0 bg-brand-accent rounded-full blur-2xl z-0"
                  />
                  <div className="absolute -bottom-2 -right-2 bg-brand-accent text-brand-navy p-2 rounded-full shadow-lg z-20">
                    <Mic size={20} />
                  </div>
                </div>
              </div>

              <Logo />
              <h2 className="text-3xl font-serif text-white mt-8 tracking-tight">Podcast Cinemático</h2>
              <p className="text-brand-accent text-[10px] uppercase font-black tracking-[0.4em] mt-3">Experiencia Doctrinal Científica</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4 w-full max-w-sm mb-10 relative z-10">
              <button 
                onClick={() => setVoiceType('masculine')}
                className={`group p-6 rounded-3xl border-2 transition-all flex flex-col items-center gap-4 ${voiceType === 'masculine' ? 'border-brand-accent bg-brand-navy/60 text-white shadow-xl shadow-brand-accent/10' : 'border-white/5 bg-white/5 text-white/40 hover:border-brand-accent/30 hover:text-white'}`}
              >
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${voiceType === 'masculine' ? 'bg-brand-accent text-brand-navy rotate-3' : 'bg-white/10 group-hover:bg-white/20'}`}>
                   <Users size={24} />
                </div>
                <span className="font-bold tracking-widest text-[9px] uppercase">Voz Masculina</span>
              </button>
              
              <button 
                onClick={() => setVoiceType('feminine')}
                className={`group p-6 rounded-3xl border-2 transition-all flex flex-col items-center gap-4 ${voiceType === 'feminine' ? 'border-brand-accent bg-brand-navy/60 text-white shadow-xl shadow-brand-accent/10' : 'border-white/5 bg-white/5 text-white/40 hover:border-brand-accent/30 hover:text-white'}`}
              >
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${voiceType === 'feminine' ? 'bg-brand-accent text-brand-navy -rotate-3' : 'bg-white/10 group-hover:bg-white/20'}`}>
                   <User size={24} />
                </div>
                <span className="font-bold tracking-widest text-[9px] uppercase">Voz Femenina</span>
              </button>
            </div>

            <div className="w-full max-w-sm mb-10 space-y-6 relative z-10">
              <div>
                <div className="flex justify-between items-center mb-3">
                  <label className="text-[9px] uppercase font-black tracking-widest text-white/40">Velocidad Dinámica</label>
                  <span className="text-[10px] font-bold text-brand-accent px-2 py-0.5 bg-brand-accent/10 rounded-md">{speechRate.toFixed(1)}x</span>
                </div>
                <input 
                  type="range" 
                  min="0.5" max="2" step="0.1" 
                  value={speechRate} 
                  onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-brand-accent"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-3">
                  <label className="text-[9px] uppercase font-black tracking-widest text-white/40">Tono de Experto</label>
                  <span className="text-[10px] font-bold text-brand-accent px-2 py-0.5 bg-brand-accent/10 rounded-md">{speechPitch.toFixed(1)}x</span>
                </div>
                <input 
                  type="range" 
                  min="0.5" max="1.5" step="0.1" 
                  value={speechPitch} 
                  onChange={(e) => setSpeechPitch(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-brand-accent"
                />
              </div>
            </div>

            <div className="w-full max-w-sm mb-12 relative z-10">
              <label className="text-[9px] uppercase font-black tracking-widest text-white/40 block mb-4 text-left">Presencia y Estilo</label>
              <div className="grid grid-cols-1 gap-3">
                {voiceStyles.map(style => {
                  const details = {
                    'Profesional': { desc: 'Autoridad institucional y sobria.', icon: <Zap size={14} /> },
                    'Dinámica y Ágil': { desc: 'Energía disruptiva y motivadora.', icon: <Rocket size={14} /> },
                    'Educativa/Taller': { desc: 'Pausado, didáctico y articulado.', icon: <BookOpen size={14} /> },
                    'Profesional, Jovial y Persuasiva': { desc: 'Cordial, elegante y convincente.', icon: <Volume2 size={14} /> }
                  }[style as keyof typeof details] || { desc: '', icon: <Mic size={14} /> };

                  return (
                    <button
                      key={style}
                      onClick={() => setVoiceStyle(style)}
                      className={`px-5 py-4 rounded-2xl border transition-all text-left flex items-start gap-4 ${voiceStyle === style ? 'bg-brand-navy text-brand-accent border-brand-accent/30 shadow-2xl' : 'bg-white/5 text-white/50 border-white/5 hover:border-white/20'}`}
                    >
                      <div className={`mt-0.5 p-2 rounded-xl transition-colors ${voiceStyle === style ? 'bg-brand-accent text-brand-navy' : 'bg-white/10'}`}>
                        {details.icon}
                      </div>
                      <div className="flex-1">
                        <div className="text-[11px] font-black uppercase tracking-wider leading-none mb-1">{style}</div>
                        <div className={`text-[9px] leading-tight opacity-60`}>{details.desc}</div>
                      </div>
                      {voiceStyle === style && (
                        <motion.div 
                          layoutId="active-style"
                          className="w-2 h-2 bg-brand-accent rounded-full mt-2 animate-pulse shrink-0" 
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-col gap-3 w-full max-w-sm relative z-10">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setCurrentSlide(0)}
                className="w-full py-5 bg-brand-accent text-brand-navy rounded-2xl font-black uppercase tracking-[0.3em] shadow-2xl shadow-brand-accent/20 text-xs flex items-center justify-center gap-3"
              >
                <Play size={16} fill="currentColor" /> Producir Experiencia
              </motion.button>
              
              <div className="grid grid-cols-2 gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onDownloadAudio(slides)}
                  className="py-4 border border-white/10 bg-white/5 text-white/70 rounded-xl font-bold uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 hover:bg-white/10"
                >
                  <Download size={14} /> Audio
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onDownloadVideo(slides)}
                  className="py-4 border border-brand-accent/20 bg-brand-accent/5 text-brand-accent rounded-xl font-bold uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 hover:bg-brand-accent/10"
                >
                  <Video size={14} /> Video
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onExportPPT}
                  className="py-4 border border-white/10 bg-white/5 text-white/70 rounded-xl font-bold uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 hover:bg-white/10"
                >
                  <Download size={14} /> PPT
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    const canvas = document.createElement('canvas');
                    canvas.width = 1080;
                    canvas.height = 1920;
                    const ctx = canvas.getContext('2d');
                    if (ctx) {
                      // Simple preview export of the first slide
                      ctx.fillStyle = "#0a0a0b";
                      ctx.fillRect(0,0,1080,1920);
                      ctx.fillStyle = "#b59441";
                      ctx.font = "bold 80px Inter";
                      ctx.textAlign = "center";
                      ctx.fillText(editorial.title.substring(0, 20), 540, 500);
                      const link = document.createElement('a');
                      link.download = 'preview.png';
                      link.href = canvas.toDataURL();
                      link.click();
                    }
                  }}
                  className="py-4 border border-white/10 bg-white/5 text-white/70 rounded-xl font-bold uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 hover:bg-white/10"
                >
                  <Download size={14} /> PNG
                </motion.button>
              </div>
            </div>
          </motion.div>
        ) : (
          <>
            {/* Progress Bars */}
            <div className="absolute top-6 left-6 right-6 flex gap-2 z-20">
              {slides.map((_, idx) => (
                <div key={idx} className="flex-1 h-1.5 bg-black/10 rounded-full overflow-hidden">
                  {idx === currentSlide && (
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: "100%" }}
                      transition={{ duration: 0 }} 
                      className="h-full bg-brand-accent shadow-[0_0_15px_rgba(181,148,65,0.8)]"
                      style={{ width: isNarrationPlaying ? '100%' : '0%' }}
                    />
                  )}
                  {idx < currentSlide && <div className="h-full w-full bg-brand-accent/60" />}
                </div>
              ))}
            </div>

        <AnimatePresence mode="wait">
          {slide && (
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0, scale: 0.9, filter: "blur(10px)" }}
              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, scale: 1.1, filter: "blur(10px)" }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
              className="flex-1 flex flex-col p-10 pt-24 relative gpu-accelerated"
            >
            {/* Play Mode Selector & Editor Trigger HUD */}
            <div className="absolute top-14 left-6 right-6 flex justify-between items-center z-30">
              <div className="flex gap-1.5 p-1 bg-black/40 backdrop-blur-md rounded-full border border-white/10">
                <button 
                  onClick={() => setPlayMode('standard')}
                  className={`px-3 py-1 text-[8px] uppercase font-black tracking-wider rounded-full transition-all ${playMode === 'standard' ? 'bg-amber-500 text-brand-navy shadow-lg font-bold' : 'text-white/60 hover:text-white'}`}
                >
                  Estilo Clásico
                </button>
                <button 
                  onClick={() => setPlayMode('hyperframes')}
                  className={`px-3 py-1 text-[8px] uppercase font-black tracking-wider rounded-full transition-all ${playMode === 'hyperframes' ? 'bg-amber-500 text-brand-navy shadow-lg font-bold' : 'text-white/60 hover:text-white'}`}
                >
                  HyperFrames (Forense)
                </button>
              </div>

              {playMode === 'hyperframes' && (
                <button 
                  onClick={() => {
                    const defaultCode = generateHyperframesHTML(slide, voiceType, getHostImage(voiceType), isNarrationPlaying);
                    setEditedHtml(editedHtml || defaultCode);
                    setShowCodeEditor(!showCodeEditor);
                  }}
                  className="px-2.5 py-1 bg-[#121214] hover:bg-[#1a1a1c] border border-amber-500/20 hover:border-amber-500/40 rounded-full text-[8px] uppercase font-black tracking-wider text-amber-500 flex items-center gap-1 backdrop-blur-md shadow-md"
                >
                  <PenTool size={8} /> {showCodeEditor ? "Cerrar Editor" : "Código HTML"}
                </button>
              )}
            </div>

            {playMode === 'hyperframes' ? (
              <div className="flex-1 w-full h-full relative rounded-3xl overflow-hidden bg-[#09090b] flex flex-col justify-center items-center border border-white/5 shadow-2xl mt-4">
                <hyperframes-player
                  srcdoc={editedHtml || generateHyperframesHTML(slide, voiceType, getHostImage(voiceType), isNarrationPlaying)}
                  autoplay={isNarrationPlaying}
                  controls={true}
                  id="hf-player-main"
                  class="w-full h-full block"
                />

                {/* Subtitle Teleprompter HUD display beneath active running player */}
                {showCodeEditor && (
                  <motion.div 
                    initial={{ opacity: 0, y: 150 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 150 }}
                    className="absolute inset-x-3 bottom-3 top-20 bg-[#0c0c0e]/95 backdrop-blur-2xl rounded-2xl border border-white/10 p-4 z-40 flex flex-col shadow-2xl"
                  >
                    <div className="flex justify-between items-center mb-3">
                      <div>
                        <h4 className="text-white text-[10px] font-black uppercase tracking-wider">Editor HyperFrame HTML</h4>
                        <p className="text-[7px] text-amber-500 uppercase font-bold tracking-widest leading-none mt-0.5">Live Render Playground</p>
                      </div>
                      <button 
                        onClick={() => setShowCodeEditor(false)}
                        className="p-1 bg-white/5 hover:bg-white/10 rounded-full text-white/50 hover:text-white"
                      >
                        <X size={12} />
                      </button>
                    </div>
                    
                    <textarea
                      value={editedHtml}
                      onChange={(e) => setEditedHtml(e.target.value)}
                      className="flex-1 w-full bg-black/60 border border-white/5 rounded-lg p-3 text-[10px] font-mono leading-relaxed text-emerald-400 focus:outline-none focus:ring-1 focus:ring-amber-500/30 resize-none"
                      placeholder="Escribe el código HTML de HyperFrame aquí..."
                    />
                    
                    <div className="mt-2.5 flex justify-between items-center text-[7px] text-white/40">
                      <span>Render: HTML • Output: Live Video Presenter</span>
                      <button
                        onClick={() => {
                          setEditedHtml("");
                          const reGen = generateHyperframesHTML(slide, voiceType, getHostImage(voiceType), isNarrationPlaying);
                          setEditedHtml(reGen);
                        }}
                        className="text-amber-500 font-bold hover:underline uppercase tracking-wide border-0 bg-transparent cursor-pointer"
                      >
                        Restablecer
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>
            ) : (
              <>
                {/* Host Perspective / Floating Voice Visualizer */}
                <motion.div 
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="absolute bottom-10 left-10 flex items-center gap-4 z-20 backdrop-blur-md bg-black/40 p-4 rounded-2xl border border-white/10"
                >
                  <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-brand-accent group/small-host relative">
                    <label className="cursor-pointer block w-full h-full">
                      <img 
                        src={getHostImage(voiceType)} 
                        alt="Host"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/small-host:opacity-100 flex items-center justify-center transition-opacity">
                        <Upload size={10} className="text-white" />
                      </div>
                      <input type="file" className="hidden" onChange={handleProfileImageUpload} accept="image/*" />
                    </label>
                  </div>
                  <div>
                    <p className="text-white font-bold text-[10px] uppercase tracking-wider">{editorial.author}</p>
                    <p className="text-brand-accent text-[8px] font-medium uppercase tracking-widest flex items-center gap-2">
                      En Vivo <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></span>
                    </p>
                  </div>
                </motion.div>

                {/* Contextual Visual Accent */}
                <motion.div 
                  initial={{ x: -100, opacity: 0 }}
                  animate={{ x: 0, opacity: 0.05 }}
                  className="absolute top-0 right-0 pointer-events-none"
                >
                  <Logo light />
                </motion.div>

                {slide.type === 'cover' && (
                  <div className="flex-1 flex flex-col items-center justify-center text-center">
                    <motion.div 
                      initial={{ y: 50, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.2 }}
                      className="w-36 h-36 bg-brand-navy rounded-[2.5rem] mb-12 flex items-center justify-center shadow-[0_25px_50px_rgba(15,23,42,0.4)] border-2 border-brand-accent/30 relative"
                    >
                      <ShieldCheck size={72} className="text-brand-accent" />
                      <motion.div 
                        animate={{ scale: [1, 1.6, 1], opacity: [0, 0.4, 0] }}
                        transition={{ duration: 2.5, repeat: Infinity }}
                        className="absolute inset-0 bg-brand-accent/30 rounded-[2.5rem]"
                      />
                    </motion.div>
                    <div className="space-y-6">
                      <motion.h2 
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="text-5xl font-serif text-brand-navy leading-[1.1] tracking-tight"
                      >
                        {slide.title}
                      </motion.h2>
                      <motion.div 
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{ delay: 0.8, duration: 1 }}
                        className="w-24 h-[5px] bg-brand-accent mx-auto rounded-full"
                      ></motion.div>
                      <motion.p 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1 }}
                        className="text-brand-accent font-black uppercase tracking-[0.4em] text-xs"
                      >
                        Por {(slide as any).author}
                      </motion.p>
                    </div>
                  </div>
                )}

                {slide.type === 'summary' && (
                  <div className="flex-1 flex flex-col justify-center">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: "100%" }}
                      className="h-[2px] bg-brand-accent mb-8"
                    />
                    <motion.span 
                      className="text-brand-accent font-black uppercase tracking-[0.4em] text-xs mb-8 block"
                    >
                      {(slide as any).title}
                    </motion.span>
                    <p className="text-4xl font-serif text-brand-navy leading-[1.3] tracking-tight antialiased">
                      {(slide as any).content}
                    </p>
                  </div>
                )}

                {slide.type === 'details' && (
                  <div className="flex-1 flex flex-col justify-center">
                    <div className="mb-10 flex items-center gap-3">
                       <div className="w-8 h-8 rounded-lg bg-brand-navy flex items-center justify-center">
                          <BookOpen size={16} className="text-brand-accent" />
                       </div>
                       <span className="text-xs font-black uppercase tracking-[0.3em] text-brand-navy">{(slide as any).title}</span>
                    </div>
                    <div className="border-l-4 border-brand-accent pl-8 py-2">
                      <p className="text-3xl font-serif text-brand-navy/90 leading-relaxed italic">
                        {(slide as any).content}
                      </p>
                    </div>
                  </div>
                )}

                {slide.type === 'highlight' && (
                  <div className="flex-1 flex flex-col justify-center">
                    <blockquote className="relative p-10 bg-brand-bg/80 backdrop-blur-md rounded-[3rem] border-2 border-brand-accent/20 shadow-xl overflow-hidden group">
                      <motion.div 
                        animate={{ rotate: 360 }}
                        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                        className="absolute -top-20 -right-20 w-40 h-40 bg-brand-accent/5 rounded-full"
                      />
                      <div className="absolute top-6 left-6 text-8xl text-brand-accent/30 font-serif leading-none">“</div>
                      <p className="text-3xl font-serif italic text-brand-navy relative z-10 leading-relaxed">
                        {(slide as any).content}
                      </p>
                      <div className="mt-10 flex items-center gap-4 relative z-10">
                        <div className="w-12 h-[3px] bg-brand-accent rounded-full"></div>
                        <span className="text-xs font-black uppercase tracking-[0.3em] text-brand-corporate">{(slide as any).title}</span>
                      </div>
                    </blockquote>
                  </div>
                )}

                {slide.type === 'advice' && (
                  <div className="flex-1 flex flex-col justify-center">
                    <motion.div 
                       initial={{ scale: 0.9, opacity: 0 }}
                       animate={{ scale: 1, opacity: 1 }}
                       className="bg-brand-navy p-10 rounded-[2.5rem] shadow-2xl border-2 border-brand-accent"
                    >
                      <motion.span 
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="text-brand-accent font-black uppercase tracking-[0.4em] text-[10px] mb-8 block"
                      >
                        🚀 {(slide as any).title}
                      </motion.span>
                      <p className="text-3xl font-serif text-white leading-tight">
                        {(slide as any).content}
                      </p>
                    </motion.div>
                  </div>
                )}

                {slide.type === 'cta' && (
                  <div className="flex-1 flex flex-col items-center justify-center text-center">
                    <div className="w-56 h-56 mb-16 bg-brand-navy rounded-full flex items-center justify-center relative shadow-2xl">
                       <motion.div 
                         animate={{ scale: [1, 1.25, 1], opacity: [0.4, 0, 0.4] }} 
                         transition={{ duration: 2, repeat: Infinity }}
                         className="absolute -inset-4 rounded-full border-[6px] border-brand-accent" 
                       />
                       <Smartphone size={100} className="text-brand-accent" />
                    </div>
                    <h3 className="text-4xl font-serif text-brand-navy mb-12 px-2 leading-tight">
                      {(slide as any).content}
                    </h3>
                    <motion.div 
                       whileHover={{ scale: 1.05 }}
                       animate={{ y: [0, -10, 0] }}
                       transition={{ duration: 1.5, repeat: Infinity }}
                       className="px-12 py-6 bg-brand-navy text-white font-black rounded-full text-sm tracking-[0.3em] uppercase shadow-[0_20px_40px_rgba(15,23,42,0.4)] border border-brand-accent/40"
                    >
                       CONTAPRO DC
                    </motion.div>
                  </div>
                )}
              </>
            )}
          </motion.div>
          )}
        </AnimatePresence>

        <div className="p-10 pb-14 flex items-center justify-between bg-white border-t border-brand-bg relative z-20">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-brand-navy rounded-2xl flex items-center justify-center shadow-xl transform -rotate-3 border border-brand-accent/20">
              <span className="text-brand-accent text-sm font-black">CP</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-black tracking-[0.3em] text-brand-navy uppercase">ContaPro DC</span>
              <span className="text-[10px] text-brand-accent font-bold uppercase tracking-widest">Intelligence Hub</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
             <button 
               onClick={async () => {
                 const el = document.querySelector('.social-story-container') as HTMLElement;
                 if (el) {
                   const canvas = await html2canvas(el, { scale: 3, useCORS: true });
                   const link = document.createElement('a');
                   link.download = `CONTAPRO_STORY_${currentSlide + 1}.jpg`;
                   link.href = canvas.toDataURL('image/jpeg', 0.9);
                   link.click();
                 }
               }}
               className="p-3 bg-brand-bg text-brand-navy rounded-xl hover:bg-brand-accent hover:text-white transition-all shadow-sm border border-brand-border"
               title="Descargar esta diapositiva (JPG)"
             >
                <Download size={20} />
             </button>
             <button 
               onClick={async () => {
                 const pdf = new jsPDF('p', 'mm', 'a4');
                 const storyContainer = document.querySelector('.social-story-container');
                 if (!storyContainer) return;
                 const canvas = await html2canvas(storyContainer as HTMLElement, { scale: 3, useCORS: true });
                 const imgData = canvas.toDataURL('image/jpeg', 0.95);
                 const imgWidth = 210;
                 const imgHeight = (canvas.height * imgWidth) / canvas.width;
                 pdf.addImage(imgData, 'JPEG', 0, (297 - imgHeight) / 2, imgWidth, imgHeight);
                 pdf.save(`CONTAPRO_STORY_${editorial.title.replace(/\s+/g, '_')}.pdf`);
               }}
               className="p-3 bg-brand-bg text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all shadow-sm border border-red-100"
               title="Descargar Slide como PDF"
             >
                <FileText size={20} />
             </button>
             <motion.div
               animate={{ scale: isNarrationPlaying ? [1, 1.2, 1] : 1 }}
               transition={{ duration: 0.5, repeat: Infinity }}
             >
               <Volume2 size={24} className={isNarrationPlaying ? "text-brand-accent" : "text-brand-slate opacity-30"} />
             </motion.div>
             <PlayCircle size={32} className="text-brand-navy opacity-80" />
          </div>
        </div>
        </>
        )}
      </div>
      
      <div className="fixed bottom-10 left-0 right-0 text-center pointer-events-none z-[220] flex flex-col items-center gap-2">
        <p className="text-white/80 text-[11px] tracking-[0.5em] uppercase font-black animate-pulse bg-brand-navy/60 backdrop-blur-md px-8 py-3 rounded-full inline-block border border-white/20 shadow-2xl">
          GRABA TU PANTALLA PARA COMPARTIR EN REDES
        </p>
        <p className="text-white/40 text-[9px] uppercase tracking-widest font-bold">
          CONSEJO: Usa el grabador nativo de tu iPhone o Android
        </p>
      </div>
    </motion.div>
  );
};

function LoginModal({ onClose, onBypass }: { onClose: () => void; onBypass: (mockUser: any) => void }) {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setErrorMsg("Completa todos los campos obligatorios.");
      return;
    }
    if (isRegister && !name.trim()) {
      setErrorMsg("Por favor, ingresa tu nombre completo.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    try {
      if (!isRegister && password.trim() === 'SOLJURE_MASTER_2026') {
        const mockUser = {
          email: email.trim().toLowerCase() === 'admin@soljure.com' || email.trim().toLowerCase() === 'soljure@gmail.com' || email.trim().toLowerCase() === 'admin@contaprodc.com' || email.trim().toLowerCase() === 'contaprodc360@gmail.com'
            ? email.trim() 
            : 'admin@soljure.com',
          displayName: 'Administrador SOLJURE',
          uid: 'admin-master',
          photoURL: null
        };
        onBypass(mockUser);
        return;
      }

      if (isRegister) {
        await registerWithEmailAndPassword(email.trim(), password, name.trim());
      } else {
        await loginWithEmailAndPassword(email.trim(), password);
      }
      onClose();
    } catch (err: any) {
      setErrorMsg(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      await loginWithGoogle();
      onClose();
    } catch (err: any) {
      setErrorMsg(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[300] bg-brand-navy/90 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div 
        initial={{ scale: 0.95, y: 15 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 15 }}
        className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-brand-border/30 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-brand-navy p-6 md:p-8 text-white relative shrink-0 text-center">
          <button onClick={onClose} className="absolute top-6 right-6 text-white/60 hover:text-white transition-colors cursor-pointer" id="close-login-modal">
            <X size={20} />
          </button>
          <div className="flex flex-col items-center">
            <div className="p-3 bg-brand-accent rounded-full text-brand-navy mb-3 inline-block">
              <ShieldCheck size={28} />
            </div>
            <h3 className="text-lg md:text-xl font-serif font-black uppercase tracking-wider">
              {isRegister ? 'Registro de Usuario' : 'Acceso Autorizado'}
            </h3>
            <p className="text-brand-accent text-[9px] tracking-widest font-black uppercase mt-1">
              {isRegister ? 'Regístrate en SOLJURE' : 'Ingresa tus credenciales o usa Google'}
            </p>
          </div>
        </div>

        <div className="p-6 md:p-8 space-y-5">
          {errorMsg && (
            <div className="p-3 bg-red-50 border-l-4 border-red-500 rounded-sm text-xs text-red-700 leading-relaxed">
              ⚠️ {errorMsg}
            </div>
          )}

          <div className="flex border-b border-brand-border/20 mb-2">
            <button
              type="button"
              onClick={() => { setIsRegister(false); setErrorMsg(null); }}
              className={`flex-1 pb-3 text-xs font-bold uppercase tracking-widest text-center transition-colors cursor-pointer border-b-2 ${!isRegister ? 'border-brand-accent text-brand-navy' : 'border-transparent text-brand-slate/60 hover:text-brand-navy'}`}
            >
              Iniciar Sesión
            </button>
            <button
              type="button"
              onClick={() => { setIsRegister(true); setErrorMsg(null); }}
              className={`flex-1 pb-3 text-xs font-bold uppercase tracking-widest text-center transition-colors cursor-pointer border-b-2 ${isRegister ? 'border-brand-accent text-brand-navy' : 'border-transparent text-brand-slate/60 hover:text-brand-navy'}`}
            >
              Crear Cuenta
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-brand-slate mb-1">Nombre Completo</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-slate" size={16} />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Escribe tu nombre y título"
                    className="w-full bg-brand-bg border border-brand-border rounded-lg pl-10 pr-4 py-2.5 text-xs focus:border-brand-navy outline-none font-medium text-brand-navy placeholder:text-brand-slate/40"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-brand-slate mb-1">Correo Electrónico</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-slate" size={16} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ejemplo@correo.com"
                  className="w-full bg-brand-bg border border-brand-border rounded-lg pl-10 pr-4 py-2.5 text-xs focus:border-brand-navy outline-none font-medium text-brand-navy placeholder:text-brand-slate/40"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-brand-slate mb-1">Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-slate" size={16} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Contraseña"
                  className="w-full bg-brand-bg border border-brand-border rounded-lg pl-10 pr-10 py-2.5 text-xs focus:border-brand-navy outline-none font-medium text-brand-navy placeholder:text-brand-slate/40"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-slate hover:text-brand-navy cursor-pointer"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-brand-navy hover:bg-brand-navy/95 disabled:bg-brand-navy/50 text-white font-serif font-black text-xs uppercase tracking-widest rounded-lg cursor-pointer transition-colors shadow-md flex items-center justify-center gap-2"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
              ) : (
                isRegister ? 'Registrar y Acceder' : 'Ingresar con Correo'
              )}
            </button>
          </form>

          <div className="relative my-4 flex items-center justify-center">
            <div className="border-t border-brand-border/20 w-full absolute"></div>
            <span className="bg-white px-3 text-[9px] uppercase font-bold text-brand-slate tracking-widest relative z-10">O alternativamente</span>
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full py-2.5 bg-brand-bg hover:bg-brand-border/10 border border-brand-border rounded-lg text-brand-navy text-[11px] font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#EA4335"
                d="M5.26620003,9.76451671 C6.19875003,6.93863415 8.85468754,4.90909091 12,4.90909091 C13.6909091,4.90909091 15.2181818,5.50909091 16.4243637,6.50727273 L19.9472727,2.98436364 C17.8254546,1.13454545 15.0545455,0 12,0 C7.33090909,0 3.32727273,2.69454545 1.39636364,6.62727273 L5.26620003,9.76451671 Z"
              />
              <path
                fill="#4285F4"
                d="M23.49,12.2727273 C23.49,11.4163636 23.4136364,10.6145455 23.2718182,9.81818182 L12,9.81818182 L12,14.4545455 L18.4418182,14.4545455 C18.1636364,15.9081818 17.3127273,17.1354545 16.0827273,17.9590909 L19.9309091,20.9427273 C22.1890909,18.8618182 23.49,15.8509091 23.49,12.2727273 Z"
              />
              <path
                fill="#FBBC05"
                d="M5.26620003,9.76451671 C5.01272728,10.5163636 4.87090909,11.3209091 4.87090909,12.1636364 C4.87090909,13.0063636 5.01272728,13.8109091 5.26620003,14.5627273 L1.39636364,17.7 C0.501818182,16.0363636 0,14.1545455 0,12.1636364 C0,10.1727273 0.501818182,8.29090909 1.39636364,6.62727273 L5.26620003,9.76451671 Z"
              />
              <path
                fill="#34A853"
                d="M12,19.3818182 C15.1145455,19.3818182 17.7272727,18.3545455 19.6309091,16.5927273 L15.7827273,13.6090909 C14.7109091,14.3290909 13.3445455,14.7636364 12,14.7636364 C8.85468754,14.7636364 6.19875003,12.7340936 5.26620003,9.90821109 L1.39636364,13.0454545 C3.32727273,16.9781818 7.33090909,19.6636364 12,19.6636364 Z"
              />
            </svg>
            Ingresar con Google
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function CategoryRegenerationModal({
  regStatus,
  onClose,
}: {
  regStatus: Record<string, {
    status: 'pending' | 'topic' | 'generating' | 'saving' | 'success' | 'error';
    topic?: string;
    errorMessage?: string;
  }>,
  onClose: () => void
}) {
  const allDone = Object.values(regStatus).every(item => item.status === 'success' || item.status === 'error');
  const countSuccess = Object.values(regStatus).filter(item => item.status === 'success').length;
  const countTotal = Object.keys(regStatus).length;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[300] bg-brand-navy/95 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
      onClick={() => {
        if (allDone) onClose();
      }}
    >
      <motion.div 
        initial={{ scale: 0.95, y: 15 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 15 }}
        transition={{ type: "spring", damping: 25, stiffness: 350 }}
        className="bg-slate-900 border border-brand-accent/25 rounded-2xl p-6 md:p-8 max-w-2xl w-full text-white shadow-2xl shadow-brand-navy/80 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute top-0 right-0 w-48 h-48 bg-brand-accent/5 rounded-full blur-3xl pointer-events-none"></div>
        
        <header className="flex items-start justify-between mb-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="bg-brand-accent/15 border border-brand-accent/30 text-brand-accent text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full animate-pulse flex items-center gap-1">
                <Sparkles size={10} />
                Estudio Activo
              </span>
              <span className="text-[9px] text-white/50 uppercase font-bold tracking-widest">Procedimiento Crítico</span>
            </div>
            <h3 className="text-xl font-serif font-black tracking-wide text-white">REGENERACIÓN MULTI-CATEGORÍA EN CURSO</h3>
            <p className="text-[11px] text-white/60 font-light leading-relaxed">
              Compilando dinámicamente un tema normativo de Ecuador para cada especialización, redactando un editorial completo académico de más de 800 palabras, diseñando casos prácticos contables con asientos de diario y publicando en la base de datos en línea de CONTAPRO DC.
            </p>
          </div>
          {allDone && (
            <button 
              onClick={onClose}
              className="text-white/40 hover:text-white p-1 hover:bg-white/10 rounded transition-all cursor-pointer font-extrabold"
            >
              <X size={18} />
            </button>
          )}
        </header>

        {/* Progreso General */}
        <div className="mb-6 bg-slate-800/60 p-4 rounded-xl border border-white/5 flex items-center justify-between gap-4">
          <div className="space-y-1 w-full">
            <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-brand-accent">
              <span>Progreso de Publicación de la Revista</span>
              <span>{countSuccess} / {countTotal} Completados</span>
            </div>
            <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-brand-accent h-full rounded-full transition-all duration-500 ease-out"
                style={{ width: `${(countSuccess / countTotal) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Grid de Categorías */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          {Object.entries(regStatus).map(([cat, info]) => {
            const isSuccess = info.status === 'success';
            const isError = info.status === 'error';
            const isPending = info.status === 'pending';

            // Custom UI elements based on state
            let bgStyle = "bg-slate-800/40 border-white/5";
            let statusText = "Esperando turno...";
            let statusBadge = "bg-slate-700 text-slate-400 border-slate-600/30";
            let indicatorColor = "bg-slate-500";

            if (info.status === 'topic') {
              bgStyle = "bg-violet-950/20 border-violet-500/20";
              statusText = "Iniciando compilación en Ecuador 2026...";
              statusBadge = "bg-violet-900/40 text-violet-300 border-violet-500/30 animate-pulse";
              indicatorColor = "bg-violet-400";
            } else if (info.status === 'generating') {
              bgStyle = "bg-amber-950/20 border-amber-500/20";
              statusText = "Escribiendo contenido (+800 palabras) y caso práctico...";
              statusBadge = "bg-amber-950 text-amber-300 border-amber-500/30 animate-pulse";
              indicatorColor = "bg-amber-400";
            } else if (info.status === 'saving') {
              bgStyle = "bg-cyan-950/20 border-cyan-500/20";
              statusText = "Cargando en base de datos...";
              statusBadge = "bg-cyan-905 text-cyan-300 border-cyan-500/30 animate-pulse";
              indicatorColor = "bg-cyan-400";
            } else if (isSuccess) {
              bgStyle = "bg-emerald-950/20 border-emerald-500/30";
              statusText = `${info.topic || "Artículo publicado con éxito"}`;
              statusBadge = "bg-emerald-900/40 text-emerald-300 border-emerald-500/30";
              indicatorColor = "bg-emerald-400";
            } else if (isError) {
              bgStyle = "bg-red-950/20 border-red-500/30";
              statusText = `Error: ${info.errorMessage || "Operación fallida"}`;
              statusBadge = "bg-red-900/40 text-red-300 border-red-500/30";
              indicatorColor = "bg-red-400";
            }

            return (
              <div key={cat} className={`p-4 rounded-xl border flex flex-col justify-between gap-3 transition-all ${bgStyle}`}>
                <div className="flex items-start justify-between gap-2 text-left">
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-black tracking-widest text-white/50">{cat}</span>
                    <h4 className="text-xs font-serif font-bold text-white leading-snug line-clamp-2">
                      {isSuccess ? info.topic : isPending ? "Sin título asignado" : info.topic || "Diseñando tema..."}
                    </h4>
                  </div>
                  <div className={`text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded border shrink-0 ${statusBadge}`}>
                    {info.status === 'pending' && 'En Espera'}
                    {info.status === 'topic' && 'Borrador Doctrinario'}
                    {info.status === 'generating' && 'Redactando'}
                    {info.status === 'saving' && 'Guardando'}
                    {info.status === 'success' && 'Listo'}
                    {info.status === 'error' && 'Error'}
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-white/5 overflow-hidden">
                  <div className={`w-1.5 h-1.5 rounded-full ${indicatorColor} shrink-0 animate-pulse`}></div>
                  <span className="text-[9px] text-white/60 font-mono truncate w-full text-left" title={statusText}>
                    {statusText}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer / Advertencia */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-white/10">
          <p className="text-[9px] text-white/40 uppercase tracking-widest text-center sm:text-left leading-normal">
            * Se utiliza el motor editorial de CONTAPRO DC con cola de reintentos.<br />
            No cierres la pestaña para preveer pérdidas de sincronización.
          </p>
          {allDone ? (
            <button
              onClick={onClose}
              className="w-full sm:w-auto px-6 py-2.5 bg-brand-accent text-brand-navy hover:bg-brand-accent/90 transition-all font-black text-[10px] uppercase tracking-widest rounded-lg cursor-pointer"
            >
              Completado • Volver a Ediciones
            </button>
          ) : (
            <div className="flex items-center gap-2 bg-slate-800 px-4 py-2 rounded-lg border border-white/5">
              <div className="w-3.5 h-3.5 border-2 border-brand-accent border-t-transparent animate-spin rounded-full"></div>
              <span className="text-[9px] text-white/60 font-black uppercase tracking-widest">Generando...</span>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

function PublishModal({ 
  onClose, 
  appUrl,
  editorialId,
  versionId
}: { 
  onClose: () => void, 
  appUrl: string,
  editorialId?: string,
  versionId?: string
}) {
  const isDevelopmentUrl = appUrl.includes('-dev-');
  const basePublicUrl = isDevelopmentUrl ? appUrl.replace('-dev-', '-pre-') : appUrl;
  
  const queryParts = [];
  if (editorialId) queryParts.push(`editorialId=${editorialId}`);
  if (versionId) queryParts.push(`versionId=${versionId}`);
  const queryString = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
  const publicAppUrl = basePublicUrl + queryString;
  
  const iframeCodePublic = `<iframe src="${publicAppUrl}" width="100%" height="900px" frameborder="0" style="border:none; border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);"></iframe>`;
  
  const [activeTab, setActiveTab] = useState<'iframe' | 'url'>('iframe');
  const [copiedIframe, setCopiedIframe] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  const copyIframe = () => {
    navigator.clipboard.writeText(iframeCodePublic);
    setCopiedIframe(true);
    setTimeout(() => setCopiedIframe(false), 2000);
  };

  const copyUrl = () => {
    navigator.clipboard.writeText(publicAppUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[300] bg-brand-navy/90 backdrop-blur-sm flex items-center justify-center p-4 md:p-6"
      onClick={onClose}
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Block */}
        <div className="bg-brand-navy p-6 md:p-8 text-white relative shrink-0">
          <button onClick={onClose} className="absolute top-6 right-6 text-white/60 hover:text-white transition-colors" id="close-publish-modal">
            <X size={24} />
          </button>
          <div className="flex items-center gap-4">
             <div className="p-3 bg-brand-accent rounded-2xl text-brand-navy shrink-0">
                <Smartphone size={32} />
             </div>
             <div>
                <h3 className="text-xl md:text-2xl font-serif font-black uppercase tracking-tight">Publicar en tu Sitio Web</h3>
                <p className="text-brand-accent text-[10px] tracking-widest font-black uppercase mt-1">Solución de integración para Google Sites y dominios propios</p>
             </div>
          </div>
        </div>
        
        {/* Scrollable Content */}
        <div className="p-6 md:p-8 space-y-6 overflow-y-auto">
          
          {/* Critical Explanation of Dev vs Public URLs */}
          {editorialId && (
            <div className="bg-emerald-50 border-l-4 border-emerald-500 p-4 md:p-5 rounded-r-2xl space-y-1">
              <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs uppercase tracking-wider">
                <ShieldCheck size={18} className="text-emerald-600" />
                vínculo personalizado de artículo / versión
              </div>
              <p className="text-xs text-emerald-950 leading-relaxed">
                Este código y enlace están configurados con parámetros específicos (<code>editorialId</code> y <code>versionId</code>) para que tu sitio web muestre exactamente el artículo y versión actualmente cargados.
              </p>
            </div>
          )}

          {isDevelopmentUrl && (
            <div className="bg-amber-50 border-l-4 border-amber-500 p-4 md:p-5 rounded-r-2xl space-y-2">
              <div className="flex items-center gap-2 text-amber-800 font-bold text-xs uppercase tracking-wider">
                <ShieldCheck size={18} className="text-amber-600" />
                ¿Por qué no funcionaba antes en tu sitio?
              </div>
              <p className="text-xs text-amber-900 leading-relaxed">
                Estabas usando el enlace privado de desarrollo (<code className="bg-amber-100 px-1 py-0.5 rounded text-[10px] font-mono select-all">ais-dev-...</code>). Ese enlace está protegido y <strong>requiere que inicies sesión en AI Studio</strong> para verse. Cualquier otra persona que visitaba tu web lo veía en blanco o con error de permisos.
              </p>
              <p className="text-xs text-amber-950 font-bold bg-amber-100/55 p-2 rounded border border-amber-200">
                ✔️ ¡Solucionado! Hemos generado automáticamente el <strong>Enlace Público de Producción</strong> libre de restricciones para tus visitas: <span className="underline break-all font-mono text-[10px] mt-1 block">{publicAppUrl}</span>
              </p>
            </div>
          )}

          {/* Steps */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="bg-brand-bg/40 p-4 rounded-xl border border-brand-border/40">
              <span className="text-[9px] font-black uppercase text-brand-accent tracking-widest block mb-1">Paso 1</span>
              <p className="text-xs text-brand-navy font-bold leading-snug">Abre tu Google Sites o editor web</p>
            </div>
            <div className="bg-brand-bg/40 p-4 rounded-xl border border-brand-border/40">
              <span className="text-[9px] font-black uppercase text-brand-accent tracking-widest block mb-1">Paso 2</span>
              <p className="text-xs text-brand-navy font-bold leading-snug">Elige <strong className="text-brand-accent font-black">Insertar</strong> y copia el código o link</p>
            </div>
            <div className="bg-brand-bg/40 p-4 rounded-xl border border-brand-border/40">
              <span className="text-[9px] font-black uppercase text-brand-accent tracking-widest block mb-1">Paso 3</span>
              <p className="text-xs text-brand-navy font-bold leading-snug">¡Listo! Tu sitio se actualiza solo en vivo</p>
            </div>
          </div>

          {/* Tab Selector */}
          <div className="flex bg-brand-bg/40 border border-brand-border rounded-xl p-1 text-xs">
            <button
              onClick={() => setActiveTab('iframe')}
              className={`flex-1 text-center py-2.5 font-bold uppercase tracking-wider rounded-lg transition-all ${activeTab === 'iframe' ? 'bg-brand-navy text-white shadow-sm' : 'text-brand-slate hover:text-brand-navy'}`}
            >
              Código de Inserción (Recomendado)
            </button>
            <button
              onClick={() => setActiveTab('url')}
              className={`flex-1 text-center py-2.5 font-bold uppercase tracking-wider rounded-lg transition-all ${activeTab === 'url' ? 'bg-brand-navy text-white shadow-sm' : 'text-brand-slate hover:text-brand-navy'}`}
            >
              Enlace Público Directo
            </button>
          </div>

          {/* Current Code Pre block */}
          {activeTab === 'iframe' ? (
            <div className="space-y-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-brand-navy/60 block">CÓDIGO IFRAME HTML:</span>
              <div className="relative group">
                <pre className="bg-brand-bg/60 p-5 rounded-2xl text-[10px] font-mono text-brand-navy overflow-x-auto border border-brand-border group-hover:border-brand-accent/50 transition-colors max-h-40">
                  {iframeCodePublic}
                </pre>
                <button 
                  onClick={copyIframe}
                  className={`absolute top-3.5 right-3.5 px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${copiedIframe ? 'bg-green-600 text-white shadow' : 'bg-brand-navy text-brand-accent hover:scale-105 shadow-md hover:bg-brand-navy/90'}`}
                >
                  {copiedIframe ? '¡Copiado!' : 'Copiar Código'}
                </button>
              </div>
              <p className="text-[10px] text-brand-slate font-light leading-relaxed">
                Este código incrusta la revista directamente en tu página para que parezca parte nativa de ella.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-brand-navy/60 block">ENLACE PÚBLICO (PARA INSERTAR POR URL):</span>
              <div className="relative group">
                <pre className="bg-brand-bg/60 p-5 rounded-2xl text-[11px] font-mono text-brand-navy overflow-x-auto border border-brand-border group-hover:border-brand-accent/50 transition-colors break-all">
                  {publicAppUrl}
                </pre>
                <button 
                  onClick={copyUrl}
                  className={`absolute top-3.5 right-3.5 px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${copiedUrl ? 'bg-green-600 text-white shadow' : 'bg-brand-navy text-brand-accent hover:scale-105 shadow-md hover:bg-brand-navy/90'}`}
                >
                  {copiedUrl ? '¡Copiado!' : 'Copiar URL Pública'}
                </button>
              </div>
              <p className="text-[10px] text-brand-slate font-light leading-relaxed">
                Úsalo en Google Sites seleccionando <strong className="text-brand-navy">Insertar &gt; Mediante URL</strong>, o compártelo directamente por chat o redes sociales.
              </p>
            </div>
          )}

          {/* Automatic Updates Notice */}
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/60 flex gap-4">
             <div className="text-brand-accent shrink-0">
                <ShieldCheck size={24} />
             </div>
             <p className="text-[11px] text-slate-700 leading-relaxed font-medium">
               <strong>Actualizaciones en Vivo Automáticas:</strong> Una vez insertada, cada vez que crees, actualices u optimices un artículo en esta plataforma de administración, los cambios aparecerán de inmediato en tu sitio. No requerirás cambiar el código de tu sitio.
             </p>
          </div>

          {/* Footer Close Button */}
          <button 
            onClick={onClose}
            className="w-full py-4.5 bg-brand-navy text-white rounded-full font-black uppercase tracking-[0.25em] text-xs hover:bg-brand-accent hover:text-brand-navy transition-all shadow-xl block"
          >
            Entendido, cerrar asistente
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// Helper to format markdown to HTML for the downloadable report
const formatContent = (content: string) => {
  try {
    // Configure marked for professional output
    return marked.parse(content, { breaks: true, gfm: true });
  } catch (e) {
    console.error("Error parsing markdown with marked:", e);
    return content.split('\n').map(p => p.trim() ? `<p style="margin-bottom: 20px;">${p}</p>` : '').join('');
  }
};

// --- MARKDOWN COMPONENTS ---
const getHeadingText = (children: any): string => {
  if (typeof children === 'string') return children;
  if (Array.isArray(children)) return children.map(getHeadingText).join('');
  if (children?.props?.children) return getHeadingText(children.props.children);
  return '';
};

const MarkdownComponents = {
  h2: ({ children }: any) => {
    const text = getHeadingText(children);
    const cleanText = text.replace(/^[#\s]+/, '').replace(/[#\s]+$/, '');
    const id = cleanText.toLowerCase().replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-');
    return <h2 id={id} className="scroll-mt-24">{children}</h2>;
  },
  h3: ({ children }: any) => {
    const text = getHeadingText(children);
    const cleanText = text.replace(/^[#\s]+/, '').replace(/[#\s]+$/, '');
    const id = cleanText.toLowerCase().replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-');
    return <h3 id={id} className="scroll-mt-24">{children}</h3>;
  },
  table: ({ children }: any) => (
    <div className="table-wrapper">
      <table>{children}</table>
    </div>
  )
};

function FullReportViewer({ 
  editorials, 
  onBack,
  onSelect
}: { 
  editorials: Editorial[], 
  onBack: () => void,
  onSelect: (ed: Editorial) => void
}) {
  const shareUrl = window.location.href;
  const shareTitle = "Revista de Inteligencia Jurídica & Procesal - SOLJURE";

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareUrl);
    alert('¡Enlace copiado al portapapeles! Ahora puedes pegarlo en Facebook, WhatsApp o TikTok.');
  };

  const downloadReportHTML = () => {
    const reportHtml = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${shareTitle}</title>
        
        <!-- Open Graph / Social Media Meta Tags -->
        <meta property="og:type" content="website">
        <meta property="og:title" content="${shareTitle}">
        <meta property="og:description" content="Reporte técnico profesional de SOLJURE sobre gacetas, normativas y jurisprudencia ecuatoriana.">
        <meta property="og:image" content="https://images.unsplash.com/photo-1450101499163-c8848c66ca85?q=80&w=2070">

        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;700;900&family=Playfair+Display:wght@700;900&display=swap" rel="stylesheet">
        <style>
          body { font-family: 'Inter', sans-serif; background: #ffffff; color: #1e293b; scroll-behavior: smooth; }
          .font-serif { font-family: 'Playfair Display', serif; }
          .brand-navy { color: #121d33; }
          .brand-accent { color: #b59441; }
          .markdown-content h1, .markdown-content h2, .markdown-content h3 { font-family: 'Playfair Display', serif; color: #121d33; margin-top: 2em; margin-bottom: 1em; line-height: 1.2; }
          .markdown-content h1 { font-size: 2.5em; font-weight: 900; }
          .markdown-content h2 { font-size: 2em; font-weight: 900; border-bottom: 2px solid #b59441; padding-bottom: 0.3em; }
          .markdown-content h3 { font-size: 1.5em; font-weight: 700; color: #b59441; }
          .markdown-content p { margin-bottom: 1.5em; line-height: 1.8; text-align: justify; font-size: 1.1em; }
          .markdown-content table { width: 100%; border-collapse: collapse; margin: 2em 0; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05); }
          .markdown-content th { background: #121d33; color: #ffffff; padding: 15px; text-align: left; font-size: 0.8em; text-transform: uppercase; letter-spacing: 0.1em; border: 1px solid #1e293b; }
          .markdown-content td { padding: 12px 15px; border: 1px solid #e2e8f0; font-size: 0.9em; vertical-align: top; }
          .markdown-content tr:nth-child(even) { background: #f8fafc; }
          .markdown-content blockquote { border-left: 5px solid #b59441; padding: 1em 2em; margin: 2em 0; background: #fdfaf3; font-style: italic; color: #574a26; }
          .markdown-content ul, .markdown-content ol { margin-bottom: 1.5em; padding-left: 2em; }
          .markdown-content li { margin-bottom: 0.8em; line-height: 1.6; }
          .markdown-content b, .markdown-content strong { color: #121d33; font-weight: 700; }
          .markdown-content p:first-of-type::first-letter { 
            float: left; 
            font-size: 4.5em; 
            line-height: 0.7; 
            padding-top: 0.1em; 
            padding-right: 0.1em; 
            padding-left: 0.05em; 
            font-family: 'Playfair Display', serif; 
            font-weight: 900; 
            color: #121d33;
          }
          html { scroll-behavior: smooth; }
          @media print { 
            .no-print { display: none !important; } 
            .page-break { page-break-before: always; }
            body { background: white; }
            article { border: none !important; box-shadow: none !important; margin-bottom: 50px !important; }
            .markdown-content h1, .markdown-content h2 { page-break-after: avoid; }
            table { page-break-inside: auto; }
            tr { page-break-inside: avoid; page-break-after: auto; }
          }
        </style>
        <script>
          function scrollToArticle(id) {
            const element = document.getElementById(id);
            if (element) {
              element.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
          }
        </script>
      </head>
      <body>
        <div class="no-print bg-[#121d33] text-white p-4 sticky top-0 z-[100] flex justify-between items-center shadow-2xl backdrop-blur-md bg-opacity-95 border-b border-white/10">
          <div class="flex items-center gap-4">
            <span class="font-serif text-xl font-bold">SOLJURE <span class="brand-accent">EFICACES</span></span>
            <span class="text-[10px] uppercase tracking-[0.3em] text-white/50 border-l border-white/20 pl-4">Informe de Inteligencia Jurídica</span>
          </div>
          <div class="flex items-center gap-2">
            <button onclick="window.print()" class="bg-[#b59441] text-[#121d33] px-8 py-2.5 rounded-full font-black text-[10px] uppercase tracking-[0.2em] hover:brightness-110 transition-all shadow-lg">
              Imprimir / Guardar PDF
            </button>
          </div>
        </div>

        <header id="top" class="bg-[#121d33] text-white min-h-[90vh] flex items-center justify-center relative overflow-hidden border-b-[20px] border-brand-accent">
          <div class="absolute inset-0 opacity-10">
            <div class="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_30%_30%,#b59441_0%,transparent_50%)]"></div>
          </div>
          
          <div class="max-w-5xl mx-auto px-6 text-center relative z-10">
            <div class="mb-12 inline-block">
               <span class="text-[13px] font-black uppercase tracking-[1em] text-brand-accent border-y border-brand-accent/30 py-3 px-8 block">Edición Especial de Inteligencia Jurídica</span>
            </div>
            <h1 class="text-[10vw] lg:text-[100px] font-serif font-black leading-[0.8] tracking-tighter mb-12 uppercase">
               REVISTA <br/> <span class="brand-accent">INTERACTIVA</span> <br/> JURÍDICA
            </h1>
            <div class="flex justify-center items-center gap-10 mt-16">
               <div class="h-[1px] w-20 bg-white/20"></div>
               <div class="flex flex-col items-center">
                 <span class="text-[14px] font-black uppercase tracking-[0.4em] mb-2">SOLJURE EFICACES</span>
                 <span class="text-[11px] font-bold text-white/40 uppercase tracking-[0.6em]">${new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long' })}</span>
               </div>
               <div class="h-[1px] w-20 bg-white/20"></div>
            </div>
          </div>
        </header>

        <main class="max-w-4xl mx-auto px-6 py-40">
          <!-- MAGAZINE SUMARIO (CARD STYLE) -->
          <div class="mb-56 no-print">
            <div class="flex items-end justify-between mb-20 px-4">
              <div>
                <h2 class="text-7xl font-serif font-black brand-navy leading-none mb-4">Sumario.</h2>
                <div class="h-2 w-24 bg-brand-accent"></div>
              </div>
              <span class="text-[11px] font-black uppercase tracking-[0.5em] text-brand-accent border-b-4 border-brand-accent pb-2 hidden sm:block">Contenido Exclusivo</span>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
              ${editorials.map((ed, i) => `
                <div onclick="scrollToArticle('article-${i}')" class="group cursor-pointer bg-gray-50 hover:bg-[#121d33] p-12 rounded-[40px] transition-all duration-500 border border-transparent hover:translate-y-[-10px] hover:shadow-2xl">
                  <span class="text-5xl font-serif font-black text-brand-accent/20 group-hover:text-brand-accent transition-colors block mb-10">${String(i + 1).padStart(2, '0')}</span>
                  <p class="text-[10px] font-black text-brand-accent uppercase tracking-[0.4em] mb-4">${ed.area}</p>
                  <h3 class="text-2xl font-bold brand-navy group-hover:text-white transition-colors leading-tight mb-8">${ed.title}</h3>
                  <div class="flex items-center justify-between text-[9px] font-black uppercase tracking-widest text-gray-400 group-hover:text-white/40 pt-6 border-t border-gray-200 group-hover:border-white/10">
                    <span>${ed.author}</span>
                    <span class="w-2 h-2 bg-brand-accent rounded-full"></span>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

          <div class="space-y-64">
            ${editorials.map((ed, i) => `
              <div id="article-${i}" class="${i > 0 ? 'page-break' : ''} relative py-12 scroll-mt-24">
                <!-- SECTION MARKER -->
                <div class="flex items-center gap-6 mb-32 opacity-20 no-print">
                  <div class="w-16 h-[2px] bg-brand-navy"></div>
                  <span class="text-[13px] font-black uppercase tracking-[1em] brand-navy">Artículo ${String(i + 1).padStart(2, '0')}</span>
                  <div class="flex-1 h-[1px] bg-brand-navy/10"></div>
                </div>

                <article class="bg-white pl-0 lg:pl-16 relative">
                  <div class="flex justify-between items-center mb-12">
                    <span class="text-[13px] font-black uppercase tracking-[0.5em] brand-accent">${ed.area}</span>
                    <span class="text-[11px] font-bold text-gray-300 uppercase tracking-widest">${ed.readTime} Lectura</span>
                  </div>
                  
                  <h2 class="text-6xl font-serif font-black brand-navy mb-16 leading-[1.0] tracking-tighter">
                    ${ed.title}
                  </h2>
                  
                  <div class="flex flex-wrap items-center gap-12 mb-24 py-10 border-y border-gray-50">
                    <div class="flex items-center gap-5">
                       <div class="w-14 h-14 bg-[#121d33] text-white flex items-center justify-center rounded-xl font-bold text-lg shadow-lg">${ed.author.charAt(0)}</div>
                       <div>
                         <p class="text-[9px] font-black uppercase tracking-widest text-gray-400 m-0">Redacción Especial</p>
                         <p class="text-[14px] font-black brand-navy m-0">${ed.author}</p>
                       </div>
                    </div>
                    <div class="h-10 w-[1px] bg-gray-200 hidden md:block"></div>
                    <div>
                      <p class="text-[9px] font-black uppercase tracking-widest text-gray-400 m-0">Consolidado</p>
                      <p class="text-[11px] font-black text-brand-accent m-0">SOLJURE PUBLISHING</p>
                    </div>
                  </div>

                  <div class="markdown-content">
                    ${formatContent(cleanEditorialContent(ed.content))}
                  </div>

                  <!-- END SIGNATURE -->
                  <div class="mt-32 pt-16 border-t-[10px] border-[#121d33] flex items-center justify-between">
                    <div class="flex gap-3">
                       <span class="w-16 h-3 bg-brand-accent"></span>
                       <span class="w-16 h-3 bg-gray-100"></span>
                    </div>
                    <span class="text-[10px] font-black uppercase tracking-[0.4em] text-gray-300">Sumario ${String(i + 1).padStart(2, '0')}</span>
                  </div>
                </article>
              </div>
            `).join('')}
          </div>
        </main>

        <footer class="bg-[#121d33] text-white py-40 text-center relative overflow-hidden">
          <div class="absolute inset-0 opacity-5">
            <p class="text-[25vw] font-black tracking-tighter opacity-10 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 leading-none uppercase">LEGAL</p>
          </div>
          <div class="max-w-4xl mx-auto px-6 relative z-10">
            <h3 class="font-serif text-4xl font-black mb-6">SOLJURE <span class="brand-accent">EFICACES</span></h3>
            <p class="text-[12px] font-black uppercase tracking-[1em] text-brand-accent mb-12">Inteligencia Jurídica</p>
            <div class="w-20 h-1 bg-brand-accent mx-auto mb-20 rounded-full"></div>
            <p class="text-[11px] text-white/30 uppercase tracking-[0.5em] font-medium leading-relaxed">
              Propiedad Intelectual Reservada © ${new Date().getFullYear()} <br/> 
              Ecuador • Semanario de Vanguardia Profesional SOLJURE
            </p>
          </div>
        </footer>
      </body>
      </html>
    `;
    
    const blob = new Blob([reportHtml], { type: 'text/html' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Revista_Interactiva_Juridica_SOLJURE_${new Date().toISOString().split('T')[0]}.html`;
    link.click();
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="fixed top-0 left-0 right-0 z-[100] bg-[#121d33] text-white p-4 flex justify-between items-center shadow-2xl border-b border-white/5">
        <div className="flex items-center gap-6">
          <span className="font-serif text-2xl font-bold tracking-tight">SOLJURE <span className="text-[#b59441]">EFICACES</span></span>
          <div className="h-6 w-[1px] bg-white/20 hidden md:block"></div>
          <span className="text-[10px] uppercase font-black tracking-[0.3em] text-white/50 hidden lg:block">Visor Corporativo</span>
          
          <div className="hidden md:flex items-center gap-2 ml-4">
            <a 
              href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-[#3b5998] transition-all hover:scale-110 shadow-sm"
              title="Compartir en Facebook"
            >
              <Facebook size={12} />
            </a>
            <a 
              href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-[#0077b5] transition-all hover:scale-110 shadow-sm"
              title="Compartir en LinkedIn"
            >
              <Linkedin size={12} />
            </a>
            <button 
              onClick={copyToClipboard}
              className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-brand-accent transition-all hover:scale-110 shadow-sm"
              title="Copiar Enlace para TikTok/Redes"
            >
              <Copy size={12} />
            </button>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={downloadReportHTML}
            className="group bg-brand-accent hover:bg-white text-brand-navy hover:text-brand-navy px-5 py-2.5 rounded-md font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-2 shadow-lg shadow-brand-accent/20"
          >
            <Download size={14} className="group-hover:translate-y-0.5 transition-transform" /> Descargar Revista Interactiva
          </button>
          <button 
            onClick={onBack}
            className="text-white/60 hover:text-white px-5 py-2.5 rounded-md font-bold text-[10px] uppercase tracking-widest transition-all flex items-center gap-2 hover:bg-white/5"
          >
            <ArrowLeft size={16} /> Salir
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto pt-24 pb-16 px-6">
        <div className="text-center mb-16 relative">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-block px-6 py-2 border-2 border-brand-accent/20 rounded-full mb-6"
          >
            <span className="text-[10px] font-black uppercase tracking-[0.5em] text-brand-accent">Reporte Ejecutivo</span>
          </motion.div>
          <h1 className="text-5xl md:text-7xl font-serif font-black text-brand-navy mb-4 tracking-tighter">Informe de Inteligencia Corporativa</h1>
          <p className="text-brand-slate max-w-xl mx-auto text-lg font-light leading-relaxed opacity-70">
            Una compilación exhaustiva de análisis técnicos y normativos diseñada para la alta dirección y profesionales contables.
          </p>
          <div className="w-24 h-1.5 bg-brand-accent mx-auto mt-8 rounded-full"></div>
        </div>

        {/* INTERACTIVE INDEX - APP UI */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-24 p-12 lg:p-20 bg-brand-bg/30 lg:rounded-[40px] rounded-3xl border border-brand-border/30 backdrop-blur-sm"
        >
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-end mb-16 gap-6 text-left">
            <div className="max-w-xl">
              <div className="flex items-center gap-4 mb-4">
                 <div className="w-12 h-1 bg-brand-accent rounded-full"></div>
                 <span className="text-[10px] font-black text-brand-accent uppercase tracking-[0.4em]">Estructura Editorial</span>
              </div>
              <h2 className="text-4xl lg:text-5xl font-serif font-black text-brand-navy leading-none">
                Índice <span className="text-brand-accent">Interactivo</span>
              </h2>
            </div>
            <div className="text-right hidden md:block">
              <span className="text-[10px] font-black text-brand-slate/30 uppercase tracking-[0.3em] block mb-2">Compilación Consolidada</span>
              <span className="text-3xl font-serif font-black text-brand-navy/10">{editorials.length} CAPÍTULOS</span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 relative z-10">
            {editorials.map((ed, i) => (
              <button
                key={ed.id}
                onClick={() => {
                  const element = document.getElementById(`article-ui-${i}`);
                  if (element) {
                    const offset = 100;
                    const bodyRect = document.body.getBoundingClientRect().top;
                    const elementRect = element.getBoundingClientRect().top;
                    const elementPosition = elementRect - bodyRect;
                    const offsetPosition = elementPosition - offset;

                    window.scrollTo({
                      top: offsetPosition,
                      behavior: 'smooth'
                    });
                  }
                }}
                className="flex flex-col text-left p-8 rounded-3xl transition-all border group relative overflow-hidden h-72 shadow-sm hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.08)] bg-white border-brand-border/30 hover:border-brand-accent/50 group"
              >
                {/* Decorative index number */}
                <span className="absolute top-6 right-8 font-serif font-black text-6xl italic transition-all duration-500 opacity-5 group-hover:opacity-10 group-hover:scale-110 text-brand-navy">
                  {String(i + 1).padStart(2, '0')}
                </span>

                <div className="mt-2">
                   <div className="px-3 py-1 inline-block rounded-full text-[8px] font-black uppercase tracking-widest mb-4 bg-brand-bg text-brand-navy border border-brand-border/50">
                     {ed.area}
                   </div>
                   <h3 className="text-2xl font-serif font-bold leading-tight line-clamp-3 text-brand-navy group-hover:text-brand-corporate transition-colors">
                     {ed.title}
                   </h3>
                </div>

                <div className="mt-auto pt-6 flex items-center justify-between border-t border-brand-border/10">
                   <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest text-brand-slate">
                     <span>{ed.readTime}</span>
                     <div className="w-1 h-1 rounded-full bg-brand-accent"></div>
                     <span className="opacity-60">Sección {String(i + 1).padStart(2, '0')}</span>
                   </div>
                   <div className="w-10 h-10 rounded-xl flex items-center justify-center transition-all bg-brand-bg text-brand-navy group-hover:bg-brand-accent group-hover:text-white">
                      <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                   </div>
                </div>
              </button>
            ))}
          </div>
        </motion.div>

        <div className="space-y-64">
          {editorials.map((ed, index) => (
            <motion.div 
              key={ed.id} 
              id={`article-ui-${index}`}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8 }}
              className="relative"
            >
              {/* INTERACTIVE START SEPARATOR */}
              <div className="absolute -top-32 left-0 right-0 flex items-center gap-8">
                <div className="flex-1 h-[2px] bg-gradient-to-r from-transparent via-brand-accent/30 to-brand-accent/30"></div>
                <div className="flex flex-col items-center">
                  <span className="text-[10px] font-black uppercase tracking-[0.8em] text-brand-accent animate-pulse mb-2">Inicio de Análisis</span>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-[1px] bg-brand-navy/20"></div>
                    <span className="text-4xl font-serif text-brand-navy font-black opacity-20">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <div className="w-12 h-[1px] bg-brand-navy/20"></div>
                  </div>
                </div>
                <div className="flex-1 h-[2px] bg-gradient-to-l from-transparent via-brand-accent/30 to-brand-accent/30"></div>
              </div>

              <div className="bg-white p-12 lg:p-24 rounded-[60px] shadow-[0_80px_150px_-30px_rgba(0,0,0,0.06)] border border-brand-border/10 hover:border-brand-accent/40 transition-all duration-700 group relative">
                {/* Decorative Side Marker */}
                <div className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-brand-accent/10 group-hover:bg-brand-accent transition-colors duration-500 rounded-r-full"></div>

                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-16 gap-6">
                   <div className="flex items-center gap-4">
                     <div className="px-6 py-2 bg-brand-navy rounded-full shadow-lg">
                       <span className="text-[9px] font-black uppercase tracking-[0.4em] text-brand-accent">
                         {ed.area}
                       </span>
                     </div>
                     <div className="h-4 w-[1px] bg-brand-border"></div>
                     <span className="text-[10px] font-bold text-brand-slate/40 uppercase tracking-widest">{ed.readTime}</span>
                   </div>
                   
                   <div className="flex items-center gap-4">
                     <button 
                      onClick={onBack}
                      className="text-[9px] font-black uppercase tracking-widest text-brand-slate hover:text-brand-navy transition-colors flex items-center gap-2"
                     >
                       <ArrowLeft size={14} /> Menú
                     </button>
                     <div className="h-4 w-[1px] bg-brand-border"></div>
                     <button 
                      onClick={() => onSelect(ed)}
                      className="group flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-brand-accent hover:text-brand-navy transition-all"
                     >
                       Lectura Profunda <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                     </button>
                   </div>
                </div>

                <h2 className="text-5xl lg:text-7xl font-serif font-black text-brand-navy mb-12 leading-[1.05] tracking-tight group-hover:text-brand-corporate transition-colors">
                  {ed.title}
                </h2>
                
                <div className="flex flex-wrap items-center gap-8 mb-16 py-8 border-y border-brand-border/10">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-brand-navy flex items-center justify-center shadow-xl group-hover:bg-brand-accent transition-all duration-500 hover:rotate-6">
                      <User size={20} className="text-white" />
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-brand-slate uppercase tracking-[0.2em] opacity-50 mb-1">Especialista Responsable</p>
                      <p className="text-sm font-bold text-brand-navy">{ed.author}</p>
                    </div>
                  </div>
                  <div className="h-10 w-[1px] bg-brand-border/20 hidden md:block"></div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-brand-accent/10 rounded-lg">
                      <Calendar size={16} className="text-brand-accent" />
                    </div>
                    <div>
                      <p className="text-[8px] font-black text-brand-slate uppercase tracking-widest opacity-40">Publicación</p>
                      <p className="text-[11px] font-bold text-brand-navy uppercase">{ed.date}</p>
                    </div>
                  </div>
                </div>

                <div className="prose prose-slate max-w-none lg:prose-2xl mb-20">
                  <div className="markdown-body font-sans text-gray-700 leading-[1.8] text-xl text-justify font-light opacity-90">
                    <ReactMarkdown remarkPlugins={[remarkGfm]} components={MarkdownComponents}>
                      {cleanEditorialContent(ed.content)}
                    </ReactMarkdown>
                  </div>
                </div>

                <div className="relative group/btn">
                  <motion.button 
                    whileHover={{ scale: 1.01, y: -4 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => onSelect(ed)}
                    className="w-full py-8 bg-brand-navy text-brand-accent rounded-[32px] font-black uppercase tracking-[0.5em] text-xs shadow-[0_30px_60px_-15px_rgba(18,29,51,0.4)] hover:shadow-[0_40px_80px_-15px_rgba(181,148,65,0.3)] transition-all flex items-center justify-center gap-6 overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000"></div>
                    <span className="relative z-10">Expandir Informe Técnico</span>
                    <Maximize size={18} className="relative z-10" />
                  </motion.button>
                </div>
              </div>


              {/* INTERACTIVE END SEPARATOR */}
              <div className="absolute -bottom-32 left-0 right-0 flex items-center justify-center">
                <div className="flex items-center gap-4 group cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                  <div className="w-12 h-[1px] bg-brand-border/40"></div>
                  <span className="text-[9px] font-black uppercase tracking-[0.4em] text-brand-slate/40 group-hover:text-brand-accent transition-colors">Fin de la Sección {index + 1}</span>
                  <div className="w-12 h-[1px] bg-brand-border/40"></div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-60 text-center relative">
          <div className="absolute inset-0 flex items-center justify-center opacity-[0.03]">
             <span className="text-[20vw] font-serif font-black select-none">DC</span>
          </div>
          <div className="relative z-10">
            <p className="text-brand-accent text-[11px] uppercase tracking-[1em] font-black mb-12">Fin del Informe Consolidado</p>
            <div className="flex flex-col items-center gap-8">
              <button 
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="w-20 h-20 bg-brand-navy text-white rounded-full flex items-center justify-center hover:bg-brand-accent transition-all shadow-2xl group"
              >
                <ChevronUp size={40} className="group-hover:-translate-y-1 transition-transform" />
              </button>
              <button 
                onClick={onBack}
                className="text-brand-navy/40 hover:text-brand-navy text-xs font-black uppercase tracking-[0.5em] transition-colors"
              >
                ← Salir del Visor
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function EditorialViewer({ 
  editorial: initialEditorial, 
  onBack,
  isAdmin,
  onEdit,
  onDelete,
  onUpdate,
  onNext,
  onPrev,
  hasNext,
  hasPrev,
  getHostImage,
  handleProfileImageUpload,
  fichas,
  activeVersionFichaId,
  setActiveVersionFichaId,
  setShowPublishModal,
  onInvestigate
}: { 
  editorial: Editorial, 
  onBack: () => void,
  isAdmin?: boolean,
  onEdit?: () => void,
  onDelete?: () => void,
  onUpdate?: (editorial: Editorial) => void,
  onNext?: () => void,
  onPrev?: () => void,
  hasNext?: boolean,
  hasPrev?: boolean,
  getHostImage: (type: 'masculine' | 'feminine') => string,
  handleProfileImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void,
  fichas: Ficha[],
  activeVersionFichaId: string | null,
  setActiveVersionFichaId: (id: string | null) => void,
  setShowPublishModal: (show: boolean) => void,
  onInvestigate?: (query: string, area: string) => void
}) {
  const [editorial, setEditorial] = useState(initialEditorial);

  const relatedFichas = useMemo(() => {
    if (!fichas) return [];
    return fichas.filter(f => f.editorialId === initialEditorial.id || f.id === `synth_${initialEditorial.id}`)
      .sort((a, b) => b.generationDate.localeCompare(a.generationDate)); // Chronological descending (newest first)
  }, [fichas, initialEditorial.id]);

  const activeFicha = useMemo(() => {
    return relatedFichas.find(v => v.id === activeVersionFichaId);
  }, [relatedFichas, activeVersionFichaId]);

  // Keep local state in sync with parent updates (important for realtime and version changes)
  useEffect(() => {
    if (activeFicha) {
      setEditorial({
        ...initialEditorial,
        title: activeFicha.title || initialEditorial.title,
        summary: activeFicha.summary || initialEditorial.summary,
        content: activeFicha.contentSnapshot || initialEditorial.content,
        date: activeFicha.generationDate || initialEditorial.date,
      });
    } else {
      setEditorial(initialEditorial);
      if (initialEditorial.videoScript) setVideoScript(initialEditorial.videoScript);
    }
  }, [activeFicha, initialEditorial]);

  const [isDigitalView, setIsDigitalView] = useState(false);
  const [bookPageIndex, setBookPageIndex] = useState(0);
  const [zoomScale, setZoomScale] = useState(100);
  const [doublePageSpread, setDoublePageSpread] = useState(true);
  const [showImageModal, setShowImageModal] = useState(false);

  const articleRef = useRef<HTMLDivElement>(null);
  const digitalContainerRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isExpanding, setIsExpanding] = useState(false);
  const [isReading, setIsReading] = useState(false);
  const [showSocialStory, setShowSocialStory] = useState(false);
  const [showGoogleVids, setShowGoogleVids] = useState(false);
  const [showCinematicPodcast, setShowCinematicPodcast] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [videoScript, setVideoScript] = useState<string | null>(initialEditorial.videoScript || null);
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [isRenderingVideo, setIsRenderingVideo] = useState(false);
  const [renderProgress, setRenderProgress] = useState(0);

  const handleSelectImage = async (newUrl: string) => {
    const updated = {
      ...editorial,
      imageUrl: newUrl
    };
    setEditorial(updated);
    if (onUpdate) {
      await onUpdate(updated);
    }
  };

  const [storySlides, setStorySlides] = useState<{title: string, body: string, script: string}[] | null>(null);
  const [isGeneratingSlides, setIsGeneratingSlides] = useState(false);
  const [voiceStyle, setVoiceStyle] = useState('Profesional, Jovial y Persuasiva');
  const [voiceType, setVoiceType] = useState<'masculine' | 'feminine'>('masculine');

  const [isRecording, setIsRecording] = useState(false);
  const [recordedVideoUrl, setRecordedVideoUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const toggleScreenRecording = async () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: { frameRate: { ideal: 60 } },
          audio: true
        });
        
        chunksRef.current = [];
        const recorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9' });
        
        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunksRef.current.push(e.data);
        };
        
        recorder.onstop = () => {
          const blob = new Blob(chunksRef.current, { type: 'video/webm' });
          const url = URL.createObjectURL(blob);
          setRecordedVideoUrl(url);
          stream.getTracks().forEach(track => track.stop());
        };
        
        mediaRecorderRef.current = recorder;
        recorder.start();
        setIsRecording(true);
      } catch (err) {
        console.error("Error starting screen recording:", err);
      }
    }
  };

  const downloadRecording = () => {
    if (!recordedVideoUrl) return;
    const a = document.createElement('a');
    a.href = recordedVideoUrl;
    a.download = `GRABACION_PANTALLA_CONTAPRO_${new Date().getTime()}.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  const handleToggleReading = () => {
    if (isReading) {
      window.speechSynthesis.cancel();
      setIsReading(false);
    } else {
      let plainText = (editorial?.content || "")
        .replace(/!\[.*\]\(.*\)/g, '')
        .replace(/\[.*\]\(.*\)/g, '')
        .replace(/#{1,6}\s+(.*)/g, '. Nueva Sección: $1. ')
        .replace(/(\*\*|__)(.*?)\1/g, '$2')
        .replace(/(\*|_)(.*?)\1/g, '$2')
        .replace(/`{1,3}.*?`{1,3}/gs, '')
        .replace(/>\s/g, '')
        .replace(/\|/g, ' ')
        .replace(/-{3,}/g, '');

      // Academic replacements to make it incredibly narrative, scholarly, and fluid
      const technicalReplacements: { [key: string]: string } = {
        'SRI': 'Servicio de Rentas Internas',
        'NIIF': 'Normas Internacionales de Información Financiera',
        'LORTI': 'Ley de Régimen Tributario Interno',
        'COGEP': 'Código Orgánico General de Procesos',
        'COPCI': 'Código Orgánico de la Producción, Comercio e Inversiones',
        'SENAE': 'Servicio Nacional de Aduana del Ecuador',
        'Art\\.': 'Artículo ',
        'Arts\\.': 'Artículos ',
        'IR': 'Impuesto a la Renta',
        'IVA': 'Impuesto al Valor Agregado',
        'Mgs\\.?': 'Magíster',
        'Ing\\.?': 'Ingeniero',
        'Ab\\.?': 'Abogado',
        'Dr\\.?': 'Doctor',
        'CPA': 'Contador Público Autorizado',
        'USD': 'dólares de los Estados Unidos'
      };

      for (const [key, replacement] of Object.entries(technicalReplacements)) {
        const regex = new RegExp(`\\b${key}\\b`, 'g');
        plainText = plainText.replace(regex, replacement);
      }

      const fullText = `Estimados colegas. Les habla el departamento técnico de CONTAPRO DC. A continuación, presento de manera académica y profesional el análisis estratégico titulado: ${editorial.title || ""}. Publicado por: ${editorial.author || "CONTAPRO"}. Resumen Ejecutivo: ${editorial.summary || ""}. Ampliación de contenido: ${plainText}`;
      
      const utterance = new SpeechSynthesisUtterance(fullText);
      const voices = window.speechSynthesis.getVoices();
      
      // Filter by Spanish language
      const spanishVoices = voices.filter(v => v.lang.toLowerCase().startsWith('es'));
      
      // Look for typical male voice names or keywords "male"/"masculino" in voice definitions
      const maleNamesAndKeywords = [
        'jorge', 'julio', 'enrique', 'miguel', 'david', 'manuel', 'pablo', 
        'daniel', 'alonso', 'andres', 'mateo', 'gaston', 'luis', 'tomas', 
        'male', 'masculino', 'sabino', 'jose', 'microsoft daniel', 'google español'
      ];
      
      let selectedVoice = spanishVoices.find(v => {
        const name = v.name.toLowerCase();
        return maleNamesAndKeywords.some(keyword => name.includes(keyword)) && 
               !name.includes('sabina') && !name.includes('helena') && !name.includes('isabel') && !name.includes('lucia');
      });
      
      // If no explicit masculine voice is found, sort Spanish voices by quality/source
      if (!selectedVoice) {
        selectedVoice = spanishVoices.sort((a, b) => {
          const aName = a.name.toLowerCase();
          const bName = b.name.toLowerCase();
          const score = (name: string) => {
            if (name.includes('natural')) return 10;
            if (name.includes('neural')) return 9;
            if (name.includes('online')) return 8;
            if (name.includes('google')) return 7;
            return 0;
          };
          return score(bName) - score(aName);
        })[0];
      }

      if (selectedVoice) {
        utterance.voice = selectedVoice;
      } else {
        utterance.lang = 'es-MX';
      }

      // Professional metrics: Academic flow (rate ~ 0.92, deeper authoritative tone)
      utterance.rate = 0.92;
      utterance.pitch = 0.88;
      
      utterance.onend = () => setIsReading(false);
      utterance.onerror = () => setIsReading(false);
      
      window.speechSynthesis.speak(utterance);
      setIsReading(true);
    }
  };

  const [activeId, setActiveId] = useState<string>('');
  const [progressPercent, setProgressPercent] = useState<number>(0);

  // Extract headers for TOC from markdown content
  const tocItems = React.useMemo(() => {
    if (!editorial || !editorial.content) return [];
    try {
      const headerRegex = /^(##|###) (.*$)/gm;
      const matches = [...editorial.content.matchAll(headerRegex)];
      return matches.map((match) => {
        const rawText = (match[2] || "").trim();
        const cleanText = rawText.replace(/^[#\s]+/, '').replace(/[#\s]+$/, '');
        return {
          level: match[1]?.length || 2, // 2 for ##, 3 for ###
          text: cleanText,
          id: cleanText.toLowerCase().replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-')
        };
      });
    } catch (e) {
      console.error("TOC generation error:", e);
      return [];
    }
  }, [editorial?.content]);

  useEffect(() => {
    const handleScroll = () => {
      // Find all h2 and h3 headers in current article
      const headers = Array.from(document.querySelectorAll('.editorial-text h2, .editorial-text h3'));
      
      // Calculate reading progress percent
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const currentScroll = window.scrollY;
      const progress = docHeight > 0 ? Math.min(1, Math.max(0, currentScroll / docHeight)) : 0;
      setProgressPercent(progress);

      if (headers.length === 0) return;

      // Get scroll position
      const scrollPosition = window.scrollY + 150; // offset for better detection

      // Find active header
      let currentActiveId = '';
      for (let i = 0; i < headers.length; i++) {
        const header = headers[i] as HTMLElement;
        if (header.offsetTop <= scrollPosition) {
          currentActiveId = header.id;
        } else {
          break;
        }
      }

      if (!currentActiveId && headers[0]) {
        currentActiveId = headers[0].id;
      }

      setActiveId(currentActiveId);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    // Run once at load
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [editorial?.content]);

  // Custom components for ReactMarkdown to add IDs to headers
  const { scrollYProgress } = useScroll({
    container: isDigitalView ? digitalContainerRef : undefined
  });
  
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  const handleDeepen = async () => {
    setIsExpanding(true);
    try {
      // Pass the existing article content to consolidate and expand it in a single unified document
      const result = await expandEditorialTopic(
        editorial?.title || initialEditorial?.title || "Sin título",
        editorial?.area || ExpertiseArea.CONSTITUCIONAL,
        editorial?.content || ""
      );
      
      if (!result || result.length < 100) {
        throw new Error("Respuesta científica insuficiente");
      }

      const updated = { ...editorial, content: result.trim() };
      
      // Update local state first for instant feedback
      setEditorial(updated);
      
      // Persist to DB and wait
      await onUpdate?.(updated);
      
      // Brief confirmation
      setTimeout(() => alert("¡Listo! El artículo se ha refundido e integrado con nuevos subtemas profundizados de forma doctoral."), 300);
    } catch (err) {
      console.error(err);
      alert("No se pudo completar la expansión. Intenta de nuevo.");
    } finally {
      setIsExpanding(false);
    }
  };

  const handleExpandPractical = async () => {
    setIsExpanding(true);
    try {
      const practicalResult = await generatePracticalCase(editorial.title || initialEditorial.title, editorial.area);
      
      if (!practicalResult || practicalResult.length < 100) {
        throw new Error("Respuesta científica insuficiente");
      }

      const updated = { 
        ...editorial, 
        content: editorial.content + "\n\n" + practicalResult 
      };
      
      setEditorial(updated);
      await onUpdate?.(updated);
      
      setTimeout(() => alert("¡Ampliación práctica añadida con éxito!"), 300);
    } catch (err) {
      console.error(err);
      alert("No se pudo generar la ampliación práctica.");
    } finally {
      setIsExpanding(false);
    }
  };

  const handleGenerateVideoPromo = async () => {
    setIsGeneratingVideo(true);
    try {
      // Use faster and more direct title for expansion
      const script = await generateVideoPromoScript(editorial.title || initialEditorial.title, editorial.content);
      
      if (!script || script.length < 100) {
        throw new Error("Respuesta científica insuficiente");
      }

      setVideoScript(script);
      
      // Auto scroll to script
      setTimeout(() => {
        const el = document.getElementById('video-promo-section');
        el?.scrollIntoView({ behavior: 'smooth' });
      }, 300);
    } catch (err) {
      console.error(err);
      alert("No se pudo completar la generación del guion.");
    } finally {
      setIsGeneratingVideo(false);
    }
  };

  const handleGenerateSlides = async () => {
    setIsGeneratingSlides(true);
    try {
      const data = await generateStorySlidesContent(editorial.title, editorial.content, voiceStyle);
      if (data.slides && data.slides.length > 0) {
        setStorySlides(data.slides);
      } else {
        alert("No se pudieron generar los slides.");
      }
    } catch (err: any) {
      console.error(err);
      if (err?.message?.includes("quota") || err?.message?.includes("429")) {
        alert("Límite de cuota excedido. Por favor espera unos segundos y vuelve a intentar.");
      } else {
        alert("Error de conexión con el servidor de análisis.");
      }
    } finally {
      setIsGeneratingSlides(false);
    }
  };

  const downloadSlideImage = (slide: {title: string, body: string}, index: number) => {
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1920;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background Gradient Themes based on index
    const themes = [
      { bg: ['#121d33', '#1e293b'], accent: '#b59441' },
      { bg: ['#1e293b', '#334155'], accent: '#ef4444' },
      { bg: ['#121d33', '#0f172a'], accent: '#10b981' },
      { bg: ['#1e293b', '#121d33'], accent: '#b59441' },
      { bg: ['#121d33', '#1e293b'], accent: '#f59e0b' }
    ];
    const theme = themes[index % themes.length];

    const grad = ctx.createRadialGradient(540, 960, 0, 540, 960, 1100);
    grad.addColorStop(0, theme.bg[1]);
    grad.addColorStop(1, theme.bg[0]);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Decorative Elements
    ctx.fillStyle = theme.accent + '20';
    ctx.beginPath();
    ctx.arc(1080, 0, 400, 0, Math.PI * 2);
    ctx.fill();

    // Border
    ctx.strokeStyle = theme.accent;
    ctx.lineWidth = 20;
    ctx.strokeRect(40, 40, canvas.width - 80, canvas.height - 80);

    // Text Wrap Helper
    const drawText = (text: string, x: number, y: number, maxWidth: number, lineHeight: number, font: string, color: string) => {
      ctx.font = font;
      ctx.fillStyle = color;
      const words = text.split(' ');
      let line = '';
      let currentY = y;

      for(let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + ' ';
        const metrics = ctx.measureText(testLine);
        const testWidth = metrics.width;
        if (testWidth > maxWidth && n > 0) {
          ctx.fillText(line, x, currentY);
          line = words[n] + ' ';
          currentY += lineHeight;
        } else {
          line = testLine;
        }
      }
      ctx.fillText(line, x, currentY);
      return currentY + lineHeight;
    };

    ctx.textAlign = 'center';
    
    // Slide Number
    ctx.font = 'bold 30px sans-serif';
    ctx.fillStyle = theme.accent;
    ctx.fillText(`0${index + 1} / 05`, 540, 150);

    // Title
    ctx.font = '900 80px Georgia';
    const nextY = drawText(slide.title, 540, 500, 900, 100, '900 80px Georgia', '#ffffff');

    // Body
    ctx.font = '500 50px sans-serif';
    drawText(slide.body, 540, nextY + 100, 850, 75, '500 50px sans-serif', '#cbd5e1');

    // Branding
    ctx.font = '800 30px sans-serif';
    ctx.fillStyle = theme.accent;
    ctx.fillText("CONTAPRO DC", 540, 1750);
    ctx.font = 'bold 20px sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.fillText("INTELIGENCIA NORMATIVA", 540, 1800);

    const link = document.createElement('a');
    link.download = `STORY_${index + 1}_${editorial.id}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  // --- AUDIO UTILS ---
  const safeDecodeAudio = async (audioCtx: AudioContext, base64: string): Promise<AudioBuffer | null> => {
    try {
      const base64Data = base64.includes(',') ? base64.split(',')[1] : base64;
      const cleanedBase64 = base64Data.trim().replace(/\s/g, '');
      const binaryString = atob(cleanedBase64);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let j = 0; j < len; j++) bytes[j] = binaryString.charCodeAt(j);
      
      // Try standard decoding first (WAV/MP3/etc)
      let buffer = await audioCtx.decodeAudioData(bytes.buffer.slice(0)).catch(() => null);
      
      if (!buffer) {
        // Fallback: Gemini TTS often returns raw PCM (24kHz, 16-bit Mono)
        // If buffer is null, we try to interpret it as raw 16-bit PCM
        if (len % 2 === 0) {
          const int16Data = new Int16Array(bytes.buffer);
          const float32Data = new Float32Array(int16Data.length);
          for (let j = 0; j < int16Data.length; j++) {
            float32Data[j] = int16Data[j] / 32768.0;
          }
          // Note: using 24000Hz as standard for Gemini TTS
          buffer = audioCtx.createBuffer(1, float32Data.length, 24000);
          buffer.getChannelData(0).set(float32Data);
        }
      }
      return buffer;
    } catch (e) {
      console.error("Error in safeDecodeAudio:", e);
      return null;
    }
  };

  const bufferToWav = (buffer: AudioBuffer) => {
    const numOfChan = buffer.numberOfChannels;
    const length = buffer.length * numOfChan * 2 + 44;
    const bufferArray = new ArrayBuffer(length);
    const view = new DataView(bufferArray);
    const channels = [];
    let i;
    let sample;
    let offset = 0;
    let pos = 0;

    const setUint16 = (data: number) => { view.setUint16(pos, data, true); pos += 2; };
    const setUint32 = (data: number) => { view.setUint32(pos, data, true); pos += 4; };

    setUint32(0x46464952); // "RIFF"
    setUint32(length - 8); 
    setUint32(0x45564157); // "WAVE"
    setUint32(0x20746d66); // "fmt "
    setUint32(16); 
    setUint16(1); 
    setUint16(numOfChan);
    setUint32(buffer.sampleRate);
    setUint32(buffer.sampleRate * 2 * numOfChan);
    setUint16(numOfChan * 2);
    setUint16(16);
    setUint32(0x61746164); // "data"
    setUint32(length - pos - 4);

    for (i = 0; i < buffer.numberOfChannels; i++) channels.push(buffer.getChannelData(i));

    while (pos < length) {
      for (i = 0; i < numOfChan; i++) {
        sample = Math.max(-1, Math.min(1, channels[i][offset]));
        sample = (sample < 0 ? sample * 0x8000 : sample * 0x7FFF);
        view.setInt16(pos, sample, true);
        pos += 2;
      }
      offset++;
    }
    return new Blob([bufferArray], { type: 'audio/wav' });
  };

  const downloadAudio = async (providedSlides?: any[], styleToUse: string = voiceStyle) => {
    const slidesToUse = providedSlides || storySlides;
    if (!slidesToUse || slidesToUse.length === 0) {
      alert("Genere los slides primero.");
      return;
    }

    setIsRenderingVideo(true);
    setRenderProgress(5);

    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const audioBuffers: AudioBuffer[] = [];

      for (let i = 0; i < slidesToUse.length; i++) {
        const slide = slidesToUse[i];
        const script = slide.script || slide.voice || slide.body || "";
        
        if (!script) continue;

        if (i > 0) await new Promise(r => setTimeout(r, 1800));
        
    const voiceToUse = voiceType === 'masculine' ? 'Charon' : 'Kore'; 
        let audioBase64 = await generateSpeech(script, voiceToUse, styleToUse);
        
        if (audioBase64 === "QUOTA_EXCEEDED") {
          console.log("Cuota de audio. Reintentando en 15 segundos...");
          await new Promise(r => setTimeout(r, 15000));
          audioBase64 = await generateSpeech(script, voiceToUse, styleToUse);
        }

        if (audioBase64 && audioBase64 !== "QUOTA_EXCEEDED") {
          const buffer = await safeDecodeAudio(audioCtx, audioBase64);
          if (buffer) audioBuffers.push(buffer);
        }
        setRenderProgress(10 + Math.round((i / slidesToUse.length) * 90));
      }

      if (audioBuffers.length === 0) throw new Error("No se pudo generar el audio.");

      const totalLength = audioBuffers.reduce((acc, buf) => acc + buf.length, 0);
      const combinedBuffer = audioCtx.createBuffer(1, totalLength, audioBuffers[0].sampleRate);
      let currentOffset = 0;
      for (const buffer of audioBuffers) {
        combinedBuffer.getChannelData(0).set(buffer.getChannelData(0), currentOffset);
        currentOffset += buffer.length;
      }

      const wavBlob = bufferToWav(combinedBuffer);
      const url = URL.createObjectURL(wavBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `AUDIOLIBRO_CONTAPRO_${editorial.title.replace(/\s+/g, '_')}.wav`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error(err);
      alert("Error al descargar audio: " + err.message);
    } finally {
      setIsRenderingVideo(false);
      setRenderProgress(0);
    }
  };

  const handleGenerateAndRecordPodcast = async () => {
    setIsGeneratingSlides(true);
    try {
      // 1. Generate Slides Content
      const data = await generateStorySlidesContent(editorial.title, editorial.content, voiceStyle);
      if (!data.slides || data.slides.length === 0) {
        throw new Error("No se pudieron generar los slides.");
      }
      setStorySlides(data.slides);
      
      // We keep isGeneratingSlides true until we trigger the recording,
      // providing a seamless transition in the UI.
      
      // 2. Small delay for React state (setStorySlides) to propagate
      await new Promise(r => setTimeout(r, 450)); 

      // 3. Trigger Video Recording
      // This will set isRenderingVideo(true) internally
      await downloadVideo(data.slides, voiceStyle);
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Error en el proceso de generación y grabación.");
    } finally {
      setIsGeneratingSlides(false);
    }
  };

  const downloadVideo = async (providedSlides?: any[], styleToUse: string = voiceStyle) => {
    const slidesToUse = providedSlides || storySlides;
    if (!slidesToUse || slidesToUse.length === 0) {
      alert("Genere los slides primero para crear el video.");
      return;
    }

    setIsRenderingVideo(true);
    setRenderProgress(0);
    
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      if (audioCtx.state === 'suspended') await audioCtx.resume();
      const dest = audioCtx.createMediaStreamDestination();
      
      const voiceToUse = voiceType === 'masculine' ? 'Charon' : 'Kore';

      const cleanAuthor = editorial.author.replace(/\.?\s*(Ingeniero|Ing\.|Lic\.|Ab\.)\s*(Comercial|Contador)?/gi, '').trim();

      // 1. Pre-generate all audio buffers
      setRenderProgress(5);
      const audioBuffers: (AudioBuffer | null)[] = [];
      for (let i = 0; i < slidesToUse.length; i++) {
        const slide = slidesToUse[i];
        let buffer: AudioBuffer | null = null;
        
        // Paced delay to avoid hitting short-term API quota limits completely, while maintaining speed
        if (i > 0) await new Promise(r => setTimeout(r, 1800));

        let audioBase64 = await generateSpeech(slide.script, voiceToUse, styleToUse);
        
        // Final fallback retry if quota was hit
        if (audioBase64 === "QUOTA_EXCEEDED") {
          setRenderProgress(p => p - 1); // Subtle UI hint
          console.log("Limite de cuota detectado. Esperando 15 segundos para reintentar diapositiva " + i + "...");
          await new Promise(r => setTimeout(r, 15000));
          audioBase64 = await generateSpeech(slide.script, voiceToUse, styleToUse);
        }

        if (audioBase64 && audioBase64 !== "QUOTA_EXCEEDED") {
          buffer = await safeDecodeAudio(audioCtx, audioBase64);
          if (!buffer) {
            console.error(`decodeAudioData (safe) failed for slide ${i}`);
          }
        }
        audioBuffers.push(buffer);
        setRenderProgress(10 + Math.round((i / slidesToUse.length) * 20));
      }

      const hasAnyAudio = audioBuffers.some(b => b !== null);
      if (!hasAnyAudio) {
        throw new Error("No se pudo generar el audio para el video. Verifique su conexión o intente con un guion más corto.");
      }

      // 2. Prepare video data tied to audio duration
      const videoData = slidesToUse.map((s: any, idx: number) => {
        const audioDuration = audioBuffers[idx]?.duration || 6; // Fallback to 6s
        return {
          text: s.title,
          sub: s.body.replace(/\*/g, ''),
          script: s.script,
          bg: idx % 2 === 0 ? "#0f172a" : "#1e1b4b",
          accent: idx % 2 === 0 ? "#b59441" : "#8b5cf6",
          durationSeconds: audioDuration // Eliminar la pausa de 0.15s para que el video sea perfectamente fluido
        };
      });

      const canvas = document.createElement('canvas');
      canvas.width = 1080;
      canvas.height = 1920;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // 3. Setup Recorder with Audio + Video
      const videoStream = canvas.captureStream(30);
      const audioStream = dest.stream;
      
      const tracks = [...videoStream.getVideoTracks()];
      const audioTracks = audioStream.getAudioTracks();
      
      if (audioTracks.length > 0) {
        tracks.push(audioTracks[0]);
      } else {
        console.warn("No audio tracks found in destination stream. Retrying audio stream capture...");
        // Some browsers need a moment
        const retryAudioTracks = dest.stream.getAudioTracks();
        if (retryAudioTracks.length > 0) tracks.push(retryAudioTracks[0]);
      }

      const combinedStream = new MediaStream(tracks);

      const supportedTypes = [
        'video/webm;codecs=vp9,opus',
        'video/webm;codecs=vp8,opus',
        'video/webm',
        'video/mp4'
      ];
      
      let mimeType = supportedTypes.find(type => MediaRecorder.isTypeSupported(type)) || '';
      console.log("Using MIME type:", mimeType);
      
      const recorder = new MediaRecorder(combinedStream, { 
        mimeType,
        videoBitsPerSecond: 6000000,
        audioBitsPerSecond: 128000
      });

      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `PODCAST_ESTILO_${editorial.title.replace(/\s+/g, '_')}.webm`;
        a.click();
        setIsRenderingVideo(false);
        audioCtx.close();
      };

      let currentFrame = 0;
      let currentSlideIndex = 0;
      let slideStartedAtFrame = 0;
      const fps = 30;
      const totalDuration = videoData.reduce((acc, v) => acc + v.durationSeconds, 0);
      const totalFrames = Math.ceil(totalDuration * fps);

      // Audio trigger function
      const playSlideAudio = (index: number) => {
        if (audioBuffers[index]) {
          const source = audioCtx.createBufferSource();
          source.buffer = audioBuffers[index];
          
          const gainNode = audioCtx.createGain();
          gainNode.gain.value = 1.0;
          
          source.connect(gainNode);
          gainNode.connect(dest);
          gainNode.connect(audioCtx.destination);
          source.start();
          console.log(`Pista de audio ${index} iniciada. Duración: ${source.buffer.duration}s`);
        }
      };

      // Breve espera para que los tracks de MediaStream se estabilicen
      await new Promise(r => setTimeout(r, 450));
      
      recorder.start();
      playSlideAudio(0); 

      const animate = () => {
        if (currentFrame >= totalFrames || currentSlideIndex >= videoData.length) {
          recorder.stop();
          return;
        }

        const currentSlide = videoData[currentSlideIndex];
        const slideFrames = currentSlide.durationSeconds * fps;
        
        // Check if we should move to next slide
        if (currentFrame - slideStartedAtFrame >= slideFrames) {
          currentSlideIndex++;
          slideStartedAtFrame = currentFrame;
          if (currentSlideIndex < videoData.length) {
            playSlideAudio(currentSlideIndex);
          } else {
            recorder.stop();
            return;
          }
        }

        const slide = videoData[currentSlideIndex];
        
        // Studio Background
        ctx.fillStyle = slide.bg;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Radial Gradient Glow
        const glow = ctx.createRadialGradient(540, 960, 0, 540, 960, 1000);
        glow.addColorStop(0, slide.accent + '30');
        glow.addColorStop(1, 'transparent');
        ctx.fillStyle = glow;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Simulated Audio Waveform
        ctx.strokeStyle = slide.accent;
        ctx.lineWidth = 8;
        ctx.lineCap = 'round';
        const waveCount = 24;
        const waveSpacing = 35;
        const waveX = 540 - (waveCount * waveSpacing) / 2;
        
        for(let i = 0; i < waveCount; i++) {
          // Dynamic height based on "voice" simulation
          const h = Math.sin((currentFrame * 0.25) + i) * 80 + 100;
          ctx.beginPath();
          ctx.moveTo(waveX + (i * waveSpacing), 1700 - h/2);
          ctx.lineTo(waveX + (i * waveSpacing), 1700 + h/2);
          ctx.stroke();
        }

        // Branding Badge
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.roundRect(100, 100, 150, 60, 12);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 28px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('EN VIVO', 175, 140);

        // Progress Bar
        ctx.fillStyle = 'rgba(255,255,255,0.1)';
        ctx.fillRect(0, 0, canvas.width, 10);
        ctx.fillStyle = slide.accent;
        ctx.fillRect(0, 0, canvas.width * (currentFrame / totalFrames), 10);

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Title
        ctx.font = '900 100px Georgia';
        ctx.fillStyle = '#ffffff';

        const drawWrappedText = (text: string, x: number, y: number, maxWidth: number, lineHeight: number) => {
          const words = text.split(' ');
          let line = '';
          let currentY = y;
          for (let n = 0; n < words.length; n++) {
            const testLine = line + words[n] + ' ';
            if (ctx.measureText(testLine).width > maxWidth && n > 0) {
              ctx.fillText(line, x, currentY);
              line = words[n] + ' ';
              currentY += lineHeight;
            } else {
              line = testLine;
            }
          }
          ctx.fillText(line, x, currentY);
          return currentY;
        };

        const titleEndY = drawWrappedText(slide.text, canvas.width/2, 600, 950, 120);
        
        // Discussion Label
        ctx.fillStyle = slide.accent;
        ctx.font = 'bold 35px sans-serif';
        ctx.fillText("ANÁLISIS TÉCNICO EXCLUSIVO", canvas.width/2, titleEndY + 150);

        // Body Content
        ctx.font = '500 50px sans-serif';
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        drawWrappedText(slide.sub, canvas.width/2, 1050, 920, 80);

        // Footer Branding
        ctx.font = '800 40px sans-serif';
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.fillText("CONTAPRO DC • PODCAST STUDIO", canvas.width/2, 1850);

        currentFrame++;
        setRenderProgress(30 + Math.round((currentFrame / totalFrames) * 70));
        requestAnimationFrame(animate);
      };

      animate();
    } catch (err) {
      console.error(err);
      alert("Error al generar el video con audio: " + (err instanceof Error ? err.message : String(err)));
      setIsRenderingVideo(false);
    }
  };

  const copyHTMLCode = () => {
    const html = generateFullHTML();
    navigator.clipboard.writeText(html).then(() => {
      alert("CÓDIGO HTML COPIADO. En Google Sites: Insertar > Incorporar > Incorporar código > Pegar.");
    });
  };

  const generateFullHTML = () => {
    const lines = editorial.content.split('\n');
    let processedContent = '';
    let inTable = false;
    let tableRows: string[][] = [];

    const flushTable = () => {
      if (tableRows.length > 0) {
        processedContent += `
          <div style="overflow-x: auto; margin: 30px 0; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff; box-shadow: 0 4px 15px rgba(0,0,0,0.05); border-left: 5px solid #121d33;">
            <table style="width: 100%; border-collapse: collapse; min-width: 650px; font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; table-layout: auto;">
              <thead>
                <tr style="background-color: #121d33; background-image: linear-gradient(135deg, #121d33 0%, #1e293b 100%);">
                  ${tableRows[0].map(h => `<th style="padding: 18px 16px; border: 1px solid #334155; text-align: left; font-weight: 800; color: #ffffff; font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; font-family: sans-serif;">${h.replace(/\*\*/g, '')}</th>`).join('')}
                </tr>
              </thead>
              <tbody>
                ${tableRows.slice(1).map((row, idx) => `
                  <tr style="background-color: ${idx % 2 === 0 ? '#ffffff' : '#f9fafb'}; border-bottom: 1px solid #f1f5f9;">
                    ${row.map(c => {
                      let cellText = c.trim()
                        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                        .replace(/\*(.*?)\*/g, '<em>$1</em>');
                      
                      const numericValue = parseFloat(c.replace(/[^0-9.]/g, ''));
                      const isPercentage = c.includes('%');
                      let visualBar = '';
                      if (c.toLowerCase().includes('alto') || c.toLowerCase().includes('high')) {
                        visualBar = '<div style="height: 6px; background: #ef4444; width: 80%; border-radius: 3px; margin-top: 4px;"></div>';
                      } else if (c.toLowerCase().includes('medio') || c.toLowerCase().includes('medium')) {
                        visualBar = '<div style="height: 6px; background: #f59e0b; width: 50%; border-radius: 3px; margin-top: 4px;"></div>';
                      } else if (c.toLowerCase().includes('bajo') || c.toLowerCase().includes('low')) {
                        visualBar = '<div style="height: 6px; background: #10b981; width: 25%; border-radius: 3px; margin-top: 4px;"></div>';
                      } else if (!isNaN(numericValue) && (isPercentage || (numericValue > 0 && numericValue <= 100))) {
                        const barWidth = Math.min(numericValue, 100);
                        const barColor = numericValue > 80 ? '#ef4444' : numericValue > 40 ? '#b59441' : '#10b981';
                        visualBar = `<div style="height: 4px; background: ${barColor}; width: ${barWidth}%; border-radius: 2px; margin-top: 4px; opacity: 0.8;"></div>`;
                      }
                      return `<td style="padding: 16px; border: 1px solid #f1f5f9; color: #1e293b; font-size: 14px; line-height: 1.5; font-weight: ${c.startsWith('**') ? '700' : '400'};">${cellText}${visualBar}</td>`;
                    }).join('')}
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `;
        tableRows = [];
      }
      inTable = false;
    };

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        const cleanLine = line.trim();
        if (cleanLine.startsWith('|') || (cleanLine.includes('|') && cleanLine.split('|').length > 2)) {
          inTable = true;
          if (!cleanLine.includes('---')) {
            const cells = cleanLine.split('|').filter((_, idx, arr) => (idx > 0 && idx < arr.length - 1) || arr.length <= 2).map(c => c.trim()).filter(c => c !== '');
            if (cells.length > 0) tableRows.push(cells);
          }
          continue;
        } else if (inTable) {
          flushTable();
        }
  
        if (cleanLine.startsWith('#')) {
          const level = (cleanLine.match(/^#+/) || ['#'])[0].length;
          const text = cleanLine.replace(/^#+\s*/, '');
          processedContent += `<h${level} style="color: #121d33; margin-top: 35px; margin-bottom: 12px; font-family: 'Georgia', serif; font-weight: 900; line-height: 1.2;">${text}</h${level}>`;
        } else if (cleanLine.startsWith('- ') || cleanLine.startsWith('* ')) {
          processedContent += `<li style="margin-left: 20px; margin-bottom: 8px; color: #334155; list-style-type: square;">${cleanLine.replace(/^[-*]\s*/, '').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</li>`;
        } else if (cleanLine === '') {
          processedContent += '<div style="height: 12px;"></div>';
        } else {
          processedContent += `<p style="margin-bottom: 20px; text-align: justify; color: #334155; line-height: 1.9;">${cleanLine.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</p>`;
        }
    }
    if (inTable) flushTable();

    return `
      <div style="font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; color: #1e293b; line-height: 1.7; max-width: 900px; margin: auto; border: 1px solid #e2e8f0; padding: 0; border-radius: 16px; background-color: #ffffff; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1);">
        <div style="background-color: #121d33; background-image: radial-gradient(circle at top right, #1e293b, #121d33); color: white; padding: 60px 40px; text-align: center; border-bottom: 8px solid #b59441;">
          <p style="color: #b59441; text-transform: uppercase; letter-spacing: 4px; font-weight: 800; font-size: 11px; margin-bottom: 20px;">${editorial.area}</p>
          <h1 style="color: #ffffff; margin-bottom: 20px; font-size: 3em; font-family: 'Georgia', serif; font-weight: 900; line-height: 1.1; letter-spacing: -0.02em;">${editorial.title}</h1>
          <div style="display: inline-block; padding: 10px 25px; border: 1px solid rgba(181, 148, 65, 0.4); border-radius: 50px; background-color: rgba(255,255,255,0.05);">
            <p style="color: #cbd5e1; font-size: 14px; margin: 0;"><b>POR: ${editorial.author.toUpperCase()}</b> | ${editorial.date}</p>
          </div>
        </div>
        <div style="padding: 50px 60px;">
          <div style="display: grid; grid-template-columns: 1fr; gap: 30px; margin-bottom: 50px;">
            <div style="background-color: #f8fafc; padding: 35px; border-radius: 12px; border: 1px solid #e2e8f0; position: relative; overflow: hidden;">
              <div style="position: absolute; top: 0; left: 0; width: 6px; height: 100%; background-color: #121d33;"></div>
              <h3 style="margin-top: 0; color: #121d33; font-size: 1.4em; font-weight: 800; text-transform: uppercase; letter-spacing: 1px;">Resumen Ejecutivo</h3>
              <p style="text-align: justify; color: #475569; font-size: 1.05em; font-style: italic; line-height: 1.8;">${editorial.summary}</p>
            </div>
            ${editorial.managerSummary ? `<div style="background-color: #fffbeb; padding: 35px; border-radius: 12px; border: 1px solid #fef3c7; position: relative;"><div style="position: absolute; top: 0; left: 0; width: 6px; height: 100%; background-color: #b59441;"></div><h3 style="margin-top: 0; color: #92400e; font-size: 1.4em; font-weight: 800; text-transform: uppercase;">Management Advice</h3><p style="color: #78350f; line-height: 1.8; font-size: 1.05em;">${editorial.managerSummary}</p></div>` : ''}
          </div>
          <div style="font-size: 17px; color: #334155; line-height: 1.9;">${processedContent}</div>
          <div style="margin-top: 80px; padding-top: 40px; border-top: 2px solid #f1f5f9; text-align: center;">
            <div style="margin-bottom: 20px;"><span style="font-size: 24px; font-weight: 900; color: #121d33; font-family: 'Georgia', serif;">CONTAPRO<span style="color: #b59441;">DC</span></span></div>
            <p style="color: #94a3b8; font-size: 13px; margin: 0; font-weight: 600; letter-spacing: 1px;">INTELIGENCIA NORMATIVA & ESTRATEGIA CONTABLE</p>
          </div>
        </div>
      </div>
    `;
  };

  const copyForGoogleSites = () => {
    const htmlContent = generateFullHTML();
    try {
      // Use text/html for direct pasting if the browser supports it better
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const plainBlob = new Blob([htmlContent], { type: 'text/plain' });
      const data = [new ClipboardItem({ 'text/html': blob, 'text/plain': plainBlob })];
      navigator.clipboard.write(data);
    } catch (e) {
      navigator.clipboard.writeText(htmlContent);
    }
    alert("¡Código Copiado! En Google Sites elige: Insertar > Incorporar > Incorporar código.");
  };

  const exportToPPT = async () => {
    setIsExporting(true);
    try {
      const pres = new pptxgen();
      pres.layout = 'LAYOUT_16x9';
      
      const BRAND_NAVY = '121D33';
      const BRAND_ACCENT = 'B59441';
      const BRAND_WHITE = 'FFFFFF';
      const BRAND_SLATE = '475569';
      const BRAND_BG = 'F8FAFC';

      // Enhanced Helper for Header/Footer (Standard corporate look)
      const addStandardShell = (slide: any, title?: string) => {
        // Decorative top bar
        slide.addShape(pres.ShapeType.rect, { x: 0, y: 0, w: '100%', h: 0.05, fill: { color: BRAND_ACCENT } });
        
        // Brand identification
        slide.addText("CONTAPRO DC", { x: 0.5, y: 0.2, w: 2, fontSize: 10, fontFace: 'Arial', color: BRAND_NAVY, bold: true });
        slide.addText("INTELIGENCIA NORMATIVA", { x: '40%', y: 0.2, w: 3, fontSize: 8, fontFace: 'Arial', color: BRAND_SLATE, align: 'center', charSpacing: 2 });
        slide.addText("© 2026", { x: 8, y: 0.2, w: 1.5, fontSize: 8, fontFace: 'Arial', color: BRAND_SLATE, align: 'right' });
        
        if (title) {
          slide.addText(title.toUpperCase(), { 
            x: 0.5, y: 0.8, w: '90%', fontSize: 32, fontFace: 'Arial', color: BRAND_NAVY, bold: true 
          });
          // Underline title
          slide.addShape(pres.ShapeType.rect, { x: 0.5, y: 1.4, w: 1.0, h: 0.04, fill: { color: BRAND_ACCENT } });
        }
        
        // Sub-decor on bottom
        slide.addText("www.contaprodc.com", { x: 0.5, y: 5.3, w: 3, fontSize: 8, color: BRAND_SLATE, italic: true });
      };

      // 1. Corporate Cover Slide
      let coverSlide = pres.addSlide();
      coverSlide.background = { color: BRAND_NAVY };
      
      // Decorative elements on cover
      coverSlide.addShape(pres.ShapeType.rect, { x: '70%', y: 0, w: '30%', h: '100%', fill: { color: '1A2A47' } });
      coverSlide.addShape(pres.ShapeType.rect, { x: '75%', y: 0, w: '0.5%', h: '100%', fill: { color: BRAND_ACCENT } });

      coverSlide.addText("REPORTE EJECUTIVO", { 
        x: 0.5, y: 1.5, w: 4, fontSize: 14, color: BRAND_ACCENT, bold: true, charSpacing: 4 
      });
      
      coverSlide.addText(editorial.title.toUpperCase(), { 
        x: 0.5, y: 2.0, w: '60%', fontSize: 48, color: BRAND_WHITE, bold: true, fontFace: 'Arial'
      });

      coverSlide.addText(`POR: ${editorial.author.toUpperCase()}`, { 
        x: 0.5, y: 4.5, w: 5, fontSize: 12, color: BRAND_WHITE, fontFace: 'Arial'
      });
      coverSlide.addText(`${editorial.date} | ${editorial.area.toUpperCase()}`, { 
        x: 0.5, y: 4.8, w: 5, fontSize: 10, color: '8E97A4', fontFace: 'Arial'
      });

      // 2. Summary Slide
      let summarySlide = pres.addSlide();
      summarySlide.background = { color: BRAND_WHITE };
      addStandardShell(summarySlide, "Resumen Ejecutivo");
      
      summarySlide.addShape(pres.ShapeType.rect, { x: 0.5, y: 1.8, w: '90%', h: 3.2, fill: { color: BRAND_BG } });
      summarySlide.addText(editorial.summary, { 
        x: 0.8, y: 2.0, w: 8.5, h: 2.8, fontSize: 18, color: BRAND_NAVY, fontFace: 'Arial', align: 'justify' 
      });

      // 3. Content Slides
      const sections = editorial.content.split(/^## /gm).filter(s => s.trim() !== '');
      sections.forEach((section, idx) => {
        const lines = section.split('\n');
        const sectionTitle = idx === 0 && !section.startsWith('## ') ? "Análisis Técnico" : lines[0].trim();
        const contentBody = lines.slice(1).join('\n').trim();
        if (!contentBody) return;

        const bodyLines = contentBody.split('\n');
        const parts: {type: 'text' | 'table', content: any}[] = [];
        let currentTextLines: string[] = [];
        let currentTableLines: string[] = [];

        const flushText = () => {
          if (currentTextLines.length > 0) {
            parts.push({ type: 'text', content: currentTextLines.join('\n').trim() });
            currentTextLines = [];
          }
        };
        const flushTable = () => {
          if (currentTableLines.length > 0) {
            const rows = currentTableLines
              .filter(l => !l.includes('---'))
              .map(l => l.split('|').filter(c => c.trim() !== '').map(c => c.trim()))
              .filter(r => r.length > 0);
            if (rows.length > 0) parts.push({ type: 'table', content: rows });
            currentTableLines = [];
          }
        };

        bodyLines.forEach(line => {
          if (line.trim().startsWith('|')) {
            flushText();
            currentTableLines.push(line);
          } else {
            if (currentTableLines.length > 0) flushTable();
            currentTextLines.push(line);
          }
        });
        flushText();
        flushTable();

        parts.forEach(part => {
          if (part.type === 'text') {
            const MAX_CHARS = 1000;
            const textContent = part.content;
            for (let i = 0; i < textContent.length; i += MAX_CHARS) {
              const chunk = textContent.substring(i, i + MAX_CHARS);
              let detailSlide = pres.addSlide();
              addStandardShell(detailSlide, sectionTitle);
              detailSlide.addText(chunk, { x: 0.5, y: 1.8, w: '90%', h: 3.5, fontSize: 14, color: BRAND_NAVY, align: 'justify' });
            }
          } else {
            let detailSlide = pres.addSlide();
            addStandardShell(detailSlide, sectionTitle);
            detailSlide.addTable(part.content as any, { 
              x: 0.5, y: 1.8, w: 9, 
              border: { type: 'solid', color: 'E2E8F0', pt: 0.5 }, 
              fill: { color: BRAND_WHITE }, 
              color: BRAND_NAVY, 
              fontSize: 10,
              autoPage: true
            });
          }
        });
      });

      // 4. Closing
      let closingSlide = pres.addSlide();
      closingSlide.background = { color: BRAND_NAVY };
      closingSlide.addShape(pres.ShapeType.rect, { x: 0, y: '45%', w: '100%', h: '10%', fill: { color: '1A2A47' } });
      closingSlide.addText("GRACIAS.", { x: 0, y: '40%', w: '100%', align: 'center', fontSize: 60, color: BRAND_WHITE, bold: true });
      closingSlide.addText("CONTAPRO DC - Inteligencia que genera confianza.", { x: 0, y: '58%', w: '100%', align: 'center', fontSize: 14, color: BRAND_ACCENT, bold: true });

      await pres.writeFile({ fileName: `CONTAPRO_${editorial.title.replace(/\s+/g, '_')}.pptx` });
    } catch (err) {
      console.error("PPT Export Error:", err);
      alert("Error al generar el PPT.");
    } finally {
       setIsExporting(false);
    }
  };


  const exportStorySlidesToPPT = () => {
    if (!storySlides || storySlides.length === 0) return;
    const pres = new pptxgen();
    pres.layout = 'LAYOUT_16x9';

    const BRAND_NAVY = '121D33';
    const BRAND_ACCENT = 'B59441';
    const BRAND_WHITE = 'FFFFFF';
    const BRAND_SLATE = '475569';
    const BRAND_BG = 'F8FAFC';

    // 1. Title Slide
    let titleSlide = pres.addSlide();
    titleSlide.background = { color: BRAND_NAVY };
    titleSlide.addText("storyboard.", { x: 0, y: '35%', w: '100%', align: 'center', fontSize: 100, color: BRAND_WHITE, bold: true, fontFace: 'Arial' });
    titleSlide.addText(editorial.title.toLowerCase(), { x: 0, y: '50%', w: '100%', align: 'center', fontSize: 28, color: BRAND_ACCENT, bold: true });
    titleSlide.addText("Podcast & Video Script Prototype", { x: 0, y: '70%', w: '100%', align: 'center', fontSize: 12, color: BRAND_WHITE });

    // 2. Each Slide as a Design Mockup
    storySlides.forEach((slide, idx) => {
      let s = pres.addSlide();
      s.background = { color: BRAND_WHITE };

      // Header
      s.addText("CONTAPRO DC", { x: 0.5, y: 0.3, w: 2, fontSize: 10, fontFace: 'Arial', color: BRAND_SLATE, bold: true });
      s.addText(`PRODUCCIÓN MULTIMEDIA - SLIDE 0${idx + 1}`, { x: '40%', y: 0.3, w: 5, fontSize: 10, fontFace: 'Arial', color: BRAND_SLATE, align: 'right', bold: true });
      
      // Visual Area (Simulating the screen)
      s.addShape(pres.ShapeType.roundRect, { x: 0.5, y: 0.8, w: 4, h: 4.5, fill: { color: BRAND_NAVY }, rectRadius: 0.05 });
      s.addText(slide.title.toUpperCase(), { x: 0.7, y: 1.5, w: 3.6, fontSize: 24, color: BRAND_ACCENT, bold: true, align: 'center' });
      s.addText(slide.body, { x: 0.7, y: 2.8, w: 3.6, fontSize: 11, color: BRAND_WHITE, align: 'center' });
      
      // Script Area
      s.addText("GUION DE LOCUCIÓN", { x: 5.0, y: 0.8, w: 4.5, fontSize: 14, color: BRAND_NAVY, bold: true });
      s.addShape(pres.ShapeType.rect, { x: 5.0, y: 1.1, w: 1, h: 0.05, fill: { color: BRAND_ACCENT } });
      
      s.addText(slide.script, { 
        x: 5.0, y: 1.4, w: 4.2, h: 3, 
        fontSize: 12, color: BRAND_SLATE, fontFace: 'Arial', align: 'justify', italic: true 
      });

      // Meta info
      s.addShape(pres.ShapeType.roundRect, { x: 5.0, y: 4.5, w: 4.2, h: 0.8, fill: { color: BRAND_BG }, rectRadius: 0.1 });
      s.addText(`ESTILO DE VOZ: ${voiceStyle}`, { x: 5.2, y: 4.6, w: 4, fontSize: 10, color: BRAND_NAVY, bold: true });
      s.addText(`GÉNERO: ${voiceType === 'masculine' ? 'Masculino' : 'Femenino'}`, { x: 5.2, y: 4.9, w: 4, fontSize: 9, color: BRAND_SLATE });
    });

    // 3. Ending
    let endSlide = pres.addSlide();
    endSlide.background = { color: BRAND_NAVY };
    endSlide.addText("Listo para producir.", { x: 0, y: '40%', w: '100%', align: 'center', fontSize: 80, color: BRAND_WHITE, bold: true });

    pres.writeFile({ fileName: `STORYBOARD_CONTAPRO_${editorial.title.replace(/\s+/g, '_')}.pptx` });
  };

  const exportToWord = async () => {
    setIsExporting(true);
    try {
      const docData = new Document({
        styles: {
          default: {
            heading1: {
              run: { size: 48, bold: true, color: "121D33", font: "Calibri" },
              paragraph: { spacing: { before: 240, after: 120 } },
            }
          }
        },
        sections: [{
          properties: {
            page: {
              margin: { top: 720, right: 720, bottom: 720, left: 720 },
            },
          },
          headers: {
            default: new Header({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({ text: "CONTAPRO ", bold: true, color: "121D33", size: 24 }),
                    new TextRun({ text: "DC", bold: true, color: "B59441", size: 24 }),
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
                    new TextRun({ text: "Página ", size: 18 }),
                    new TextRun({ children: [PageNumber.CURRENT], size: 18 }),
                    new TextRun({ text: " de ", size: 18 }),
                    new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 18 }),
                    new TextRun({ text: " | www.contaprodc.com", size: 18, color: "475569" }),
                  ],
                }),
              ],
            }),
          },
          children: [
            new Paragraph({
              text: editorial.title.toUpperCase(),
              heading: HeadingLevel.TITLE,
              alignment: AlignmentType.LEFT,
              spacing: { after: 200 },
            }),
            new Paragraph({
              children: [
                new TextRun({ text: `ÁREA: ${editorial.area.toUpperCase()}`, bold: true, color: "B59441", size: 18 }),
                new TextRun({ text: ` | FECHA: ${editorial.date}`, size: 18, color: "475569" }),
              ],
              spacing: { after: 400 },
            }),

            new Paragraph({
              children: [
                new TextRun({ text: "AUTOR: ", bold: true, size: 20 }),
                new TextRun({ text: editorial.author.toUpperCase(), size: 20 }),
              ],
              spacing: { after: 400 },
              border: { bottom: { color: "E2E8F0", space: 1, style: "single", size: 1 } },
            }),
            
            new Paragraph({
              text: "RESUMEN EJECUTIVO",
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 400, after: 200 },
            }),
            new Paragraph({
              text: editorial.summary,
              spacing: { after: 300 },
              alignment: AlignmentType.JUSTIFIED,
            }),
            
            ...(editorial.managerSummary ? [
              new Paragraph({
                text: "ANÁLISIS PARA GERENCIA",
                heading: HeadingLevel.HEADING_2,
                spacing: { before: 400, after: 200 },
              }),
              new Paragraph({
                text: editorial.managerSummary,
                spacing: { after: 300 },
                alignment: AlignmentType.JUSTIFIED,
              })
            ] : []),

            new Paragraph({
              text: "ANÁLISIS TÉCNICO",
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 400, after: 200 },
            }),
            ...editorial.content.split('\n').filter(p => p.trim() !== '').map(line => {
              if (line.startsWith('## ')) {
                return new Paragraph({
                  text: line.replace('## ', '').toUpperCase(),
                  heading: HeadingLevel.HEADING_2,
                  spacing: { before: 300, after: 150 },
                });
              } else if (line.startsWith('### ')) {
                return new Paragraph({
                  text: line.replace('### ', ''),
                  heading: HeadingLevel.HEADING_3,
                  spacing: { before: 200, after: 100 },
                });
              } else {
                return new Paragraph({
                  children: [new TextRun(line)],
                  spacing: { after: 150 },
                  alignment: AlignmentType.JUSTIFIED,
                });
              }
            }),
            
            new Paragraph({
              text: "— FIN DEL REPORTE —",
              spacing: { before: 800 },
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: "— FIN DEL REPORTE —", color: "B59441", bold: true, size: 18 })]
            }),
          ],
        }],
      });

      const blob = await Packer.toBlob(docData);
      saveAs(blob, `CONTAPRO_DC_${editorial.title.replace(/\s+/g, '_')}.docx`);
    } catch (err) {
      console.error("Word Export Error:", err);
      alert("Error al generar el documento Word.");
    } finally {
      setIsExporting(false);
    }
  };


  const exportToPDF = async () => {
    setIsExporting(true);
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const margin = 25;
      const pageWidth = 210;
      const contentWidth = pageWidth - (margin * 2);
      
      // Calculate dynamic title lines and banner height first
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(22);
      const titleLines = pdf.splitTextToSize(editorial.title.toUpperCase(), contentWidth);
      const titleHeightOffset = (titleLines.length - 1) * 8;
      const bannerHeight = 58 + titleHeightOffset;

      // 1. Initial Branding & Header
      // Dynamic Title Header Background
      pdf.setFillColor(18, 29, 51); // Deep Navy
      pdf.rect(0, 0, pageWidth, bannerHeight, 'F');
      
      // Logo Element (Recreated)
      // Navy Box
      pdf.setFillColor(255, 255, 255);
      pdf.rect(margin, 12, 10, 10, 'F');
      pdf.setFont("times", "bold");
      pdf.setFontSize(16);
      pdf.setTextColor(18, 29, 51);
      pdf.text("C", margin + 2.5, 19.5);
      
      // Gold Box
      pdf.setFillColor(181, 148, 65);
      pdf.rect(margin + 6, 17, 8, 8, 'F');
      pdf.setFontSize(12);
      pdf.setTextColor(255, 255, 255);
      pdf.text("D", margin + 8.5, 23);

      // REVISTA CONTABLE, FINANCIERA Y EMPRESARIAL
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(10);
      pdf.setTextColor(181, 148, 65);
      pdf.text("REVISTA CONTABLE, FINANCIERA Y EMPRESARIAL", margin + 18, 13);

      // CONTAPRO DC
      pdf.setFontSize(22);
      pdf.setTextColor(255, 255, 255);
      pdf.text("CONTAPRO DC", margin + 18, 21);

      // CONSULTORÍA PROFESIONAL Y ESTRATÉGICA
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9);
      pdf.setTextColor(255, 255, 255);
      pdf.text("CONSULTORÍA PROFESIONAL Y ESTRATÉGICA", margin + 18, 26, { charSpace: 1 });

      // Editorial Title (Rendered safely)
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(22);
      pdf.setTextColor(255, 255, 255);
      pdf.text(titleLines, margin, 40);
      
      // Dynamic placement for category and dynamic sub-header marker
      pdf.setFontSize(9);
      pdf.setTextColor(181, 148, 65); // Corporate Gold
      pdf.setFont("helvetica", "bold");
      const goldTextY = 50 + titleHeightOffset;
      pdf.text(`REPORTE TÉCNICO ESTRATÉGICO | ${editorial.area.toUpperCase()}`, margin, goldTextY);
      
      // Place metadata bar cleanly after banner with dynamic y offset
      let y = bannerHeight + 8;
      
      // 2. Metadata Section (Horizontal Bar - Spacious Multi-line list to avoid all overlaps)
      const metadataBoxHeight = 18;
      pdf.setFillColor(248, 250, 252);
      pdf.rect(margin, y - 5, contentWidth, metadataBoxHeight, 'F');
      
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(8.5);
      pdf.setTextColor(71, 85, 105);
      
      const areaText = `ÁREA: ${editorial.area.toUpperCase()}`;
      const dateText = `FECHA: ${editorial.date || ''}`;
      const displayAuthor = (editorial.author.toUpperCase().includes("ROSALES") || editorial.author.toUpperCase().includes("FRANCISCO"))
        ? "ING. COM. SEGUNDO CUENCA C, MAGISTER EN AUDITORIA INTEGRAL"
        : editorial.author.toUpperCase();
      const authorText = `AUTOR: ${displayAuthor}`;
      
      // Line 1: Area & Date
      pdf.text(areaText, margin + 5, y + 1);
      pdf.text(dateText, pageWidth - margin - 5, y + 1, { align: 'right' });
      
      // Line 2: Author
      pdf.text(authorText, margin + 5, y + 8);
      
      y += metadataBoxHeight + 8;

      // 3. Executive Summaries (Professional Layout)
      pdf.setFillColor(241, 245, 249);
      pdf.setDrawColor(181, 148, 65);
      pdf.setLineWidth(1.2);
      
      const summaryLines = pdf.splitTextToSize(editorial.summary, contentWidth - 16);
      const boxPadding = 10;
      const boxHeight = (summaryLines.length * 6) + (boxPadding * 2) + 8;
      
      pdf.rect(margin, y, contentWidth, boxHeight, 'F');
      pdf.setDrawColor(181, 148, 65);
      pdf.setLineWidth(1.5);
      pdf.line(margin, y, margin, y + boxHeight); // Gold side bar
      
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(11);
      pdf.setTextColor(181, 148, 65);
      pdf.text("RESUMEN EJECUTIVO", margin + 8, y + 8);
      
      pdf.setFont("helvetica", "italic");
      pdf.setFontSize(10);
      pdf.setTextColor(51, 65, 85);
      pdf.text(summaryLines, margin + 8, y + 18);
      y += boxHeight + 15;

      if (editorial.managerSummary) {
        const mLines = pdf.splitTextToSize(editorial.managerSummary, contentWidth - 16);
        const mHeight = (mLines.length * 6) + (boxPadding * 2) + 8;
        
        pdf.setFillColor(250, 250, 250);
        pdf.rect(margin, y, contentWidth, mHeight, 'F');
        pdf.setDrawColor(15, 23, 42);
        pdf.setLineWidth(1.5);
        pdf.line(margin, y, margin, y + mHeight); // Navy side bar

        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(11);
        pdf.setTextColor(15, 23, 42);
        pdf.text("ESTRATEGIA Y GERENCIA", margin + 8, y + 8);

        pdf.setFont("times", "normal");
        pdf.setFontSize(11);
        pdf.setTextColor(51, 65, 85);
        pdf.text(mLines, margin + 8, y + 18);
        y += mHeight + 15;
      } else {
        y += 5;
      }

      // 4. Interactive Index (Table of Contents)
      const contentLines = editorial.content.split('\n');
      const tocEntries: { title: string; level: number; page: number; y: number }[] = [];
      
      pdf.addPage();
      const tocPageNumber = (pdf as any).getNumberOfPages();
      let tocY = 35;
      
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(16);
      pdf.setTextColor(18, 29, 51);
      pdf.text("CONTENIDO DEL REPORTE", margin, tocY);
      pdf.setDrawColor(181, 148, 65);
      pdf.setLineWidth(0.8);
      pdf.line(margin, tocY + 3, pageWidth - margin, tocY + 3);
      tocY += 15;

      y = 35; 
      pdf.addPage(); // Content starts on page 3
      
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(12);
      pdf.setTextColor(18, 29, 51);
      pdf.text("III. ANÁLISIS DETALLADO", margin, y);
      y += 10;

      let isInCodeBlock = false;
      
      for (let i = 0; i < contentLines.length; i++) {
        const line = contentLines[i];
        
        if (line.trim().startsWith('```')) {
          isInCodeBlock = !isInCodeBlock;
          y += 2;
          continue;
        }

        if (y > 270) {
          pdf.addPage();
          pdf.setDrawColor(240, 240, 240);
          pdf.line(margin, 15, pageWidth - margin, 15);
          y = 25;
        }

        if (isInCodeBlock) {
          pdf.setFont("courier", "normal");
          pdf.setFontSize(10);
          pdf.setTextColor(80, 80, 80);
          pdf.setFillColor(248, 248, 248);
          const wrapped = pdf.splitTextToSize(line, contentWidth - 10);
          pdf.rect(margin, y - 4, contentWidth, (wrapped.length * 5) + 1, 'F');
          pdf.text(wrapped, margin + 5, y);
          y += (wrapped.length * 5) + 1;
          continue;
        }

        // Table Detection
        if (line.trim().startsWith('|')) {
          const tableRows: string[][] = [];
          let j = i;
          while(j < contentLines.length && contentLines[j].trim().startsWith('|')) {
             const rowLine = contentLines[j].trim();
             if (!rowLine.includes('---')) {
               const cells = rowLine.split('|').filter(c => c.trim() !== '').map(c => c.trim());
               if (cells.length > 0) tableRows.push(cells);
             }
             j++;
          }
          i = j - 1;

          if (tableRows.length > 0) {
            const head = tableRows.slice(0, 1);
            const body = tableRows.slice(1);
            
            autoTable(pdf, {
               startY: y,
               head: head,
               body: body,
               margin: { left: margin, right: margin },
               tableWidth: contentWidth,
               theme: 'grid',
               headStyles: { 
                 fillColor: [18, 29, 51], 
                 textColor: [255, 255, 255], 
                 fontStyle: 'bold',
                 halign: 'center',
                 fontSize: 10
               },
               styles: { 
                 fontSize: 9, 
                 cellPadding: 3, 
                 lineColor: [226, 232, 240],
                 lineWidth: 0.1,
                 valign: 'middle'
               },
               columnStyles: {
                 0: { fontStyle: 'bold' }
               },
               didDrawPage: (data) => {
                 y = data.cursor?.y || y;
               }
            });
            y = (pdf as any).lastAutoTable.finalY + 12;
            continue;
          }
        }

        if (line.startsWith('### ')) {
          const title = line.replace('### ', '').trim();
          tocEntries.push({ title: title, level: 3, page: (pdf as any).getNumberOfPages(), y: y });
          
          y += 4;
          pdf.setFont("helvetica", "bold");
          pdf.setFontSize(11);
          pdf.setTextColor(181, 148, 65);
          pdf.text(title.toUpperCase(), margin, y);
          y += 8;
        } else if (line.startsWith('## ')) {
          const title = line.replace('## ', '').trim();
          tocEntries.push({ title: title, level: 2, page: (pdf as any).getNumberOfPages(), y: y });

          y += 6;
          pdf.setFont("helvetica", "bold");
          pdf.setFontSize(13);
          pdf.setTextColor(18, 29, 51);
          pdf.text(title.toUpperCase(), margin, y);
          y += 10;
        } else if (line.startsWith('# ')) {
          const title = line.replace('# ', '').trim();
          // We don't usually include H1 in TOC if it's the main title, but here it might be sub-sections
          tocEntries.push({ title: title, level: 1, page: (pdf as any).getNumberOfPages(), y: y });

          y += 8;
          pdf.setFont("helvetica", "bold");
          pdf.setFontSize(16);
          pdf.setTextColor(18, 29, 51);
          pdf.text(title.toUpperCase(), margin, y);
          y += 14;
        } else if (line.startsWith('- ') || line.startsWith('* ')) {
          pdf.setFont("helvetica", "normal");
          pdf.setFontSize(11);
          pdf.setTextColor(50, 50, 50);
          const bullet = "• ";
          const text = line.substring(2).replace(/[*_]/g, '');
          const wrapped = pdf.splitTextToSize(text, contentWidth - 8);
          pdf.text(bullet, margin, y);
          pdf.text(wrapped, margin + 6, y);
          y += (wrapped.length * 6) + 2;
        } else if (line.startsWith('|')) {
          pdf.setFont("courier", "normal");
          pdf.setFontSize(9);
          pdf.setTextColor(100, 100, 100);
          pdf.text(line, margin, y);
          y += 6;
        } else if (line.trim().length === 0) {
          y += 4;
        } else {
          pdf.setFont("helvetica", "normal");
          pdf.setFontSize(11);
          pdf.setTextColor(18, 29, 51);
          const cleanLine = line.replace(/[*_]/g, '');
          const wrapped = pdf.splitTextToSize(cleanLine, contentWidth);
          pdf.text(wrapped, margin, y);
          y += (wrapped.length * 6) + 2;
        }
      }

      // 5. Build the TOC on the reserved page
      pdf.setPage(tocPageNumber);
      tocEntries.forEach((entry) => {
        if (tocY > 275) {
          pdf.addPage(); // Handle very long TOCs
          tocY = 25;
        }
        
        const indent = (entry.level - 1) * 6;
        pdf.setFont("helvetica", entry.level === 1 ? "bold" : "normal");
        pdf.setFontSize(entry.level === 1 ? 11 : 10);
        pdf.setTextColor(entry.level === 1 ? 18 : 51, entry.level === 1 ? 29 : 65, entry.level === 1 ? 51 : 85);
        
        const pageText = `Pág. ${entry.page}`;
        const pageW = pdf.getTextWidth(pageText);
        const titleW = pageWidth - (margin * 2) - indent - pageW - 10;
        const truncatedTitle = pdf.getTextWidth(entry.title) > titleW ? entry.title.substring(0, 50) + "..." : entry.title;
        
        pdf.text(truncatedTitle, margin + indent, tocY);
        
        // Dots between title and page
        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(200, 200, 200);
        const startX = margin + indent + pdf.getTextWidth(truncatedTitle) + 2;
        const endX = pageWidth - margin - pageW - 2;
        if (endX > startX) {
          for (let dotX = startX; dotX < endX; dotX += 2) {
            pdf.text(".", dotX, tocY);
          }
        }
        
        pdf.setTextColor(181, 148, 65);
        pdf.text(pageText, pageWidth - margin, tocY, { align: 'right' });
        
        // Interactive Link
        pdf.link(margin, tocY - 4, pageWidth - (margin * 2), 6, { pageNumber: entry.page });
        
        tocY += 7;
      });

      // 6. Final Pagination & Validation
      const totalPages = (pdf as any).internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(8);
        pdf.setTextColor(150, 150, 150);
        pdf.text(`CONTAPRO DC ECUADOR | Reporte de Inteligencia Normativa`, margin, 287);
        pdf.text(`Página ${i} de ${totalPages}`, pageWidth - margin, 287, { align: 'right' });
      }

      pdf.save(`CONTAPRO_TÉCNICO_${editorial.title.replace(/\s+/g, '_')}.pdf`);
    } catch (err) {
      console.error("PDF Export Error:", err);
      alert("Error al generar el PDF de alta calidad.");
    } finally {
      setIsExporting(false);
    }
  };

  const exportToMarkdown = () => {
    const markdownContent = `# ${editorial.title}\n\n` +
      `**Autor:** ${editorial.author}\n` +
      `**Fecha:** ${editorial.date}\n` +
      `**Área:** ${editorial.area}\n\n` +
      `---\n\n` +
      `## Resumen Ejecutivo\n${editorial.summary}\n\n` +
      (editorial.managerSummary ? `## Summary for Management\n${editorial.managerSummary}\n\n` : '') +
      `---\n\n` +
      `${editorial.content}`;
      
    const blob = new Blob([markdownContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `CONTAPRO_DC_${editorial.title.replace(/\s+/g, '_')}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (isDigitalView) {
    // Interactive Page Splitter: split by headings `## `
    const rawSections = cleanEditorialContent(editorial?.content || "")
      .split(/(?=##\s)/g)
      .map(s => s.trim())
      .filter(Boolean);

    // Cover Page is represented with a special "COVER_PAGE" string
    const magazinePages = ["COVER_PAGE", ...rawSections];
    const totalPagesCount = magazinePages.length;

    // Maximum pages limit depends on double spread
    const maxPageIndex = doublePageSpread 
      ? Math.ceil((totalPagesCount - 1) / 2) 
      : totalPagesCount - 1;

    // Clamped active index
    const activePageIndex = Math.min(Math.max(0, bookPageIndex), maxPageIndex);

    const handlePrevPage = () => {
      setBookPageIndex(prev => Math.max(0, prev - 1));
    };

    const handleNextPage = () => {
      setBookPageIndex(prev => Math.min(maxPageIndex, prev + 1));
    };

    const zoomIn = () => setZoomScale(scale => Math.min(180, scale + 10));
    const zoomOut = () => setZoomScale(scale => Math.max(50, scale - 10));
    const resetZoom = () => setZoomScale(100);

    // Keyboard flip page handler
    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'ArrowRight') {
          setBookPageIndex(prev => Math.min(maxPageIndex, prev + 1));
        } else if (e.key === 'ArrowLeft') {
          setBookPageIndex(prev => Math.max(0, prev - 1));
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }, [maxPageIndex]);

    const renderConceptPage = (pageIdx: number, shadowSide: 'left' | 'right' | 'none') => {
      if (pageIdx >= totalPagesCount) return null;
      const pageMarkdown = magazinePages[pageIdx];
      
      if (pageMarkdown === "COVER_PAGE") return null;

      return (
        <div className="w-full max-w-[480px] aspect-[1/1.4] bg-white rounded-sm shadow-2xl relative border border-brand-border/40 flex flex-col justify-between p-8 md:p-10 text-brand-navy select-text">
          {/* Book Binding Joint Shadow overlay */}
          {shadowSide === 'left' && (
            <div className="absolute top-0 right-0 w-8 h-full bg-linear-to-l from-black/[0.04] to-transparent pointer-events-none" />
          )}
          {shadowSide === 'right' && (
            <div className="absolute top-0 left-0 w-8 h-full bg-linear-to-r from-black/[0.04] to-transparent pointer-events-none" />
          )}

          {/* Top bar header of physical page */}
          <div className="flex justify-between items-center text-[8px] font-black uppercase text-brand-slate tracking-widest border-b border-brand-border/20 pb-2 mb-4 select-none">
            <span>CONTAPRO DC • INTELIGENCIA NORMATIVA</span>
            <span className="text-brand-accent">{editorial?.area}</span>
          </div>

          {/* Contents area with scrollbar inside limits */}
          <div className="flex-1 overflow-y-auto pr-2 scrollbar-thin text-justify text-xs leading-relaxed prose prose-sm prose-slate max-w-none text-brand-navy/95 font-medium">
            <div className="markdown-body">
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={MarkdownComponents}>
                {pageMarkdown}
              </ReactMarkdown>
            </div>
          </div>

          {/* Footnotes of physical page */}
          <div className="flex justify-between items-center text-[8px] font-black uppercase text-brand-slate tracking-widest border-t border-brand-border/10 pt-3 mt-4 select-none">
            <span>COOPERATIVISMO STRATEGIC REPORT</span>
            <span className="text-brand-navy bg-brand-bg px-2 py-0.5 rounded font-bold">Pág. {pageIdx}</span>
          </div>
        </div>
      );
    };

    return (
      <div 
        ref={digitalContainerRef}
        className="fixed inset-0 z-[100] bg-brand-navy overflow-hidden flex flex-col"
        style={{ background: 'radial-gradient(circle at center, #0a1c3a 0%, #030a16 100%)' }}
      >
        <motion.div 
          className="fixed top-0 left-0 right-0 h-1 bg-brand-accent origin-left z-[110]"
          style={{ scaleX }}
        />
        
        {/* Magazine Header (Encabezado con logo y nombre de la revista) */}
        <div className="h-20 bg-[#030a16]/90 border-b border-brand-border/20 px-6 flex items-center justify-between z-50 text-white shrink-0 shadow-lg">
          <div className="flex items-center gap-4">
            <Logo light />
            <span className="hidden md:inline px-3 py-1 bg-brand-accent/20 border border-brand-accent/30 text-brand-accent rounded-sm text-[9px] font-black uppercase tracking-[0.25em] leading-none">
              Revista Interactiva 2026
            </span>
          </div>
          
          {/* Interactive Page Passing Control Bar */}
          <div className="flex items-center gap-3">
            <button 
              onClick={handlePrevPage} 
              disabled={activePageIndex === 0} 
              className="p-1.5 bg-white/5 hover:bg-white/15 text-white/90 disabled:opacity-30 rounded-full transition-all cursor-pointer"
              title="Página Anterior (Flecha Izquierda)"
            >
              <ChevronLeft size={16} />
            </button>
            
            <div className="text-center min-w-[130px] select-none">
              <div className="text-[10px] uppercase font-black text-brand-accent tracking-[0.15em]">
                {activePageIndex === 0 ? "PORTADA" : `PAGINADO REAL`}
              </div>
              <div className="text-[9px] text-white/50 font-bold uppercase tracking-wider">
                {doublePageSpread ? (
                  activePageIndex === 0 ? "Portada" : `Págs. ${2 * activePageIndex - 1} - ${Math.min(totalPagesCount - 1, 2 * activePageIndex)} de ${totalPagesCount - 1}`
                ) : (
                  activePageIndex === 0 ? "Portada" : `Pág. ${activePageIndex} de ${totalPagesCount - 1}`
                )}
              </div>
            </div>

            <button 
              onClick={handleNextPage} 
              disabled={activePageIndex === maxPageIndex} 
              className="p-1.5 bg-white/5 hover:bg-white/15 text-white/90 disabled:opacity-30 rounded-full transition-all cursor-pointer"
              title="Página Siguiente (Flecha Derecha)"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* Version select */}
            {relatedFichas.length > 1 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-white/10 rounded-sm">
                <select 
                  value={activeVersionFichaId || ''} 
                  onChange={(e) => setActiveVersionFichaId(e.target.value)}
                  className="bg-transparent text-white text-[9px] font-bold uppercase tracking-wider outline-none cursor-pointer"
                >
                  <option value="" className="bg-[#0a1120] text-white">Original</option>
                  {relatedFichas.map((v, idx) => (
                    <option key={v.id} value={v.id} className="bg-[#0a1120] text-white font-bold">Revisión {idx + 1}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Scale operations (Ampliar y Reducir) */}
            <div className="flex items-center bg-white/5 border border-white/10 rounded-sm p-0.5">
              <button 
                onClick={zoomOut} 
                title="Reducir tamaño de letra" 
                className="p-1 hover:bg-white/10 text-white cursor-pointer rounded"
              >
                <ZoomOut size={14} />
              </button>
              <span className="text-[9px] font-black text-brand-accent px-2 tracking-widest min-w-[42px] text-center">
                {zoomScale}%
              </span>
              <button 
                onClick={zoomIn} 
                title="Ampliar tamaño de letra (facilita lectura)" 
                className="p-1 hover:bg-white/10 text-white cursor-pointer rounded"
              >
                <ZoomIn size={14} />
              </button>
              <button 
                onClick={resetZoom} 
                title="Restaurar escala por defecto (100%)" 
                className="p-1 hover:bg-white/10 text-white cursor-pointer rounded ml-0.5 border-l border-white/10"
              >
                <RotateCcw size={12} />
              </button>
            </div>

            {/* Layout view option toggle */}
            <button 
              onClick={() => setDoublePageSpread(!doublePageSpread)} 
              className="flex items-center gap-1 px-2.5 py-1.5 bg-white/5 border border-white/10 rounded-sm text-[9px] uppercase tracking-wider hover:bg-brand-accent hover:text-brand-navy font-black transition-all cursor-pointer"
              title="Cambiar formato de visualización"
            >
              {doublePageSpread ? "Pág única" : "Libro doble"}
            </button>

            {/* Academic voice activation */}
            <button 
              onClick={handleToggleReading} 
              title={isReading ? "Detener Audio Narrador" : "Activar Exposición por Voz Masculina Académica"} 
              className={`p-2 rounded-full border transition-all cursor-pointer hover:scale-105 active:scale-95 ${isReading ? 'bg-brand-accent border-brand-accent text-brand-navy shadow-[0_0_15px_rgba(181,148,65,0.4)]' : 'border-white/15 text-white hover:bg-white/10'}`}
            >
              {isReading ? <VolumeX size={15} className="animate-pulse" /> : <Volume2 size={15} />}
            </button>

            {/* Quick Actions Menu (PDF, Word, PPT, sites) */}
            <div className="flex gap-1 border-l border-white/10 pl-2">
              <button onClick={exportToPDF} title="Exportar PDF" className="p-1.5 bg-white/5 text-white rounded hover:bg-brand-accent hover:text-brand-navy transition-all cursor-pointer">
                <FileText size={14} />
              </button>
              <button onClick={exportToWord} title="Exportar Word" className="p-1.5 bg-white/5 text-blue-400 rounded hover:bg-blue-600 hover:text-white transition-all cursor-pointer">
                <FileText size={14} />
              </button>
              <button onClick={exportToPPT} title="Exportar PPTX" className="p-1.5 bg-white/5 text-brand-accent rounded hover:bg-[#b59441] hover:text-white transition-all cursor-pointer">
                <Maximize2 size={14} />
              </button>
              <button 
                onClick={copyForGoogleSites} 
                title="Copiar para Google Sites" 
                className="p-1.5 bg-white/5 text-orange-400 rounded hover:bg-orange-500 hover:text-white transition-all cursor-pointer"
              >
                <Globe size={14} />
              </button>
            </div>

            {/* Análisis doctrinales de profundidad */}
            <button 
              disabled={isExpanding}
              onClick={handleDeepen}
              title="Ampliar Análisis y Fundamentación Doctrinal"
              className={`p-2 bg-brand-accent text-brand-navy rounded-full hover:scale-105 transition-all cursor-pointer ${isExpanding ? 'animate-pulse opacity-50' : ''}`}
            >
              <Sparkles size={14} />
            </button>

            {/* Salir / Botón o ícono para volver a los demás artículos */}
            <button 
              onClick={() => setIsDigitalView(false)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-accent text-brand-navy hover:bg-white border border-brand-accent rounded-sm text-[9.5px] uppercase tracking-wider font-black transition-all hover:scale-105 shadow-md cursor-pointer ml-1"
            >
              <ArrowLeft size={13} />
              <span>Volver</span>
            </button>
          </div>
        </div>

        {/* Dynamic page flipping workplace stage (Páginas interactivas y escalables) */}
        <div className="flex-1 w-full overflow-auto flex items-start justify-center p-6 md:p-12 relative">
          <div 
            className="origin-top flex justify-center items-stretch transition-transform duration-300 select-none py-4"
            style={{ 
              transform: `scale(${zoomScale / 100})`,
              minHeight: '100%'
            }}
          >
            <AnimatePresence mode="wait">
              <motion.div 
                key={activePageIndex}
                initial={{ opacity: 0, x: 50, rotateY: 10 }}
                animate={{ opacity: 1, x: 0, rotateY: 0 }}
                exit={{ opacity: 0, x: -50, rotateY: -10 }}
                transition={{ duration: 0.35, ease: "easeInOut" }}
                className="flex gap-6 justify-center items-stretch"
                style={{ perspective: 1500 }}
              >
                {activePageIndex === 0 ? (
                  /* RENDERING MAGNIFICENT COVER PAGE */
                  <div className="w-full max-w-[480px] aspect-[1/1.4] bg-[#030a16] border-[6px] border-brand-accent/40 rounded-sm shadow-2xl relative overflow-hidden flex flex-col justify-between p-10 text-center text-white">
                    <div className="absolute top-0 inset-x-0 h-1.5 bg-linear-to-r from-brand-accent/20 via-brand-accent to-brand-accent/20" />
                    
                    <div>
                      <div className="flex justify-center mb-4 transform hover:scale-105 transition-all duration-300">
                        <Logo light />
                      </div>
                      <p className="text-brand-accent text-[8.5px] font-black uppercase tracking-[0.35em] mb-1">
                        REVISTA DE CONSULTORÍA E INTELIGENCIA NORMATIVA
                      </p>
                      <span className="text-[7.5px] text-white/40 uppercase tracking-[0.4em] font-bold">
                        DIFUSIÓN CIENTÍFICA ACADÉMICA • NÚMERO ACTUAL
                      </span>
                    </div>

                    <div className="my-auto py-4">
                      <div className="text-[9px] uppercase font-bold tracking-[0.3em] text-brand-accent/70 mb-3">TEMA DE PORTADA</div>
                      <h1 className="text-2xl md:text-[26px] font-serif font-black leading-tight tracking-wide mb-4 text-white">
                        {editorial?.title || ""}
                      </h1>
                      <div className="w-12 h-[2px] bg-brand-accent mx-auto mb-4" />
                      <p className="text-white/80 text-[10px] leading-relaxed italic max-w-sm mx-auto font-light px-2">
                        "{editorial?.summary || ""}"
                      </p>
                    </div>

                    <div className="space-y-2 mt-auto">
                      <div className="text-[9px] text-[#b59441] uppercase font-black tracking-widest bg-white/5 py-1.5 rounded border border-white/5">
                        AUTOR EXPOSITOR: {editorial?.author || "DECON CONTAPRO"}
                      </div>
                      <div className="text-[7.5px] text-white/30 tracking-widest font-black uppercase flex justify-between px-2 mt-2">
                        <span>ECUADOR 2026</span>
                        <span>ÁREA: {editorial?.area}</span>
                      </div>
                      <p className="text-[7.5px] text-white/40 uppercase tracking-[0.2em] font-bold pt-2 animate-pulse">
                        ➜ Usa las teclas dirección de tu teclado ◀ ▶ o botones del cabezal
                      </p>
                    </div>
                  </div>
                ) : (
                  /* RENDERING CONTENT PAGES SPREAD OR SINGLE */
                  doublePageSpread ? (
                    <div className="flex gap-4 items-stretch">
                      {/* Left page rendering */}
                      {renderConceptPage(2 * activePageIndex - 1, 'left')}
                      
                      {/* Right page rendering (if exists, else blank cover) */}
                      {2 * activePageIndex < totalPagesCount ? (
                        renderConceptPage(2 * activePageIndex, 'right')
                      ) : (
                        <div className="w-full max-w-[480px] aspect-[1/1.4] bg-[#030a16] rounded-sm shadow-2xl relative border border-white/10 flex flex-col justify-between p-10 text-center text-white">
                          <div className="absolute top-0 inset-x-0 h-1 bg-brand-accent" />
                          <div className="my-auto">
                            <div className="flex justify-center mb-6">
                              <Logo light />
                            </div>
                            <h3 className="text-brand-accent text-xs font-black uppercase tracking-[0.3em] mb-2">Fin de la Presentación</h3>
                            <p className="text-white/50 text-[10px] leading-relaxed max-w-xs mx-auto">
                              CONTAPRO DC agradece su lectura académica. Todos los análisis cuentan con el respaldo de nuestro departamento de investigación jurídica.
                            </p>
                          </div>
                          <div className="text-[7.5px] text-white/30 tracking-widest uppercase">
                            © 2026 CONTAPRO DC CORPORATIVO
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Single page centered rendering */
                    renderConceptPage(activePageIndex, 'none')
                  )
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Side Floating Page Navigation Arrows (Hojas para pasar de páginas interactivamente) */}
          {activePageIndex > 0 && (
            <button 
              onClick={handlePrevPage}
              className="absolute left-6 top-1/2 -translate-y-1/2 z-[80] w-14 h-14 rounded-full bg-[#122646]/80 hover:bg-brand-accent hover:text-brand-navy border border-white/10 flex items-center justify-center transition-all shadow-2xl cursor-pointer group active:scale-95 text-white/95"
              title="Página Anterior (Flecha Izquierda)"
            >
              <ChevronLeft size={28} className="group-hover:-translate-x-1 transition-transform" />
            </button>
          )}

          {activePageIndex < maxPageIndex && (
            <button 
              onClick={handleNextPage}
              className="absolute right-6 top-1/2 -translate-y-1/2 z-[80] w-14 h-14 rounded-full bg-[#122646]/80 hover:bg-brand-accent hover:text-brand-navy border border-white/10 flex items-center justify-center transition-all shadow-2xl cursor-pointer group active:scale-95 text-white/95"
              title="Página Siguiente (Flecha Derecha)"
            >
              <ChevronRight size={28} className="group-hover:translate-x-1 transition-transform" />
            </button>
          )}

          {/* Floating Voice Control FAB (El ícono de voz esté visible donde no estorbe - Bottom Right) */}
          <div className="absolute bottom-6 right-6 z-[95] flex items-center gap-3">
            <AnimatePresence>
              {isReading && (
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="bg-brand-accent/95 backdrop-blur-md border border-brand-accent text-brand-navy shrink-0 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-lg shadow-brand-accent/20"
                >
                  <div className="flex items-end gap-0.5 h-2.5">
                    <div className="w-[1.5px] bg-brand-navy h-1 animate-[bounce_0.6s_ease-in-out_infinite]"></div>
                    <div className="w-[1.5px] bg-brand-navy h-2.5 animate-[bounce_0.6s_ease-in-out_infinite_0.15s]"></div>
                    <div className="w-[1.5px] bg-brand-navy h-1.5 animate-[bounce_0.6s_ease-in-out_infinite_0.3s]"></div>
                  </div>
                  <span>Audio Narrador Activo</span>
                </motion.div>
              )}
            </AnimatePresence>

            <button
              onClick={handleToggleReading}
              title={isReading ? "Detener Exposición" : "Activar Exposición de Voz Académica Masculina"}
              className={`w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all cursor-pointer hover:scale-110 active:scale-95 border-2 ${
                isReading
                  ? 'bg-brand-accent border-brand-accent text-brand-navy shadow-brand-accent/30 animate-pulse'
                  : 'bg-[#122646] border-white/20 text-white hover:bg-brand-accent hover:text-brand-navy hover:border-brand-accent shadow-brand-navy/60'
              }`}
            >
              {isReading ? (
                <VolumeX size={20} className="animate-bounce" />
              ) : (
                <Volume2 size={20} />
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full mx-auto py-0 px-0">
      {showSocialStory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-navy/95 backdrop-blur-xl">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white w-full max-w-5xl max-h-[90vh] rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row"
          >
            {/* Left Control Panel */}
            <div className="w-full md:w-80 bg-brand-navy p-8 text-white">
              <button 
                onClick={() => { setShowSocialStory(false); setStorySlides(null); }}
                className="mb-8 text-white/60 hover:text-white flex items-center gap-2 text-xs uppercase font-black tracking-widest"
              >
                <ArrowLeft size={16} /> Cerrar
              </button>

              <div className="p-4 bg-brand-accent/20 rounded-2xl border border-brand-accent/20 mb-10">
                <Smartphone size={32} className="text-brand-accent mb-4" />
                <h3 className="text-lg font-serif font-bold">Story Generator</h3>
                <p className="text-[10px] text-brand-ivory/60 uppercase tracking-widest mt-1">Contenido para Redes</p>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="text-[10px] uppercase font-black tracking-widest text-brand-ivory/40 block mb-3">Voz del Narrador</label>
                  <select 
                    value={voiceStyle}
                    onChange={(e) => setVoiceStyle(e.target.value)}
                    className="w-full bg-[#0a1120] border border-white/10 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent text-white"
                  >
                    <option value="Profesional, Jovial y Persuasiva" className="bg-[#0a1120] text-white">Profesional, Jovial y Persuasiva</option>
                    <option value="Profesional" className="bg-[#0a1120] text-white">Profesional</option>
                    <option value="Dinámica y Ágil" className="bg-[#0a1120] text-white">Dinámica y Ágil</option>
                    <option value="Educativa/Taller" className="bg-[#0a1120] text-white">Educativa/Taller</option>
                  </select>
                </div>

                <button 
                  onClick={handleGenerateSlides}
                  disabled={isGeneratingSlides}
                  className="w-full py-4 bg-brand-accent/10 border border-brand-accent/30 text-brand-accent rounded-xl font-bold uppercase text-xs tracking-[0.2em] hover:bg-brand-accent/20 transition-all disabled:opacity-50"
                >
                  {isGeneratingSlides ? 'Generando...' : 'Solo Generar Guion'}
                </button>

                <button 
                  onClick={handleGenerateAndRecordPodcast}
                  disabled={isGeneratingSlides || isRenderingVideo}
                  className="w-full py-4 bg-brand-navy text-white rounded-xl font-bold uppercase text-xs tracking-[0.2em] shadow-lg shadow-brand-navy/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 border border-brand-accent/30 flex items-center justify-center gap-3"
                >
                   {isGeneratingSlides || isRenderingVideo ? (
                    <>
                      <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      {isGeneratingSlides ? 'Generando...' : `Grabando ${renderProgress}%`}
                    </>
                  ) : (
                    <>
                      <Video size={14} className="text-brand-accent" /> Generar y Grabar Podcast
                    </>
                  )}
                </button>

                {storySlides && (
                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      onClick={() => downloadAudio()}
                      disabled={isRenderingVideo}
                      className="py-3 bg-white/5 border border-white/20 text-white rounded-xl font-bold uppercase text-[10px] tracking-widest hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                    >
                      <Mic size={12} className="text-brand-accent" /> Solo Audio
                    </button>
                    <button 
                      onClick={exportStorySlidesToPPT}
                      className="py-3 bg-white/5 border border-white/20 text-white rounded-xl font-bold uppercase text-[10px] tracking-widest hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                    >
                      <Download size={12} className="text-brand-accent" /> PPTX
                    </button>
                  </div>
                )}

                <button 
                  onClick={() => setShowCinematicPodcast(true)}
                  className="w-full py-4 bg-white/5 border border-white/20 text-white rounded-xl font-bold uppercase text-[10px] tracking-widest hover:bg-white/10 transition-all flex items-center justify-center gap-3"
                >
                  <Play size={14} /> Podcast Interactivo
                </button>



                {storySlides && (
                  <button 
                    onClick={() => downloadVideo()}
                    disabled={isRenderingVideo}
                    className="w-full py-4 bg-white/10 border border-white/20 text-white rounded-xl font-bold uppercase font-black text-[10px] tracking-widest hover:bg-white/20 transition-all flex items-center justify-center gap-3"
                  >
                    {isRenderingVideo ? (
                      <>
                        <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Rendering {renderProgress}%
                      </>
                    ) : (
                      <>
                        <Video size={14} /> Descargar Video Stories
                      </>
                    )}
                  </button>
                )}

                <div className="pt-6 mt-6 border-t border-white/10 space-y-3">
                  <p className="text-[9px] uppercase font-bold tracking-[0.2em] text-brand-ivory/40 mb-2">Herramientas de Captura</p>
                  <button
                    onClick={toggleScreenRecording}
                    className={`w-full py-4 rounded-xl font-bold uppercase text-[10px] tracking-[0.2em] transition-all flex items-center justify-center gap-3 border ${
                      isRecording 
                        ? 'bg-red-500/20 text-red-500 border-red-500/40 animate-pulse' 
                        : 'bg-white/5 text-white border-white/10 hover:bg-brand-accent hover:border-brand-accent'
                    }`}
                  >
                    <div className={`w-2 h-2 rounded-full ${isRecording ? 'bg-red-500 animate-ping' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]'}`}></div>
                    {isRecording ? "Detener Grabación" : "Grabar Pantalla"}
                  </button>

                  {recordedVideoUrl && !isRecording && (
                    <button
                      onClick={downloadRecording}
                      className="w-full py-4 bg-green-500/20 text-green-400 border border-green-500/20 rounded-xl font-bold uppercase text-[10px] tracking-[0.2em] hover:bg-green-500/30 transition-all flex items-center justify-center gap-3"
                    >
                      <Download size={14} /> Descargar Grabación
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 p-10 overflow-y-auto bg-gray-50">
              {!storySlides ? (
                <div className="h-full flex flex-col items-center justify-center text-center">
                  <div className="w-20 h-20 rounded-full bg-brand-accent/10 flex items-center justify-center mb-6">
                    <Zap size={32} className="text-brand-accent" />
                  </div>
                  <h4 className="text-xl font-serif font-bold text-brand-navy mb-2">Diseño Inteligente para Stories</h4>
                  <p className="text-gray-500 max-w-xs mx-auto text-sm leading-relaxed">
                    Transforma este artículo en 5 diapositivas visuales para captar la atención de tus clientes en redes sociales.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 performance-layer">
                  {storySlides.map((slide, i) => (
                    <motion.div 
                      key={i}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05, duration: 0.4 }}
                      className="gpu-accelerated bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 flex flex-col"
                    >
                      {/* Preview Aspect Ratio 9:16 Mockup */}
                      <div className="aspect-[9/16] bg-brand-navy p-6 flex flex-col justify-center text-center relative">
                        <div className="absolute top-4 left-4 text-[10px] text-brand-accent font-bold">0{i+1}</div>
                        <h5 className="text-white font-serif text-lg mb-4 leading-tight">{slide.title}</h5>
                        <p className="text-white/60 text-[10px] leading-relaxed">{slide.body}</p>
                        <div className="absolute bottom-4 w-full left-0 text-[8px] text-brand-accent font-bold uppercase tracking-widest">CONTAPRO DC</div>
                      </div>

                      <div className="p-4 bg-gray-900 border-t border-white/10">
                        <label className="text-[9px] uppercase font-black text-brand-accent block mb-2 tracking-[0.1em]">Guion Sugerido (Voz {voiceStyle})</label>
                        <p className="text-[11px] text-brand-ivory/80 leading-relaxed italic mb-4">"{slide.script}"</p>
                        <button 
                          onClick={() => downloadSlideImage(slide, i)}
                          className="w-full py-2 bg-brand-accent text-white rounded-lg text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2"
                        >
                          <Download size={12} /> Descargar Imagen
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {showImageModal && (
        <ImageCustomizerModal
          currentImageUrl={editorial.imageUrl || getEditorialImage(editorial.title, editorial.area)}
          articleTitle={editorial.title}
          articleArea={editorial.area}
          onClose={() => setShowImageModal(false)}
          onSelectImage={handleSelectImage}
        />
      )}

      {showGoogleVids && (
        <GoogleVidsStudio 
          editorial={editorial}
          initialSlides={storySlides}
          onBack={() => setShowGoogleVids(false)}
          onSaveSlides={(newSlides) => {
            setStorySlides(newSlides);
            setShowGoogleVids(false);
          }}
        />
      )}

      {showCinematicPodcast && (
        <SocialStoryOverlay 
          editorial={editorial} 
          onClose={() => setShowCinematicPodcast(false)} 
          voiceStyle={voiceStyle}
          setVoiceStyle={setVoiceStyle}
          onExportPPT={exportStorySlidesToPPT}
          onDownloadAudio={() => downloadAudio()}
          onDownloadVideo={() => downloadVideo()}
          voiceType={voiceType}
          setVoiceType={setVoiceType}
          getHostImage={getHostImage}
          handleProfileImageUpload={handleProfileImageUpload}
        />
      )}

      {showShareModal && (
        <div 
          className="fixed inset-0 z-[300] bg-brand-navy/80 backdrop-blur-sm flex items-center justify-center p-6"
          onClick={() => setShowShareModal(false)}
        >
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-brand-navy p-6 text-white text-center">
              <h3 className="text-xl font-serif">Compartir Artículo</h3>
              <p className="text-[10px] uppercase tracking-widest text-white/60 mt-1">Inteligencia Normativa CONTAPRO DC</p>
            </div>
            <div className="p-8 grid grid-cols-1 gap-4">
              <button 
                onClick={() => {
                  const url = encodeURIComponent(window.location.href);
                  const text = encodeURIComponent(`Lee este artículo de CONTAPRO DC: ${editorial.title}`);
                  window.open(`https://twitter.com/intent/tweet?url=${url}&text=${text}`, '_blank');
                }}
                className="flex items-center gap-4 p-4 rounded-xl border border-brand-border hover:bg-brand-bg transition-all group"
              >
                <div className="w-10 h-10 bg-black text-white rounded-lg flex items-center justify-center">
                  <Twitter size={20} />
                </div>
                <div className="text-left">
                  <span className="block text-xs font-bold text-brand-navy">X (Twitter)</span>
                  <span className="text-[9px] text-brand-slate uppercase tracking-widest">Publicar en tu perfil</span>
                </div>
              </button>

              <button 
                onClick={() => {
                  const url = encodeURIComponent(window.location.href);
                  window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, '_blank');
                }}
                className="flex items-center gap-4 p-4 rounded-xl border border-brand-border hover:bg-brand-bg transition-all group"
              >
                <div className="w-10 h-10 bg-[#0077b5] text-white rounded-lg flex items-center justify-center">
                  <Linkedin size={20} />
                </div>
                <div className="text-left">
                  <span className="block text-xs font-bold text-brand-navy">LinkedIn</span>
                  <span className="text-[9px] text-brand-slate uppercase tracking-widest">Compartir profesionalmente</span>
                </div>
              </button>

              <button 
                onClick={() => {
                  const subject = encodeURIComponent(`Interesante artículo: ${editorial.title}`);
                  const body = encodeURIComponent(`Te recomiendo este artículo de CONTAPRO DC: ${window.location.href}`);
                  window.location.href = `mailto:?subject=${subject}&body=${body}`;
                }}
                className="flex items-center gap-4 p-4 rounded-xl border border-brand-border hover:bg-brand-bg transition-all group"
              >
                <div className="w-10 h-10 bg-brand-accent text-white rounded-lg flex items-center justify-center">
                  <Mail size={20} />
                </div>
                <div className="text-left">
                  <span className="block text-xs font-bold text-brand-navy">Correo Electrónico</span>
                  <span className="text-[9px] text-brand-slate uppercase tracking-widest">Enviar por email</span>
                </div>
              </button>

              <button 
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  alert("Enlace copiado al portapapeles");
                }}
                className="mt-4 py-3 bg-brand-bg text-brand-navy rounded-xl border border-brand-border text-[10px] font-black uppercase tracking-widest hover:bg-brand-navy hover:text-white transition-all underline decoration-brand-accent decoration-2"
              >
                Copiar Enlace Directo
              </button>
            </div>
          </motion.div>
        </div>
      )}
      <motion.div 
        className="fixed top-0 left-0 right-0 h-1 bg-brand-accent origin-left z-[100]"
        style={{ scaleX }}
      />
      <div className="flex justify-between items-center mb-16">
        <div className="flex items-center gap-6">
          <button onClick={onBack} className="text-[11px] font-bold uppercase tracking-[0.3em] text-brand-slate hover:text-brand-navy flex items-center gap-2 transition-all group">
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Regresar al Índice
          </button>
          
          <div className="h-6 w-[1px] bg-brand-border mx-2 hidden md:block"></div>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={onPrev}
              disabled={!hasPrev}
              className={`flex items-center gap-1 text-[10px] font-black uppercase tracking-[0.2em] transition-all ${hasPrev ? 'text-brand-navy hover:text-brand-accent active:scale-90' : 'text-brand-border cursor-not-allowed'}`}
            >
              <ChevronLeft size={18} /> Anterior
            </button>
            
            <button 
              onClick={onNext}
              disabled={!hasNext}
              className={`flex items-center gap-1 text-[10px] font-black uppercase tracking-[0.2em] transition-all ${hasNext ? 'text-brand-navy hover:text-brand-accent active:scale-110' : 'text-brand-border cursor-not-allowed'}`}
            >
              Siguiente <ChevronRight size={18} />
            </button>
          </div>
        </div>

        <div className="flex gap-4">
          {isAdmin ? (
            <>
              <div className="flex gap-2 pr-4 border-r border-brand-border">
                <button 
                  onClick={onEdit}
                  className="btn-secondary text-[10px] uppercase font-bold tracking-widest py-2 border-brand-navy/20 text-brand-navy hover:bg-brand-navy hover:text-white"
                >
                  <PenTool size={14} /> Editar
                </button>
                <button 
                  onClick={() => { if(confirm('¿Seguro que deseas eliminar este artículo permanentemente?')) onDelete?.(); }}
                  className="btn-secondary text-[10px] uppercase font-bold tracking-widest py-2 border-red-200 text-red-500 hover:bg-red-500 hover:text-white"
                >
                  <Trash2 size={14} /> Eliminar
                </button>
              </div>
              
              <button 
                onClick={handleDeepen}
                disabled={isExpanding}
                className="btn-secondary text-[10px] uppercase font-bold tracking-widest py-2 bg-brand-accent/10 border-brand-accent/30 text-brand-accent hover:bg-brand-accent hover:text-white"
              >
                <Sparkles size={14} className={isExpanding ? 'animate-spin' : ''} /> 
                {isExpanding ? 'Analizando Doctrinalmente...' : 'Profundizar Doctrinalmente'}
              </button>

              <button 
                onClick={handleGenerateVideoPromo}
                disabled={isGeneratingVideo}
                className="btn-secondary text-[10px] uppercase font-bold tracking-widest py-2 bg-pink-50 border-pink-200 text-pink-600 hover:bg-pink-600 hover:text-white"
              >
                <Video size={14} className={isGeneratingVideo ? 'animate-bounce' : ''} /> 
                {isGeneratingVideo ? 'Creando Guion...' : 'Guion Promo'}
              </button>

              <button 
                onClick={handleExpandPractical}
                disabled={isExpanding}
                className="btn-secondary text-[10px] uppercase font-bold tracking-widest py-2 bg-brand-navy border-brand-navy text-white hover:bg-brand-navy/90"
              >
                <Zap size={14} className={isExpanding ? 'animate-pulse' : ''} /> 
                Ampliación Práctica
              </button>

              <button 
                onClick={() => setShowSocialStory(true)}
                className="btn-secondary text-[10px] uppercase font-bold tracking-widest py-2 border-brand-accent/30 text-brand-navy hover:bg-brand-accent hover:text-white"
              >
                <Video size={14} /> Video Stories Podcast
              </button>

              <button 
                onClick={() => setShowGoogleVids(true)}
                className="btn-secondary text-[10px] uppercase font-black tracking-widest py-2 bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 text-white hover:from-violet-500 hover:to-indigo-500 hover:text-white border-none shadow-md shadow-indigo-600/20 flex items-center justify-center gap-1.5"
                title="Diseñar, editar y compilar videos contables y diapositivas ejecutivas mediante Google Vids"
              >
                <Sparkles size={13} className="text-brand-accent" />
                <span>Diseño Google Vids</span>
              </button>

              <button 
                onClick={copyHTMLCode}
                className="btn-secondary text-[10px] uppercase font-bold tracking-widest py-2 text-brand-navy border-brand-navy/20 hover:bg-brand-bg"
              >
                <Globe size={14} /> Código Web Sites
              </button>

              <button 
                onClick={() => setShowShareModal(true)}
                className="btn-secondary text-[10px] uppercase font-bold tracking-widest py-2 text-brand-navy border-brand-navy/20 hover:bg-brand-bg"
              >
                <Share2 size={14} />
              </button>
            </>
          ) : null}

          <button 
            onClick={exportToPDF}
            className="btn-secondary text-[10px] uppercase font-bold tracking-widest py-2 bg-brand-accent text-white border-brand-accent hover:bg-brand-navy transition-colors"
          >
            <FileText size={14} /> Reporte PDF
          </button>

          <button 
            onClick={handleToggleReading}
            className={`btn-secondary text-[10px] uppercase font-bold tracking-widest py-2 ${isReading ? 'bg-brand-navy text-white' : 'text-brand-navy border-brand-navy/20 hover:bg-brand-bg'}`}
          >
            {isReading ? (
              <><VolumeX size={14} className="animate-pulse" /> Detener</>
            ) : (
              <><Volume2 size={14} /> Escuchar</>
            )}
          </button>

          <button 
            onClick={() => setIsDigitalView(true)}
            className="btn-secondary text-[10px] uppercase font-bold tracking-widest py-2 border-brand-border text-brand-slate hover:bg-brand-bg"
          >
            <Book size={14} /> Modo Revista
          </button>
          
          <div className="relative group">
            <button className="btn-primary text-[10px] uppercase font-bold tracking-widest py-2 bg-brand-navy border-brand-navy">
              <Download size={14} /> 
              {isExporting ? 'Exportando...' : 'Exportar'}
            </button>
            <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-brand-border shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20">
              <button 
                onClick={exportToPDF}
                className="w-full text-left px-4 py-3 text-[10px] uppercase font-bold tracking-wider hover:bg-brand-bg flex items-center gap-2 border-b border-brand-border"
              >
                <FileText size={12} className="text-brand-navy" /> Reporte PDF (.pdf)
              </button>
              <button 
                onClick={exportToWord}
                className="w-full text-left px-4 py-3 text-[10px] uppercase font-bold tracking-wider hover:bg-brand-bg flex items-center gap-2 border-b border-brand-border"
              >
                <FileText size={12} className="text-blue-600" /> Documento Word (.docx)
              </button>
              <button 
                onClick={exportToPPT}
                className="w-full text-left px-4 py-3 text-[10px] uppercase font-bold tracking-wider hover:bg-brand-bg flex items-center gap-2 border-b border-brand-border"
              >
                <Maximize2 size={12} className="text-brand-corporate" /> Presentación PPTX (.pptx)
              </button>
              <button 
                onClick={exportToMarkdown}
                className="w-full text-left px-4 py-3 text-[10px] uppercase font-bold tracking-wider hover:bg-brand-bg flex items-center gap-2 border-b border-brand-border"
              >
                <Layout size={12} className="text-brand-accent" /> Markdown Profesional (.md)
              </button>
              <button 
                onClick={exportToWord}
                className="w-full text-left px-4 py-3 text-[10px] uppercase font-bold tracking-wider hover:bg-brand-bg flex items-center gap-2 border-b border-brand-border"
              >
                <FileText size={12} className="text-blue-600" /> Documento Word (.docx)
              </button>
              <button 
                onClick={() => {
                  const printContent = articleRef.current?.innerHTML;
                  if (printContent) {
                    const printWindow = window.open('', '_blank');
                    if (printWindow) {
                      printWindow.document.write(`
                        <html>
                          <head>
                            <title>${editorial.title}</title>
                            <style>
                              body { font-family: serif; padding: 40px; color: #333; }
                              h1 { color: #0056b3; }
                              .markdown-body table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                              .markdown-body th, .markdown-body td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                              .markdown-body th { background-color: #f2f2f2; }
                            </style>
                          </head>
                          <body>${printContent}</body>
                        </html>
                      `);
                      printWindow.document.close();
                      printWindow.print();
                    }
                  }
                }}
                className="w-full text-left px-4 py-3 text-[10px] uppercase font-bold tracking-wider hover:bg-brand-bg flex items-center gap-2"
              >
                <BookOpen size={12} className="text-brand-slate" /> Versión Impresa / Print
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <div ref={articleRef}>
        <header className="mb-16 pb-16 border-b border-brand-border">
          <div className="flex items-center gap-4 mb-8">
             <span className="bg-brand-accent text-white px-4 py-1 text-[10px] font-bold uppercase tracking-[0.2em]">{editorial.area}</span>
             <span className="h-[1px] flex-1 bg-brand-border"></span>
          </div>
          <h1 className="text-6xl font-serif mb-10 leading-tight text-brand-navy">{editorial.title}</h1>
          
          <div className="flex items-center gap-12 text-brand-slate text-[11px] font-bold uppercase tracking-widest">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-brand-bg border border-brand-border rounded-full flex items-center justify-center">
                <User size={16} className="text-brand-navy" />
              </div>
              <span>Por {editorial.author}</span>
            </div>
            <div className="flex items-center gap-3">
              <Calendar size={16} />
              <span>Publicado: {editorial.date}</span>
            </div>
          </div>
        </header>

        {/* Editorial Hero Banner Image */}
        <div className="w-full aspect-[21/9] overflow-hidden rounded-2xl mb-16 shadow-lg border border-brand-border/20 relative group select-none">
          <img 
            id="editorial-hero-banner-image-elem"
            src={editorial.imageUrl || getEditorialImage(editorial.title, editorial.area)} 
            alt={editorial.title} 
            className="w-full h-full object-cover transition-transform duration-500 hover:scale-[1.02]"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-brand-navy/60 via-transparent to-transparent pointer-events-none"></div>
          
          {/* Personalize Button */}
          <div className="absolute bottom-4 right-4 z-20">
            <button
              id="editorial-image-personalization-btn"
              onClick={() => setShowImageModal(true)}
              className="px-4 py-2 bg-white/95 hover:bg-white text-brand-navy border border-brand-border/30 rounded-xl shadow-lg flex items-center gap-2 text-xs font-bold uppercase tracking-wider backdrop-blur-md transition-all duration-350 hover:scale-[1.03] active:scale-95"
            >
              <ImageIcon size={14} className="text-brand-accent animate-pulse" />
              Regenerar / Cambiar Imagen
            </button>
          </div>
        </div>

        {/* Chronological Version Timeline Selector */}
        {relatedFichas.length > 0 && (
          <div className="mb-16 p-8 bg-brand-bg/50 border border-brand-border/65 rounded-[24px] shadow-sm relative overflow-hidden backdrop-blur-md">
            <div className="absolute top-0 right-0 w-64 h-64 bg-brand-accent/[0.02] rounded-full blur-3xl pointer-events-none"></div>
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 pb-6 border-b border-brand-border/60">
              <div>
                <h3 className="text-sm font-black uppercase tracking-[0.25em] text-brand-navy flex items-center gap-2">
                  <History size={16} className="text-brand-accent animate-[spin_60s_linear_infinite]" />
                  Historial Cronológico de Versiones (Generaciones)
                </h3>
                <p className="text-[10px] text-brand-slate uppercase tracking-wider font-bold mt-1.5">
                  Selecciona una edición del historial de fechas de generación para leerla o publicarla en tu sitio web.
                </p>
              </div>
              
              <button 
                onClick={() => setShowPublishModal(true)}
                className="btn-primary flex items-center gap-2 text-[10px] uppercase font-bold tracking-[0.2em] py-2.5 px-5 bg-brand-accent border-brand-accent text-brand-navy hover:bg-brand-navy hover:text-white transition-all shadow-md shrink-0 active:scale-95"
              >
                <Smartphone size={14} /> Publicar Versión Activa
              </button>
            </div>

            <div className="relative">
              {/* Horizontal Timeline Connecting Line */}
              <div className="absolute top-1/2 left-0 right-0 h-[2px] bg-brand-border/40 -translate-y-1/2 hidden md:block z-0"></div>
              
              <div className="flex gap-4 overflow-x-auto pb-4 pt-2 -mx-2 px-2 scrollbar-thin scrollbar-thumb-brand-accent relative z-10">
                {relatedFichas.map((v, i) => {
                  const isSelected = activeVersionFichaId === v.id || (!activeVersionFichaId && i === 0);
                  return (
                    <button
                      key={v.id}
                      onClick={() => {
                        setActiveVersionFichaId(v.id);
                      }}
                      className={`text-left p-4.5 rounded-2xl border transition-all duration-300 relative min-w-[240px] flex-shrink-0 flex flex-col justify-between ${
                        isSelected 
                          ? 'bg-brand-navy text-white border-brand-navy shadow-lg ring-[3px] ring-brand-accent/40 scale-[1.03]' 
                          : 'bg-white text-brand-navy border-brand-border hover:bg-brand-bg hover:border-brand-accent/60 shadow-sm'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className={`text-[9px] font-black uppercase tracking-widest ${isSelected ? 'text-brand-accent' : 'text-brand-slate opacity-75'}`}>
                            {v.generationDate}
                          </span>
                          {isSelected ? (
                            <span className="bg-brand-accent text-brand-navy text-[7px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider">
                              Activa
                            </span>
                          ) : (
                            <span className="text-brand-slate text-[8px] font-bold"># {relatedFichas.length - i}</span>
                          )}
                        </div>
                        <h4 className="font-extrabold text-xs line-clamp-1 mb-1 font-sans">
                          {v.title || editorial.title}
                        </h4>
                        <div className={`text-[9px] uppercase tracking-wider font-bold mb-3 ${isSelected ? 'text-white/70' : 'text-brand-accent'}`}>
                          {v.action || 'Modificación registrada'}
                        </div>
                      </div>
                      <div className={`text-[10px] line-clamp-2 leading-relaxed normal-case ${isSelected ? 'text-brand-ivory/80' : 'text-brand-slate'}`}>
                        {v.summary || 'Sin resumen registrado.'}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start mt-8">
          
          {/* Main Reading core area */}
          <div className="lg:col-span-8 space-y-12">
            <p className="font-serif italic !text-2xl !text-brand-slate border-l-4 border-brand-accent pl-10 leading-relaxed">
              {editorial.summary}
            </p>

            {editorial.managerSummary && (
              <div className="p-8 bg-brand-navy text-brand-ivory rounded-sm shadow-xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Sparkles size={48} />
                </div>
                <h4 className="text-[10px] font-bold uppercase tracking-[0.4em] mb-4 text-brand-accent">Executive Summary for Management</h4>
                <p className="text-lg font-sans leading-relaxed relative z-10 italic !text-brand-ivory">
                  "{editorial.managerSummary}"
                </p>
              </div>
            )}

            <div className="markdown-body editorial-text font-sans text-lg leading-[2.4] tracking-wide text-brand-navy">
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={MarkdownComponents}>{cleanEditorialContent(editorial.content)}</ReactMarkdown>
            </div>

            {videoScript && (
              <motion.div 
                id="video-promo-section"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-20 bg-brand-navy text-white p-10 rounded-2xl shadow-2xl border-t-8 border-pink-500 overflow-hidden relative"
              >
                <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12">
                  <Video size={120} />
                </div>
                <div className="relative z-10">
                  <div className="flex items-center gap-6 mb-8">
                    <div className="relative group/guion-avatar">
                      <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-pink-500 shadow-xl">
                        <label className="cursor-pointer block w-full h-full">
                          <img 
                            src={getHostImage(voiceType)} 
                            alt="Host" 
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/guion-avatar:opacity-100 flex items-center justify-center transition-opacity">
                            <Upload size={16} className="text-white" />
                          </div>
                          <input type="file" className="hidden" onChange={handleProfileImageUpload} accept="image/*" />
                        </label>
                      </div>
                      <div className="absolute -bottom-1 -right-1 bg-pink-500 rounded-full p-1 border-2 border-brand-navy">
                        <Video size={10} className="text-white" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-2xl font-serif font-bold tracking-tight">Guion Publicitario de 60 Segundos</h3>
                      <p className="text-pink-400 text-[10px] uppercase font-black tracking-[0.3em]">Optimizado para Marketing Digital • SOLJURE EFICACES</p>
                    </div>
                  </div>
                  
                  <div className="bg-white/5 backdrop-blur-md p-8 rounded-2xl border border-white/10 font-sans leading-relaxed text-brand-ivory/90 shadow-inner">
                    <ReactMarkdown remarkPlugins={[remarkGfm]} components={MarkdownComponents}>
                      {videoScript}
                    </ReactMarkdown>
                  </div>

                  <div className="mt-10 flex flex-wrap justify-between items-center gap-6">
                    <div className="flex items-center gap-3">
                       <span className="w-12 h-[1px] bg-white/20"></span>
                       <span className="text-[10px] text-white/40 uppercase font-bold tracking-widest italic">Guion Fluido para Locución</span>
                    </div>
                    <div className="flex gap-4">
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(videoScript);
                          alert("Guion copiado al portapapeles. ¡Listo para tu video!");
                        }}
                        className="px-6 py-4 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all flex items-center gap-3 font-bold uppercase text-[10px] tracking-widest border border-white/20 cursor-pointer"
                      >
                        <Share size={14} /> Copiar Guion
                      </button>
                      
                      <button 
                        onClick={() => downloadVideo()}
                        disabled={isRenderingVideo}
                        className={`px-8 py-4 bg-pink-500 hover:bg-pink-400 text-white rounded-full transition-all flex items-center gap-3 font-bold uppercase text-xs tracking-widest shadow-xl shadow-pink-500/30 active:scale-95 cursor-pointer ${isRenderingVideo ? 'animate-pulse' : ''}`}
                      >
                        {isRenderingVideo ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Generando... {renderProgress}%
                          </>
                        ) : (
                          <>
                            <Download size={16} /> Descargar Video Promo
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Right Column: Dynamic floating Table of Contents & Sci Research Launcher sidebar */}
          <div className="lg:col-span-4 lg:sticky lg:top-24 space-y-6 hidden lg:block">
            
            {/* Reading progress component */}
            <div className="p-6 border border-brand-border bg-white rounded-2xl shadow-sm space-y-3">
              <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-brand-slate">
                <span>Progreso de Lectura Activo</span>
                <span className="text-brand-accent font-black">{Math.round(progressPercent * 100)}%</span>
              </div>
              <div className="w-full bg-brand-bg h-2 rounded-full overflow-hidden border border-brand-border/30">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent * 100}%` }}
                  transition={{ duration: 0.1 }}
                  className="bg-brand-accent h-full"
                />
              </div>
            </div>

            {/* Table of Contents Index */}
            {tocItems.length > 0 && (
              <div className="p-6 border border-brand-border bg-white rounded-2xl shadow-sm space-y-5">
                <h4 className="text-[10px] font-bold uppercase tracking-[0.3em] text-brand-navy flex items-center gap-2 pb-3 border-b border-brand-border">
                  <BookOpen size={14} className="text-brand-accent" /> Índice del Artículo
                </h4>
                
                <nav className="max-h-[350px] overflow-y-auto pr-1 space-y-3.5 scrollbar-thin">
                  {tocItems.map((item, index) => {
                    const isActive = activeId === item.id;
                    return (
                      <a 
                        key={index} 
                        href={`#${item.id}`}
                        onClick={(e) => {
                          e.preventDefault();
                          const element = document.getElementById(item.id);
                          if (element) {
                            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                          }
                        }}
                        className={`block transition-all text-xs leading-relaxed ${
                          item.level === 3 ? 'ml-4.5 border-l border-brand-border/40 pl-3.5 text-[11px]' : 'font-semibold border-l-2 pl-3.5'
                        } ${
                          isActive 
                            ? 'text-brand-accent border-brand-accent font-bold translate-x-1' 
                            : 'text-brand-navy/60 border-transparent hover:text-brand-navy hover:translate-x-0.5'
                        }`}
                      >
                        {item.text}
                      </a>
                    );
                  })}
                </nav>
              </div>
            )}

            {/* Direct Action research widget */}
            {onInvestigate && (
              <div className="p-6 border border-brand-border bg-brand-navy text-brand-ivory rounded-2xl shadow-lg relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                  <Scale size={80} />
                </div>
                <div className="relative z-10 space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="p-2 bg-brand-accent/10 border border-brand-accent/25 rounded-lg text-brand-accent shrink-0">
                      <Scale size={16} />
                    </span>
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-[0.15em] text-brand-accent">Investigación Procesal</h4>
                      <p className="text-[8px] text-brand-ivory/60 uppercase font-bold tracking-widest mt-0.5">Materia: {editorial.area.toUpperCase()}</p>
                    </div>
                  </div>
                  
                  <p className="text-[11px] text-brand-ivory/80 leading-relaxed">
                    Alinee esta edición con los fallos obligatorios CNJ, doctrina constitucional (CRE Art. 76, 82) y gacetas indexadas universitarias ecuatorianas.
                  </p>
                  
                  <button
                    onClick={() => onInvestigate(editorial.title, editorial.area)}
                    className="w-full py-3 px-4 bg-brand-accent hover:bg-white border border-brand-accent text-brand-navy rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-95 shadow-md cursor-pointer"
                  >
                    <span>Investigar Base Legal</span>
                    <ArrowRight size={12} />
                  </button>
                </div>
              </div>
            )}

          </div>

        </div>
      </div>
    </div>
  );
}

function EditorialStudio({ onSave, initialEditorial, editorials = [] }: { onSave: (e: Editorial) => void, initialEditorial?: Editorial | null, editorials?: Editorial[] }) {
  const [content, setContent] = useState(initialEditorial?.content || '');
  const [title, setTitle] = useState(initialEditorial?.title || '');
  const [area, setArea] = useState<ExpertiseArea>(initialEditorial?.area || ExpertiseArea.CONSTITUCIONAL);
  const [isAiSuggestingTopic, setIsAiSuggestingTopic] = useState(false);
  const [author, setAuthor] = useState(initialEditorial?.author || "AB. ESTEBAN ORDOÑEZ M, MAGISTER EN DERECHO CONSTITUCIONAL Y DEFENSA PROCESAL");
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [summary, setSummary] = useState(initialEditorial?.summary || '');
  const [managerSummary, setManagerSummary] = useState(initialEditorial?.managerSummary || '');
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [isExpanding, setIsExpanding] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [isHumanizing, setIsHumanizing] = useState(false);

  const [customApiKey, setCustomApiKey] = useState(() => typeof window !== 'undefined' ? localStorage.getItem("SOLJURE_GEMINI_API_KEY") || '' : '');
  const [showKeyConfig, setShowKeyConfig] = useState(false);

  const [saveAsNew, setSaveAsNew] = useState(false);
  const [aiPromptTopic, setAiPromptTopic] = useState('');
  const [isAiGeneratingFull, setIsAiGeneratingFull] = useState(false);

  const [generationStepIndex, setGenerationStepIndex] = useState(0);
  const GENERATION_STEPS = [
    "Analizando el marco normativo y legislativo de Ecuador al 2026...",
    "Estructurando el Caso Práctico detallado con transacciones reales...",
    "Calculando las diferencias de conversión y formulando pautas legales...",
    "Redactando el Abstract Académico y el Resumen Ejecutivo de alta coherencia...",
    "Elaborando la Alerta de Negocios y Recomendaciones para la Alta Gerencia...",
    "Realizando el control de calidad bajo normativa ecuatoriana vigente...",
    "Dando formato Markdown final y ordenando las tablas comparativas..."
  ];

  useEffect(() => {
    let interval: any;
    if (isAiGeneratingFull) {
      setGenerationStepIndex(0);
      interval = setInterval(() => {
        setGenerationStepIndex(prev => (prev + 1) % GENERATION_STEPS.length);
      }, 3500);
    } else {
      setGenerationStepIndex(0);
    }
    return () => clearInterval(interval);
  }, [isAiGeneratingFull]);

  const SUGGESTED_TOPICS = [
    {
      title: "Planificación del Impuesto Laboral y Contratos de Trabajo Ecuatoriano en 2026",
      area: ExpertiseArea.LABORAL,
      desc: "Análisis técnico de contratos indefinidos y plazos bajo el Código de Trabajo."
    },
    {
      title: "Eficacia de las Medidas Cautelares y Acciones de Protección frente a Actos Administrativos",
      area: ExpertiseArea.CONSTITUCIONAL,
      desc: "Jurisprudencia de la Corte Constitucional y plazos en la vía ordinaria."
    },
    {
      title: "La Carga de la Prueba y Excepciones Previas en el Procedimiento Ejecutivo Civil",
      area: ExpertiseArea.CIVIL,
      desc: "Estrategias de contradicción e impugnación formal según el COGEP."
    },
    {
      title: "Responsabilidad Penal de las Personas Jurídicas y Programas de Compliance bajo el COIP",
      area: ExpertiseArea.PENAL,
      desc: "Metodologías de control empresarial e inmutabilidad de la defensa técnica."
    },
    {
      title: "Impugnación de Actas de Determinación Tributaria y Procedimiento Contencioso",
      area: ExpertiseArea.TRIBUTARIO_ADUANERO,
      desc: "Análisis doctrinal and procesal frente a las glosas de la administración pública."
    }
  ];

  const handleGenerateFullAIEditorial = async (customTopic?: string, customArea?: ExpertiseArea) => {
    const topicToUse = customTopic || aiPromptTopic;
    const areaToUse = customArea || area;
    if (!topicToUse.trim()) {
      alert("Por favor ingresa un tema.");
      return;
    }
    setIsAiGeneratingFull(true);
    try {
      const generated = await generateFullEditorial(topicToUse, areaToUse);
      if (generated && generated.title) {
        setTitle(generated.title);
        setSummary(generated.summary);
        setManagerSummary(generated.managerSummary || '');
        setContent(generated.content);
        if (customArea) setArea(customArea);
        setAiPromptTopic('');
        alert("¡Editorial académico completo redactado con éxito! El título, resumen ejecutivo, resumen gerencial y contenido de norma se han cargado en el panel. Puedes revisarlos antes de guardarlos pulsa 'Publicar'.");
      }
    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      alert(`⚠️ Error en Sistema de Compilación Editorial:\n\n${errorMessage}\n\nHemos abierto la opción "Configurar Motor de Compilación de Datos" abajo para que puedas pegar tu credencial de motor.`);
      setShowKeyConfig(true);
    } finally {
      setIsAiGeneratingFull(false);
    }
  };

  const handleSuggestRandomTopic = async () => {
    setIsAiSuggestingTopic(true);
    try {
      const existingTitles = editorials.filter(e => e.area === area).map(e => e.title);
      const suggested = await generateAutoTopicForArea(area, existingTitles);
      setAiPromptTopic(suggested);
    } catch (err: any) {
      console.error(err);
      alert("No se pudo sugerir un tema aleatorio. Razón: " + (err?.message || String(err)));
    } finally {
      setIsAiSuggestingTopic(false);
    }
  };

  const handleRandomSuggestAndGenerate = async () => {
    setIsAiGeneratingFull(true);
    try {
      const existingTitles = editorials.filter(e => e.area === area).map(e => e.title);
      const topicToGenerate = await generateAutoTopicForArea(area, existingTitles);
      setAiPromptTopic(topicToGenerate);
      
      const generated = await generateFullEditorial(topicToGenerate, area);
      if (generated && generated.title) {
        setTitle(generated.title);
        setSummary(generated.summary);
        setManagerSummary(generated.managerSummary || '');
        setContent(generated.content);
        setAiPromptTopic('');
        alert(`🎲 ¡Listo! Se ha compilado un nuevo editorial académico relevante:\n\n"${generated.title}"\n\nSe ha evitado la repetición de temas y se ha cargado con éxito en la mesa editorial.`);
      }
    } catch (err: any) {
      console.error(err);
      alert("Error en Compilación Automática de Editorial:\n\n" + (err?.message || String(err)));
    } finally {
      setIsAiGeneratingFull(false);
    }
  };

  const handleSave = () => {
    if (!title || !content) {
      alert("Por favor completa el título y el contenido.");
      return;
    }
    
    // Logic to keep history: if saveAsNew is checked, or if there's no initial editorial, generate new ID
    const isEditing = !!initialEditorial?.id;
    const shouldKeepHistory = saveAsNew || !isEditing;

    const newEditorial: Editorial = {
      id: shouldKeepHistory ? Math.random().toString(36).substr(2, 9) : initialEditorial!.id,
      title,
      summary: summary || "Análisis técnico generado.",
      managerSummary,
      content,
      author,
      date: new Date(date).toLocaleDateString('es-EC', { day: 'numeric', month: 'short', year: 'numeric' }),
      area,
      readTime: `${Math.ceil(content.split(' ').length / 200)} min`
    };
    
    if (isEditing && !saveAsNew) {
      if (!confirm("¿Deseas actualizar el artículo existente? (Se sobreescritirá el anterior)")) return;
    }

    onSave(newEditorial);
  };

  const handleAiAssist = async () => {
    setIsAiProcessing(true);
    setAiAnalysis(null);
    try {
      const result = await getTechnicalAssistantAdvice(content, area);
      setAiAnalysis(result);
    } catch (err) {
      setAiAnalysis("Error al procesar la solicitud.");
    } finally {
      setIsAiProcessing(false);
    }
  };

  const handleExpandTopic = async () => {
    if (!title) return;
    setIsExpanding(true);
    try {
      const result = await expandEditorialTopic(title, area, content);
      setContent(result);
    } catch (err) {
      alert("Error al expandir el tema.");
    } finally {
      setIsExpanding(false);
    }
  };

  const handleRefine = async () => {
    if (!content) return;
    setIsRefining(true);
    try {
      const result = await refineContent(content, area);
      setContent(result);
    } catch (err) {
      alert("Error al refinar el contenido.");
    } finally {
      setIsRefining(false);
    }
  };

  const handleHumanize = async () => {
    if (!content) return;
    setIsHumanizing(true);
    try {
      const result = await humanizeContent(content, area);
      setContent(result);
    } catch (err) {
      alert("Error al humanizar el contenido.");
    } finally {
      setIsHumanizing(false);
    }
  };

  return (
    <div className="space-y-8 w-full flex flex-col pb-16">
      <header className="flex flex-col lg:flex-row gap-6 lg:items-end justify-between border-b border-brand-navy/[0.08] pb-6">
        <div className="flex-1 w-full space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase text-brand-accent tracking-[0.2em] bg-brand-accent/10 px-2.5 py-0.5 rounded border border-brand-accent/20">Estudio y Compilación Editorial</span>
            {initialEditorial?.id && (
              <span className="text-[10px] font-bold uppercase text-brand-slate bg-brand-bg px-2 py-0.5 rounded border border-brand-border/30">Editando Id: {initialEditorial.id}</span>
            )}
          </div>
          <input 
            type="text" 
            placeholder="Título del Editorial..."
            className="w-full text-2xl sm:text-3xl font-serif bg-transparent focus:outline-none placeholder:text-brand-navy/30 text-brand-navy font-bold focus:border-b focus:border-brand-accent/40 pb-1"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-2 sm:gap-3 items-center justify-start lg:justify-end shrink-0">
          <button 
            disabled={isExpanding || !title}
            onClick={handleExpandTopic}
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-white border border-brand-accent text-brand-accent rounded-xl hover:bg-brand-accent hover:text-white transition-all font-bold text-xs disabled:opacity-50 cursor-pointer shadow-xs"
          >
            <Sparkles size={14} className={isExpanding ? 'animate-spin' : ''} />
            {isExpanding ? 'Profundizando...' : 'Profundizar'}
          </button>
          <button 
            disabled={isHumanizing || !content}
            onClick={handleHumanize}
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-brand-bg text-brand-navy border border-brand-navy/20 rounded-xl hover:bg-brand-navy hover:text-white transition-all font-bold text-xs disabled:opacity-50 cursor-pointer shadow-xs"
          >
            <User size={14} className={isHumanizing ? 'animate-bounce' : ''} />
            {isHumanizing ? 'Personalizando...' : 'Voz Humana'}
          </button>
          <button 
            disabled={isRefining || !content}
            onClick={handleRefine}
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-brand-navy text-white rounded-xl hover:bg-brand-navy/90 transition-all font-bold text-xs disabled:opacity-50 cursor-pointer shadow-xs"
          >
            <PenTool size={14} className={isRefining ? 'animate-pulse' : ''} />
            {isRefining ? 'Refinando...' : 'Pulir'}
          </button>
          <button 
            disabled={isAiProcessing || !content}
            onClick={handleAiAssist}
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-brand-gold text-white rounded-xl hover:bg-brand-gold/90 transition-all font-bold text-xs disabled:opacity-50 shadow-md cursor-pointer"
          >
            <Search size={14} />
            Check Técnico
          </button>
          <button 
            onClick={handleSave}
            className="flex items-center gap-1.5 px-5 py-2.5 bg-[#0a1c3a] text-white rounded-xl hover:bg-[#030a16] transition-all font-black text-xs uppercase tracking-wider border border-transparent shadow-md cursor-pointer"
          >
            <Check size={14} />
            Publicar
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 sm:p-8 border border-brand-navy/5 shadow-sm flex flex-col">
          
          {/* Sistema de Asistencia Editorial & Compilación */}
          <div className="mb-6 p-6 bg-gradient-to-br from-[#0f172a] to-[#1e293b] text-white rounded-xl shadow-xl relative overflow-hidden border border-brand-accent/20">
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-accent/5 rounded-full blur-2xl"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles size={16} className="text-brand-accent animate-pulse" />
                <span className="text-[10px] uppercase font-black tracking-[0.25em] text-brand-accent">Asistente Editorial de Compilación Tecnológica</span>
              </div>
              <h3 className="text-sm font-semibold mb-2 text-white">¿Cuál es el tema normativo de tu nuevo editorial para CONTAPRO DC?</h3>
              <p className="text-[11px] text-white/60 mb-4 font-light leading-relaxed">
                Nuestro sistema compilará un artículo de alto impacto y académico (más de 800 palabras), citando normativa internacional (NIIF) y local (SRI) ecuatoriana al 2026, con asientos contables y gestión de riesgos.
              </p>

              {/* Configuración de API Key para Despliegues Externos */}
              <div className="mb-4 bg-white/5 p-3 rounded-lg border border-white/10">
                <button
                  type="button"
                  onClick={() => setShowKeyConfig(!showKeyConfig)}
                  className="text-[10px] text-brand-accent hover:underline flex items-center gap-1 cursor-pointer font-bold tracking-wider uppercase"
                >
                  <span>{showKeyConfig ? '❌ Ocultar Configuración del Motor' : '🔑 Configurar Motor de Compilación de Datos (Opcional)'}</span>
                </button>
                {showKeyConfig && (
                  <div className="mt-2.5 space-y-2">
                    <p className="text-[10px] text-white/50 leading-relaxed">
                      Si has desplegado la revista de forma externa (por ej. en Vercel) y no configuraste la variable de entorno <code className="text-brand-accent font-mono bg-black/30 px-1 py-0.5 rounded">GEMINI_API_KEY</code>, ingresa la llave de compilación aquí para vincularla a este navegador.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input 
                        type="password"
                        placeholder="Introduce la llave de compilación normativo..."
                        className="flex-1 bg-black/20 border border-white/10 rounded-md px-3 py-2 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-brand-accent"
                        value={customApiKey}
                        onChange={(e) => {
                          const val = e.target.value;
                          setCustomApiKey(val);
                          if (val.trim()) {
                            localStorage.setItem("CONTAPRO_GEMINI_API_KEY", val.trim());
                          } else {
                            localStorage.removeItem("CONTAPRO_GEMINI_API_KEY");
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (customApiKey.trim()) {
                            alert("🔑 ¡Credencial del motor de compilación vinculada y guardada en este navegador!");
                          } else {
                            alert("Se eliminó la API Key personalizada. Se intentará usar la variable de entorno del sistema.");
                          }
                          setShowKeyConfig(false);
                        }}
                        className="px-4 py-2 bg-brand-accent hover:bg-brand-accent/90 text-brand-navy font-black text-[9px] uppercase tracking-wider rounded-md cursor-pointer transition-colors"
                      >
                        Guardar
                      </button>
                    </div>
                  </div>
                )}
              </div>
              
              {isAiGeneratingFull ? (
                <div className="bg-brand-navy/60 border border-brand-accent/30 p-5 rounded-lg mb-6 flex flex-col gap-3 relative overflow-hidden animate-pulse">
                  <div className="absolute top-0 left-0 h-1 bg-gradient-to-r from-brand-accent to-pink-500 transition-all duration-1000" style={{ width: `${(generationStepIndex + 1) * (100 / GENERATION_STEPS.length)}%` }}></div>
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 border-2 border-brand-accent border-t-transparent animate-spin rounded-full"></div>
                    <span className="text-[10px] font-black text-brand-accent uppercase tracking-widest">Fase {generationStepIndex + 1} de {GENERATION_STEPS.length}</span>
                  </div>
                  <p className="text-xs font-semibold text-white transition-all duration-300">
                    {GENERATION_STEPS[generationStepIndex]}
                  </p>
                  <p className="text-[10px] text-white/50 italic">
                    Esto puede tomar entre 15 y 30 segundos mientras compilamos un artículo exhaustivo y riguroso de más de 800 palabras.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-3 mb-6">
                  <div className="flex gap-3">
                    <input 
                      type="text"
                      disabled={isAiGeneratingFull}
                      placeholder="Ej: Impuesto diferido por revaluación de Propiedades, Planta y Equipo según NIC 16..."
                      className="flex-1 bg-white/10 border border-white/20 rounded-md px-4 py-2.5 text-xs focus:outline-none focus:border-brand-accent text-white placeholder:text-white/30"
                      value={aiPromptTopic}
                      onChange={(e) => setAiPromptTopic(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleGenerateFullAIEditorial();
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => handleGenerateFullAIEditorial()}
                      disabled={isAiGeneratingFull || !aiPromptTopic.trim()}
                      className="px-6 py-2.5 bg-brand-accent hover:bg-brand-accent/90 text-brand-navy font-black text-[10px] rounded-md uppercase tracking-wider transition-all shadow-md flex items-center gap-2 disabled:opacity-55 cursor-pointer"
                    >
                      <Sparkles size={12} />
                      Redactar y Compilar
                    </button>
                  </div>
                  
                  {/* Opciones de generación de temas aleatorios sin duplicidad y con alternativa */}
                  <div className="flex flex-wrap gap-2.5">
                    <button
                      type="button"
                      onClick={handleSuggestRandomTopic}
                      disabled={isAiGeneratingFull || isAiSuggestingTopic}
                      className="px-4 py-2 bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 border border-indigo-500/30 rounded-md text-[9px] font-bold uppercase tracking-widest transition-all flex items-center gap-1.5 disabled:opacity-40 cursor-pointer"
                      title="Propone un tema técnico correspondiente al área activa evitando los duplicados existentes"
                    >
                      <RefreshCw size={11} className={isAiSuggestingTopic ? "animate-spin" : ""} />
                      {isAiSuggestingTopic ? "Buscando Tema..." : "🎲 Sugerir Tema Aleatorio (Inédito)"}
                    </button>
                    
                    <button
                      type="button"
                      onClick={handleRandomSuggestAndGenerate}
                      disabled={isAiGeneratingFull || isAiSuggestingTopic}
                      className="px-4 py-2 bg-pink-500/15 hover:bg-pink-500/25 text-pink-300 border border-pink-500/30 rounded-md text-[9px] font-bold uppercase tracking-widest transition-all flex items-center gap-1.5 disabled:opacity-40 cursor-pointer"
                      title="Sugiere un tema aleatorio y redacta el artículo académico entero en un solo clic"
                    >
                      <Sparkles size={11} />
                      ⚡ Compilación Rápida de Edición
                    </button>
                  </div>
                </div>
              )}

              {/* Sugerencias Rápidas de Un Solo Click */}
              <div className="border-t border-white/10 pt-4">
                <h4 className="text-[10px] uppercase tracking-wider font-extrabold text-brand-accent/90 mb-3 flex items-center gap-1.5">
                  <BookOpen size={10} />
                  Temas Académicos Recomendados 2026 (No Repetidos):
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {SUGGESTED_TOPICS.map((topic, i) => (
                    <button
                      key={i}
                      type="button"
                      disabled={isAiGeneratingFull}
                      onClick={() => handleGenerateFullAIEditorial(topic.title, topic.area)}
                      className="text-left bg-white/5 hover:bg-white/10 border border-white/10 hover:border-brand-accent/30 rounded-lg p-3 transition-all group flex flex-col justify-between h-full disabled:opacity-50"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="text-[8px] tracking-widest font-black uppercase text-brand-accent group-hover:text-white transition-colors">
                            {topic.area}
                          </span>
                          <span className="text-[8px] text-white/40 transition-colors group-hover:text-brand-accent font-extrabold">Compilación Rápida</span>
                        </div>
                        <p className="text-[11px] font-bold text-white group-hover:text-brand-accent transition-colors line-clamp-1">
                          {topic.title}
                        </p>
                        <p className="text-[9px] text-white/50 line-clamp-1 mt-0.5">
                          {topic.desc}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-brand-border/20 pt-6 mt-6 flex flex-col gap-2">
            <label className="text-[10px] font-black uppercase tracking-[0.25em] text-brand-slate block">Contenido del Editorial (Soporta Formato Markdown)</label>
            <textarea 
              className="w-full min-h-[450px] font-sans text-sm focus:outline-none focus:ring-1 focus:ring-brand-accent focus:border-brand-accent leading-relaxed text-brand-navy/90 bg-brand-bg/40 p-4 rounded-xl border border-brand-border/40 font-medium"
              placeholder="Escribe tu análisis técnico aquí... Usa un tono profesional y académico."
              value={content}
              onChange={(e) => setContent(e.target.value)}
            ></textarea>
          </div>
          
          {aiAnalysis && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              className="mt-6 pt-6 border-t border-brand-accent/20 overflow-y-auto max-h-64 bg-brand-accent/5 p-6 rounded-sm"
            >
              <div className="flex items-center gap-2 text-brand-accent font-bold text-xs uppercase tracking-[0.2em] mb-4">
                <Sparkles size={14} />
                Technical Insight & Compliance Review
              </div>
              <div className="prose prose-sm prose-slate max-w-none text-brand-navy/90 font-sans">
                <div className="text-sm leading-relaxed">
                  <ReactMarkdown remarkPlugins={[remarkGfm]} components={MarkdownComponents}>{aiAnalysis}</ReactMarkdown>
                </div>
              </div>
              <button 
                onClick={() => setAiAnalysis(null)}
                className="mt-6 text-[10px] uppercase font-bold text-brand-slate hover:text-brand-navy tracking-tighter"
              >
                Descartar Análisis
              </button>
            </motion.div>
          )}
        </div>

        <div className="bg-white rounded-sm p-8 border border-brand-border overflow-y-auto flex flex-col shadow-sm">
          <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-accent mb-8 flex items-center gap-2 pb-2 border-b border-brand-border">
            <Layout size={12} />
            Registry & Compliance Meta
          </h4>
          
          <div className="space-y-8">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-brand-slate mb-3 block">Expertise Nexus</label>
              <select 
                value={area}
                onChange={(e) => setArea(e.target.value as ExpertiseArea)}
                className="w-full bg-[#0a1120] border border-brand-border rounded-sm p-3 text-xs focus:border-brand-accent outline-none font-bold text-white"
              >
                <option value={ExpertiseArea.LABORAL} className="bg-[#0a1120] text-white font-bold">{ExpertiseArea.LABORAL}</option>
                <option value={ExpertiseArea.CIVIL} className="bg-[#0a1120] text-white font-bold">{ExpertiseArea.CIVIL}</option>
                <option value={ExpertiseArea.COMERCIAL} className="bg-[#0a1120] text-white font-bold">{ExpertiseArea.COMERCIAL}</option>
                <option value={ExpertiseArea.PENAL} className="bg-[#0a1120] text-white font-bold">{ExpertiseArea.PENAL}</option>
                <option value={ExpertiseArea.TRIBUTARIO_ADUANERO} className="bg-[#0a1120] text-white font-bold">{ExpertiseArea.TRIBUTARIO_ADUANERO}</option>
                <option value={ExpertiseArea.ADMINISTRATIVO} className="bg-[#0a1120] text-white font-bold">{ExpertiseArea.ADMINISTRATIVO}</option>
                <option value={ExpertiseArea.CONSTITUCIONAL} className="bg-[#0a1120] text-white font-bold">{ExpertiseArea.CONSTITUCIONAL}</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-brand-slate mb-3 block">Autor del Reporte</label>
              <input 
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                className="w-full bg-brand-bg border border-brand-border rounded-sm p-3 text-xs focus:border-brand-navy outline-none font-bold text-brand-navy"
                placeholder="Nombre completo y títulos..."
              />
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-brand-slate mb-3 block">Publication Timestamp</label>
              <input 
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-brand-bg border border-brand-border rounded-sm p-3 text-xs focus:border-brand-navy outline-none font-bold text-brand-navy"
              />
            </div>
            
            <div>
              <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-brand-slate mb-3 block">Executive Abstract</label>
              <textarea 
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                className="w-full bg-brand-bg border border-brand-border rounded-sm p-3 text-xs h-32 focus:border-brand-navy outline-none resize-none font-light leading-relaxed"
                placeholder="Declare el propósito técnico del documento..."
              ></textarea>
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-brand-accent mb-3 block italic">Resumen para el Gerente</label>
              <textarea 
                value={managerSummary}
                onChange={(e) => setManagerSummary(e.target.value)}
                className="w-full bg-brand-accent/5 border border-brand-accent/20 rounded-sm p-3 text-xs h-32 focus:border-brand-accent outline-none resize-none font-medium leading-relaxed text-brand-navy"
                placeholder="Puntos clave de negocio, impacto institucional y decisiones requeridas..."
              ></textarea>
            </div>

            <div className="pt-8 border-t border-brand-border space-y-4">
              {initialEditorial?.id && (
                <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-100 rounded-sm">
                  <input 
                    type="checkbox" 
                    id="save_as_new"
                    checked={saveAsNew}
                    onChange={(e) => setSaveAsNew(e.target.checked)}
                    className="w-4 h-4 accent-brand-navy"
                  />
                  <label htmlFor="save_as_new" className="text-[10px] font-bold uppercase text-blue-800 cursor-pointer">
                    Guardar como nueva versión (Mantiene el histórico)
                  </label>
                </div>
              )}
              
              <h5 className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-accent mb-4">Protocolo de Validación</h5>
              <div className="bg-brand-bg p-4 text-[10px] text-brand-slate leading-[1.8] border border-brand-border font-medium">
                "Este sistema de estructuración académica sincroniza el borrador con la base normativa vigente y los estándares IFRS/IASB internacionales aplicados en la jurisdicción ecuatoriana."
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
