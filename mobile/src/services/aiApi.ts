import apiClient from "./apiClient";

export interface ChatMessage {
  sender: "user" | "bot";
  text: string;
}

export const aiApi = {
  chat: async (message: string, chatHistory: ChatMessage[]) => {
    const res = await apiClient.post("/api/ai/chat", { message, chatHistory });
    return res.data;
  }
};
