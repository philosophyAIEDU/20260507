import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface LetterContent {
  title: string;
  body: string;
  announcements: string[];
}

export async function generateLetterContent(
  topic: string,
  schoolName: string,
  target: string,
  extraNotes: string
): Promise<LetterContent> {
  const prompt = `
    학교 가정통신문을 작성하려고 합니다. 
    다음 정보를 바탕으로 공손하고 격식 있는 어조의 가정통신문 내용을 작성해주세요.
    
    학교 이름: ${schoolName}
    대상: ${target}
    주제 및 목적: ${topic}
    추가 전달 사항: ${extraNotes}
    
    출력 형식은 반드시 다음 JSON 구조를 따라야 합니다:
    {
      "title": "제목 (예: 2024학년도 여름방학 생활 안내)",
      "body": "본문 내용 (인사말 포함, 정중한 어조)",
      "announcements": ["공지사항 1", "공지사항 2", "공지사항 3"...]
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            body: { type: Type.STRING },
            announcements: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["title", "body", "announcements"]
        }
      }
    });

    const result = JSON.parse(response.text || "{}");
    return {
      title: result.title || "",
      body: result.body || "",
      announcements: result.announcements || []
    };
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
}
