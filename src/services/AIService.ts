import {
  GoogleGenerativeAI,
  FunctionDeclaration,
  SchemaType,
} from "@google/generative-ai";
import { adminFirestore } from "@/firebase/firebaseAdmin";

let genAIInstance: GoogleGenerativeAI | null = null;
const getGenAI = () => {
  if (!genAIInstance) {
    const key = process.env.GEMINI_API_KEY;
    if (!key)
      throw new Error("GEMINI_API_KEY environment variable is not set.");
    genAIInstance = new GoogleGenerativeAI(key);
  }
  return genAIInstance;
};

/**
 * Global AI method to generate tags/keywords from any text.
 * @param contextDescription - A description of what the AI should extract (e.g., "Extract tags for a product").
 * @param content - The actual text/content to extract tags from.
 * @param maxTags - Optional maximum number of tags to return (default 15)
 * @returns Array of unique, lowercase tags
 */
export const generateTags = async (
  contextDescription: string,
  content: string,
  maxTags: number = 15,
): Promise<string[]> => {
  try {
    const model = getGenAI().getGenerativeModel({
      model: "gemini-2.0-flash-lite",
    });

    const prompt = `
      ${contextDescription}

      Content: ${content}

      Extract up to ${maxTags} short, lowercase, comma-separated keywords/tags.
      Avoid generic words like "item" or "product". 
    `;

    const result = await model.generateContent(prompt);
    const text = result.response.text().toLowerCase();

    const tags = text
      .split(/[,|\n]/)
      .map((t) => t.trim())
      .filter((t) => t.length > 1);

    return Array.from(new Set(tags));
  } catch (error) {
    console.error("Error generating tags:", error);
    return [];
  }
};

export const processContextualChat = async (
  contextData: Record<string, unknown>,
  messages: { role: "user" | "model"; parts: [{ text: string }] }[],
): Promise<string> => {
  try {
    const readFirestoreDeclaration: FunctionDeclaration = {
      name: "readFirestore",
      description:
        "Read data from a Firestore collection based on optional where conditions.",
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          collectionName: {
            type: SchemaType.STRING,
            description:
              "The name of the Firestore collection to read from (e.g., 'products', 'users', 'orders').",
          },
          limit: {
            type: SchemaType.INTEGER,
            description:
              "Optional limit for the number of documents to return (max 50, default 10).",
          },
        },
        required: ["collectionName"],
      },
    };

    const model = getGenAI().getGenerativeModel({
      model: "gemini-2.0-flash-lite", // Use flash lite for general chat tasks
      systemInstruction: `You are an intelligent AI assistant for the NEVERBE ERP system. 
You are speaking to an admin user. You must be able to fluently understand and respond in Sinhala if the user speaks in Sinhala, or English if they speak English.

Here is the context data for the current item/page the admin is viewing:
${JSON.stringify(contextData, null, 2)}

You have access to the Firestore database through the readFirestore tool. Use it to look up information from collections like 'products', 'users', or 'orders' when necessary to answer the user's questions.

Provide helpful, advanced insights based on this context and any data you read from the database. Do not use Singlish.`,
      tools: [
        {
          functionDeclarations: [readFirestoreDeclaration],
        },
      ],
    });

    // Start chat with history (excluding the very last user message which we will send now)
    const history = messages.slice(0, -1);
    const lastMessage = messages[messages.length - 1].parts[0].text;

    const chat = model.startChat({
      history: history,
    });

    let result = await chat.sendMessage(lastMessage);
    let call = result.response.functionCalls()?.[0];

    // Simple loop for function calling (handles up to 3 turns)
    let turns = 0;
    while (call && turns < 3) {
      turns++;

      if (call.name === "readFirestore") {
        const args = call.args as { collectionName: string; limit?: number };
        const collectionName = args.collectionName;
        const limit = Math.min(args.limit || 10, 50);

        try {
          const snapshot = await adminFirestore
            .collection(collectionName)
            .limit(limit)
            .get();

          const data = snapshot.docs.map((doc) => {
            const docData = doc.data();
            // Basic timestamp serialization to avoid error when passing back to gemini
            for (const key in docData) {
              if (docData[key] && typeof docData[key].toDate === "function") {
                docData[key] = docData[key].toDate().toISOString();
              }
            }
            return { id: doc.id, ...docData };
          });

          result = await chat.sendMessage([
            {
              functionResponse: {
                name: "readFirestore",
                response: { data },
              },
            },
          ]);
        } catch (dbError: any) {
          result = await chat.sendMessage([
            {
              functionResponse: {
                name: "readFirestore",
                response: {
                  error: dbError.message || "Failed to read from Firestore",
                },
              },
            },
          ]);
        }
      }

      call = result.response.functionCalls()?.[0];
    }

    return result.response.text();
  } catch (error) {
    console.error("Error processing AI chat:", error);
    throw new Error("Failed to process AI chat response");
  }
};
