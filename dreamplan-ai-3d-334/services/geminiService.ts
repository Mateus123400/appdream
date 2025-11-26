import { GoogleGenAI, Type, Schema } from "@google/genai";
import { HouseData, WallData } from "../types";
import { v4 as uuidv4 } from 'uuid';

// Initialize Gemini Client
// IMPORTANT: API_KEY is injected by the environment.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Analyzes a 2D floor plan image and converts it into 3D coordinate data.
 */
export const analyzeFloorPlan = async (base64Image: string): Promise<HouseData> => {
  const model = "gemini-2.5-flash";

  // Define the schema for the house structure
  const houseSchema: Schema = {
    type: Type.OBJECT,
    properties: {
      walls: {
        type: Type.ARRAY,
        description: "List of walls detected in the floor plan. Assume a grid roughly from -10 to 10 on both axes.",
        items: {
          type: Type.OBJECT,
          properties: {
            startX: { type: Type.NUMBER, description: "Start X coordinate (-10 to 10)" },
            startZ: { type: Type.NUMBER, description: "Start Y coordinate on 2D plan, becomes Z in 3D (-10 to 10)" },
            endX: { type: Type.NUMBER, description: "End X coordinate (-10 to 10)" },
            endZ: { type: Type.NUMBER, description: "End Y coordinate on 2D plan, becomes Z in 3D (-10 to 10)" },
            height: { type: Type.NUMBER, description: "Height of the wall (default around 3)" },
            color: { type: Type.STRING, description: "Hex color code for the wall (e.g., #E2E8F0)" }
          },
          required: ["startX", "startZ", "endX", "endZ", "height", "color"]
        }
      },
      floorColor: { type: Type.STRING, description: "Hex color for the floor based on the image style" },
      floorMaterial: { type: Type.STRING, description: "Estimated material: wood, tile, or concrete" }
    },
    required: ["walls", "floorColor", "floorMaterial"]
  };

  const prompt = `
    Analyze this floor plan image. 
    Convert the lines representing walls into a set of 3D coordinates.
    Assume the center of the house is (0,0).
    Scale the coordinates so the house fits within a 20x20 unit area.
    Ignore text labels and furniture, focus on the structural walls.
    Return the data in JSON format matching the schema.
  `;

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [
          { inlineData: { mimeType: "image/png", data: base64Image } },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: houseSchema,
        temperature: 0.2 // Low temperature for more precise coordinate extraction
      }
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("No data returned from Gemini");

    const parsed = JSON.parse(jsonText);

    // Transform to internal HouseData type with IDs
    const walls: WallData[] = parsed.walls.map((w: any) => ({
      id: uuidv4(),
      start: { x: w.startX, z: w.startZ },
      end: { x: w.endX, z: w.endZ },
      height: w.height || 3,
      thickness: 0.2,
      color: w.color || "#cccccc",
      texture: 'smooth'
    }));

    return {
      walls,
      floor: {
        color: parsed.floorColor || "#555555",
        material: parsed.floorMaterial || "concrete"
      }
    };

  } catch (error) {
    console.error("Error analyzing floor plan:", error);
    // Return a dummy fallback if AI fails, to prevent app crash
    return {
      walls: [
        { id: '1', start: { x: -5, z: -5 }, end: { x: 5, z: -5 }, height: 3, thickness: 0.2, color: '#cccccc' },
        { id: '2', start: { x: 5, z: -5 }, end: { x: 5, z: 5 }, height: 3, thickness: 0.2, color: '#cccccc' },
        { id: '3', start: { x: 5, z: 5 }, end: { x: -5, z: 5 }, height: 3, thickness: 0.2, color: '#cccccc' },
        { id: '4', start: { x: -5, z: 5 }, end: { x: -5, z: -5 }, height: 3, thickness: 0.2, color: '#cccccc' },
      ],
      floor: { color: '#78350f', material: 'wood' }
    };
  }
};

/**
 * Modifies an element of the house based on user instructions.
 */
export const modifyElement = async (
  currentAttributes: any,
  userPrompt: string,
  type: 'WALL' | 'FLOOR'
): Promise<any> => {
  const model = "gemini-2.5-flash";

  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      color: { type: Type.STRING, description: "New hex color code" },
      texture: { type: Type.STRING, description: "New texture description (e.g., brick, wood, marble, paint)" }
    },
    required: ["color", "texture"]
  };

  const context = type === 'WALL' 
    ? `The user wants to modify a wall. Current color: ${currentAttributes.color}.` 
    : `The user wants to modify the floor. Current color: ${currentAttributes.color}, Material: ${currentAttributes.material}.`;

  const prompt = `
    ${context}
    User Instruction: "${userPrompt}"
    Based on the instruction, provide the new visual attributes (color hex and texture name).
    If the user asks for "brick", give a reddish/brownish hex.
    If the user asks for "modern white", give a near-white hex.
  `;

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema
      }
    });

    const text = response.text;
    if (!text) return currentAttributes;
    
    return JSON.parse(text);

  } catch (error) {
    console.error("Error modifying element:", error);
    return currentAttributes;
  }
};
