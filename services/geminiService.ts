
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { Persona, Message, UserProfile, CastMember, AppSettings } from "../types";

export class GeminiService {
  private getClient(apiKey?: string): GoogleGenAI {
    if (!apiKey) throw new Error("API Key is missing");
    return new GoogleGenAI({ apiKey });
  }

  private getDateTimeContext(settings: AppSettings): string {
    if (!settings.showDateTimeContext) return '';
    return `\n\nCURRENT DATE & TIME: ${new Date().toLocaleString(undefined, { dateStyle: 'full', timeStyle: 'short' })}`;
  }

  async getChatResponse(
    persona: Persona,
    userProfile: UserProfile,
    history: Message[],
    userInput: string,
    settings: AppSettings,
    attachment?: Message['attachment'],
    isScenario: boolean = false
  ): Promise<string> {
    const model = settings.model;
    const apiKey = settings.apiKey;

    if (!apiKey) {
      return "The chamber is dark... I need an API key to shine a light on my thoughts. Please set one in Settings.";
    }

    const ai = this.getClient(apiKey);

    const contents = history.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [
        { text: msg.isScenario ? `[NARRATIVE EVENT: ${msg.text}]` : msg.text },
        ...(msg.attachment?.base64 ? [{
          inlineData: { mimeType: msg.attachment.mimeType, data: msg.attachment.base64.split(',')[1] }
        }] : []),
        ...(msg.scenarioImage?.base64 ? [{
          inlineData: { mimeType: msg.scenarioImage.mimeType, data: msg.scenarioImage.base64.split(',')[1] }
        }] : [])
      ]
    }));

    contents.push({
      role: 'user',
      parts: [
        { text: isScenario ? `[NARRATIVE EVENT: ${userInput}]` : userInput },
        ...(attachment?.base64 ? [{
          inlineData: { mimeType: attachment.mimeType, data: attachment.base64.split(',')[1] }
        }] : [])
      ]
    });

    const memoriesSection = persona.memories ? `\n\nYOUR MEMORIES AND KNOWLEDGE: \n${persona.memories}` : '';
    const userContext = userProfile.isAnonymous
      ? `YOU ARE TALKING TO: A mysterious stranger (Anonymous).`
      : `YOU ARE TALKING TO: ${userProfile.name}. Description: ${userProfile.personality}. Bio: ${userProfile.bio}`;
    const dateTimeContext = this.getDateTimeContext(settings);

    const systemInstruction = `
      Role: You are ${persona.name}, the ${persona.role}.
      Personality: ${persona.personality}.
      Backstory: ${persona.bio}
      Interests: ${persona.interests.join(', ')}
      Speaking Style: ${persona.speakingStyle}.${memoriesSection}
      ${userContext}${dateTimeContext}

      DIALOGUE RULES:
      1. Stay strictly in character as ${persona.name}. Never admit you are an AI.
      2. React to [NARRATIVE EVENT] tags as if they are happening in the world around you.
      3. Keep responses warm, cozy, and brief (under 3 sentences).
    `;

    try {
      const response: GenerateContentResponse = await ai.models.generateContent({
        model,
        contents: contents as any,
        config: { systemInstruction, temperature: 0.85 },
      });
      return response.text || "...";
    } catch (error) {
      console.error("Gemini API Error:", error);
      return "The connection to the chamber is flickering... I'm still here, just lost in thought.";
    }
  }

  async getPlaygroundTurn(
    speakingPersona: Persona,
    activeRole: string,
    allCastConfigs: { name: string, role: string, sceneRole: string, personaId: string }[],
    history: Message[],
    currentScene: string,
    settings: AppSettings
  ): Promise<string> {
    const model = settings.model;
    const apiKey = settings.apiKey;

    if (!apiKey) {
      return "The theater remains silent... An API key is needed to begin the simulation.";
    }

    const ai = this.getClient(apiKey);

    // Build a rich transcript for the model to understand the social dynamics
    const transcript = history.map(msg => {
      if (msg.isScenario) return `[STAGE DIRECTION: ${msg.text}]`;
      const speaker = allCastConfigs.find(c => c.personaId === msg.personaId);
      return `${speaker?.name || 'Someone'}: "${msg.text}"`;
    }).join('\n');

    const castList = allCastConfigs.map(c => `- ${c.name} (Base Archetype: ${c.role} | Scene Specific Role: ${c.sceneRole || 'Same as archetype'})`).join('\n');
    const dateTimeContext = this.getDateTimeContext(settings);

    const systemInstruction = `
      You are writing a lines for ${speakingPersona.name} in a collective story simulation.
      
      CURRENT SCENE: ${currentScene}${dateTimeContext}
      
      YOUR CHARACTER (${speakingPersona.name}):
      Base Personality: ${speakingPersona.personality}
      Speaking Style: ${speakingPersona.speakingStyle}
      YOUR SPECIFIC ROLE IN THIS SCENE: ${activeRole || speakingPersona.role}
      
      THE ENTIRE CAST ON STAGE:
      ${castList}
      
      TRANSCRIPT SO FAR:
      ${transcript || "(Scene begins)"}
      
      OBJECTIVE:
      - Respond naturally to the current situation and the last person who spoke.
      - Stay strictly in character. Do not explain your actions.
      - DO NOT narrate for other characters or write their lines.
      - Keep it concise (1-3 sentences maximum).
      - Do not include your name (e.g., "${speakingPersona.name}:") in the output. Just output the dialogue text.
    `;

    try {
      const response: GenerateContentResponse = await ai.models.generateContent({
        model,
        contents: [{ role: 'user', parts: [{ text: "Please continue the scene as your character." }] }],
        config: { systemInstruction, temperature: 0.9 },
      });
      return response.text?.trim() || "...";
    } catch (error) {
      console.error("Gemini Playground Error:", error);
      return "Character is momentarily speechless...";
    }
  }
}

export const geminiService = new GeminiService();
