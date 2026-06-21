import { ExpertiseArea } from "../types";

// Helper function to handle fetch calls to backend API
async function apiRequest<T>(endpoint: string, body: object): Promise<T> {
  const response = await fetch(`/api/gemini/${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}

export async function getTechnicalAssistantAdvice(content: string, type: ExpertiseArea): Promise<string> {
  try {
    const data = await apiRequest<{ result: string }>("technical-advice", { content, type });
    return data.result;
  } catch (error) {
    console.error("advice client error:", error);
    return "Error al conectar con el Asistente Técnico en el servidor.";
  }
}

export async function expandEditorialTopic(title: string, type: ExpertiseArea, existingContent?: string): Promise<string> {
  try {
    const data = await apiRequest<{ result: string }>("expand", { title, type, existingContent });
    return data.result;
  } catch (error) {
    console.error("expand client error:", error);
    return "Error al intentar expandir el tema.";
  }
}

export async function generatePracticalCase(title: string, type: ExpertiseArea): Promise<string> {
  try {
    const data = await apiRequest<{ result: string }>("practical-case", { title, type });
    return data.result;
  } catch (error) {
    console.error("case client error:", error);
    return "Error al generar el caso práctico técnico.";
  }
}

export async function refineContent(content: string, type: ExpertiseArea): Promise<string> {
  try {
    const data = await apiRequest<{ result: string }>("refine", { content, type });
    return data.result;
  } catch (error) {
    console.error("refine client error:", error);
    return "Error al refinar el contenido.";
  }
}

export async function humanizeContent(content: string, type: ExpertiseArea): Promise<string> {
  try {
    const data = await apiRequest<{ result: string }>("humanize", { content, type });
    return data.result;
  } catch (error) {
    console.error("humanize client error:", error);
    return "Error al intentar humanizar el artículo.";
  }
}

export async function generateVideoPromoScript(title: string, content: string): Promise<string> {
  try {
    const data = await apiRequest<{ result: string }>("video-script", { title, content });
    return data.result;
  } catch (error) {
    console.error("video script client error:", error);
    return "Error al generar el guion del video.";
  }
}

export async function generateStorySlidesContent(title: string, content: string, voiceStyle: string): Promise<{slides: {title: string, body: string, script: string}[]}> {
  try {
    return await apiRequest<{slides: {title: string, body: string, script: string}[]}>("story-slides", { title, content, voiceStyle });
  } catch (error) {
    console.error("slides client error:", error);
    return { slides: [] };
  }
}

export async function generateSpeech(text: string, voice: string = 'Puck', style: string = 'Profesional'): Promise<string | null> {
  try {
    const data = await apiRequest<{ audioData: string | null }>("speech", { text, voice, style });
    return data.audioData;
  } catch (error) {
    console.error("speech client error:", error);
    return null;
  }
}

export async function generateFullEditorial(topic: string, area: ExpertiseArea, customInstructions?: string): Promise<{ title: string, summary: string, managerSummary: string, content: string }> {
  return apiRequest<{ title: string, summary: string, managerSummary: string, content: string }>("generate-full-editorial", { topic, area, customInstructions });
}

export async function generateAutoTopicForArea(area: ExpertiseArea, existingTitles?: string[]): Promise<string> {
  try {
    const data = await apiRequest<{ result: string }>("auto-topic", { area, existingTitles });
    return data.result;
  } catch (error) {
    console.error("auto topic client error:", error);
    return "Análisis Técnico de Actualización Normativa";
  }
}
