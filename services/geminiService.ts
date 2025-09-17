import { GoogleGenAI, Modality } from "@google/genai";
import type { UploadedImage } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateImages = async (
  images: UploadedImage[],
  characterDescription: string,
  backgroundSetting: string,
  removeBackground: boolean
): Promise<string[]> => {
  try {
    if (images.length === 0) {
      throw new Error("At least one image must be provided.");
    }
    const model = 'gemini-2.5-flash-image-preview';

    let prompt = `Based on the provided image(s), create a new artistic version of the character.
    Character Description: ${characterDescription || 'As in the original image(s).'}
    Background / Setting: ${backgroundSetting || 'As in the original image(s).'}`;

    if (removeBackground) {
      prompt += "\nThe final image must have a transparent background. Do not add any other background elements.";
    }

    const imageParts = images.map(image => ({
      inlineData: {
        data: image.base64,
        mimeType: image.mimeType,
      },
    }));

    const textPart = {
      text: prompt,
    };
    
    // Create an array of 4 promises to generate images in parallel
    const generationPromises = Array(4).fill(0).map(() => 
      ai.models.generateContent({
        model: model,
        contents: {
          parts: [...imageParts, textPart],
        },
        config: {
          responseModalities: [Modality.IMAGE, Modality.TEXT],
        },
      })
    );

    const responses = await Promise.all(generationPromises);

    const generatedImages = responses.map(response => {
      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          return part.inlineData.data;
        }
      }
      throw new Error("One of the generated images was empty. The model may have refused the prompt.");
    });

    return generatedImages;

  } catch (error) {
    console.error("Error generating images:", error);
    if (error instanceof Error) {
        throw new Error(`Failed to generate images: ${error.message}`);
    }
    throw new Error("An unknown error occurred while generating the images.");
  }
};