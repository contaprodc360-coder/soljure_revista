import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import "dotenv/config";

// Import backend services
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
} from "./src/services/geminiService.server.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Use JSON middleware with reasonable limits
  app.use(express.json({ limit: "50mb" }));

  // API Route to search high quality images via Unsplash search page parsing
  app.get("/api/images/search", async (req, res) => {
    const fallbackList = [
      "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=1200&h=630&q=80",
      "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&h=630&q=80",
      "https://images.unsplash.com/photo-1544377193-33dcf4d68fb5?auto=format&fit=crop&w=1200&h=630&q=80",
      "https://images.unsplash.com/photo-1606857521015-7f9fcf423740?auto=format&fit=crop&w=1200&h=630&q=80",
      "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=1200&h=630&q=80",
      "https://images.unsplash.com/photo-1505664194779-8beaceb93744?auto=format&fit=crop&w=1200&h=630&q=80",
      "https://images.unsplash.com/photo-1554224155-6b990742613b?auto=format&fit=crop&w=1200&h=630&q=80",
      "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1200&h=630&q=80",
      "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&w=1200&h=630&q=80",
      "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1200&h=630&q=80"
    ];

    try {
      const queryStr = req.query.query ? String(req.query.query) : "business";
      console.log(`Searching images on Unsplash for query: "${queryStr}"`);
      const response = await fetch(
        `https://unsplash.com/s/photos/${encodeURIComponent(queryStr)}`,
        {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
            "Accept-Language": "es-ES,es;q=0.8,en-US;q=0.5,en;q=0.3",
            "Referer": "https://unsplash.com/"
          }
        }
      );
      
      if (!response.ok) {
        throw new Error(`Unsplash responded with status ${response.status}`);
      }
      
      const html = await response.text();
      // Match photo URL patterns: https://images.unsplash.com/photo-[something]
      const regex = /https:\/\/images\.unsplash\.com\/photo-[a-zA-Z0-9_\-]+/g;
      const matches = html.match(regex) || [];
      
      // Filter clean and unique photo URLs
      const uniqueUrls = Array.from(new Set(matches))
        .filter(url => url.length > 40)
        .slice(0, 16)
        .map(url => {
          // Append high-res banner size parameters for excellent UI crop
          const baseUrl = url.split('?')[0];
          return `${baseUrl}?auto=format&fit=crop&w=1200&h=630&q=80`;
        });

      if (uniqueUrls.length > 0) {
        res.json({ results: uniqueUrls });
      } else {
        res.json({ results: fallbackList });
      }
    } catch (error: any) {
      console.error("Error searching Unsplash via public page parse:", error);
      res.json({ results: fallbackList });
    }
  });

  // API Routes MUST be mounted BEFORE Vite middleware
  app.post("/api/gemini/technical-advice", async (req, res) => {
    try {
      const { content, type } = req.body;
      const result = await getTechnicalAssistantAdvice(content, type);
      res.json({ result });
    } catch (error: any) {
      console.error("API advice error:", error);
      res.status(500).json({ error: error.message || "Error processing technical advice" });
    }
  });

  app.post("/api/gemini/expand", async (req, res) => {
    try {
      const { title, type, existingContent } = req.body;
      const result = await expandEditorialTopic(title, type, existingContent);
      res.json({ result });
    } catch (error: any) {
      console.error("API expand error:", error);
      res.status(500).json({ error: error.message || "Error expanding topic" });
    }
  });

  app.post("/api/gemini/practical-case", async (req, res) => {
    try {
      const { title, type } = req.body;
      const result = await generatePracticalCase(title, type);
      res.json({ result });
    } catch (error: any) {
      console.error("API case error:", error);
      res.status(500).json({ error: error.message || "Error generating practical case" });
    }
  });

  app.post("/api/gemini/refine", async (req, res) => {
    try {
      const { content, type } = req.body;
      const result = await refineContent(content, type);
      res.json({ result });
    } catch (error: any) {
      console.error("API refine error:", error);
      res.status(500).json({ error: error.message || "Error refining content" });
    }
  });

  app.post("/api/gemini/humanize", async (req, res) => {
    try {
      const { content, type } = req.body;
      const result = await humanizeContent(content, type);
      res.json({ result });
    } catch (error: any) {
      console.error("API humanize error:", error);
      res.status(500).json({ error: error.message || "Error humanizing content" });
    }
  });

  app.post("/api/gemini/video-script", async (req, res) => {
    try {
      const { title, content } = req.body;
      const result = await generateVideoPromoScript(title, content);
      res.json({ result });
    } catch (error: any) {
      console.error("API video script error:", error);
      res.status(500).json({ error: error.message || "Error generating script" });
    }
  });

  app.post("/api/gemini/story-slides", async (req, res) => {
    try {
      const { title, content, voiceStyle } = req.body;
      const result = await generateStorySlidesContent(title, content, voiceStyle);
      res.json(result);
    } catch (error: any) {
      console.error("API story slides error:", error);
      res.status(500).json({ error: error.message || "Error generating slides" });
    }
  });

  app.post("/api/gemini/speech", async (req, res) => {
    try {
      const { text, voice, style } = req.body;
      const audioData = await generateSpeech(text, voice, style);
      res.json({ audioData });
    } catch (error: any) {
      console.error("API speech error:", error);
      res.status(500).json({ error: error.message || "Error generating speech" });
    }
  });

  app.post("/api/gemini/generate-full-editorial", async (req, res) => {
    try {
      const { topic, area, customInstructions } = req.body;
      const result = await generateFullEditorial(topic, area, customInstructions);
      res.json(result);
    } catch (error: any) {
      console.error("API full editorial error:", error);
      res.status(500).json({ error: error.message || "Error generating full editorial" });
    }
  });

  app.post("/api/gemini/auto-topic", async (req, res) => {
    try {
      const { area, existingTitles } = req.body;
      const result = await generateAutoTopicForArea(area, existingTitles);
      res.json({ result });
    } catch (error: any) {
      console.error("API auto topic error:", error);
      res.status(500).json({ error: error.message || "Error generating auto topic" });
    }
  });

  // Serve static UI assets with Vite middleware in development, and from dist/ in production
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting server in development mode (with Vite integration)...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting server in production mode (compiled SPA distribution)...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
