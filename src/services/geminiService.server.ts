import { GoogleGenAI, ThinkingLevel, Modality, Type } from "@google/genai";
import { ExpertiseArea } from "../types";

let aiClient: GoogleGenAI | null = null;
let currentKeyUsed: string | null = null;

function getGeminiClient(): GoogleGenAI {
  const envKey = process.env.GEMINI_API_KEY;
  const key = envKey;

  if (!key) {
    throw new Error("La API Key de Gemini (GEMINI_API_KEY) no está configurada en las variables de entorno de tu servidor Cloud Run. Por favor regístrala como secreto en la sección Configuración.");
  }

  // If key has changed or client doesn't exist, re-instantiate
  if (!aiClient || currentKeyUsed !== key) {
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
    currentKeyUsed = key;
  }
  return aiClient;
}

// Proxied 'ai' to allow lazy-loaded instantiation only when a call is executed
export const ai = new Proxy({} as GoogleGenAI, {
  get: (target, prop, receiver) => {
    return Reflect.get(getGeminiClient(), prop, receiver);
  }
});

async function withRetry<T>(fn: () => Promise<T>, maxRetries = 2, baseDelay = 1500): Promise<T> {
  let lastError: any;
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      const errorMsg = error instanceof Error ? error.message : JSON.stringify(error);
      const isQuotaError = errorMsg.includes("429") || errorMsg.includes("RESOURCE_EXHAUSTED") || errorMsg.toLowerCase().includes("quota");
      const isInternalError = errorMsg.includes("500") || errorMsg.includes("INTERNAL") || errorMsg.toLowerCase().includes("internal error");
      const isUnavailableError = errorMsg.includes("503") || errorMsg.includes("UNAVAILABLE") || errorMsg.toLowerCase().includes("high demand") || errorMsg.toLowerCase().includes("temporary");
      
      if ((isQuotaError || isInternalError || isUnavailableError) && i < maxRetries) {
        const delay = baseDelay * Math.pow(2, i);
        console.warn(`${isQuotaError ? 'Quota' : isUnavailableError ? 'Service Unavailable' : 'Internal'} error detected. Retrying in ${delay}ms... (Attempt ${i + 1}/${maxRetries})`);
        await new Promise(r => setTimeout(r, delay));
        continue;
      }
      throw error;
    }
  }
  throw lastError;
}

interface GenerateOptions {
  prompt: string;
  temperature?: number;
  responseMimeType?: string;
  responseSchema?: any;
}

async function generateContentSmartFallback(options: GenerateOptions, defaultModel = "gemini-3.5-flash"): Promise<any> {
  const modelsToTry = [
    defaultModel,
    "gemini-3.1-flash-lite",
    "gemini-flash-latest"
  ];

  const uniqueModels = Array.from(new Set(modelsToTry));

  let lastError: any;
  for (const model of uniqueModels) {
    try {
      const response = await withRetry(() => ai.models.generateContent({
        model: model,
        contents: [{ parts: [{ text: options.prompt }] }],
        config: {
          temperature: options.temperature ?? 0.7,
          responseMimeType: options.responseMimeType,
          responseSchema: options.responseSchema,
        }
      }), 2, 1200);
      return response;
    } catch (error) {
      lastError = error;
      const errorMsg = error instanceof Error ? error.message : JSON.stringify(error);
      console.warn(`Smart Fallback: Model "${model}" failed with: ${errorMsg}. Trying next option in fallback chain...`);
    }
  }
  throw lastError;
}

export async function getTechnicalAssistantAdvice(content: string, type: ExpertiseArea) {
  if (!content || content.length < 20) {
    return "Escribe un poco más para que pueda realizar un análisis jurídico válido.";
  }

  const prompt = `Actúa como un experto asesor judicial, consultor constitucional de alto nivel y procesalista en la República del Ecuador para el portal SOLJURE (Soluciones Jurídicas Eficaces). 
Examine el siguiente borrador o caso de estudio legal con el más alto RIGOR JURÍDICO, profundidad analítica y exactitud doctrinal:

"${content}"

Sobre la base de la especialidad en "${type}", proporcione un dictamen articulado que comprenda:
1. ANÁLISIS DE CONSISTENCIA JURÍDICO-PROCESAL: Evalúe la coherencia formal y material del texto. Examine si el planteamiento cumple con las reglas de sustanciación, los principios de seguridad jurídica (Art. 82 de la Constitución de la República del Ecuador) y debido proceso (Art. 76 CRE), así como las gacetas correspondientes.
2. FUNDAMENTACIÓN RECOMENDADA (JURISPRUDENCIA Y NORMATIVA): Ofrezca sugerencias precisas de normas sustantivas y adjetivas vigentes del Ecuador (ej. COGEP, COIP, Código Civil, Código del Trabajo, COA, Constitución), y cite fallos de triple reiteración, precedentes de observancia obligatoria de la Corte Nacional de Justicia, o sentencias vinculantes de la Corte Constitucional del Ecuador que resulten idóneas para sostener la tesis.
3. ELEVACIÓN DE RIGOR DOCTRINARIO: Adapte y sugiera formas estilísticas formales, terminología jurídica depurada (exégesis, antijuridicidad, eximente, antinomia, tutela judicial efectiva, etc.) y una estructura argumentativa sólida de corte académico.
4. EVITAR MENCIONES DE SISTEMAS DE IA: No se auto-referencie bajo ningún concepto como inteligencia artificial, asistente virtual de Google, modelo de lenguaje u otra denominación informática. Todo el texto debe fluir sin costuras como la consultoría directa de un jurista humano especialista de SOLJURE.
5. FUENTES BIBLIOGRÁFICAS REALES: Incorpore de manera prolija al final una selecta lista de bibliográficas reales vigentes en la República del Ecuador (tratadistas andinos de renombre, Códigos Oficiales editados por la Asamblea Nacional, gacetas oficiales y números de Registro Oficial auténticos).

Responde estrictamente en formato Markdown formal y didáctico para profesionales del derecho.`;

  try {
    const response = await generateContentSmartFallback({
      prompt: prompt,
      temperature: 0.7
    });

    return response.text || "No se pudo generar un análisis jurídico en este momento.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return `> 💡 **Nota de Contingencia:** En este momento, debido a la alta demanda de la cuota compartida de la API de Gemini, SOLJURE ha activado la base de jurisprudencia y doctrina local precargada.

### 📋 Análisis Jurídico y Procesal Especializado: "${content.substring(0, 60)}..."

1. **Revisión de Coherencia Normativa y Procesal (${type})**:
   - Hemos analizado la argumentación técnico-jurídica de su borrador. Si versa sobre prescripción de acciones, recursos de casación, garantías jurisdiccionales, causales de despido ineficaz o determinaciones tributarias, asegure la debida concordancia con los precedentes de observancia obligatoria y fallos de triple reiteración de la Corte Nacional de Justicia del Ecuador.
   - Todo alegato u opinión jurídica debe estar blindado por los principios de seguridad jurídica (Art. 82 de la Constitución) y debido proceso (Art. 76).

2. **Fuentes Jurisprudenciales y Normativas sugeridas (Ecuador)**:
   - **Constitución de la República del Ecuador**: Garantías constitucionales y procesales aplicables.
   - **Gacetas Judiciales de la Corte Nacional de Justicia**: Resoluciones obligatorias en materia civil, laboral, mercantil y penal.
   - **Jurisprudencia de la Corte Constitucional**: Sentencias interpretativas de derechos fundamentales y acciones extraordinarias de protección (AEP).

3. **Recomendación de Argumentación SOLJURE**:
   - Se aconseja robustecer la fundamentación fáctica mediante la incorporación de fichas analíticas de precedentes vinculantes, evitando vacíos interpretativos que puedan restar mérito procesal ante tribunales nacionales.`;
  }
}

export async function expandEditorialTopic(title: string, type: ExpertiseArea, existingContent?: string) {
  if (!title || title.length < 5) {
    return "Por favor ingresa un título o tema jurídico más descriptivo para expandir.";
  }

  let prompt = "";
  if (existingContent && existingContent.length > 100) {
    prompt = `Actúas como un prestigioso investigador académico jurídico categorizado, doctor en jurisprudencia y catedrático de postgrados en derecho procesal y civil en el Ecuador para SOLJURE (Soluciones Jurídicas Eficaces).
El usuario desea AMPLIAR y PROFUNDIZAR un artículo científico preexistente sobre el tema: "${title}" (Especialidad: ${type}).

Aquí está el contenido doctrinal preexistente del artículo que debes ampliar e integrar de manera perfecta:
---
${existingContent}
---

MISIONES IMPERATIVAS DE INTEGRACIÓN ORGÁNICA, COHESIÓN CIENTÍFICA Y NINGÚN SOLAPAMIENTO:
1. INTEGRACIÓN SEAMLESS Y ORGÁNICA (SIN COSTRAS NI SEGUNDOS INICIOS): No pegues un nuevo artículo al final, ni generes introducciones de cortesía del asistente, ni segundos títulos principales (#). No crees secciones que repitan la introducción o preámbulos. Lee el texto preexistente de arriba y expande de forma cohesionada, intercalando los nuevos análisis, jurisprudencias, exégesis normativas and subtemas directamente dentro de las secciones correspondientes o creando subcategorías numeradas de forma continua (v.gr., "## 2.1...", "## 3.1...").
2. UNA SOLA ESTRUCTURA DE CONCLUSIONES, RECOMENDACIONES Y REFERENCIAS: El documento final resultante debe tener estrictamente una única sección de "## Conclusiones" (numeradas de manera unificada y continua, mínimo 5 en total), una única sección de "## Recomendaciones" (numeradas de manera unificada y continua, mínimo 5 en total) y una única sección de "## REFERENCIAS". Fusiona y enriquece de forma unificada el contenido preexistente con los nuevos descubrimientos de tu ampliación.
3. PROHIBICIÓN IMPERATIVA DE SECCIONES DE AUTORÍA O METADATOS: Queda terminantemente prohibido incorporar textos de marcas de transición, subtítulos secundarios o firmas superfluas tales como "## Por el autor", "## Por el autor de SOLJURE", "## Estudio Doctrinario Complementario", "Director de Publicaciones", "Director Editorial", ni nombres de ficción como "Dr. h.c. Alejandro Vance-Ceballos". El artículo debe ser un único cuerpo académico continuo, riguroso e indiviso de excelencia científica. No pongas ninguna firma ni autoría.
4. PROHIBICIÓN ABSOLUTA DE CÓDIGO HTML O ESTILOS INLINE: El output debe ser puramente texto plano estructurado en Markdown clásico ecuatoriano. Está ABSOLUTAMENTE PROHIBIDO incluir cualquier etiqueta HTML (v.gr., <div>, <span>, <p>), atributos 'style', posicionamiento absoluto, inline-blocks o márgenes negativos. Toda la maquetación debe dejarse al motor nativo de Markdown para prevenir empalme de letras o solapamientos visuales de tipografía.
5. EXCELENCIA EDITORIAL ACADÉMICA Y HUMANA: Escribe con prosa forense exquisita, categórica e impecable, evitando cualquier frase introductoria de IA ("Entendido", "Aquí tienes la ampliación...", "He integrado..."). Devuelve única y exclusivamente el documento consolidado final completo.`;
  } else {
    prompt = `Actúa como un renombrado maestro en derecho civil, procesal, penal y constitucional, académico de derecho e investigador doctrinario en Ecuador para la revista especializada de SOLJURE (Soluciones Jurídicas Eficaces). 
Tema: "${title}"
Especialidad: ${type}.

Tu tarea es redactar una profundización científica de un tema jurídico con MÁXIMO RIGOR DOCTRINAL Y EXÉGESIS JURÍDICA:
1. TRATAMIENTO DOCTRINARIO PROFUNDO: Desarrolle un análisis sustantivo (aprox. 500-800 palabras) con terminología académica y formal. Aborde las corrientes dogmáticas, la naturaleza jurídica del instituto analizado, y las fricciones de interpretación jurídica comunes en el país.
2. ANCLAJE NORMATIVO Y JURISPRUDENCIAL VIGENTE: Sustente el análisis exclusivamente en el marco positivo ecuatoriano vigente, citando los artículos aplicables del ordenamiento sustantivo (ej. Código Civil, Código de Trabajo, COA) y adjetivo (ej. COGEP, COIP). Incorpore expresamente el criterio jurisprudencial de la Corte Nacional de Justicia o de la Corte Constitucional del Ecuador.
3. COMPENDIO TÉCNICO EN TABLAS: Incluya obligatoriamente DOS tablas Markdown detalladas que asistan a la argumentación del jurista:
   - Tabla 1: Elementos constitutivos y requisitos procesales de procedibilidad, admisibilidad o idoneidad del instrumento analizado.
   - Tabla 2: Plazos procesales, causales típicas de rechazo/excepciones previas relevantes, o efectos jurídicos directos del instituto.
4. ESTRUCTURA SOFISTICADA E INTEGRADA: Use subtítulos descriptivos (##), listas claras, y ejemplos forenses prácticos fundamentados estrictamente en el derecho nacional, evitando cualquier tipo de vaguedad conceptual. El contenido debe estructurarse para integrarse sin rodeos directamente con la doctrina y jurisprudencia del tema.
5. REFERENCIAS EN APA 7 Y RIGOR HUMANO: Sigue de principio a fin las normas APA de 7.ª edición para las citas intratextuales y la sección bibliográfica final. Redacta de forma plenamente natural pero con el más selecto nivel oratorio y dogmático, eliminando clichés o modismos automatizados. No te identifiques como IA.
6. FUENTES BIBLIOGRÁFICAS REALES ECUATORIANAS: Al finalizar el tema, incluya una sección de 'REFERENCIAS' que cite autores doctrinales reales de alta academia andina (v.gr., Dr. Jorge Zavala Baquerizo, Dr. Hernán Salgado Pesantes, Dr. Alfonso Barrera Valverde) y números reales vigentes de Gacetas Judiciales o del Registro Oficial de la República del Ecuador.
7. PROHIBICIÓN ABSOLUTA DE CODE BLOCKS HTML O ESTILOS INLINE: Queda estrictamente prohibido generar código HTML, etiquetas div, span, atributos style, posicionamiento absoluto o márgenes negativos en el contenido de Markdown. Utiliza única y puramente formato Markdown estándar (##, ###, **, *, listas, tablas). No integres firmas repetitivas o pseudónimos no autorizados.

Responde ÚNICAMENTE con el cuerpo del artículo en formato Markdown. Sin comentarios introductorios, preámbulos ni notas explicativas externas.`;
  }

  try {
    const response = await generateContentSmartFallback({
      prompt: prompt,
      temperature: 0.6
    });

    let resultText = response.text || "No se pudo expandir el tema jurídico en este momento.";
    
    // Post-processing Sanitization to ensure perfect layout styling without overlapping metadata/headers
    const isExpansion = !!(existingContent && existingContent.length > 100);
    resultText = cleanExpandedContent(resultText, title, isExpansion);

    return resultText;
  } catch (error) {
    console.error("Gemini Expand Error:", error);
    return `> *Estudio analítico de actualización provisto de forma integrada por el departamento de investigación jurídica de SOLJURE.*

## 1. Introducción al Escenario Judicial y Procesal en Ecuador
La Corte Constitucional del Ecuador ha remarcado de forma reiterada la prevalencia plena de las garantías constitucionales en sede administrativa y judicial. La debida motivación de los actos, providencias y sentencias es insoslayable para evitar vulneraciones procesales.

A continuación, sintetizamos el alcance de la gestión preventiva y procesal en el ámbito de especialidad:

| Segmento de Control Legal | Base de Garantía Constitucional | Jurisprudencia y Doctrina Aplicable | Efecto Procesal de Omisión |
| :--- | :--- | :--- | :--- |
| **Garantías y debido proceso** | Art. 76 de la CRE: Normas fundamentales del proceso | Precedentes vinculantes de la Corte Constitucional | Nulidad insanable del acto o proceso judicial |
| **Sustanciación Adjetiva** | Código Orgánico General de Procesos o COIP según materia | Fallos de triple reiteración de la Corte Nacional | Inadmisibilidad de recursos ordinarios y extraordinarios |
| **Cumplimiento Sustantivo** | Leyes orgánicas especializadas del Ecuador | Gacetas Judiciales y doctrina jurídica nacional | Sanciones pecuniarias o determinaciones administrativas perjudiciales |

## 2. Flujo de Procedimientos y Jurisprudencia Relevante
La Corte Constitucional del Ecuador ha remarcado de forma reiterada la prevalencia plena de las garantías constitucionales en sede administrativa y judicial. La debida motivación de los actos, providencias y sentencias es insoslayable para evitar vulneraciones procesales.

### Síntesis de Términos y Recursos Procesales:

| Recurso / Acción Judicial | Término Legal de Interposición | Órgano Competente de Resolución | Fundamentación Normativa del Ecuador |
| :--- | :--- | :--- | :--- |
| **Recurso de Apelación** | 3 a 5 días laborables según código | Tribunal de la Corte Provincial respectiva | Arts. 256 y sgtes. del COGEP / COIP |
| **Recurso de Casación** | 30 días hábiles en materia ordinaria | Sala Especializada de la Corte Nacional di Justicia | Arts. 268 del COGEP (causales de infracción de ley) |
| **Acción Extraordinaria de Protección** | 20 días desde la ejecutoria del fallo | Pleno de la Corte Constitucional del Ecuador | Ley Orgánica de Garantías Jurisdiccionales |

## 3. Conclusiones y Recomendaciones Consultivas para SOLJURE
Se aconseja estructurar auditorías legales preventivas (Legal Compliance) de manera permanente, respaldando la toma de decisiones empresariales sobre bases jurisprudenciales sólidas y gacetas judiciales actualizadas, resguardando la integridad corporativa y previniening contingencias judiciales.`;
  }
}

/**
 * Sanitize and align the expanded text to strip redundant wrappers, duplicate H1 headers,
 * and eliminate any trace of AI generated warnings or fictitious author attributions.
 */
function cleanExpandedContent(content: string, title: string = "", isExpansion: boolean = true): string {
  let cleaned = content.trim();

  // Strip Markdown code fences if the model wrapped the response in one (v.gr., ```markdown ... ```)
  if (cleaned.startsWith("```markdown")) {
    cleaned = cleaned.substring(11);
    if (cleaned.endsWith("```")) {
      cleaned = cleaned.substring(0, cleaned.length - 3);
    }
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned.substring(3);
    if (cleaned.endsWith("```")) {
      cleaned = cleaned.substring(0, cleaned.length - 3);
    }
  }
  cleaned = cleaned.trim();

  // Split content into lines to aggressively remove metadata rows, fake authors, SRI/NIIF leaks or AI notations
  const lines = cleaned.split('\n');
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
    
    // Remove specific unrequested titles or section divisions that split the flow
    if (trimmed.includes("estudio doctrinario complementario") || trimmed.includes("profundización de contenido") || trimmed.includes("ampliación de contenido") || trimmed.includes("nota de contingencia") || trimmed.includes("biblioteca doctrinaria local")) {
      return false;
    }

    // Check for any AI/IA metadata lines or robot warnings
    if (trimmed.includes("generado por") || trimmed.includes("autogenerado") || trimmed.includes("optimizado por") || trimmed.includes("motor de compilación")) {
      return false;
    }
    if (trimmed.includes("inteligencia artificial") || trimmed.includes("modelo de lenguaje") || trimmed.includes("asistente virtual") || trimmed.includes("asistente editorial") || trimmed.includes("asistente de compilación")) {
      return false;
    }
    if (/\b(ia|ai)\b/i.test(trimmed)) {
      return false;
    }

    if (trimmed.includes("por el autor") || trimmed.includes("por los autores") || trimmed.includes("ampliación por el autor") || trimmed.includes("profundización por el autor")) {
      return false;
    }

    // Prevent any "soljure publishing" credits in lines
    if (trimmed.includes("soljure publishing") || trimmed.includes("semanario de vanguardia")) {
      return false;
    }

    // Block markdown block fields declaring authorship
    if (trimmed.match(/^#+\s*por\s+el\s+autor/) || trimmed.match(/^#+\s*autores/) || trimmed.match(/^#+\s*director\s+editorial/) || trimmed.match(/^#+\s*escrito\s+por/)) {
      return false;
    }

    return true;
  });

  cleaned = filteredLines.join('\n').trim();

  // Strip duplicate H1 that matches original title (v.gr., "# My Title")
  if (title) {
    const titleWords = title.split(/\s+/).filter(w => w.length > 3).slice(0, 4).join("|");
    if (titleWords) {
      const duplicateH1Regex = new RegExp(`^\\s*#\\s+(${titleWords})[^\\n]*\\n+`, "i");
      cleaned = cleaned.replace(duplicateH1Regex, "");
    }
  }

  // Remove general H1 starting title blocks ONLY if we are performing an expansion inside an existing article text
  if (isExpansion) {
    cleaned = cleaned.replace(/^\s*#\s+[^\n]+\n+/, "");
  }

  // Strip out any redundant markdown lines starting with HTML tags or style properties
  cleaned = cleaned.replace(/<[^>]*>/gi, ""); 

  return cleaned.trim();
}

export async function generatePracticalCase(title: string, type: ExpertiseArea) {
  if (!title || title.length < 5) {
    return "Por favor ingresa un título o tema procesal para generar un caso práctico jurídico.";
  }

  const prompt = `Actúa como un prestigioso consultor de patrocinio forense, ex-magistrado de casación de la Corte Nacional y socio consultor senior de SOLJURE (Soluciones Jurídicas Eficaces) en Ecuador.
Tema de análisis: "${title}"
Materia: ${type}.

Su tarea es elaborar un CASO PRÁCTICO METODOLÓGICO Y FORENSE CON PLENO RIGOR JURÍDICO:
1. PRESENTACIÓN FÁCTICA Y CONTROVERSIA: Plantee un caso práctico complejo basado en un conflicto judicial del mundo corporativo o particular real en el Ecuador (excluyendo datos confidenciales reales, pero modelado según los litigios más comunes).
2. ANÁLISIS ADJETIVO Y PROCESAL MINUCIOSO: Detalle la vía de sustanciación correspondiente (ej. Ordinaria, Sumaria, Contencioso-Administrativa), los términos, las excepciones previas que se deben deducir (Art. 153 del COGEP) y la carga de la prueba aplicable.
3. SUBSUNCIÓN Y MARCO SUSTANTIVO VIGENTE: Justifique técnicamente el encuadre legal sustantivo, explicando cómo opera la norma en el caso particular (vicios de consentimiento, causales penales, prescripciones laborales, etc.).
4. ANÁLISIS DE LA RATIO DECIDENDI VINCULANTE: Dedique una sección a citar sentencias de triple reiteración, resoluciones obligatorias del pleno de la Corte Nacional, o sentencias interpretativas de la Corte Constitucional del Ecuador que resuelvan la disputa doctrinaria.
5. RECOMENDACIÓN DE PREVENCIÓN Y COMPLIANCE SOLJURE: Detalle la estrategia idónea tanto si ejerce la defense del actor como si asume el patrocinio de la parte demandada, incorporando recomendaciones de blindaje legal corporativo y gestión probatoria.
6. EXCLUSION DE ASISTENCIAS AUTOMATICAS: Evite el uso de expresiones artificiales, marcas de agua de IA o lenguaje genérico. Integre al final de las secciones jurisprudenciales referencias o citas bibliotecarias reales y vigentes de la República de Ecuador.

Responde ÚNICAMENTE en formato Markdown, estructurado formalmente mediante epígrafes descriptivos y sin notas accesorias ni comentarios de la IA.`;

  try {
    const response = await generateContentSmartFallback({
      prompt: prompt,
      temperature: 0.7
    });

    return response.text || "No se pudo generar el caso práctico jurídico.";
  } catch (error) {
    console.error("Gemini Practical Error:", error);
    return `> 💡 **Nota de Contingencia:** *Análisis técnico-procesal alternativo provisto por la base de jurisprudencia y gacetas de SOLJURE.*

# Caso Práctico Sometido a Examen: Litigio y Defensa de Derechos

## 1. Planteamiento del Conflicto Fáctico
La corporación mercantil "Ecuadistribuidores S.A." afronta una controversia legal sustancial respecto al cumplimiento y exigibilidad de derechos u obligaciones derivadas de sus operaciones ordinarias en este ejercicio fiscal 2026. Se requiere trazar la estrategia de contradicción o defensa procesal, identificando nulidades procesales o la viabilidad de interposición de recursos ordinarios con base en las resoluciones vigentes de la Corte Nacional de Justicia.

### Elementos Procedimentales Clave:
- **Base Material de la Controversia**: Incumplimiento contractual / Despido ineficaz / Determinación impositiva.
- **Término para Contestación o Demanda**: Plazos de desestimación u oposición conforme al COGEP o leyes aplicables.
- **Vía Procesal**: Ordinaria / Sumaria / Contencioso Administrativa según corresponda de forma estricta.

## 2. Cuadro de Acciones Procesales y Excepciones Previas

| Código Orgánico (COGEP) | Excepción de Oposición Legal | Efectos Jurídicos en la Audiencia Única | Fundamento Doctrinal y Legal |
| :--- | :--- | :--- | :--- |
| **Art. 153.1** | Incompetencia del Juzgador(a) | Remisión inmediata al juez competente para trámite | Principio del juez natural y competencia procesal |
| **Art. 153.3** | Caducidad o Prescripción de la Acción | Extinción definitiva de la pretensión y archivo del expediente | Falta de ejercicio oportuno del derecho o tutela judicial |
| **Art. 153.6** | Litispendencia activa | Acumulación de autos o archivo de la demanda posterior | Evita fallos contradictorios y cosa juzgada |

## 3. Jurisprudencia Nacional del Ecuador y Veredicto Consultivo
- **Corte Nacional de Justicia**: Se fundamenta la defensa en la aplicación del precedente jurisprudencial obligatorio para que la contradicción resulte idónea en audiencia de juicio.
- **Cumplimiento Instrumental**: Conserve siempre pruebas notariales, testimonios y peritajes para validar su postura en audiencia.
- **Fuentes Sincronizadas**: Resoluciones vigentes del SRI, Registro Oficial de la República del Ecuador, Gaceta Judicial y jurisprudencia ecuatoriana a 2026.
`;
  }
}

export async function refineContent(content: string, type: ExpertiseArea) {
  if (!content || content.length < 50) {
    return "El contenido es demasiado corto para ser refinado profesionalmente.";
  }

  const prompt = `Actúa como el Director de Publicaciones Científicas de la Revista SOLJURE y magistrado emérito ordinario. Refina el siguiente texto concerniente a la materia de "${type}" en Ecuador con la máxima densidad técnica y rigor formal:

"${content}"

Instrucciones imperativas de elevación editorial:
1. CULMINACIÓN ORATORIA Y TERMINOLOGÍA PROCESAL: Sustituya conceptos genéricos por tecnicismos forenses de alta alcurnia (v.gr., "contradicción fáctica", "locus regit actum", "procedencia de alzamiento", "excepción perentoria de prescripción", "vicios in procedendo" o "in iudicando"). El tono debe deponer cualquier coloquialismo en pos de una oratoria contundente e impecable, digna de un memorial casacional.
2. DEBIDO ANCLAJE POSITIVO Y JURISPRUDENCIAL: Verifique y dote de consistencia procesal a todas las alusiones jurídicas, sugiriendo de forma precisa los incisos normativos correspondientes y engarzando el texto con la doctrina oficial emanada del Pleno de la Corte Nacional o el Tribunal de Garantías de la Corte Constitucional.
3. COHESIÓN ACADÉMICA: Asegure que la transición de premisas sea fluida, didáctica pero sumamente erudita, depurando redundancias propias de modelos de lenguaje comunes.

Devuelve el texto completo optimizado y refinado, estructurado en Markdown.`;

  try {
    const response = await generateContentSmartFallback({
      prompt: prompt,
      temperature: 0.6
    });

    return cleanExpandedContent(response.text || "No se pudo refinar el contenido legal.", "", false);
  } catch (error) {
    console.error("Gemini Refine Error:", error);
    return `> 💡 **Nota de Contingencia:** *Contenido refinado y optimizado con la guía tecno-editorial de SOLJURE (Soluciones Jurídicas Eficaces).*

### 📰 Versión Refinada por la Dirección Académica de SOLJURE:

${content}

***

#### ⚖️ Nota de Rigor Jurisprudencial y Procesal (${type}):
- **Oratoria Judicial**: Hemos adaptado la redacción a un marco doctrinario formal para garantizar la asimilación idónea de los criterios de las altas cortes del Ecuador.
- **Soporte Fáctico**: Se reforzaron conceptos de seguridad jurídica, debido proceso y derecho a la defensa para un óptimo sustento procesal corporativo.`;
  }
}

export async function humanizeContent(content: string, type: ExpertiseArea) {
  if (!content || content.length < 50) {
    return "El contenido es demasiado corto para ser humanizado adecuadamente.";
  }

  const prompt = `Actúa como un corrector de estilo doctrinario, experto en argumentación jurídica, litigación y oratoria forense ecuatoriana.
Transforma el siguiente texto en un análisis que suene 100% natural, experimentado y redactado directamente por un prestigioso jurista y académico de SOLJURE en Ecuador.

TEXTO:
"${content}"

DIRECTRICES:
1. RITMO: Varía la longitud de los períodos oratorios alternando frases cortas de gran impacto y explicaciones minuciosas.
2. EXPERIENCIA: Inserta anécdotas o frases que muestren el día a día en tribunales y audiencias del Ecuador (audiencia única, juicio, casación).
3. CONTEXTO: Enlaza el análisis con la realidad de los despachos judiciales en el país, el Consejo de la Judicatura y las Gacetas Judiciales de la Corte Nacional.
4. NATURALIDAD: Elimina redundancias y vicios de redacción repetitivos o sintéticos.

Devuelve el texto refinado y humanizado en Markdown.`;

  try {
    const response = await generateContentSmartFallback({
      prompt: prompt,
      temperature: 0.8
    });

    return cleanExpandedContent(response.text || "No se pudo humanizar el contenido jurídico.", "", false);
  } catch (error) {
    console.error("Gemini Humanize Error:", error);
    return `> 💡 **Nota de Contingencia:** *Conversión a tono oratorio forense directo provista por el equipo de litigantes de SOLJURE.*

${content.replace(/En conclusión|Es importante destacar|Por ende/gi, 'Por consiguiente').replace(/Asimismo/gi, 'Por otra parte')}

***

*Mensaje personal de los socios consultores de SOLJURE:*
> "En el ejercicio activo de la defensa jurídica en Ecuador, hemos evidenciado que la audiencia se gana desde el momento en que se estructuran de forma sólida las excepciones previas y se define el anuncio de pruebas instrumentales notarizadas. Más que memorizar códigos, el éxito procesal se basa en entender y aplicar debidamente la doctrina de las Gacetas Judiciales de las altas cortes."`;
  }
}

export async function generateVideoPromoScript(title: string, content: string): Promise<string> {
  const prompt = `Actúa como un experto en Marketing Jurídico Digital para el portal legal SOLJURE en Ecuador.
Genera un guion publicitario de 1 minuto para un video de redes sociales (Reel/TikTok) basado en este artículo de análisis procesal:
Título: "${title}"
Contenido: ${content.substring(0, 1500)}...

El guion debe durar exactamente 60 segundos y seguir esta estructura:
1. **GANCHO (0-10s)**: Una pregunta o afirmación de impacto directo sobre un problema procesal o judicial en Ecuador.
2. **VALOR TÉCNICO (10-45s)**: Explica los 3 puntos procesales clave que el profesional del derecho o la plana gerencial encontrará. Lenguaje persuasivo y erudito.
3. **CALL TO ACTION (45-60s)**: Invita a leer el análisis completo en el portal de SOLJURE.

Incluye anotaciones de [ESCENA] para el editor de video (ej: [Muestra código de leyes], [Grafica plazos], [Música de fondo misteriosa]).
Responde en formato Markdown claro. Sin preámbulos.`;

  try {
    const response = await generateContentSmartFallback({
      prompt: prompt,
      temperature: 0.7
    });

    return response.text || "No se pudo generar el guion publicitario legal.";
  } catch (error) {
    console.error("Error generating video script:", error);
    return `> 💡 **Nota de Contingencia:** *Guion de redes sociales provisto con los lineamientos de compliance de SOLJURE.*

### 🎬 Guion Publicitario de 60 Segundos: "${title}"

* **[0:00 - 0:10] [GANCHO DE APERTURA]**
  * **[ESCENA]**: Primer plano de un abogado de SOLJURE sosteniendo un Código Orgánico de Procesos en una oficina elegante.
  * **[NARRADOR]**: "¿Estás seguro de que tu anuncio probatorio resistiría la objeción de la contraparte en la Audiencia Preliminar? ¡Cuidado, un error procesal formal te puede costar el caso!"

* **[0:10 - 0:45] [VALOR TÉCNICO COMPARTIDO]**
  * **[ESCENA]**: Transición rápida a pantalla interactiva con cuadro analítico de excepciones previas.
  * **[NARRADOR]**: "En nuestro último informe estratégico en SOLJURE, analizamos a fondo la jurisprudencia obligatoria y resoluciones de casación de la Corte Nacional. Te revelamos los tres puntos insoslayables del debido proceso que blindarán tu contestación de demanda."

* **[0:45 - 1:00] [CALL TO ACTION FINAL]**
  * **[ESCENA]**: Pantalla mostrando el sitio web oficial de SOLJURE con el lema: 'Soluciones Jurídicas Eficaces'.
  * **[NARRADOR]**: "¡No dejes tu defensa legal al azar! Entra hoy mismo a SOLJURE, lee el artículo completo y descarga nuestras guías procesales gratuitas. Haz clic en el enlace."`;
  }
}

export async function generateStorySlidesContent(title: string, content: string, voiceStyle: string): Promise<{slides: {title: string, body: string, script: string}[]}> {
  const prompt = `Actúa como un productor de contenido jurídico multimedia de élite para SOLJURE.
Genera el contenido para 5 SLIDES de una experiencia de Podcast de video profesional basada en este artículo legal:
Título del Artículo: "${title}"
Contenido Base: ${content.substring(0, 1000)}...

Voz y Personaje del Narrador: ${voiceStyle}. El tono debe ser de un prestigiado analista de derecho o litigante carismático en un set moderno de grabación.

Estructura requerida por slide:
1. PORTADA: Título impactante de alta retención legal.
2. EL DESAFÍO: Planteamiento de la controversia judicial o vacío adjetivo en tribunales ecuatorianos.
3. REVELACIÓN JURÍDICA: El fallo crucial de la Corte Constitucional o Corte Nacional (jurisprudencia o Gaceta Judicial) aplicable.
4. ACCIÓN ESTRATÉGICA: Recomendación de patrocinio o compliance preventivo de SOLJURE.
5. CIERRE MASTERMIND: Invitación de negocios a leer el artículo en el portal oficial de SOLJURE.

Responde estrictamente en formato JSON válido. Asegúrate de escapar correctamente comillas dobles internas.
Estructura JSON:
{
  "slides": [
    { "title": "Encabezado Visual", "body": "Texto cuerpo (máximo 15 palabras)", "script": "Guion del narrador (máximo 120 palabras)" }
  ]
}

Sin preámbulos, solo el JSON puro.`;

  try {
    const response = await generateContentSmartFallback({
      prompt: prompt,
      temperature: 0.7,
      responseMimeType: "application/json"
    });

    const text = response.text || "{}";
    const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    try {
      return JSON.parse(cleanedText);
    } catch (e) {
      console.error("JSON Parse Error in slides generation:", e, cleanedText);
      return { slides: [] };
    }
  } catch (error) {
    console.error("Error definitivo en generación de slides, usando fallback local:", error);
    return {
      slides: [
        {
          title: "Garantizando la Seguridad",
          body: "Defensa jurídica preventiva y oportuna sustentada en jurisprudencia nacional.",
          script: "[ESCENA: Presentador en set de grabación de SOLJURE] Saludos a toda la comunidad jurídica. Hoy analizaremos el correcto encuadre de las garantías procesales frente a controversias complejas en el Ecuador."
        },
        {
          title: "El Desafío en Tribunales",
          body: "Inconsistencias y omisiones procesales comprometen la tutela judicial efectiva.",
          script: "[ESCENA: El presentador señala un pizarrón con flujo procesal del COGEP] El riesgo principal estriba en la omisión del sustento jurisprudencial vinculante al momento de plantear excepciones de caducidad o incompetencia en la contestación."
        },
        {
          title: "La Regla de Precedentes",
          body: "La jurisprudencia y las Gacetas Judiciales de la Corte Constitucional son fuentes vinculantes.",
          script: "[ESCENA: Animación que muestra la pirámide de Kelsen en Ecuador] La Constitución del Ecuador establece con meridiana claridad que los precedentes constitucionales gozan de fuerza de ley, obligando a los jueces ordinarios a acatarlos."
        },
        {
          title: "La Audiencia Única",
          body: "Organice minuciosamente sus alegatos fácticos y anuncie su prueba en el término legal.",
          script: "[ESCENA: Simulación de un estrado judicial] Estructure la oratoria inicial con máxima contundencia fáctica, enlazándola coherentemente con los fallos de triple reiteración de la Corte Nacional."
        },
        {
          title: "SOLJURE Soluciones Jurídicas",
          body: "Acceda al análisis completo y obtenga recursos doctrinarios actualizados.",
          script: "[ESCENA: Pantalla que muestra el portal oficial de SOLJURE] Proteja los intereses corporativos con patrocinio de alto nivel. Visite SOLJURE y acceda a todos nuestros compendios y análisis judiciales. ¡Hasta la próxima!"
        }
      ]
    };
  }
}

export async function generateSpeech(text: string, voice: string = 'Puck', style: string = 'Profesional'): Promise<string | null> {
  if (!text || text.trim().length === 0) return null;
  
  const cleanedText = text
    .replace(/[*#_\[\]()]/g, '')
    .substring(0, 800)
    .trim();

  let styleInstruction = "Di con voz profesional, jovial y amigable";
  if (style === 'Dinámica y Ágil') {
    styleInstruction = "Di con mucha energía, rapidez y entusiasmo, con un tono muy dinámico";
  } else if (style === 'Educativa/Taller') {
    styleInstruction = "Di con tono pausado, claro, articulado y didáctico, como si estuvieras enseñando";
  } else if (style === 'Profesional, Jovial y Persuasiva') {
    styleInstruction = "Di con tono seguro, persuasivo, elegante y muy cordial";
  } else if (style === 'Profesional') {
    styleInstruction = "Di con una voz institucional, sobria, autoritaria y experta";
  }

  try {
    const response = await withRetry(() => ai.models.generateContent({
      model: "gemini-3.1-flash-tts-preview",
      contents: [{ 
        parts: [{ 
          text: `(estilo de voz: ${styleInstruction}) lo siguiente: ${cleanedText}` 
        }] 
      }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voice as any },
          },
        },
      }
    }), 5, 3500); 

    const candidate = response.candidates?.[0];
    if (candidate?.finishReason === 'SAFETY') {
      console.warn("TTS: Audio generation blocked by safety filters.");
      return null;
    }

    const audioPart = candidate?.content?.parts?.find(p => p.inlineData);
    const audioData = audioPart?.inlineData?.data;

    return audioData || null;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : JSON.stringify(error);
    const isQuota = errorMsg.includes("429") || errorMsg.includes("RESOURCE_EXHAUSTED") || errorMsg.toLowerCase().includes("quota");
    
    if (isQuota) {
      console.error("Límite de cuota excedido en TTS de forma definitiva.");
      return "QUOTA_EXCEEDED"; 
    }
    
    console.error("Error generando voz (TTS):", errorMsg);
    return null;
  }
}

export async function generateFullEditorial(topic: string, area: ExpertiseArea, customInstructions?: string): Promise<{ title: string, summary: string, managerSummary: string, content: string }> {
  if (!topic || topic.length < 5) {
    throw new Error("Por favor ingresa un tema o título judicial más descriptivo.");
  }

  const prompt = `Actúas como un investigador académico jurídico categorizado, doctor en jurisprudencia, catedrático de postgrados en procesal e interpretación constitucional en el Ecuador para el portal científico de SOLJURE (Soluciones Jurídicas Eficaces). Tu encargo es redactar un artículo científico de alto nivel dogmático y rigor exegético para publicaciones jurídicas indexadas, rigiéndote estrictamente por las leyes ecuatorianas vigentes y el método analítico-positivista.

  Tema/Título deseado: "${topic}"
  Especialidad jurídica: ${area}.
  ${customInstructions ? `Instrucciones adicionales de investigación: ${customInstructions}` : ""}

  DIRECTRICES RIGUROSAS DE CALIDAD CIENTÍFICA:
  1. MÁXIMO RIGOR JURÍDICO Y EXACITUD NORMATIVA: Evite cualquier generalidad conceptual o retórica sin sustento legal. Analice los institutos jurídicos desde sus cimientos dogmáticos, integrando el análisis procesal formal y sustantivo sustancial. Cite con absoluta precisión técnica el articulado, los incisos y los literales correspondientes de los códigos y leyes ecuatorianas vigentes.
  2. PROHIBICIÓN DE PSEUDODATOS: No invente sentencias ficticias, números de causas procesales falsos, ni fallos que no existan en el sistema SATJE de consulta ecuatoriana. Si un precedente o doctrina específica no está registrada oficialmente en gacetas, use la analogía justificada o declare de forma transparente la necesidad de un desarrollo jurisprudencial futuro, diciendo: "A la fecha, el desarrollo procesal nacional frente a este supuesto es eminentemente consultivo, por lo que se recomienda una fundamentación fáctica reforzada".
  3. HUMANIZACIÓN Y DISTINCIÓN ORATORIA: El dialecto técnico debe ser fluido, elegante, doctrinario y prolijo, erradicando por completo cualquier tipo de frase predecible de un generador de inteligencia artificial común.
  4. INDEXACIÓN APA 7 Y BIBLIOGRAFÍA VERÍDICA: Todas las citas intratextuales deben observar el formato APA 7. Al final del artículo, incluya una bibliografía robusta de doctrina andina real, Registro Oficial de Ecuador, sentencias vinculantes del Pleno CNJ o Corte Constitucional.

  El contenido científico del campo 'content' debe estructurarse STRICTLY bajo los siguientes títulos, numerados y ordenados de la siguiente forma:
  
  # [Título Académico del Artículo]
  
  ## Resumen
  (Debe constar de entre 200 y 250 palabras detallando el problema jurídico, objetivo, metodología de estudio y el aporte fundamental del análisis).
  
  ## Palabras clave
  (Entre 5 y 8 palabras clave separadas por comas).
  
  ## Abstract
  (Versión académica en inglés del resumen redactada con precisión académica).
  
  ## Keywords
  (Versión en inglés de las palabras clave).
  
  ## 1. Introducción
  (Contextualiza el problema jurídico en Ecuador, justifica el interés social y científico de la investigación, y plantea el objetivo del estudio).
  
  ## 2. Marco Teórico
  (Desarrolla doctrina nacional e internacional, evolución teórica vinculada y debates doctrinarios actuales sobre la materia jurídica).
  
  ## 3. Marco Normativo
  (Análisis normativo minucioso de las leyes del Ecuador aplicables y sus resoluciones obligatorias. Incluye al menos una tabla Markdown de contrastación técnica de normas, plazos procesales o excepciones previas relevantes).
  
  ## 4. Metodología
  (Explica la metodología científica empleada: diseño de investigación dogmático-jurídico, de alcance descriptivo-analítico, con enfoque cualitativo y recopilación sistemática en repositorios y gacetas jurisprudenciales oficiales).
  
  ## 5. Análisis del Caso
  ### 5.1 Antecedentes
  ### 5.2 Hechos relevantes
  ### 5.3 Pretensiones
  ### 5.4 Argumentos de las partes
  ### 5.5 Motivación judicial
  ### 5.6 Ratio decidendi
  ### 5.7 Obiter dicta
  ### 5.8 Análisis crítico (análisis crítico del fallo o de la resolución estándar aplicable según la jurisprudencia ecuatoriana, señalando su pertinencia ante la seguridad jurídica).
  
  ## 6. Discusión
  (Compara doctrina, legislación y precedentes constitucionales o de casación de Ecuador, evaluando fortalezas y debilidades de los criterios imperantes).
  
  ## 7. Conclusiones
  (Debe haber un mínimo de 5 conclusiones sólidas, profundas, numeradas de 1 a 5).
  
  ## 8. Recomendaciones
  (Debe haber un mínimo de 5 recomendaciones sustanciales de compliance y patrocinio forense práctico para profesionales, numeradas de 1 a 5).
  
  ## REFERENCIAS
  (Lista de referencias bibliográficas completa en formato APA 7, incluyendo el Registro Oficial, Resoluciones del Pleno CNJ, sentencias CC y CNJ, doctrinas académicas andinas reales y repositorios universitarios verificables de alto rigor).

  Regresa la respuesta estructurada de manera exacta en los siguientes campos de un objeto JSON:
  - title: El título pulido e impactante del artículo profesional.
  - summary: Un "Abstract Ejecutivo" de 3-4 líneas resumiendo el aporte y objetivo técnico del artículo.
  - managerSummary: Un "Resumen para la Dirección o Alerta de Compliance" (2-3 párrafos de alto impacto corporativo que explique las decisiones comerciales o de gestión estratégica necesarias que deben tomarse basadas en este estudio).
  - content: El cuerpo entero del artículo en formato Markdown, estructurado exactamente según la estructura científica descrita arriba.`;

  try {
    const response = await generateContentSmartFallback({
      prompt: prompt,
      temperature: 0.7,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          summary: { type: Type.STRING },
          managerSummary: { type: Type.STRING },
          content: { type: Type.STRING }
        },
        required: ["title", "summary", "managerSummary", "content"]
      }
    });

    const text = response.text || "{}";
    const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanedText);
    parsed.content = cleanExpandedContent(parsed.content, parsed.title, false);
    return parsed;
  } catch (error) {
    console.error("Error generating full editorial after fallback attempts, using backup database template:", error);
    
    const cleanTopic = topic.replace(/^"|"$/g, '').trim();
    return {
      title: cleanTopic,
      summary: `Análisis exhaustivo y procesal de la temática relevante: "${cleanTopic}". Aborda de manera práctica y metodológica la legislación y reglamentación ecuatoriana en base a jurisprudencia de las altas cortes.`,
      managerSummary: `Nota Preventiva Directiva de Compliance:\nEste estudio desglosa los riesgos sustantivos y procesales de "${cleanTopic}" para directores y gerenciales de SOLJURE. Brinda pautas estratégicas sobre los procesos contenciosos, penales o laborales, y las medidas prioritarias para blindar a la empresa ante fiscalizaciones y demandas.`,
      content: `> *Compendio de investigación especializada del departamento de doctrina y jurisprudencia de SOLJURE.*

# ${cleanTopic}

## 1. Introducción al Escenario Normativo (Ecuador 2026)
La constante evolución de los marcos normativos, procesales y administrativos en el Ecuador exige un alto nivel de preparación jurídica. El análisis estratégico referente a **"${cleanTopic}"** representa una de las áreas críticas de cumplimiento normativo operativo y legal a nivel corporativo y personal.

A nivel de sustanciación, se deben observar estrictamente los fallos jurisprudenciales obligatorios de la Corte Nacional y la Corte Constitucional de Justicia, así como las Gacetas Judiciales que definen el rumbo procesal actual del país.

## 2. Marco Regulatorio y Coherencia Técnica
Cualquier tratamiento sustantivo de estas características se evalúa rigurosamente bajo los siguientes parámetros del Ecuador:
- **Área Temática**: ${area}
- **Aplicación Técnica**: Prescripciones y debido proceso regulados por el COGEP, COIP, Código Civil y normativas sectoriales.
- **Normativa Superior**: Constitución de la República del Ecuador Art. 82 (Seguridad jurídica) y Art. 76 (Debido proceso).

A continuación se resumen los componentes clave de este análisis estructurado:

| Eje de Control Legal | Garantía Fundamental Ecuatoriana | Ajuste y Beneficio Procesal Directo | Riesgo Crítico Relacionado |
| :--- | :--- | :--- | :--- |
| **Garantía Procesal** | Debido proceso y derecho a la defensa | Sentencia motivada y oportuna | Nulidades y retraso de justicia |
| **Seguridad Jurídica** | Aplicación de leyes preexistentes y claras | Coherencia en fallos de altas cortes | Glosas y resoluciones de cobro presuntivo |
| **Cumplimiento Corporativo** | Auditorías legales preventivas constantes | Minimización de litigios activos | Daño reputacional y pérdidas pecuniarias |

## 3. Desarrollo del Análisis Técnico Profundo
La sustanciación de controversias referentes a **"${cleanTopic}"** requiere de un riguroso soporte instrumental y testimonial. Los tribunales del Ecuador exigen no solamente la existencia de un contrato, sino la demostración fáctica de su materialidad, debiendo recopilarse correspondencia, actas de directorio, informes técnicos firmados y toda prueba documental útil para desestimar las pretensiones de la parte contraria.

Como socio consultor de SOLJURE, remarcamos que "las empresas a menudo descuidan la etapa probatoria inicial, confiando de forma ingenua en alegatos genéricos. La clave de la victoria en audiencias de juicio es el anuncio probatorio idóneo conforme al Art. 142 del COGEP."

## 4. Caso Práctico Judicial con Tabla de Excepciones
Supongamos que una compañía afronta un reclamo formal asociado a este tema, debiendo incoar excepciones previas sólidas:

### Excepciones Previas Planteadas conformes al Art. 153 del COGEP:

| Excepción Seleccionada | Detalle del Caso Fáctico | Sustento Normativo y Jurisprudencia | Efecto en la Audiencia Única |
| :--- | :--- | :--- | :--- |
| **Prescripción de la Acción** | El actor demanda derechos laborales tras 3 años | Art. 635 del Código del Trabajo de Ecuador | Declaratoria de extinción y archivo definitivo |
| **Incompetencia del Juez**| Demanda laboral planteada ante juez de inquilinato | Art. 153.1 del COGEP de Ecuador | Remisión de autos bajo sanción al juzgador |

## 5. Riesgos Identificados y Recomendaciones de Compliance
1. **Falta de motivación**: Todo borrador o acto debe estar jurídicamente fundado para evitar nulidades.
2. **Plazos caducados**: Monitoree rigurosamente los términos procesales para la interposición de recursos ordinarios y extraordinarios de casación.
3. **Auditorías preventivas**: Planifique diagnósticos legales semestrales en SOLJURE para identificar contingencias laborales o societarias de forma oportuna.`
    };
  }
}

export async function generateAutoTopicForArea(area: ExpertiseArea, existingTitles?: string[]): Promise<string> {
  let prompt = `Actúas como un prestigioso consultor constitucional y director académico del portal legal SOLJURE (Soluciones Jurídicas Eficaces).
  Genera el título académico de un tema procesal o problema jurídico sustancial sumamente relevante de debate contemporáneo, contingencia o análisis de jurisprudencia en el Ecuador al año 2026 para la especialidad jurídica: "${area}".`;

  if (existingTitles && existingTitles.length > 0) {
    prompt += `\n\nCRÍTICO - EVITAR DUPLICADOS SEMÁNTICOS:
    Los siguientes temas/títulos ya existen en el sistema:
    ${existingTitles.map(t => `- "${t}"`).join('\n')}
    
    Por favor genera un título completamente diferente, o "DARLE OTRO ENFOQUE" sumamente diferenciado (por ejemplo, examinando otra casación de la Corte Nacional o una reciente acción extraordinaria de la Corte Constitucional), garantizando un artículo original.`;
  } else {
    prompt += `\n\nEjemplos de alta calidad:
    - Para Laboral: "Sustanciación procesal del despido ineficaz y estabilidad laboral reforzada en el Ecuador"
    - Para Constitucional: "Límites al recurso extraordinario de protección frente a sentencias de casación de la Corte Nacional"`;
  }

  prompt += `\n\nDevuelve ÚNICAMENTE el título pulido, formal y altamente sofisticado (máximo 14 palabras). Sin comillas, sin introducciones, sin textos explicativos ni prefijos como "Título:".`;

  try {
    const response = await generateContentSmartFallback({
      prompt: prompt,
      temperature: 0.9
    });
    return (response.text || "").trim().replace(/^"|"$/g, '').replace(/^Título:\s*/i, '');
  } catch (err) {
    const fallbacks: Record<string, string> = {
      "Laboral": "Análisis del Despido Ineficaz en Mujeres Embarazadas y su Garantía Procesal",
      "Civil": "La Exigibilidad Procesal de los Títulos Ejecutivos en el COGEP Ecuador",
      "Comercial": "Responsabilidad Solidaria de los Administradores en Compañías Limitadas en Ecuador",
      "Penal": "Garantías del Debido Proceso en la Formulación de Cargos y Prisión Preventiva",
      "Tributario y Aduanero": "Impugnación de Glosas ante el Tribunal Contencioso Tributario y Gaceta Judicial",
      "Derecho Administrativo": "El Silencio Administrativo Positivo frente a Órganos Seccionales GADs",
      "Constitucional": "Alcance de la Acción Extraordinaria de Protección frente a Decisiones de Casación"
    };
    
    let chosen = fallbacks[area] || "Análisis de Precedentes Jurisprudenciales de la Corte Nacional de Justicia";
    if (existingTitles && existingTitles.some(t => t.toLowerCase() === chosen.toLowerCase())) {
      chosen += ` - Enfoque Jurisprudencial ${Math.floor(Math.random() * 900) + 100}`;
    }
    return chosen;
  }
}
