import { inngest } from "./client.js";
import { logger } from "../utils/logger.js";
import Groq from "groq-sdk";
import dotenv from "dotenv";

dotenv.config();

const groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY });


function extractJSON(raw) {
  if (!raw || typeof raw !== "string") return {};

  let cleaned = raw
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();

  // Try to extract JSON {...} part even if text contains extra words
  const jsonMatch = cleaned.match(/\{[\s\S]*\}$/);
  if (jsonMatch) cleaned = jsonMatch[0];

  try {
    return JSON.parse(cleaned);
  } catch (e) {
    logger.error("JSON parse failed → returning fallback object", {
      raw,
      cleaned,
      error: e.message,
    });
    return {};
  }
}


export const processChatMessage = inngest.createFunction(
  { id: "process-chat-message" },
  { event: "therapy/session.message" },
  async ({ event, step }) => {
    try {
      const {
        message,
        history,
        memory = {
          userProfile: { emotionalState: [], riskLevel: 0, preferences: {} },
          sessionContext: { conversationThemes: [], currentTechnique: null },
        },
        goals = [],
        systemPrompt,
      } = event.data;

      logger.info("Processing chat message", { message });

      
      const analysis = await step.run("analyze-message", async () => {
        try {
          const analysisPrompt = `

            Analyze this therapy message and return ONLY a valid JSON.

            Message: ${message}
            Context: ${JSON.stringify({ memory, goals })}

            JSON format:
            {
              "emotionalState": "string",
              "themes": ["string"],
              "riskLevel": number,
              "recommendedApproach": "string",
              "progressIndicators": ["string"]
            }`;

          const ai = await groqClient.chat.completions.create({
            model: "llama3-70b-8192",
            messages: [{ role: "user", content: analysisPrompt }],
          });

          const raw = ai.choices[0]?.message?.content?.trim() || "{}";
          return extractJSON(raw);
        } catch (err) {
          logger.error("Analysis failed:", err);
          return {
            emotionalState: "neutral",
            themes: [],
            riskLevel: 0,
            recommendedApproach: "supportive",
            progressIndicators: [],
          };
        }
      });


      const updatedMemory = await step.run("update-memory", async () => {
        if (analysis.emotionalState) {
          memory.userProfile.emotionalState.push(analysis.emotionalState);
        }
        if (analysis.themes) {
          memory.sessionContext.conversationThemes.push(...analysis.themes);
        }
        if (typeof analysis.riskLevel === "number") {
          memory.userProfile.riskLevel = analysis.riskLevel;
        }
        return memory;
      });


      if (analysis.riskLevel > 4) {
        await step.run("trigger-risk-alert", async () => {
          logger.warn("High risk detected", { message, risk: analysis.riskLevel });
        });
      }


      const response = await step.run("generate-response", async () => {
        try {
          const prompt = `
${systemPrompt}

Generate a therapeutic response.

Message: ${message}
Analysis: ${JSON.stringify(analysis)}
Memory: ${JSON.stringify(updatedMemory)}
Goals: ${JSON.stringify(goals)}
`;

          const ai = await groqClient.chat.completions.create({
            model: "llama3-70b-8192",
            messages: [{ role: "user", content: prompt }],
          });

          return ai.choices[0]?.message?.content?.trim() ||
            "I'm here with you. Tell me more about how you're feeling.";
        } catch (err) {
          logger.error("Error generating response:", err);
          return "I'm here with you. Tell me more about what's on your mind.";
        }
      });

      return { response, analysis, updatedMemory };
    } catch (err) {
      logger.error("Chat processing failed:", err);
      return {
        response: "I'm here to support you.",
        analysis: {},
        updatedMemory: event.data.memory,
      };
    }
  }
);


export const analyzeTherapySession = inngest.createFunction(
  { id: "analyze-therapy-session" },
  { event: "therapy/session.created" },
  async ({ event, step }) => {
    try {
      const sessionContent = await step.run("get-session-content", async () => {
        return event.data.notes || event.data.transcript || "";
      });

      const analysis = await step.run("analyze-session", async () => {
        const sessionPrompt = `
Analyze the following therapy session:

${sessionContent}

Return JSON:
{
  "themes": ["string"],
  "emotionalState": "string",
  "areasOfConcern": ["string"],
  "recommendations": ["string"],
  "progressIndicators": ["string"]
}
`;

        const ai = await groqClient.chat.completions.create({
          model: "llama3-70b-8192",
          messages: [{ role: "user", content: sessionPrompt }],
        });

        const raw = ai.choices[0]?.message?.content?.trim() || "{}";
        return extractJSON(raw);
      });

      await step.run("store-analysis", async () => {
        logger.info("Session analysis stored.");
      });

      if (analysis.areasOfConcern?.length > 0) {
        await step.run("trigger-alert", async () => {
          logger.warn("Areas of concern detected", {
            sessionId: event.data.sessionId,
            concerns: analysis.areasOfConcern,
          });
        });
      }

      return { message: "Session analysis completed", analysis };
    } catch (err) {
      logger.error("Therapy session analysis failed:", err);
      throw err;
    }
  }
);


export const generateActivityRecommendations = inngest.createFunction(
  { id: "generate-activity-recommendations" },
  { event: "mood/updated" },
  async ({ event, step }) => {
    try {
      const userContext = await step.run("get-user-context", async () => {
        return {
          recentMoods: event.data.recentMoods,
          completedActivities: event.data.completedActivities,
          preferences: event.data.preferences,
        };
      });

      const recommendations = await step.run("generate-recs", async () => {
        const prompt = `
Generate personalized activity suggestions.

User Context: ${JSON.stringify(userContext)}

Return JSON:
{
  "activities": [
    {
      "name": "string",
      "reason": "string",
      "benefit": "string",
      "difficulty": "easy | medium | hard",
      "duration": "string"
    }
  ]
}
`;

        const ai = await groqClient.chat.completions.create({
          model: "llama3-70b-8192",
          messages: [{ role: "user", content: prompt }],
        });

        const raw = ai.choices[0]?.message?.content?.trim() || "{}";
        return extractJSON(raw);
      });

      await step.run("store-recommendations", async () => {
        logger.info("Recommendations stored.");
      });

      return { message: "Activity recommendations generated", recommendations };

    } catch (err) {
      logger.error("Recommendation generation failed:", err);
      throw err;
    }
  }
);

export const functions = [
  processChatMessage,
  analyzeTherapySession,
  generateActivityRecommendations,
];
