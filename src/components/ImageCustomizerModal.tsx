import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { X, Image as ImageIcon, Search, RefreshCw, Check, Globe, Sliders, Sparkles } from 'lucide-react';
import { IMAGES_BY_AREA } from '../utils/imageHelper';
import { ExpertiseArea } from '../types';

interface ImageCustomizerModalProps {
  currentImageUrl: string;
  articleTitle: string;
  articleArea: ExpertiseArea;
  onClose: () => void;
  onSelectImage: (url: string) => void;
}

export default function ImageCustomizerModal({
  currentImageUrl,
  articleTitle,
  articleArea,
  onClose,
  onSelectImage
}: ImageCustomizerModalProps) {
  const [activeTab, setActiveTab] = useState<'curated' | 'unsplash' | 'custom'>('curated');
  
  // Tab 1: Curated images
  const [selectedArea, setSelectedArea] = useState<ExpertiseArea | 'default'>(articleArea);
  const curatedPool = IMAGES_BY_AREA[selectedArea as ExpertiseArea] || IMAGES_BY_AREA.default;
  
  // Tab 2: Dynamic generator (Unsplash keyword search)
  const [unsplashKeyword, setUnsplashKeyword] = useState(() => {
    // Generate intelligent default keyword from article area or first words of title
    if (articleArea === ExpertiseArea.LABORAL) return 'labor employment law';
    if (articleArea === ExpertiseArea.CIVIL) return 'civil justice lawyer';
    if (articleArea === ExpertiseArea.COMERCIAL) return 'business commerce law';
    if (articleArea === ExpertiseArea.PENAL) return 'criminal defense court';
    if (articleArea === ExpertiseArea.TRIBUTARIO_ADUANERO) return 'tax customs law';
    if (articleArea === ExpertiseArea.ADMINISTRATIVO) return 'government administrative law';
    if (articleArea === ExpertiseArea.CONSTITUCIONAL) return 'constitution law supreme';
    return 'business corporate finance';
  });
  
  const [searchResults, setSearchResults] = useState<string[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  // Tab 3: Custom URL Link
  const [customUrlInput, setCustomUrlInput] = useState('');
  const [urlError, setUrlError] = useState('');

  // Currently hovered/selected temporary image URL for preview
  const [chosenUrl, setChosenUrl] = useState(currentImageUrl);

  const handleRegenerateUnsplash = async (customKW?: string) => {
    const kw = customKW || unsplashKeyword;
    if (!kw.trim()) return;
    
    setSearchLoading(true);
    try {
      const resp = await fetch(`/api/images/search?query=${encodeURIComponent(kw)}`);
      if (resp.ok) {
        const data = await resp.json();
        if (data.results && data.results.length > 0) {
          setSearchResults(data.results);
          // Set chosen preview to the first loaded result
          setChosenUrl(data.results[0]);
        }
      }
    } catch (e) {
      console.error("Error searching photos via backend proxy:", e);
    } finally {
      setSearchLoading(false);
    }
  };

  // Trigger search on mount or when switching to unsplash tab
  useEffect(() => {
    if (activeTab === 'unsplash' && searchResults.length === 0) {
      handleRegenerateUnsplash();
    }
  }, [activeTab]);

  const handleApplyCustomUrl = () => {
    setUrlError('');
    if (!customUrlInput.trim()) {
      setUrlError('Por favor ingresa un enlace válido.');
      return;
    }
    if (!customUrlInput.startsWith('http://') && !customUrlInput.startsWith('https://')) {
      setUrlError('El enlace debe comenzar con http:// o https://');
      return;
    }
    setChosenUrl(customUrlInput.trim());
  };

  const handleSave = () => {
    onSelectImage(chosenUrl);
    onClose();
  };

  return (
    <motion.div 
      id="image-customizer-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[300] bg-brand-navy/90 backdrop-blur-sm flex items-center justify-center p-4 md:p-6"
      onClick={onClose}
    >
      <motion.div 
        id="image-customizer-modal-content"
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full overflow-hidden max-h-[92vh] flex flex-col border border-brand-border"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-brand-border flex items-center justify-between bg-brand-bg/50">
          <div>
            <span className="text-[9px] font-black uppercase text-brand-accent tracking-[0.25em]">Estilo Visual</span>
            <h3 className="text-xl font-serif font-black text-brand-navy mt-1">Personalizar Imagen del Artículo</h3>
            <p className="text-[10px] text-brand-slate uppercase font-bold tracking-wider mt-0.5 max-w-lg truncate">
              {articleTitle}
            </p>
          </div>
          <button 
            id="image-customizer-close-btn"
            onClick={onClose}
            className="w-10 h-10 border border-brand-border rounded-xl flex items-center justify-center text-brand-slate hover:text-brand-navy bg-white hover:border-brand-accent transition-colors active:scale-95"
            title="Cerrar modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Dynamic Image Real-Time Preview Banner */}
        <div className="px-6 pt-6 flex-shrink-0">
          <div className="relative w-full aspect-[21/9] rounded-2xl overflow-hidden border border-brand-border select-none bg-brand-bg shadow-sm">
            <img 
              id="image-customizer-live-preview"
              src={chosenUrl} 
              alt="Preview de imagen" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
              onError={() => {
                // Return fallback if link fails
                setChosenUrl("https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80");
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none"></div>
            <span className="absolute bottom-3 left-4 text-[10px] font-black uppercase tracking-[0.2em] text-white bg-brand-accent px-3 py-1.5 rounded-lg shadow">
              Vista Previa en Tiempo Real
            </span>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="px-6 pt-6 border-b border-brand-border/40 flex gap-2">
          <button
            id="tab-curated-gallery"
            onClick={() => setActiveTab('curated')}
            className={`px-4 py-2.5 text-xs font-black uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'curated' 
                ? 'border-brand-accent text-brand-navy bg-brand-bg/40' 
                : 'border-transparent text-brand-slate/60 hover:text-brand-navy'
            }`}
          >
            <Sliders size={14} />
            Galería de la Categoría
          </button>
          
          <button
            id="tab-unsplash-generator"
            onClick={() => setActiveTab('unsplash')}
            className={`px-4 py-2.5 text-xs font-black uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'unsplash' 
                ? 'border-brand-accent text-brand-navy bg-brand-bg/40' 
                : 'border-transparent text-brand-slate/60 hover:text-brand-navy'
            }`}
          >
            <Sparkles size={14} className="text-brand-accent" />
            Buscador Inteligente (Unsplash)
          </button>

          <button
            id="tab-custom-link"
            onClick={() => setActiveTab('custom')}
            className={`px-4 py-2.5 text-xs font-black uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'custom' 
                ? 'border-brand-accent text-brand-navy bg-brand-bg/40' 
                : 'border-transparent text-brand-slate/60 hover:text-brand-navy'
            }`}
          >
            <Globe size={14} />
            Pega tu Enlace
          </button>
        </div>

        {/* Tab Contents - Scrollable Box */}
        <div className="p-6 overflow-y-auto flex-1 min-h-[220px] max-h-[360px] bg-brand-bg/10">
          {activeTab === 'curated' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-black uppercase tracking-widest text-brand-slate">Filtro de Categoría Temática:</label>
                <select
                  id="curated-area-filter"
                  value={selectedArea}
                  onChange={(e) => setSelectedArea(e.target.value as any)}
                  className="px-3 py-1.5 border border-brand-border rounded-xl bg-white text-xs font-bold text-brand-navy outline-none focus:border-brand-accent shadow-sm"
                >
                  <option value={ExpertiseArea.LABORAL}>Laboral</option>
                  <option value={ExpertiseArea.CIVIL}>Civil</option>
                  <option value={ExpertiseArea.COMERCIAL}>Comercial</option>
                  <option value={ExpertiseArea.PENAL}>Penal</option>
                  <option value={ExpertiseArea.TRIBUTARIO_ADUANERO}>Tributario y Aduanero</option>
                  <option value={ExpertiseArea.ADMINISTRATIVO}>Derecho Administrativo</option>
                  <option value={ExpertiseArea.CONSTITUCIONAL}>Constitucional</option>
                  <option value="default">Diseños Generales</option>
                </select>
              </div>

              {/* Curated Grid Selection */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-1">
                {curatedPool.map((url, index) => {
                  const isSelected = chosenUrl === url;
                  return (
                    <div 
                      key={index}
                      onClick={() => setChosenUrl(url)}
                      className={`relative aspect-[16/10] rounded-xl overflow-hidden cursor-pointer group shadow-sm transition-all border-2 ${
                        isSelected 
                          ? 'border-brand-accent scale-95 ring-2 ring-brand-accent/20' 
                          : 'border-brand-border/40 hover:border-brand-navy/30 hover:scale-102'
                      }`}
                    >
                      <img 
                        src={url} 
                        alt={`Curated Option ${index + 1}`} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        referrerPolicy="no-referrer"
                      />
                      {isSelected && (
                        <div className="absolute inset-0 bg-brand-navy/40 flex items-center justify-center">
                          <div className="w-8 h-8 rounded-full bg-brand-accent text-brand-navy flex items-center justify-center shadow-md animate-scale-in">
                            <Check size={18} className="stroke-[3]" />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'unsplash' && (
            <div className="space-y-6">
              <div className="bg-white p-5 rounded-2xl border border-brand-border/80 shadow-sm space-y-4">
                <h4 className="text-xs font-black uppercase text-brand-navy tracking-widest flex items-center gap-1.5">
                  <Sparkles size={14} className="text-brand-accent animate-spin" />
                  Buscador de Stock Fotográfico de Alta Fidelidad (Unsplash)
                </h4>
                <p className="text-[11px] text-brand-slate leading-relaxed">
                  Busca palabras clave relacionadas con tu artículo para obtener imágenes reales y de alta calidad directamente desde el catálogo oficial de Unsplash. Selecciona tu favorita a continuación:
                </p>

                <div className="flex gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-slate/50" size={16} />
                    <input
                      id="unsplash-keyword-input"
                      type="text"
                      value={unsplashKeyword}
                      onChange={(e) => setUnsplashKeyword(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleRegenerateUnsplash();
                        }
                      }}
                      placeholder="Ej. auditoría fiduciaria, balance contable, ecuador..."
                      className="w-full pl-11 pr-4 py-3 border border-brand-border rounded-xl text-xs font-bold text-brand-navy outline-none focus:border-brand-accent shadow-inner bg-brand-bg/20"
                    />
                  </div>
                  <button
                    id="unsplash-search-regenerate-btn"
                    onClick={() => handleRegenerateUnsplash()}
                    disabled={searchLoading}
                    className="px-5 py-3 bg-brand-navy hover:bg-brand-corporate text-white font-black text-xs uppercase tracking-widest rounded-xl flex items-center gap-2 transition-all hover:shadow shadow-md active:scale-95 disabled:opacity-50 active:translate-y-[1px]"
                  >
                    <RefreshCw size={14} className={searchLoading ? "animate-spin" : ""} />
                    {searchLoading ? "Buscando..." : "Buscar"}
                  </button>
                </div>

                {/* Popular Keywords Chips */}
                <div className="flex flex-wrap gap-2 pt-1 border-t border-brand-border/20">
                  <span className="text-[9px] uppercase font-black text-brand-slate/50 self-center mr-1">Sugeridos:</span>
                  {[
                    { display: 'Oficina', kw: 'modern office corporate' },
                    { display: 'Finanzas', kw: 'accounting numbers spreadsheet' },
                    { display: 'Auditoría', kw: 'finance audit business documents' },
                    { display: 'Imposición/Tributos', kw: 'government money scale' },
                    { display: 'Justicia / Fiscalía', kw: 'gavel court legal scale' },
                    { display: 'Estadísticas', kw: 'growth investor stocks charts' }
                  ].map((chip) => (
                    <button
                      key={chip.display}
                      onClick={() => {
                        setUnsplashKeyword(chip.kw);
                        handleRegenerateUnsplash(chip.kw);
                      }}
                      className="text-[10px] font-bold text-brand-navy/70 border border-brand-border hover:border-brand-accent hover:bg-brand-accent/10 px-3 py-1.5 rounded-lg bg-brand-bg/55 transition-colors"
                    >
                      {chip.display}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dynamic Search Results Grid */}
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-brand-slate">Resultados Encontrados ({searchResults.length}):</label>
                
                {searchLoading ? (
                  <div className="flex flex-col items-center justify-center py-10 gap-3 border border-dashed border-brand-border rounded-2xl bg-white/40">
                    <div className="w-8 h-8 border-3 border-brand-accent border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-brand-slate animate-pulse">Consultando Unsplash...</span>
                  </div>
                ) : searchResults.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {searchResults.map((url, index) => {
                      const isSelected = chosenUrl === url;
                      return (
                        <div 
                          key={index}
                          onClick={() => setChosenUrl(url)}
                          className={`relative aspect-[16/10] rounded-xl overflow-hidden cursor-pointer group shadow-sm transition-all border-2 ${
                            isSelected 
                              ? 'border-brand-accent scale-95 ring-2 ring-brand-accent/20' 
                              : 'border-brand-border/40 hover:border-brand-navy/30 hover:scale-102'
                          }`}
                        >
                          <img 
                            src={url} 
                            alt={`Searched Option ${index + 1}`} 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            referrerPolicy="no-referrer"
                          />
                          {isSelected && (
                            <div className="absolute inset-0 bg-brand-navy/40 flex items-center justify-center">
                              <div className="w-8 h-8 rounded-full bg-brand-accent text-brand-navy flex items-center justify-center shadow-md animate-scale-in">
                                <Check size={18} className="stroke-[3]" />
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center text-brand-slate bg-white border border-brand-border rounded-2xl">
                    <ImageIcon size={32} className="opacity-20 mb-2" />
                    <span className="text-xs font-bold">Ingresa una búsqueda arriba para ver fotos de stock libres</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'custom' && (
            <div className="space-y-4">
              <div className="bg-white p-5 rounded-2xl border border-brand-border/80 shadow-sm space-y-4">
                <h4 className="text-xs font-black uppercase text-brand-navy tracking-widest flex items-center gap-2">
                  <Globe size={14} className="text-brand-accent" />
                  Escribe o Pega un Enlace Externo
                </h4>
                <p className="text-[11px] text-brand-slate leading-relaxed">
                  Si ya tienes una fotografía alojada en tus servidores, en WordPress o en tu nube, pega el enlace absoluto (HTTPS) aquí abajo para asociarla directamente con el artículo de manera formal.
                </p>

                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      id="custom-url-input-field"
                      type="url"
                      value={customUrlInput}
                      onChange={(e) => setCustomUrlInput(e.target.value)}
                      placeholder="https://ejemplo.com/imagenes/mi_articulo_banner.jpg"
                      className="w-full px-4 py-3 border border-brand-border rounded-xl text-xs font-bold text-brand-navy outline-none focus:border-brand-accent shadow-inner bg-brand-bg/20"
                    />
                    <button
                      id="custom-url-apply-btn"
                      onClick={handleApplyCustomUrl}
                      className="px-5 py-3 bg-brand-accent text-brand-navy font-black text-xs uppercase tracking-widest rounded-xl hover:bg-brand-navy hover:text-white transition-all shadow-md active:scale-95"
                    >
                      Aplicar
                    </button>
                  </div>
                  {urlError && <p className="text-[10px] font-black uppercase text-red-500 mt-1">{urlError}</p>}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="p-6 border-t border-brand-border flex items-center justify-between bg-brand-bg/30">
          <button
            id="image-customizer-cancel-btn"
            onClick={onClose}
            className="px-5 py-3 border border-brand-border hover:border-brand-navy text-brand-navy hover:bg-brand-bg font-black text-xs uppercase tracking-widest rounded-xl transition-all active:scale-95"
          >
            Cancelar
          </button>
          
          <button
            id="image-customizer-save-btn"
            onClick={handleSave}
            className="px-6 py-3 bg-brand-accent border border-brand-accent text-brand-navy hover:bg-brand-navy hover:text-white hover:border-brand-navy font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg hover:shadow-xl active:scale-95 flex items-center gap-2"
          >
            <Check size={16} className="stroke-[2.5]" />
            Guardar Cambios de Imagen
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
