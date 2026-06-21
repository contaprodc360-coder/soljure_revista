
export enum ExpertiseArea {
  LABORAL = "Laboral",
  CIVIL = "Civil",
  COMERCIAL = "Comercial",
  PENAL = "Penal",
  TRIBUTARIO_ADUANERO = "Tributario y Aduanero",
  ADMINISTRATIVO = "Derecho Administrativo",
  CONSTITUCIONAL = "Constitucional",
}

export interface Editorial {
  id: string;
  title: string;
  summary: string;
  managerSummary?: string;
  content: string;
  author: string;
  date: string;
  area: ExpertiseArea;
  readTime: string;
  videoScript?: string;
  imageUrl?: string;
}

export interface AIReviewResponse {
  summary: string;
  technicalChecks: string[];
  suggestedCitations: string[];
}

export interface Ficha {
  id: string;
  editorialId: string;
  title: string;
  summary: string;
  contentSnapshot: string;
  area: ExpertiseArea;
  author: string;
  generationDate: string; // local date string (e.g. YYYY-MM-DD)
  readTime: string;
  action: string; // 'Creado' | 'Actualizado' | 'Enriquecido Doctrinalmente' etc.
  authorId: string;
  createdAt?: any;
}

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

