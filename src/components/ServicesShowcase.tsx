import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Briefcase, FileText, ShieldAlert, CheckCircle, 
  DollarSign, Building, XCircle, Users, Scale, 
  Play, Pause, Volume2, VolumeX, Sparkles, Smartphone, 
  Heart, Share2, Send, HelpCircle, Check, ArrowRight,
  TrendingUp, Percent, Clock, ChevronRight, Award, Flame,
  Calculator, UserCheck, Shield, ChevronLeft, ThumbsUp,
  ExternalLink, Terminal, Settings, BookOpen
} from 'lucide-react';
import { db, auth } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

interface ServiceItem {
  id: string;
  title: string;
  category: string;
  icon: React.ReactNode;
  imageUrl: string;
  summary: string;
  fullDescription: string;
  keyBenefits: string[];
  viralStat: string;
  viralStatLabel: string;
  estimatedDuration: string;
}

export const ServicesShowcase: React.FC = () => {
  // Service definition containing everything requested by the user
  const services: ServiceItem[] = [
    {
      id: 'civil',
      title: 'Derecho Civil: Casación & Litigación Ordinaria',
      category: 'Civil',
      icon: <Scale className="w-6 h-6" />,
      imageUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&q=80&w=600',
      summary: 'Patrocinio procesal de alta especialidad en recursos de casación civil bajo causales del Art. 268 del COGEP y disputas de derechos reales, contratos y obligaciones.',
      fullDescription: 'Abordamos la litigación civil ordinaria con el más alto rigor doctrinal ecuatoriano. Lideramos el diseño de recursos extraordinarios de casación civil ante la Corte Nacional de Justicia, superando el riguroso examen de admisibilidad constitucional mediante la fundamentación autónoma de cargos y la exégesis de fallos de triple reiteración.',
      keyBenefits: ['Sólido control previo de admisibilidad en casación civil', 'Demostración dogmática de vicios in iudicando o in procedendo', 'Recursos con nexo directo a la seguridad jurídica (Art. 82 CRE)', 'Análisis preventivo de viabilidad procesal y riesgos de costas'],
      viralStat: '92%',
      viralStatLabel: 'Inadmisibilidad en Casación Evitada con Rigor',
      estimatedDuration: 'De acuerdo a tiempos procesales / COGEP'
    },
    {
      id: 'familia',
      title: 'Derecho de Familia: Alimentos, Tenencia y Divorcios',
      category: 'Familia',
      icon: <Users className="w-6 h-6" />,
      imageUrl: 'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?auto=format&fit=crop&q=80&w=600',
      summary: 'Garantizamos el debido proceso en pensiones alimenticias, divorcios litigiosos y tenencia en estricta observancia del Código Civil y el CONA, precautelando el interés superior del menor.',
      fullDescription: 'La resolución de conflictos familiares exige un equilibrio entre la sensibilidad humana y el rigor jurídico. Representamos disputas de fijación y rebaja de pensiones alimenticias utilizando incidentes procesales basados en la capacidad contributiva real, incidentes de tenencia, régimen de visitas, y disolución de sociedad conyugal.',
      keyBenefits: ['Cálculo de tabla de pensiones alimenticias del MIES blindado', 'Acuerdos de mediación formales con validez de sentencia ejecutoriada', 'Patrocinio en divorcios por causales del Art. 110 del Código Civil', 'Protección del interés superior de los niños, niñas y adolescentes'],
      viralStat: '100%',
      viralStatLabel: 'Debido Proceso en Garantía de Menores',
      estimatedDuration: 'Procedimiento Sumario / Inmediato'
    },
    {
      id: 'roles',
      title: 'Derecho Laboral: Estabilidad Reforzada & Despidos',
      category: 'Laboral',
      icon: <Briefcase className="w-6 h-6" />,
      imageUrl: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&q=80&w=600',
      summary: 'Soluciones integrales ante despido ineficaz de mujeres gestantes/lactantes y dirigentes sindicales, visto bueno, jubilaciones y compliance laboral bajo el Código del Trabajo.',
      fullDescription: 'La estabilidad laboral reforzada exige el trámite riguroso de autorizaciones administrativas ante el Inspector del Trabajo. Patrocinamos acciones de despido ineficaz en procedimiento sumario, garantizando la reincorporación inmediata o el cobro de indemnizaciones con recargo del 10% adicional.',
      keyBenefits: ['Defensa corporativa ante demandas sumarias por ineficacia laboral', 'Sustanciación técnica de un visto bueno legal con causa legítima', 'Auditoría preventiva de contratos de trabajo y actas de finiquito', 'Asesoría científica en cálculo de horas extras e indemnizaciones'],
      viralStat: '10%',
      viralStatLabel: 'Recargo Sancionatorio Evitado por Compliance',
      estimatedDuration: 'Procedimiento Sumario (Art. 332 COGEP)'
    },
    {
      id: 'transito',
      title: 'Derecho de Tránsito: Impugnaciones y Defensa Técnica',
      category: 'Tránsito',
      icon: <ShieldAlert className="w-6 h-6" />,
      imageUrl: 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?auto=format&fit=crop&q=80&w=600',
      summary: 'Impugnación formal de fotosensóricos y contravenciones de la ANT o GADs, y defensa técnica judicial en delitos de tránsito conforme al COIP.',
      fullDescription: 'Protegemos tu derecho al libre tránsito y la presunción de inocencia. Brindamos asesoría en la anulación de resoluciones sancionatorias de tránsito irregulares, impugnando citaciones de velocidad captadas con radares mal calibrados, y asumiendo la defensa en audiencias de juicio por accidentes.',
      keyBenefits: ['Anulación de contravenciones por falta de notificación legal', 'Defensa forense técnica en accidentes de tránsito bajo el COIP', 'Restitución de puntos de licencia de conducir mediante apelación', 'Impugnación de resoluciones administrativas de la ANT'],
      viralStat: '0%',
      viralStatLabel: 'Cobro Injustificado de Foto-multas Evitado',
      estimatedDuration: 'Término Fatal de 3 Días para Impugnación'
    },
    {
      id: 'defensa_omisos',
      title: 'Derecho Penal: Defensa Forense & Libertad del Directivo',
      category: 'Penal',
      icon: <Shield className="w-6 h-6" />,
      imageUrl: 'https://images.unsplash.com/photo-1505664194779-8bebcb95df84?auto=format&fit=crop&q=80&w=600',
      summary: 'Defensa técnica especializada en materia penal de delitos económicos, tributarios y ordinarios. Acreditación rigurosa de arraigos para mitigar la prisión preventiva (Art. 534 COIP).',
      fullDescription: 'Representamos a directivos y el patrimonio corporativo ante investigaciones fiscales e instrucción fiscal. Aplicamos el principio de excepcionalidad y proporcionalidad de las medidas cautelares conforme a los estándares convencionales, garantizando que la prisión preventiva no sea una sanción anticipada.',
      keyBenefits: ['Acreditación científica de arraigos de calidad para evitar prisión', 'Litigación estratégica en audiencias de formulación de cargos', 'Compliance penal corporativo ante delitos de lavado, estafa y fraude', 'Recursos de apelación y casación penal de alto nivel doctrinal'],
      viralStat: '100%',
      viralStatLabel: 'Defensa en Enfoque Proporcional y Convencional',
      estimatedDuration: 'Investigación Previa / Etapas del COIP'
    },
    {
      id: 'constitucional',
      title: 'Derecho Constitucional: Garantías & Acción Extraordinaria',
      category: 'Constitucional',
      icon: <Building className="w-6 h-6" />,
      imageUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=600',
      summary: 'Interposición y defensa de acciones de protección, acciones extraordinarias de protección (AEP) y hábeas data ante la Corte Constitucional del Ecuador.',
      fullDescription: 'La Acción Extraordinaria de Protección es el baluarte de resguardo judicial de última ratio. Superamos los rigurosos filtros de admisibilidad de la LOGJCC, estructurando cargos de violación constitucional al debido proceso y tutela judicial efectiva con observancia estricta del test de motivación.',
      keyBenefits: ['Trascendencia constitucional demostrada con rigor jurídico', 'Alineación de la demanda a estándares del test de motivación de la CC', 'Sustanciación de medidas cautelares constitucionales de urgencia', 'Agotamiento preciso de recursos ordinarios previo a la vía de la CC'],
      viralStat: '20d',
      viralStatLabel: 'Término Improrrogable de Interposición (LOGJCC)',
      estimatedDuration: 'Fases de Calificación y Sentencia de la CC'
    },
    {
      id: 'impuestos',
      title: 'Derecho Administrativo y Tributario: Silencio Positivo & SRI',
      category: 'Administrativo y Tributario',
      icon: <FileText className="w-6 h-6" />,
      imageUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=600',
      summary: 'Impugnaciones administrativas bajo el COA, reclamos de pago indebido o en exceso ante el SRI y protocolización judicial del Silencio Administrativo.',
      fullDescription: 'Combatimos la arbitrariedad estatal y la mora administrativa municipal o fiscal. Patrocinamos la protocolización de escrituras públicas de Silencio Administrativo Positivo frente a GADs conforme al COA, y planteamos recursos de impugnación tributaria ante los Tribunales Contenciosos del Ecuador.',
      keyBenefits: ['Protocolización y cobro ejecutivo del Silencio Administrativo Positivo', 'Impugnación de glosas del SRI, SENAE y Contraloría General del Estado', 'Optimización legal de la carga impositiva en planificación fiscal', 'Cancelación legal de trámites de coactiva de forma ágil'],
      viralStat: '30d',
      viralStatLabel: 'Término del Silencio para Configuración Legal',
      estimatedDuration: 'Reclamo Administrativo o Litigio Contencioso'
    },
    {
      id: 'constitucion_cia',
      title: 'Otros Servicios: Derecho Societario & Compliance Comercial',
      category: 'Otros',
      icon: <BookOpen className="w-6 h-6" />,
      imageUrl: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&q=80&w=600',
      summary: 'Constitución ágil de compañías SAS moderna y flexible, blindaje patrimonial, fusiones, liquidaciones y protección del levantamiento del velo societario.',
      fullDescription: 'Ofrecemos soluciones corporativas preventivas para resguardar el capital de los fundadores. Brindamos asesoría en la constitución inmediata de compañías SAS sin capital mínimo exigido, fusiones, y estructuramos protocolos de manejo de personal y activos para evitar el levantamiento del velo societario.',
      keyBenefits: ['Creación de empresas SAS en 48 horas con estatutos a la medida', 'Liquidaciones societarias expeditas libres de trabas y pasivos imprevistos', 'Protocolos preventivos ante inoponibilidad de personería jurídica', 'Auditoría patrimonial y de contratos civiles mercantiles'],
      viralStat: '48h',
      viralStatLabel: 'Término Promedio para Constitución SAS',
      estimatedDuration: 'De 2 a 15 días laborables'
    }
  ];

  // Interactive Simulator Tab
  const [activeSimulatorTab, setActiveSimulatorTab] = useState<'impuestos' | 'defensa' | 'constitucion' | 'roles'>('impuestos');
  const [selectedService, setSelectedService] = useState<ServiceItem | null>(null);

  // States for Simulator 1: Tax Income Estimator
  const [incomeAmount, setIncomeAmount] = useState<number>(35000);
  const [expenseAmount, setExpenseAmount] = useState<number>(18000);
  
  // States for Simulator 2: Fines and Penalties
  const [omissionMonths, setOmissionMonths] = useState<number>(3);
  const [obligationType, setObligationType] = useState<'iva' | 'renta' | 'anexo'>('iva');
  const [amountSales, setAmountSales] = useState<number>(5000);

  // States for Simulator 3: Company Setup
  const [companyType, setCompanyType] = useState<'sas' | 'sa' | 'limitada'>('sas');
  const [socialCapital, setSocialCapital] = useState<number>(800);

  // States for Simulator 4: Payroll & IESS
  const [employeeCount, setEmployeeCount] = useState<number>(5);
  const [avgSalary, setAvgSalary] = useState<number>(650);

  // Short dynamic visual reels simulation
  const [activeVideoIndex, setActiveVideoIndex] = useState<number>(0);
  const [isVideoPlaying, setIsVideoPlaying] = useState<boolean>(true);
  const [videoLikes, setVideoLikes] = useState<number[]>([1420, 2940, 895, 3410]);
  const [hasLiked, setHasLiked] = useState<boolean[]>([false, false, false, false]);
  const [progress, setProgress] = useState<number>(0);

  // Lead feedback states
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    serviceName: 'Derecho Administrativo y Tributario: Silencio Positivo & SRI',
    message: ''
  });
  const [leadStatus, setLeadStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

  // Google Form link customization (toggled in Contact section)
  const [googleFormUrl, setGoogleFormUrl] = useState<string>(() => {
    return localStorage.getItem('soljure_google_form_url') || 
      'https://docs.google.com/forms/d/e/1FAIpQLSfBv6J_Zt0A1p0t9wK4-Vv5I80_1F5IuY7mG0L9L9_7vV8r5A/viewform?usp=sf_link';
  });
  const [isUrlEditing, setIsUrlEditing] = useState<boolean>(false);
  const [leadMethod, setLeadMethod] = useState<'direct' | 'google_form'>('direct');

  // Interactive SOLJURE Skills states (GitHub / Google Skills inspired concept)
  const [activeSkillId, setActiveSkillId] = useState<string>('impuestos_lorti');
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const [currentQuizStep, setCurrentQuizStep] = useState<number | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [earnedBadge, setEarnedBadge] = useState<boolean>(false);
  const [isVerifyingSkill, setIsVerifyingSkill] = useState<boolean>(false);

  // Video reels contents
  const videoReels = [
    {
      title: '¿Evadir o Planificar? El Escudo Fiscal SAS 2026',
      subtitles: [
        { time: 0, text: '💡 Sabías que constituir una empresa SAS en Ecuador...' },
        { time: 3, text: '¡No requiere capital inicial de miles de dólares!' },
        { time: 6, text: 'Además, te otorga un escudo tributario único...' },
        { time: 9, text: 'para justificar gastos deducibles sin correr riesgos.' },
        { time: 12, text: 'Evita multas declarando con soporte real.' },
        { time: 15, text: '📞 Haz clic en "Adquirir" para crear tu SAS en 48 horas.' }
      ],
      likes: '1.4k',
      comments: '344',
      shares: '120',
      duration: 18,
      coverImg: 'https://images.unsplash.com/photo-1596463059283-da257325602a?auto=format&fit=crop&q=80&w=400'
    },
    {
      title: '¡Alerta Omisos! El SRI fiscalizará cuentas personales',
      subtitles: [
        { time: 0, text: '⚠️ ¡Mucho cuidado contribuyente!' },
        { time: 3, text: 'En este año 2026, el SRI ha incrementado un 45%...' },
        { time: 6, text: 'las notificaciones coactivas para deudas omisas.' },
        { time: 9, text: 'Si utilizas tus cuentas de ahorros para giros de negocio...' },
        { time: 12, text: 'puedes tener multas de hasta el 20% sobre ingresos.' },
        { time: 15, text: '🛡️ En SOLJURE te defendemos con sustento real.' }
      ],
      likes: '2.9k',
      comments: '682',
      shares: '411',
      duration: 18,
      coverImg: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&q=80&w=400'
    },
    {
      title: '¿Cuánto cuesta un error de roles o IESS en tu empresa?',
      subtitles: [
        { time: 0, text: '👥 El personal es el recurso más importante...' },
        { time: 3, text: 'Pero omitir un aviso de entrada o liquidar mal los décimos...' },
        { time: 6, text: 'da lugar a glosas millonarias por el IESS.' },
        { time: 9, text: 'Un solo juicio laboral puede quebrar tu mediana empresa.' },
        { time: 12, text: 'Terceriza tus roles y vive con tranquilidad.' },
        { time: 15, text: '✅ Déjanos la nómina en manos profesionales de inmediato.' }
      ],
      likes: '895',
      comments: '112',
      shares: '48',
      duration: 18,
      coverImg: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&q=80&w=400'
    },
    {
      title: 'La Auditoría Preventiva: De Gasto a Inversión Suprema',
      subtitles: [
        { time: 0, text: '🔍 No esperes a que el SRI toque tu puerta.' },
        { time: 3, text: 'La asesoría integral preventiva de SOLJURE...' },
        { time: 6, text: 'analiza las inconsistencias operativas previamente.' },
        { time: 9, text: 'Encontramos vacíos de cumplimiento, facturas no válidas...' },
        { time: 12, text: 'y conciliamos tu inventario en concordancia a NIC 2.' },
        { time: 15, text: '💼 ¡Adquiere tu auditoría y cuida tu patrimonio hoy!' }
      ],
      likes: '3.4k',
      comments: '409',
      shares: '512',
      duration: 18,
      coverImg: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&q=80&w=400'
    }
  ];

  // Simulated video playback cycle
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isVideoPlaying) {
      interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            // Next video
            setProgress(0);
            setActiveVideoIndex(curr => (curr + 1) % videoReels.length);
            return 0;
          }
          return prev + 1.25; // Speed adjustment to match 18 seconds duration
        });
      }, 250);
    }
    return () => clearInterval(interval);
  }, [isVideoPlaying, activeVideoIndex]);

  // Find active subtitle corresponding to progress ratio
  const getActiveSubtitleText = () => {
    const elapsedSeconds = (progress / 100) * videoReels[activeVideoIndex].duration;
    const subs = videoReels[activeVideoIndex].subtitles;
    let found = subs[0].text;
    for (let i = 0; i < subs.length; i++) {
      if (elapsedSeconds >= subs[i].time) {
        found = subs[i].text;
      }
    }
    return found;
  };

  const toggleLikeVideo = (idx: number) => {
    const newHasLiked = [...hasLiked];
    const newLikes = [...videoLikes];
    if (newHasLiked[idx]) {
      newLikes[idx]--;
      newHasLiked[idx] = false;
    } else {
      newLikes[idx]++;
      newHasLiked[idx] = true;
    }
    setVideoLikes(newLikes);
    setHasLiked(newHasLiked);
  };

  // Tax Estimator computations
  const taxableBasis = Math.max(0, incomeAmount - expenseAmount);
  const getEstimatedCorporatetax = () => {
    // 2026 Ecuador flat corporate standard standard rate of 25% or 22% for micro/pymes
    const rate = companyType === 'sas' ? 0.22 : 0.25;
    return taxableBasis * rate;
  };

  // SRI late penalty simulation values
  const getFinesReport = () => {
    const minFine = obligationType === 'iva' ? 30 : obligationType === 'renta' ? 45 : 60;
    const rateOfIncome = obligationType === 'renta' ? 0.03 : 0.01; // monthly penalty %
    const estimatedFine = Math.max(minFine, amountSales * rateOfIncome * omissionMonths);
    const advisoryDefenseSavings = estimatedFine * 0.85; // hypothetical 85% discount applying legal resources
    return { estimatedFine, advisoryDefenseSavings };
  };

  // Company Constitution calculations
  const getConstitutionCosts = () => {
    if (companyType === 'sas') {
      return { notariales: 45, registroMer: 0, honorariosLeg: 300, total: 345, days: '2-3 días' };
    } else if (companyType === 'sa') {
      return { notariales: 180, registroMer: 130, honorariosLeg: 550, total: 860, days: '12-15 días' };
    } else {
      return { notariales: 150, registroMer: 110, honorariosLeg: 480, total: 740, days: '8-10 días' };
    }
  };

  // Payroll IESS computations
  const calculateIESSStats = () => {
    const totalPayroll = employeeCount * avgSalary;
    const workerContrib = totalPayroll * 0.0945; // 9.45%
    const employerContrib = totalPayroll * 0.1215; // 12.15% employers
    const provisionDecimos = (totalPayroll * (1/12)) * 2; // Decimo 3 y 4
    return { totalPayroll, workerContrib, employerContrib, provisionDecimos };
  };

  const handleSaveGoogleFormUrl = (url: string) => {
    setGoogleFormUrl(url);
    localStorage.setItem('soljure_google_form_url', url);
    setIsUrlEditing(false);
  };

  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLeadStatus('submitting');
    try {
      // Direct Firestore submission
      await addDoc(collection(db, 'service_leads'), {
        ...formData,
        createdAt: serverTimestamp(),
        source: 'Interactive Services Showcase 2026'
      });
      // Fallback local storage log
      const localLeads = JSON.parse(localStorage.getItem('soljure_leads') || '[]');
      localLeads.push({ ...formData, date: new Date().toISOString() });
      localStorage.setItem('soljure_leads', JSON.stringify(localLeads));

      setLeadStatus('success');
      setTimeout(() => {
        setLeadStatus('idle');
        setFormData({
          name: '',
          company: '',
          email: '',
          phone: '',
          serviceName: selectedService ? selectedService.title : 'Derecho Administrativo y Tributario: Silencio Positivo & SRI',
          message: ''
        });
        setSelectedService(null);
      }, 3500);
    } catch (err) {
      console.error("Firestore submission failed: ", err);
      // Fallback success using localStorage even if DB fails/unauthorized 
      const localLeads = JSON.parse(localStorage.getItem('soljure_leads') || '[]');
      localLeads.push({ ...formData, date: new Date().toISOString(), status: 'offline_saved' });
      localStorage.setItem('soljure_leads', JSON.stringify(localLeads));
      setLeadStatus('success');
    }
  };

  const initiateAcquisition = (srv: ServiceItem) => {
    setSelectedService(srv);
    setFormData(prev => ({
      ...prev,
      serviceName: srv.title,
      message: `Hola, estoy interesado en adquirir de forma inmediata el servicio de: ${srv.title}. Por favor proveer una cotización adaptada a mi empresa.`
    }));
    // Scroll smoothly to form
    const formElement = document.getElementById('solicitud-servicio-form');
    if (formElement) {
      formElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="performance-layer max-w-7xl mx-auto px-4 md:px-12 py-12 space-y-24">
      
      {/* 1. VISUAL HERO BANNER WITH SLOGAN */}
      <section className="relative rounded-3xl overflow-hidden bg-[#0A1120] border border-brand-accent/30 py-16 px-8 md:px-16 text-white text-center md:text-left shadow-2xl">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:32px_32px] opacity-20"></div>
        <div className="absolute top-1/2 right-10 -translate-y-1/2 w-96 h-96 bg-brand-accent/15 rounded-full blur-3xl pointer-events-none hidden lg:block"></div>
        
        <div className="relative z-10 max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 bg-brand-accent/25 border border-brand-accent/40 rounded-full px-4 py-1.5 backdrop-blur-md">
            <span className="flex h-2 w-2 rounded-full bg-brand-accent animate-ping"></span>
            <span className="text-[10px] uppercase tracking-widest font-bold text-brand-accent flex items-center gap-1">
              <Sparkles size={11} /> Expertos Tributarios y Contables 2026
            </span>
          </div>

          <h1 className="text-4xl md:text-5xl font-serif font-extrabold uppercase leading-tight tracking-tight">
            Servicios Profesionales de Contabilidad y <span className="text-brand-accent">Defensa Fiscal</span>
          </h1>

          <p className="text-sm md:text-base text-slate-300 leading-relaxed max-w-2xl font-light">
            Soluciones gerenciales blindadas, trámites expeditos y asesoría contable científica certificada por el Mgst. Segundo Cuenca C. Transformamos datos fiscales en decisiones estratégicas de alta eficiencia corporativa.
          </p>

          <div className="flex flex-wrap gap-4 pt-4 justify-center md:justify-start">
            <a 
              href="#catalogo-servicios" 
              className="bg-brand-accent hover:bg-white text-brand-navy hover:text-brand-navy px-6 py-3.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all shadow-md hover:scale-[1.02] flex items-center gap-2"
            >
              Ver Servicios Profesionales <ArrowRight size={14} />
            </a>
            <a 
              href="#estimaciones" 
              className="bg-white/5 border border-white/20 hover:border-brand-accent hover:bg-white/10 text-white px-6 py-3.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all flex items-center gap-1.5"
            >
              Simuladores Electrónicos
            </a>
          </div>
        </div>
      </section>

      {/* 2. SERVICES CATALOG WITH ATTRACTIVE CARDS & CTA */}
      <section id="catalogo-servicios" className="space-y-12">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <span className="text-xs uppercase tracking-[0.3em] font-bold text-brand-accent">Portafolio Oficial</span>
          <h2 className="text-3xl md:text-4xl font-serif font-black uppercase text-brand-navy leading-tight">
            Nuestros Servicios Profesionales
          </h2>
          <p className="text-xs text-brand-slate tracking-wide uppercase font-mono font-medium">
            Respaldados con dashboards predictivos e informes periciales acreditados
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((srv) => (
            <motion.div 
              key={srv.id}
              whileHover={{ y: -6 }}
              className="bg-white border border-brand-border rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col justify-between group relative"
            >
              {/* Image Header with Badge */}
              <div className="relative h-48 overflow-hidden bg-slate-900 shrink-0">
                <img 
                  src={srv.imageUrl} 
                  alt={srv.title} 
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover opacity-85 group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-brand-navy to-transparent opacity-65"></div>
                <span className="absolute top-4 left-4 bg-brand-navy/90 text-brand-accent border border-brand-accent/20 text-[9px] font-bold tracking-widest uppercase px-2.5 py-1 rounded">
                  {srv.category}
                </span>

                {/* Stat Overlays represent high efficiency */}
                <div className="absolute bottom-4 right-4 text-right">
                  <span className="text-lg md:text-2xl font-serif font-black text-brand-accent block drop-shadow-md leading-none">
                    {srv.viralStat}
                  </span>
                  <span className="text-[8px] font-bold text-slate-200 uppercase tracking-widest block">
                    {srv.viralStatLabel}
                  </span>
                </div>
              </div>

              {/* Service Details */}
              <div className="p-6 flex-1 flex flex-col justify-between space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-brand-bg text-brand-accent rounded-lg border border-brand-border">
                      {srv.icon}
                    </div>
                    <h3 className="text-lg font-serif font-bold text-brand-navy uppercase tracking-tight group-hover:text-brand-corporate transition-colors line-clamp-1 leading-snug">
                      {srv.title}
                    </h3>
                  </div>

                  <p className="text-[12.5px] text-brand-slate leading-relaxed text-justify">
                    {srv.summary}
                  </p>

                  <div className="pt-3 border-t border-brand-border/60">
                    <p className="text-[9px] text-[#B59441] font-bold uppercase tracking-wider mb-2">Resultados Estratégicos:</p>
                    <ul className="space-y-1">
                      {srv.keyBenefits.slice(0, 3).map((benefit, bIdx) => (
                        <li key={bIdx} className="flex items-start gap-1.5 text-[11px] text-slate-700">
                          <Check size={11} className="text-brand-accent shrink-0 mt-0.5" />
                          <span className="line-clamp-1">{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="pt-4 border-t border-brand-border/60 flex items-center justify-between">
                  <span className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-widest">
                    P: {srv.estimatedDuration}
                  </span>

                  <button 
                    onClick={() => initiateAcquisition(srv)}
                    className="bg-brand-navy hover:bg-brand-accent text-white hover:text-brand-navy py-2 px-4 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-1 shadow-md"
                  >
                    Me Interesa <ChevronRight size={11} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* 3. INTERACTIVE DASHBOARDS & CALCULATORS - VIRAL ACTION SECTION */}
      <section id="estimaciones" className="bg-[#0A1120] text-white rounded-3xl p-8 md:p-12 border border-brand-accent/25 relative overflow-hidden shadow-2xl">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:32px_32px] opacity-15"></div>
        
        <div className="relative z-10 flex flex-col lg:flex-row gap-12 items-stretch">
          
          {/* Sidebar / Options description */}
          <div className="lg:w-1/3 flex flex-col justify-between space-y-8">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-1.5 bg-red-500/20 border border-red-500/35 text-red-400 rounded-full px-3 py-1 text-[8.5px] font-bold uppercase tracking-widest">
                <Flame size={10} className="animate-pulse" /> Simulador Multi-Riesgo
              </div>

              <h2 className="text-3xl font-serif font-black uppercase tracking-tight text-white leading-tight">
                Simulador Tarifario & <span className="text-brand-accent">Fiscal Interactivo</span>
              </h2>

              <p className="text-[12.5px] text-slate-300 leading-relaxed">
                Selecciona una pestaña de simulación interactiva para estimar tus obligaciones societarias, calcular posibles multas del SRI, estructurar aportes del IESS de nómina o identificar tu escudo legal de utilidades.
              </p>
            </div>

            <div className="space-y-2.5">
              <button 
                onClick={() => setActiveSimulatorTab('impuestos')}
                className={`w-full flex items-center justify-between p-3.5 rounded-xl break-words text-left transition-all border text-xs font-bold uppercase tracking-wider ${activeSimulatorTab === 'impuestos' ? 'bg-brand-accent text-brand-navy border-brand-accent' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
              >
                <span>🏢 Impuesto a la Renta Corporativa</span>
                <ChevronRight size={12} />
              </button>
              <button 
                onClick={() => setActiveSimulatorTab('defensa')}
                className={`w-full flex items-center justify-between p-3.5 rounded-xl break-words text-left transition-all border text-xs font-bold uppercase tracking-wider ${activeSimulatorTab === 'defensa' ? 'bg-brand-accent text-brand-navy border-brand-accent' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
              >
                <span>⚠️ Simulador de Defensa y Multas SRI</span>
                <ChevronRight size={12} />
              </button>
              <button 
                onClick={() => setActiveSimulatorTab('constitucion')}
                className={`w-full flex items-center justify-between p-3.5 rounded-xl break-words text-left transition-all border text-xs font-bold uppercase tracking-wider ${activeSimulatorTab === 'constitucion' ? 'bg-brand-accent text-brand-navy border-brand-accent' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
              >
                <span>🚀 Constitución express (SAS, S.A.)</span>
                <ChevronRight size={12} />
              </button>
              <button 
                onClick={() => setActiveSimulatorTab('roles')}
                className={`w-full flex items-center justify-between p-3.5 rounded-xl break-words text-left transition-all border text-xs font-bold uppercase tracking-wider ${activeSimulatorTab === 'roles' ? 'bg-brand-accent text-brand-navy border-brand-accent' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
              >
                <span>👥 Nómina & Aporte Patronal IESS</span>
                <ChevronRight size={12} />
              </button>
            </div>

            <div className="bg-brand-navy/60 border border-white/5 p-4 rounded-2xl flex items-center gap-3.5 text-[11px] text-slate-300">
              <Award size={24} className="text-[#B59441] shrink-0" />
              <p>Asesoría validada conforme a resoluciones tributarias al año fiscal de transacciones ecuatorianas.</p>
            </div>
          </div>

          {/* Active Interactive Dashboard Window */}
          <div className="lg:w-2/3 bg-slate-900/95 border border-white/10 rounded-3xl p-6 md:p-8 flex flex-col justify-between shadow-inner">
            <div className="space-y-6">
              
              {/* TAB 1: CORPORATE INCOME TAX CALCULATOR */}
              {activeSimulatorTab === 'impuestos' && (
                <div className="space-y-6">
                  <div className="border-b border-white/10 pb-3 flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#B59441]">Módulo Tributario LORTI</span>
                    <span className="text-[9px] bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-bold uppercase px-2 py-0.5 rounded">Escudo Comercial Pymes</span>
                  </div>

                  <h3 className="text-xl font-serif font-black uppercase text-white">Consolidador de Impuesto a la Renta Corporativo</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs text-slate-300 block font-bold uppercase tracking-widest">Ingresos Brutos Anuales (USD)</label>
                      <input 
                        type="range" 
                        min="5000" 
                        max="500000" 
                        step="5000"
                        value={incomeAmount}
                        onChange={(e) => setIncomeAmount(Number(e.target.value))}
                        className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-brand-accent"
                      />
                      <div className="flex justify-between items-center text-xs text-slate-400 font-mono">
                        <span>$5,000</span>
                        <span className="text-brand-accent font-bold">$ {incomeAmount.toLocaleString()}</span>
                        <span>$500,000</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs text-slate-300 block font-bold uppercase tracking-widest">Gastos Deducibles Proyectados (USD)</label>
                      <input 
                        type="range" 
                        min="0" 
                        max={incomeAmount} 
                        step="500"
                        value={expenseAmount}
                        onChange={(e) => setExpenseAmount(Number(e.target.value))}
                        className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-brand-accent"
                      />
                      <div className="flex justify-between items-center text-xs text-slate-400 font-mono">
                        <span>$0</span>
                        <span className="text-[#38bdf8] font-bold">$ {expenseAmount.toLocaleString()}</span>
                        <span>Límite (Ingresos)</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white/5 border border-white/10 p-5 rounded-2xl grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block">Base Imponible Fiscal</span>
                      <span className="text-xl font-serif font-black text-white block mt-1">$ {taxableBasis.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block">Tasa Impositiva Estimada</span>
                      <span className="text-xl font-serif font-black text-brand-accent block mt-1">
                        {companyType === 'sas' ? '22% (SAS Pyme)' : '25% (S.A. Normal)'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block">Impuesto a la Renta Previsto</span>
                      <span className="text-xl font-serif font-black text-red-400 block mt-1">$ {getEstimatedCorporatetax().toLocaleString(undefined, {maximumFractionDigits:2})}</span>
                    </div>
                  </div>

                  <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-xl text-xs text-emerald-200">
                    💡 <strong>Planificación Fiscal Sugerida:</strong> Estructurando tus operaciones societarias bajo una <span className="font-bold text-brand-accent">compañía SAS</span> de forma ordenada, puedes registrar provisión de beneficios deducibles y pagar solo la tarifa reducida del <strong>22%</strong> en vez de tasas de persona natural de hasta el 37%.
                  </div>
                </div>
              )}

              {/* TAB 2: LATE FILING PENALTY AND DEFENSE SIMULATOR */}
              {activeSimulatorTab === 'defensa' && (
                <div className="space-y-6">
                  <div className="border-b border-white/10 pb-3 flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase tracking-widest text-red-400">Mitigador de Riesgo Fiscal</span>
                    <span className="text-[9px] bg-red-500/15 border border-red-500/30 text-red-400 font-bold uppercase px-2 py-0.5 rounded">Omisos, Glosas, Sanciones</span>
                  </div>

                  <h3 className="text-xl font-serif font-black uppercase text-white">Calculador de Multas y Estrategia Tributaria de Defensa</h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs text-slate-300 block font-bold uppercase tracking-widest">Tipo de Obligación Omitida</label>
                      <select 
                        value={obligationType} 
                        onChange={(e: any) => setObligationType(e.target.value)}
                        className="w-full bg-[#0F172A] border border-white/10 rounded-xl p-3 text-xs text-white uppercase focus:ring-1 focus:ring-brand-accent outline-none"
                      >
                        <option value="iva">Declaración IVA Mensual</option>
                        <option value="renta">Impuesto a la Renta Anual</option>
                        <option value="anexo">Anexo Transaccional (ATS)</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs text-slate-300 block font-bold uppercase tracking-widest">Meses de Retraso/Omisión</label>
                      <input 
                        type="number" 
                        min="1" 
                        max="24"
                        value={omissionMonths}
                        onChange={(e) => setOmissionMonths(Math.max(1, Number(e.target.value)))}
                        className="w-full bg-[#0F172A] border border-white/10 rounded-xl p-2.5 text-xs text-white focus:ring-1 focus:ring-brand-accent outline-none font-mono"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs text-slate-300 block font-bold uppercase tracking-widest">Ventas/Ingresos Declarados (USD)</label>
                      <input 
                        type="number" 
                        min="0" 
                        value={amountSales}
                        onChange={(e) => setAmountSales(Math.max(0, Number(e.target.value)))}
                        className="w-full bg-[#0F172A] border border-white/10 rounded-xl p-2.5 text-xs text-white focus:ring-1 focus:ring-brand-accent outline-none font-mono"
                      />
                    </div>
                  </div>

                  <div className="bg-[#1e293b]/60 border border-white/5 p-5 rounded-2xl grid grid-cols-1 md:grid-cols-2 gap-6 text-center">
                    <div className="border-r border-white/10 md:pr-4">
                      <span className="text-[10px] text-red-300 font-bold uppercase tracking-widest block">Multa Presunta del SRI</span>
                      <span className="text-2xl font-serif font-black text-red-400 block mt-1">$ {getFinesReport().estimatedFine.toLocaleString(undefined, {maximumFractionDigits:2})}</span>
                      <span className="text-[9px] text-slate-400 block mt-1.5">Aplica recargos por mora e interés vigentes</span>
                    </div>
                    <div className="md:pl-4">
                      <span className="text-[10px] text-emerald-300 font-bold uppercase tracking-widest block">Ahorro con Defensa SOLJURE</span>
                      <span className="text-2xl font-serif font-black text-emerald-400 block mt-1">$ {getFinesReport().advisoryDefenseSavings.toLocaleString(undefined, {maximumFractionDigits:2})}</span>
                      <span className="text-[9px] text-brand-accent block mt-1.5">Mediante recurso de impugnación o justificación</span>
                    </div>
                  </div>

                  <div className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-xl text-xs text-amber-200">
                    ⚖️ <strong>Soporte Jurídico Fiscal:</strong> El SRI emite resoluciones sancionatorias sistemáticas que a menudo se calculan incorrectamente o exceden causales razonables de la LORTI. Contar con un peritaje técnico de descargos te permite apelar la resolución y anular de pleno derecho o reducir sustancialmente el cargo causado.
                  </div>
                </div>
              )}

              {/* TAB 3: COMPANY CONSTITUTION SIMULATOR */}
              {activeSimulatorTab === 'constitucion' && (
                <div className="space-y-6">
                  <div className="border-b border-white/10 pb-3 flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase tracking-widest text-brand-accent">Derecho Societario & Puesta en Marcha</span>
                    <span className="text-[9px] bg-brand-accent/20 border border-brand-accent/40 text-brand-accent font-bold uppercase px-2 py-0.5 rounded">Superintendencia de Compañías</span>
                  </div>

                  <h3 className="text-xl font-serif font-black uppercase text-white">Asistente de Creación y Constitución de Empresas</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs text-slate-300 block font-bold uppercase tracking-widest">Tipo Societario Propuesto</label>
                      <div className="grid grid-cols-3 gap-2">
                        <button 
                          onClick={() => setCompanyType('sas')}
                          className={`p-3 rounded-xl border text-[11px] font-bold uppercase tracking-widest text-center transition-all ${companyType === 'sas' ? 'bg-brand-accent text-brand-navy border-brand-accent' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
                        >
                          S.A.S.
                        </button>
                        <button 
                          onClick={() => setCompanyType('sa')}
                          className={`p-3 rounded-xl border text-[11px] font-bold uppercase tracking-widest text-center transition-all ${companyType === 'sa' ? 'bg-brand-accent text-brand-navy border-brand-accent' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
                        >
                          S.A.
                        </button>
                        <button 
                          onClick={() => setCompanyType('limitada')}
                          className={`p-3 rounded-xl border text-[11px] font-bold uppercase tracking-widest text-center transition-all ${companyType === 'limitada' ? 'bg-brand-accent text-brand-navy border-brand-accent' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
                        >
                          Limitada
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs text-slate-300 block font-bold uppercase tracking-widest">Capital de Fundación Sugerido (USD)</label>
                      <input 
                        type="number" 
                        min="1" 
                        value={socialCapital}
                        onChange={(e) => setSocialCapital(Math.max(1, Number(e.target.value)))}
                        className="w-full bg-[#0F172A] border border-white/10 rounded-xl p-3 text-xs text-white focus:ring-1 focus:ring-brand-accent outline-none font-mono"
                      />
                    </div>
                  </div>

                  <div className="bg-[#1e293b]/50 border border-white/10 p-5 rounded-2xl grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block">Plazo de Constitución</span>
                      <span className="text-lg font-serif font-black text-brand-accent block mt-1">{getConstitutionCosts().days}</span>
                      <span className="text-[9px] text-[#38bdf8] block mt-1">Agilidad inmediatez</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block">Gastos Notaría & Registro</span>
                      <span className="text-lg font-serif font-black text-white block mt-1">$ {(getConstitutionCosts().notariales + getConstitutionCosts().registroMer).toLocaleString()}</span>
                      <span className="text-[9px] text-slate-400 block mt-1">Estatuto simplificado</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block">Costos Totales Promedio</span>
                      <span className="text-lg font-serif font-black text-emerald-400 block mt-1">$ {getConstitutionCosts().total.toLocaleString()}</span>
                      <span className="text-[9px] text-emerald-300 block mt-1">Estructurado y con Firma</span>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: PAYROLL & IESS SOCIAL SECURITY SIMULATOR */}
              {activeSimulatorTab === 'roles' && (
                <div className="space-y-6">
                  <div className="border-b border-white/10 pb-3 flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#B59441]">Módulo de Operaciones Laborales</span>
                    <span className="text-[9px] bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 font-bold uppercase px-2 py-0.5 rounded">Planilla de Aportes IESS</span>
                  </div>

                  <h3 className="text-xl font-serif font-black uppercase text-white">Calculador de Planilla de Roles e Impacto de Seguro Social</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs text-slate-300 block font-bold uppercase tracking-widest">Cantidad de Empleados en Nómina</label>
                      <input 
                        type="range" 
                        min="1" 
                        max="100"
                        value={employeeCount}
                        onChange={(e) => setEmployeeCount(Number(e.target.value))}
                        className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-brand-accent"
                      />
                      <div className="flex justify-between items-center text-xs text-slate-400 font-mono">
                        <span>1 emp</span>
                        <span className="text-brand-accent font-bold">{employeeCount} colaboradores</span>
                        <span>100 emp</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs text-slate-300 block font-bold uppercase tracking-widest">Salario Promedio del Personal (USD)</label>
                      <input 
                        type="range" 
                        min="460" 
                        max="2500" 
                        step="50"
                        value={avgSalary}
                        onChange={(e) => setAvgSalary(Number(e.target.value))}
                        className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-brand-accent"
                      />
                      <div className="flex justify-between items-center text-xs text-slate-400 font-mono">
                        <span>S.M.U $460</span>
                        <span className="text-[#38bdf8] font-bold">$ {avgSalary.toLocaleString()}</span>
                        <span>$2,500</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#1e293b]/60 border border-white/5 p-5 rounded-2xl grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
                    <div>
                      <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest block">Nómina Bruta Mensual</span>
                      <span className="text-base font-serif font-black text-white block mt-1">$ {calculateIESSStats().totalPayroll.toLocaleString(undefined, {maximumFractionDigits:2})}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest block">Aporte Personal (9.45%)</span>
                      <span className="text-base font-serif font-black text-white/80 block mt-1">$ {calculateIESSStats().workerContrib.toLocaleString(undefined, {maximumFractionDigits:2})}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest block">Planilla Patronal (12.15%)</span>
                      <span className="text-base font-serif font-black text-[#38bdf8] block mt-1">$ {calculateIESSStats().employerContrib.toLocaleString(undefined, {maximumFractionDigits:2})}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest block">Provisión Décimos Est.</span>
                      <span className="text-base font-serif font-black text-brand-accent block mt-1">$ {calculateIESSStats().provisionDecimos.toLocaleString(undefined, {maximumFractionDigits:2})}</span>
                    </div>
                  </div>

                  <div className="p-4 bg-cyan-500/5 border border-cyan-500/10 rounded-xl text-xs text-cyan-200">
                    🛡️ <strong>Evita Glosas Laborales:</strong> El Ministerio de Trabajo sanciona inconsistencias de horas extras y planillas del IESS con multas severas de hasta 10 salarios mínimos. Con la asesoría y modelación legal de SOLJURE, reduces el riesgo de multas procesales a 0%.
                  </div>
                </div>
              )}

            </div>

            {/* Quick Acquisition CTA inside active simulator tab */}
            <div className="mt-8 pt-6 border-t border-white/10 flex flex-wrap gap-4 justify-between items-center bg-white/5 p-4 rounded-2xl">
              <div>
                <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">¿Tienes dudas sobre los resultados estimativos?</p>
                <p className="text-xs text-white font-medium mt-0.5">Analizamos tu caso de forma pormenorizada con las leyes vigentes del SRI e IESS.</p>
              </div>

              <button 
                onClick={() => {
                  const correlatedService = services.find(s => {
                    if (activeSimulatorTab === 'impuestos') return s.id === 'impuestos';
                    if (activeSimulatorTab === 'defensa') return s.id === 'defensa_omisos';
                    if (activeSimulatorTab === 'constitucion') return s.id === 'constitucion_cia';
                    return s.id === 'roles';
                  }) || services[0];
                  initiateAcquisition(correlatedService);
                }}
                className="bg-brand-accent hover:bg-white text-brand-navy p-3 px-6 text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-md shrink-0 border border-brand-accent"
              >
                Adquirir Asesoría Basada en Simulación <ArrowRight className="inline ml-1" size={13} />
              </button>
            </div>

          </div>

        </div>
      </section>

      {/* 4. TIKTOK / REELS VIRAL WORKSPACE FOR SERVICE PROMOTION */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        
        {/* Left Side: Copywriting / Promo pitch */}
        <div className="lg:col-span-5 space-y-6">
          <div className="inline-flex items-center gap-1.5 bg-red-500/10 border border-red-500/30 text-red-500 rounded-full px-3 py-1 text-[9px] font-black tracking-widest uppercase">
            <Flame size={12} className="animate-pulseFill animate-bounce" /> Contenido Viral Formativo
          </div>

          <h2 className="text-3xl md:text-4xl font-serif font-black uppercase text-brand-navy leading-tight">
            SOLJURE Shorts: Cápsulas de Inteligencia Legal
          </h2>

          <p className="text-xs uppercase tracking-wide font-mono text-brand-slate font-bold">
            Educamos para proteger — El conocimiento como blindaje financiero
          </p>

          <p className="text-[13px] text-slate-600 leading-relaxed text-justify space-y-4">
            Atraemos clientes con información práctica y real en formato visual de alta calidad. En nuestras cápsulas informativas simulamos la resolución inmediata de problemas impositivos, explicando cómo evitar glosas, disolver compañías sin dolor societario y deducir gastos legalmente.
          </p>

          <div className="space-y-3.5 pt-4">
            <div className="flex items-center gap-3">
              <div className="h-6 w-6 bg-brand-accent/20 border border-brand-accent/30 text-brand-accent rounded-full flex items-center justify-center text-xs font-bold">1</div>
              <span className="text-xs font-bold text-brand-navy uppercase tracking-wide">Impugnación de deudas por cobros indebidos</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-6 w-6 bg-brand-accent/20 border border-brand-accent/30 text-brand-accent rounded-full flex items-center justify-center text-xs font-bold">2</div>
              <span className="text-xs font-bold text-brand-navy uppercase tracking-wide">Estructuras SAS eficientes y sin trabas de capital</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-6 w-6 bg-brand-accent/20 border border-brand-accent/30 text-brand-accent rounded-full flex items-center justify-center text-xs font-bold">3</div>
              <span className="text-xs font-bold text-brand-navy uppercase tracking-wide">Tránsito de disolución y cancelación societaria</span>
            </div>
          </div>
        </div>

        {/* Right Side: Fully Animated Smartphone simulating TikTok/Reels feed playing tutorials */}
        <div className="lg:col-span-7 flex justify-center">
          <div className="relative w-80 h-[560px] bg-[#070B14] rounded-[36px] border-8 border-[#1e293b] shadow-2xl p-3 flex flex-col justify-between overflow-hidden">
            
            {/* Top Notch of Smartphone */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-[#1e293b] h-5 w-28 rounded-b-xl z-20 flex justify-center items-center">
              <div className="h-1.5 w-1.5 rounded-full bg-slate-900 mr-2"></div>
              <div className="h-1 w-8 rounded-full bg-slate-800"></div>
            </div>

            {/* Video Canvas overlay background */}
            <div className="absolute inset-0 z-0">
              <img 
                src={videoReels[activeVideoIndex].coverImg} 
                alt="Video Cover" 
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover blur-sm opacity-35"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"></div>
            </div>

            {/* Playback controller interface */}
            <div className="relative z-10 flex justify-between items-center border-b border-white/10 pb-2 mt-4">
              <span className="text-[8px] font-bold text-brand-accent uppercase tracking-widest">SOLJURE TV // SHORTS VIRALES</span>
              <div className="flex gap-1.5 items-center">
                <span className="text-[7.5px] font-mono text-white/40 uppercase">Reel {activeVideoIndex + 1}/{videoReels.length}</span>
              </div>
            </div>

            {/* Simulated Live Broadcast Stream Viewport */}
            <div className="relative z-10 flex-1 flex flex-col justify-end pb-4 space-y-4">
              
              {/* Play symbol on pause state */}
              {!isVideoPlaying && (
                <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/60 border border-white/20 p-4 rounded-full text-brand-accent animate-ping duration-1000">
                  <Play size={20} fill="currentColor" />
                </div>
              )}

              {/* Floating speech subtitle area that synchronizes with the simulated speaker */}
              <div className="bg-black/60 border border-white/10 p-3.5 rounded-2xl backdrop-blur-md text-center max-w-[90%] mx-auto shadow-lg">
                <p className="text-[11.5px] text-white font-bold tracking-wide italic leading-relaxed leading-snug">
                  {getActiveSubtitleText()}
                </p>
              </div>

              {/* Reel Info Details and Profile Icon */}
              <div className="flex justify-between items-end gap-2 px-1">
                <div className="space-y-1.5 max-w-[80%]">
                  <div className="flex items-center gap-1.5">
                    <div className="h-6 h-6 w-6 rounded-full bg-brand-accent flex items-center justify-center font-bold text-[10px] text-brand-navy border border-white/20">
                      S
                    </div>
                    <div>
                      <p className="text-[9.5px] font-black text-white uppercase tracking-tight">soljure.com</p>
                      <p className="text-[7px] text-slate-300 font-bold uppercase tracking-widest">SÍGUENOS EN TIKTOK</p>
                    </div>
                  </div>
                  
                  <h4 className="text-[10px] font-bold text-slate-100 uppercase tracking-tight leading-snug line-clamp-2">
                    {videoReels[activeVideoIndex].title}
                  </h4>
                </div>

                {/* Right Float Reactions column */}
                <div className="flex flex-col items-center gap-3 shrink-0">
                  <button 
                    onClick={() => toggleLikeVideo(activeVideoIndex)}
                    className="flex flex-col items-center group cursor-pointer"
                  >
                    <div className={`p-2 rounded-full ${hasLiked[activeVideoIndex] ? 'bg-red-500 text-white' : 'bg-white/15 text-white hover:bg-red-500/25'} transition-all`}>
                      <Heart size={14} fill={hasLiked[activeVideoIndex] ? "currentColor" : "none"} className="group-hover:scale-125 transition-transform" />
                    </div>
                    <span className="text-[8px] font-bold mt-0.5">{videoLikes[activeVideoIndex]}</span>
                  </button>

                  <button 
                    onClick={() => {
                      const correlatedSrv = services.find(s => {
                        if (activeVideoIndex === 0) return s.id === 'constitucion_cia';
                        if (activeVideoIndex === 1) return s.id === 'defensa_omisos';
                        if (activeVideoIndex === 2) return s.id === 'roles';
                        return s.id === 'auditorias';
                      }) || services[0];
                      initiateAcquisition(correlatedSrv);
                    }}
                    className="flex flex-col items-center cursor-pointer group"
                    title="Adquirir este beneficio"
                  >
                    <div className="p-2 rounded-full bg-brand-accent text-brand-navy hover:bg-white transition-all">
                      <Briefcase size={14} className="group-hover:scale-110 transition-transform" />
                    </div>
                    <span className="text-[7.5px] font-black text-brand-accent block mt-0.5 uppercase tracking-tighter">Comprar</span>
                  </button>

                  <button 
                    onClick={() => alert("¡Enlace dinámico de WhatsApp copiado para compartir este Reel en Ecuador!")}
                    className="flex flex-col items-center cursor-pointer"
                  >
                    <div className="p-2 rounded-full bg-white/15 hover:bg-emerald-500 transition-all text-white">
                      <Share2 size={13} />
                    </div>
                    <span className="text-[8px] mt-0.5">Envia</span>
                  </button>
                </div>
              </div>

            </div>

            {/* Bottom Controls / Progress timeline */}
            <div className="relative z-10 space-y-2 mt-auto">
              
              {/* Progress Timeline bar */}
              <div className="h-1 w-full bg-white/15 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-brand-accent rounded-full transition-all duration-200"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>

              {/* Navigation switches */}
              <div className="flex justify-between items-center pb-2 bg-black/40 p-2 rounded-xl border border-white/5">
                <button 
                  onClick={() => setIsVideoPlaying(!isVideoPlaying)}
                  className="p-1 text-brand-accent hover:text-white transition-all"
                  title={isVideoPlaying ? "Pausar" : "Reproducir"}
                >
                  {isVideoPlaying ? <Pause size={13} /> : <Play size={13} />}
                </button>

                <div className="flex gap-2">
                  <button 
                    onClick={() => {
                      setProgress(0);
                      setActiveVideoIndex(curr => (curr - 1 + videoReels.length) % videoReels.length);
                    }}
                    className="p-1 px-2 border border-white/10 rounded hover:bg-white/10 text-[9px] font-bold"
                  >
                    Anterior
                  </button>
                  <button 
                    onClick={() => {
                      setProgress(0);
                      setActiveVideoIndex(curr => (curr + 1) % videoReels.length);
                    }}
                    className="p-1 px-2 bg-brand-accent text-brand-navy rounded text-[9px] font-bold"
                  >
                    Siguiente Capsula
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>

      </section>

      {/* 4.5. ACADEMIA DE HABILIDADES Y CERTIFICACIONES COMERCIALES (INSPIRADO EN GOOGLE SKILLS) */}
      <section id="academia-certificaciones" className="space-y-12">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <span className="text-xs uppercase tracking-[0.3em] font-bold text-brand-accent">Sello de Calidad Profesional</span>
          <h2 className="text-3xl md:text-4xl font-serif font-black uppercase text-brand-navy leading-tight">
            SOLJURE <span className="text-brand-accent">Skills Academy</span>
          </h2>
          <p className="text-xs text-brand-slate tracking-wide uppercase font-mono font-medium">
            Validación de Competencias Basada en el Ecosistema de Google/GitHub Skills
          </p>
        </div>

        <div className="bg-[#0A1120] text-white border border-brand-accent/25 rounded-3xl p-6 md:p-10 shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:32px_32px] opacity-10"></div>
          
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* Left side: Skills Navigation List */}
            <div className="lg:col-span-12 xl:col-span-5 lg:col-span-5 space-y-4 flex flex-col justify-between">
              <div>
                <div className="inline-flex items-center gap-2 bg-[#B59441]/10 border border-[#B59441]/30 text-brand-accent rounded-full px-4 py-1.5 text-[9px] font-bold uppercase tracking-widest mb-4 font-mono">
                  <BookOpen size={11} /> Currículum Certificado 2026
                </div>
                <h3 className="text-2xl font-serif font-black uppercase tracking-tight text-white mb-3">
                  Verificación Curricular de Capacidades Técnicas
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed max-w-md">
                  Inspirado en la rigurosidad y gamificación del repositorio <strong>Google/GitHub Skills</strong>, este catálogo detalla las aptitudes de nuestro equipo de consultoría, ofreciéndote un diagnóstico interactivo e inmediato de cumplimiento empresarial.
                </p>

                {/* Skill select buttons with GitHub-Style visual nodes */}
                <div className="pt-4 space-y-2.5">
                  {[
                    {
                      id: 'impuestos_lorti',
                      title: 'Planificación Fiscal & LORTI',
                      category: 'Tributaria',
                      icon: <Calculator className="w-5 h-5 text-brand-accent" />
                    },
                    {
                      id: 'auditoria_control',
                      title: 'Auditoría Preventiva & IFRS',
                      category: 'Examen Contable',
                      icon: <Shield className="w-5 h-5 text-brand-accent" />
                    },
                    {
                      id: 'societario_sas',
                      title: 'Derecho Societario & SAS',
                      category: 'Legal Compañías',
                      icon: <Building className="w-5 h-5 text-brand-accent" />
                    },
                    {
                      id: 'nomina_iess',
                      title: 'Ingeniería Laboral & Nómina',
                      category: 'Operaciones IESS',
                      icon: <Users className="w-5 h-5 text-brand-accent" />
                    }
                  ].map((sk) => (
                    <button
                      key={sk.id}
                      onClick={() => {
                        setActiveSkillId(sk.id);
                        setQuizScore(null);
                        setCurrentQuizStep(null);
                        setQuizAnswers({});
                      }}
                      className={`w-full flex items-center gap-3.5 p-4 rounded-xl border text-left transition-all ${activeSkillId === sk.id ? 'bg-white/10 border-brand-accent text-white shadow-md' : 'bg-white/5 border-white/5 hover:bg-white/10'}`}
                    >
                      <div className="h-9 w-9 rounded-xl bg-slate-900 border border-white/15 flex items-center justify-center shrink-0">
                        {sk.icon}
                      </div>
                      <div>
                        <span className="text-[9px] uppercase tracking-widest text-[#B59441] font-bold block font-mono">{sk.category}</span>
                        <span className="text-xs font-bold tracking-wide block text-white">{sk.title}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right side: Detailed Active Skill Panel */}
            <div className="lg:col-span-12 xl:col-span-7 lg:col-span-7 bg-slate-950/60 border border-white/10 rounded-3xl p-6 md:p-8 flex flex-col justify-between">
              {(() => {
                const activeSkill = [
                  {
                    id: 'impuestos_lorti',
                    title: 'Planificación Fiscal & LORTI',
                    category: 'Tributaria',
                    badge: 'Senior Tax Auditor',
                    difficulty: 'Avanzado',
                    hours: '120 Horas',
                    description: 'Capacidades críticas de estructuración tributaria, uso doctrinario de la LORTI como escudo fiscal regulado, mitigación de retenciones en la fuente y conciliación electrónica predictiva de transacciones.',
                    codeBasis: 'Ley Orgánica de Régimen Tributario Interno (LORTI) Arts. 9, 10, 13',
                    practicalOutputs: [
                      'Simulaciones predictivas de impuesto a la renta anual',
                      'Conciliación de provisiones contables vs. gastos deducibles',
                      'Defensa formal sobre resoluciones sancionatorias y omisiones del SRI'
                    ],
                    quizQuestions: [
                      {
                        question: '¿Bajo qué base legal de la LORTI se regula la deducibilidad de los gastos operativos de tu empresa?',
                        options: [
                          'A. Artículo 10 (Se regula que son deducibles los gastos para obtener, mantener y mejorar ingresos gravados)',
                          'B. Artículo 22 (Aportaciones extraordinarias de socios extranjeros)',
                          'C. Artículo 5 (Exenciones genéricas sin necesidad de soporte)'
                        ],
                        correctIndex: 0
                      },
                      {
                        question: '¿Qué método es legalmente admitido bajo la LORTI para amortizar los gastos de constitución y preoperativos?',
                        options: [
                          'A. Cero amortización (no es deducible en compañías simplificadas)',
                          'B. Amortización diferida lineal hasta en 5 años consecutivos',
                          'C. Cargo directo e instantáneo al balance del primer periodo comercial'
                        ],
                        correctIndex: 1
                      }
                    ]
                  },
                  {
                    id: 'auditoria_control',
                    title: 'Auditoría Preventiva & IFRS/NIIF',
                    category: 'Examen Contable',
                    badge: 'Financial Control Specialist',
                    difficulty: 'Experto',
                    hours: '240 Horas',
                    description: 'Diagnósticos sustantivos de estados de situación, control interno predictivo e identificación oportuna de inconsistencias materiales bancarias o de inventarios.',
                    codeBasis: 'Normas Internacionales de Información Financiera (NIIF para PYMES) Sección 3, 4 y 5',
                    practicalOutputs: [
                      'Informes periciales sobre razonabilidad de saldos de cuentas',
                      'Pistas de auditoría y flujogramas de mitigación de fraudes o fugas',
                      'Validaciones formales previas a auditorías externas requeridas'
                    ],
                    quizQuestions: [
                      {
                        question: 'En la sección 3 de NIIF para PYMES, ¿cuál es el requisito fundamental para declarar la razonabilidad de un conjunto de estados financieros?',
                        options: [
                          'A. Aplicar cuadre de cuentas bancarias solo al cierre del año',
                          'B. La presentación razonable de la situación financiera, rendimiento y flujos de efectivo con declaración explícita de cumplimiento',
                          'C. Consolidar balances manuales omitiendo depreciaciones ordinarias'
                        ],
                        correctIndex: 1
                      },
                      {
                        question: '¿Qué acción constituye el eje de una Auditoría Preventiva de Caja e Inventarios de alta eficacia?',
                        options: [
                          'A. Conciliación estricta periódica y muestreos de rotación bajo método de costo promedio ponderado',
                          'B. Registrar las compras únicamente según flujo de caja real',
                          'C. Omitir provisiones para desvalorización de existencias'
                        ],
                        correctIndex: 0
                      }
                    ]
                  },
                  {
                    id: 'societario_sas',
                    title: 'Creación de Compañías SAS & Liquidaciones',
                    category: 'Derecho Societario',
                    badge: 'Corporate Law Expert',
                    difficulty: 'Intermedio',
                    hours: '80 Horas',
                    description: 'Asesoría y acompañamiento societario pericial en la constitución ágil de Sociedades de Acciones Simplificadas (SAS), redacción de estatutos protectivos y liquidaciones expeditas ante la SuperCias.',
                    codeBasis: 'Ley de Compañías de la República del Ecuador (Reformas SAS)',
                    practicalOutputs: [
                      'Estatutos a medida con cláusulas de preferencia y restricciones',
                      'Constituciones simplificadas expeditas en 48 horas sin capital mínimo',
                      'Disoluciones y cancelaciones societarias limpias libres de deudas arrastradas'
                    ],
                    quizQuestions: [
                      {
                        question: '¿Cuál es el capital mínimo requerido por la Superintendencia de Compañías para constituir una compañía SAS en Ecuador actualmente?',
                        options: [
                          'A. Mínimo $800 dólares',
                          'B. Desde $1 dólar o sin límite mínimo explícito',
                          'C. Mínimo $400 dólares'
                        ],
                        correctIndex: 1
                      },
                      {
                        question: '¿Cuáles son las formas legales permitidas para liquidar ordenadamente una compañía que ya no registra operaciones?',
                        options: [
                          'A. Dejar inactiva la cuenta bancaria de forma indefinida',
                          'B. Proceso abreviado de Disolución, Liquidación y Cancelación inscrita en el Registro Mercantil o Superintendencia',
                          'C. Transferencia de acciones a terceros sin descargo legal'
                        ],
                        correctIndex: 1
                      }
                    ]
                  },
                  {
                    id: 'nomina_iess',
                    title: 'Ingeniería Laboral & Nómina',
                    category: 'Operaciones',
                    badge: 'Payroll Professional',
                    difficulty: 'Intermedio',
                    hours: '150 Horas',
                    description: 'Liquidaciones de haberes de alta precisión bajo el Código de Trabajo, cálculo de suplementos, contratos legales, afiliaciones al IESS y reporte oportuno ante el Ministerio del Trabajo.',
                    codeBasis: 'Código del Trabajo del Ecuador y Resoluciones del IESS',
                    practicalOutputs: [
                      'Roles de pago estructurados de forma exacta con cálculo de horas extras',
                      'Actas de finiquito blindadas para mitigar contingencias operativas',
                      'Soporte completo en portales IESS y Ministerio del Trabajo (SUT)'
                    ],
                    quizQuestions: [
                      {
                        question: '¿Cuál es el recargo obligatorio que establece el Código de Trabajo de Ecuador para las horas extraordinarias elaboradas fines de semana o feriados?',
                        options: [
                          'A. 50% de recargo sobre el valor ordinario',
                          'B. 100% de recargo sobre el valor ordinario de la hora de trabajo',
                          'C. 25% de recargo con acumulación compensatoria'
                        ],
                        correctIndex: 1
                      },
                      {
                        question: '¿Qué constituye una obligación patronal ineludible bajo el Código del Trabajo respecto a los décimos sueldos?',
                        options: [
                          'A. Pagarlos únicamente si la compañía registra utilidades líquidas',
                          'B. El pago de la decimotercera y decimocuarta remuneraciones en las fechas de ley o acumulación debidamente solicitada',
                          'C. Unificarlos directivo con aportaciones patronales'
                        ],
                        correctIndex: 1
                      }
                    ]
                  }
                ].find(item => item.id === activeSkillId);

                if (!activeSkill) return null;

                const startQuiz = () => {
                  setCurrentQuizStep(0);
                  setQuizScore(null);
                  setQuizAnswers({});
                  setEarnedBadge(false);
                };

                const selectQuizAnswer = (qIdx: number, oIdx: number) => {
                  setQuizAnswers(prev => ({ ...prev, [qIdx]: oIdx }));
                };

                const nextQuizStep = () => {
                  if (currentQuizStep === null) return;
                  if (currentQuizStep < activeSkill.quizQuestions.length - 1) {
                    setCurrentQuizStep(prev => prev !== null ? prev + 1 : 0);
                  } else {
                    let correct = 0;
                    activeSkill.quizQuestions.forEach((q, idx) => {
                      if (quizAnswers[idx] === q.correctIndex) {
                        correct++;
                      }
                    });
                    const finalScore = Math.round((correct / activeSkill.quizQuestions.length) * 100);
                    setQuizScore(finalScore);
                    if (finalScore === 100) {
                      setEarnedBadge(true);
                    }
                  }
                };

                return (
                  <div className="h-full flex flex-col justify-between space-y-6">
                    
                    {/* QUIZ INTERFACE VISIBLE */}
                    {currentQuizStep !== null ? (
                      <div className="space-y-6">
                        <div className="flex justify-between items-center border-b border-white/10 pb-3">
                          <span className="text-[9px] uppercase tracking-widest text-brand-accent font-mono">
                            Comprobación Interactiva // {activeSkill.title}
                          </span>
                          <span className="text-[10px] text-slate-400 font-bold font-mono">
                            Pregunta {currentQuizStep + 1} de {activeSkill.quizQuestions.length}
                          </span>
                        </div>

                        {quizScore === null ? (
                          <div className="space-y-5">
                            <h4 className="text-sm font-bold text-white font-serif tracking-wide leading-relaxed">
                              {activeSkill.quizQuestions[currentQuizStep].question}
                            </h4>

                            <div className="space-y-2.5">
                              {activeSkill.quizQuestions[currentQuizStep].options.map((opt, oIdx) => (
                                <button
                                  key={oIdx}
                                  onClick={() => selectQuizAnswer(currentQuizStep, oIdx)}
                                  className={`w-full p-3.5 text-xs text-left rounded-xl border text-slate-300 transition-all ${quizAnswers[currentQuizStep] === oIdx ? 'bg-brand-accent/20 border-brand-accent text-white' : 'bg-white/5 border-white/5 hover:bg-white/10'}`}
                                >
                                  {opt}
                                </button>
                              ))}
                            </div>

                            <div className="flex justify-between items-center pt-2 font-mono">
                              <button
                                onClick={() => setCurrentQuizStep(null)}
                                className="text-slate-400 hover:text-white text-[10px] font-bold uppercase tracking-wider"
                              >
                                Cancelar Test
                              </button>
                              <button
                                onClick={nextQuizStep}
                                disabled={quizAnswers[currentQuizStep] === undefined}
                                className="bg-brand-accent disabled:opacity-45 hover:bg-white text-brand-navy font-bold py-2.5 px-5 rounded-lg text-[10px] uppercase tracking-widest transition-all"
                              >
                                {currentQuizStep === activeSkill.quizQuestions.length - 1 ? 'Finalizar Evaluación' : 'Siguiente Pregunta'}
                              </button>
                            </div>
                          </div>
                        ) : (
                          /* QUIZ COMPLETED WITH RESULTS */
                          <div className="text-center py-6 space-y-6">
                            {earnedBadge ? (
                              <div className="space-y-4">
                                <div className="inline-flex h-16 w-16 bg-brand-accent/15 rounded-full border-2 border-brand-accent items-center justify-center text-brand-accent animate-bounce">
                                  <Award size={32} />
                                </div>
                                <h4 className="text-xl font-serif font-black uppercase text-brand-accent">
                                  ¡Suficiencia Normativa Validada!
                                </h4>
                                <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
                                  Has respondido de forma impecable a todos los planteamientos legales de la LORTI y/o estándares NIIF. Se otorga la insignia digital oficial de suficiencia técnica:
                                </p>

                                {/* GORGEOUS DIGITAL BADGE */}
                                <div className="p-5 bg-[#0F172A] border border-brand-accent/30 rounded-2xl max-w-sm mx-auto shadow-inner text-center relative overflow-hidden group">
                                  <div className="absolute top-0 right-0 p-1 bg-[#B59441] text-[#0A1120] text-[7px] font-mono font-black uppercase">
                                    VERIFIED SKU
                                  </div>
                                  <div className="text-[10px] uppercase tracking-widest text-[#B59441] font-bold">SOLJURE DIGITAL BADGE</div>
                                  <div className="text-base font-serif font-black text-white uppercase mt-1 tracking-tight">{activeSkill.title}</div>
                                  <div className="text-[9px] font-mono text-emerald-400 font-bold mt-1.5 flex items-center justify-center gap-1">
                                    <CheckCircle size={10} /> STATUS: 100% CUMPLIMIENTO
                                  </div>
                                  <div className="h-px bg-white/10 my-3"></div>
                                  <div className="text-[8.5px] font-mono text-slate-400 uppercase tracking-widest">
                                    Reg. Cod: <span className="text-brand-accent font-bold">CP-SKILL-2026-92849</span>
                                  </div>
                                </div>

                                <div className="flex flex-wrap justify-center gap-3 pt-2 font-mono">
                                  <button
                                    onClick={() => {
                                      navigator.clipboard.writeText(`CP-SKILL-${activeSkill.id.toUpperCase()}-2026-VERIFIED`);
                                      alert("Código Hash de Insignia copiado al portapapeles con éxito.");
                                    }}
                                    className="bg-white/5 border border-white/20 hover:border-brand-accent text-white text-[9.5px] font-bold uppercase tracking-widest px-4 py-2.5 rounded-lg transition-all"
                                  >
                                    Copiar Hash de Licencia
                                  </button>
                                  <button
                                    onClick={() => {
                                      setFormData(p => ({
                                        ...p,
                                        serviceName: activeSkill.title,
                                        message: `Hola, he verificado mi caso mediante el autodiagnóstico sobre "${activeSkill.title}" obteniendo un puntaje sobresaliente de 100%. Deseo formalizar una auditoría.`
                                      }));
                                      setLeadMethod('google_form');
                                      setCurrentQuizStep(null);
                                      setQuizScore(null);
                                      
                                      setTimeout(() => {
                                        const el = document.getElementById('solicitud-servicio-form');
                                        if (el) el.scrollIntoView({ behavior: 'smooth' });
                                      }, 150);
                                    }}
                                    className="bg-brand-accent hover:bg-white text-brand-navy text-[9.5px] font-black uppercase tracking-widest px-4 py-2.5 rounded-lg transition-all flex items-center gap-1"
                                  >
                                    Contar Caso en Google Forms <ArrowRight size={12} />
                                  </button>
                                </div>
                              </div>
                            ) : (
                              /* INCOMPLETE PERFORMANCE SCORING */
                              <div className="space-y-4 py-4">
                                <div className="inline-flex h-12 w-12 bg-red-400/10 rounded-full border border-red-500/30 text-red-400 items-center justify-center">
                                  <HelpCircle size={22} />
                                </div>
                                <h4 className="text-lg font-serif font-bold text-white uppercase">
                                  Prueba Casi Completada ({quizScore} / 100)
                                </h4>
                                <p className="text-xs text-slate-300 max-w-sm mx-auto leading-relaxed">
                                  Para recibir la insignia oficial de habilidades de CONTAPRO DC necesitas responder correctamente todas las causales normativas del Ecuador. ¡Consulta nuestro material y repite!
                                </p>
                                <div className="pt-2 font-mono">
                                  <button
                                    onClick={startQuiz}
                                    className="bg-brand-accent hover:bg-white text-brand-navy font-bold py-2.5 px-5 rounded-lg text-[10px] uppercase tracking-widest transition-all"
                                  >
                                    Intentar de nuevo
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      /* STATIC SKILL DETAILS OVERVIEW */
                      <>
                        {/* Upper Details Block */}
                        <div className="space-y-5">
                          <div className="flex justify-between items-start border-b border-white/10 pb-4">
                            <div>
                              <div className="inline-flex items-center gap-1.5 bg-brand-accent/15 border border-brand-accent/35 text-brand-accent rounded px-2.5 py-0.5 text-[8.5px] font-bold uppercase tracking-widest mb-1 shadow-inner font-mono">
                                {activeSkill.badge}
                              </div>
                              <h4 className="text-xl font-serif font-black uppercase text-white leading-tight">
                                {activeSkill.title}
                              </h4>
                            </div>
                            <div className="text-right shrink-0 font-mono">
                              <span className="text-[9px] text-slate-400 block font-bold uppercase tracking-widest leading-none">RIGUROSIDAD</span>
                              <span className="text-[#B59441] text-xs font-black uppercase tracking-wider block mt-1">{activeSkill.difficulty}</span>
                            </div>
                          </div>

                          <p className="text-[12.5px] text-slate-300 leading-relaxed text-justify">
                            {activeSkill.description}
                          </p>

                          {/* Basis and requirements code block */}
                          <div className="bg-[#0F172A] border border-white/5 rounded-2xl p-4 space-y-2">
                            <span className="text-[8.5px] text-brand-accent font-mono font-black uppercase tracking-widest block flex items-center gap-1 leading-none">
                              <Terminal size={11} className="inline" /> MARCO LEGAL ASOCIADO:
                            </span>
                            <p className="text-xs text-slate-100 font-bold font-serif italic text-justify leading-relaxed">
                              "{activeSkill.codeBasis}"
                            </p>
                          </div>

                          <div className="space-y-2.5">
                            <span className="text-[9px] text-[#B59441] font-bold uppercase tracking-widest block font-mono">Productos Prácticos Entregables:</span>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                              {activeSkill.practicalOutputs.map((out, idx) => (
                                <div key={idx} className="flex items-start gap-2 p-3 bg-white/5 rounded-xl border border-white/5">
                                  <Check size={11} className="text-brand-accent shrink-0 mt-0.5" />
                                  <span className="text-[11px] text-slate-300 leading-tight">{out}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Lower Action CTA to play/test */}
                        <div className="pt-6 border-t border-white/10 flex flex-wrap justify-between items-center gap-4">
                          <span className="text-[9.5px] font-mono text-slate-400 uppercase tracking-widest">
                            Tiempo estimado: {activeSkill.hours} de rigor técnico
                          </span>
                          <button
                            onClick={startQuiz}
                            className="bg-brand-accent hover:bg-white text-brand-navy font-black py-3 px-6 rounded-xl text-[10px] uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg flex items-center gap-1.5 font-mono"
                          >
                            <Terminal size={13} /> Autoevaluación interactiva <ArrowRight size={12} />
                          </button>
                        </div>
                      </>
                    )}

                  </div>
                );
              })()}
            </div>
          </div>

        </div>
      </section>

      {/* 5. LEAD CONVERSION / ACQUISITION CONTACT FORM */}
      <section id="solicitud-servicio-form" className="bg-white border-2 border-brand-border rounded-3xl p-8 md:p-12 shadow-xl space-y-8">
        <div className="max-w-3xl mx-auto space-y-8">
          
          <div className="text-center space-y-2 animate-fade-in">
            <div className="inline-flex h-8 w-8 rounded-full bg-[#B59441]/10 text-brand-accent items-center justify-center font-bold text-sm">
              <Award size={16} />
            </div>
            <h3 className="text-2xl font-serif font-black uppercase text-brand-navy">
              Solicitud de Asesoría Legal Directa
            </h3>
            <p className="text-xs text-brand-slate leading-relaxed">
              Dinos cómo podemos ayudarte. Elige tu método preferido para enviarnos su caso y obtener los servicios de SOLJURE de inmediato.
            </p>
          </div>

          {/* DUAL METHOD SWITCHER TAB BAR */}
          <div className="flex flex-col sm:flex-row bg-slate-100 p-1.5 rounded-2xl max-w-lg mx-auto gap-1 border border-slate-200 font-mono">
            <button
              onClick={() => setLeadMethod('direct')}
              className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all duration-300 flex items-center justify-center gap-1.5 ${leadMethod === 'direct' ? 'bg-brand-navy text-white shadow-md' : 'text-slate-600 hover:text-brand-navy'}`}
            >
              <Users size={12} /> Formulario SOLJURE Directo
            </button>
            <button
              onClick={() => setLeadMethod('google_form')}
              className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all duration-300 flex items-center justify-center gap-1.5 ${leadMethod === 'google_form' ? 'bg-brand-navy text-white shadow-md' : 'text-slate-600 hover:text-brand-navy'}`}
            >
              <ExternalLink size={12} /> Formulario de Google (Contar Caso)
            </button>
          </div>

          <AnimatePresence mode="wait">
            {leadMethod === 'direct' ? (
              <motion.div
                key="direct-form"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <form onSubmit={handleLeadSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase tracking-widest font-black text-brand-slate">Nombre Completo del Solicitante *</label>
                      <input 
                        type="text" 
                        required
                        placeholder="Ej. Ing. Juan Pérez"
                        value={formData.name}
                        onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
                        className="w-full bg-brand-bg border border-brand-border rounded-xl p-3 text-xs focus:ring-1 focus:ring-brand-accent outline-none"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase tracking-widest font-black text-brand-slate">Razón Social o Empresa *</label>
                      <input 
                        type="text" 
                        required
                        placeholder="Ej. Corporación Alpha S.A.S."
                        value={formData.company}
                        onChange={(e) => setFormData(p => ({ ...p, company: e.target.value }))}
                        className="w-full bg-brand-bg border border-brand-border rounded-xl p-3 text-xs focus:ring-1 focus:ring-brand-accent outline-none"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase tracking-widest font-black text-brand-slate">Correo Electrónico Corporativo *</label>
                      <input 
                        type="email" 
                        required
                        placeholder="ejemplo@empresa.com"
                        value={formData.email}
                        onChange={(e) => setFormData(p => ({ ...p, email: e.target.value }))}
                        className="w-full bg-brand-bg border border-brand-border rounded-xl p-3 text-xs focus:ring-1 focus:ring-brand-accent outline-none"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase tracking-widest font-black text-brand-slate">Número Telefónico / WhatsApp *</label>
                      <input 
                        type="tel" 
                        required
                        placeholder="Ej. +593 99 999 9999"
                        value={formData.phone}
                        onChange={(e) => setFormData(p => ({ ...p, phone: e.target.value }))}
                        className="w-full bg-brand-bg border border-brand-border rounded-xl p-3 text-xs focus:ring-1 focus:ring-brand-accent outline-none"
                      />
                    </div>

                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase tracking-widest font-black text-brand-slate">Servicio que Deseas Adquirir *</label>
                    <select 
                      value={formData.serviceName}
                      onChange={(e) => setFormData(p => ({ ...p, serviceName: e.target.value }))}
                      className="w-full bg-brand-bg border border-brand-border rounded-xl p-3 text-xs focus:ring-1 focus:ring-brand-accent outline-none font-sans"
                    >
                      {services.map((s, idx) => (
                        <option key={idx} value={s.title}>{s.title}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase tracking-widest font-black text-brand-slate">Mensaje u Observaciones / Descripción del Caso</label>
                    <textarea 
                      rows={4}
                      placeholder="Indica de forma breve la cantidad de transacciones promedio, si cuentas con multas SRI vigentes, o cuántos colaboradores integran tu nómina para cotizar a la medida..."
                      value={formData.message}
                      onChange={(e) => setFormData(p => ({ ...p, message: e.target.value }))}
                      className="w-full bg-brand-bg border border-brand-border rounded-xl p-3 text-xs focus:ring-1 focus:ring-brand-accent outline-none"
                    ></textarea>
                  </div>

                  <AnimatePresence mode="wait">
                    {leadStatus === 'success' ? (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="bg-emerald-50 border border-emerald-300 p-4 rounded-xl text-center text-emerald-800 text-xs font-semibold"
                      >
                        🎉 ¡Formulación procesada con éxito! Tu solicitud fue registrada de forma segura en las bases de datos de SOLJURE. Un analista legal corporativo te contactará inmediatamente.
                      </motion.div>
                    ) : leadStatus === 'error' ? (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="bg-red-50 border border-red-300 p-4 rounded-xl text-center text-red-800 text-xs font-semibold"
                      >
                        ❌ Hubo un inconveniente al guardar. Tu solicitud se guardó localmente en el navegador de manera segura.
                      </motion.div>
                    ) : (
                      <button
                        type="submit"
                        disabled={leadStatus === 'submitting'}
                        className="w-full bg-brand-accent hover:bg-brand-navy hover:text-white text-brand-navy p-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 shadow-md flex items-center justify-center gap-2 font-mono"
                      >
                        {leadStatus === 'submitting' ? 'Enviando Solicitud...' : 'Confirmar Adquisición de Servicio Profesional'}
                      </button>
                    )}
                  </AnimatePresence>
                </form>
              </motion.div>
            ) : (
              /* GOOGLE FORM CASE SUBMISSION FOR SECURITY ATTACHMENTS (USER REQUEST) */
              <motion.div
                key="google-form"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                {/* Admin configuration header */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="p-2.5 bg-[#B59441]/10 text-brand-accent rounded-xl border border-brand-accent/20 shrink-0">
                      <Settings size={18} />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-brand-navy uppercase tracking-wider">
                        Enlace de Formulario de Google Oficial
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Los clientes pueden detallar su caso y adjuntar archivos como estados financieros o resoluciones del SRI.
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0 font-mono">
                    <button
                      onClick={() => setIsUrlEditing(!isUrlEditing)}
                      className="text-xs text-brand-navy hover:text-brand-accent font-black uppercase tracking-wider flex items-center gap-1 border-b border-dashed border-brand-navy hover:border-brand-accent"
                    >
                      {isUrlEditing ? 'Cerrar Edición' : '🛠️ Personalizar Formulario URL'}
                    </button>
                  </div>
                </div>

                {/* Inline edit panel if url editing is active */}
                <AnimatePresence>
                  {isUrlEditing && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="bg-slate-100 border border-slate-300 rounded-2xl p-4 space-y-3 overflow-hidden"
                    >
                      <label className="text-[9.5px] uppercase tracking-widest font-black text-brand-navy block font-mono">
                        Introduce la nueva URL de tu Formulario de Google:
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={googleFormUrl}
                          onChange={(e) => setGoogleFormUrl(e.target.value)}
                          className="flex-1 bg-white border border-slate-300 rounded-xl p-2.5 text-xs focus:ring-1 focus:ring-brand-accent outline-none font-mono"
                          placeholder="https://docs.google.com/forms/d/..."
                        />
                        <button
                          onClick={() => handleSaveGoogleFormUrl(googleFormUrl)}
                          className="bg-brand-navy text-white hover:bg-brand-accent hover:text-brand-navy px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors font-mono"
                        >
                          Guardar
                        </button>
                      </div>
                      <p className="text-[10px] text-slate-500">
                        * Pulse Guardar para fijar la URL del Formulario. Se guardará de forma automatizada en el navegador.
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Google form main panel info & direct links */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-slate-800">
                  {/* Left Column: Direct Launcher & attachment instruction */}
                  <div className="bg-brand-bg/50 border border-brand-border rounded-2xl p-6 flex flex-col justify-between space-y-6">
                    <div className="space-y-4">
                      <div className="inline-flex items-center gap-1 bg-brand-navy text-white text-[8px] font-bold uppercase tracking-widest px-2.5 py-1 rounded font-mono">
                        RECOMENDADO PARA ARCHIVOS Y CASOS
                      </div>

                      <h4 className="text-lg font-serif font-black uppercase text-brand-navy">
                        Sube balances, actas, PDFs del SRI o IESS
                      </h4>

                      <p className="text-[12.5px] text-brand-slate leading-relaxed text-justify">
                        La plataforma oficial de <strong>Google Forms</strong> de SOLJURE te permite reportar los pormenores de tu caso mercantil, tributario, societario o civil, y subir anexos (evidencias, citaciones, notificaciones de tribunales o entes públicos) con total seguridad.
                      </p>

                      <div className="space-y-2 pt-2">
                        {[
                          'Soporta archivos PDF, imágenes, expedientes y citaciones',
                          'Protegido bajo la encriptación estándar de Google Workspace',
                          'Recepción inmediata en la bandeja del Departamento Legal de SOLJURE'
                        ].map((item, idx) => (
                          <div key={idx} className="flex items-start gap-1.5 text-xs text-slate-800">
                            <CheckCircle size={12} className="text-brand-accent shrink-0 mt-0.5" />
                            <span>{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-4 font-mono">
                      <a
                        href={googleFormUrl}
                        target="_blank"
                        referrerPolicy="no-referrer"
                        rel="noopener"
                        className="w-full bg-[#B59441] hover:bg-brand-navy text-white p-4 rounded-xl text-center text-xs font-black uppercase tracking-widest transition-all duration-300 shadow-md flex items-center justify-center gap-2 hover:scale-[1.01]"
                      >
                        Llenar Caso en Google Forms de Forma Directa <ExternalLink size={13} />
                      </a>
                    </div>
                  </div>

                  {/* Right Column: Google form embedded live preview */}
                  <div className="bg-slate-50 border border-brand-border rounded-2xl overflow-hidden p-3 shadow-inner flex flex-col justify-between">
                    <div className="text-center py-1.5 border-b border-slate-200 mb-3 bg-white rounded-lg">
                      <span className="text-[8.5px] font-mono font-bold text-slate-400 uppercase tracking-widest">
                        🔌 VISTA PREVIA INTEGRADA ELECTRÓNICA
                      </span>
                    </div>

                    <div className="relative rounded-xl border border-slate-200 overflow-hidden bg-white h-[320px] shadow-sm">
                      <iframe
                        src={googleFormUrl}
                        className="w-full h-full border-0 absolute inset-0"
                        title="Embedded Google Form"
                        loading="lazy"
                      >
                        Cargando formulario de Google...
                      </iframe>
                    </div>

                    <div className="text-center pt-3">
                      <p className="text-[10px] text-slate-400 leading-tight">
                        ¿Pantalla de móvil muy pequeña? Es preferible pulsar el botón de la izquierda para abrir el formulario en pantalla completa con total comodidad.
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </section>

    </div>
  );
};
