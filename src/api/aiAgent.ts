import * as Location from 'expo-location';

// 1. Define types to match your FastAPI Pydantic models
export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface AgentResponse {
  status: string;
  metadata: {
    process_id: string;
    is_emergency: boolean;
  };
  diagnosis: {
    detected_symptoms: string[];
    recommended_specialty: string;
  };
  response_text: string;
  doctors: Array<{
    name: string;
    address: string;
    rating: number;
    distance: string;
    location: { lat: number; lng: number };
  }>;
}

// 2. The Service Class
const AGENT_API_URL = process.env.EXPO_PUBLIC_AGENT_API_URL || "http://your-server-ip:8000";

export const aiAgentService = {
  // Captures current GPS and sends the conversation to the AI Agent
  sendChat: async (messages: ChatMessage[], userId?: string): Promise<AgentResponse> => {
    try {
      // A. Get Location Permissions & Coordinates
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Permission to access location was denied');
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      // B. Prepare Payload
      const payload = {
        messages,
        lat: location.coords.latitude,
        lng: location.coords.longitude,
        user_id: userId,
      };

      // C. Call FastAPI
      const response = await fetch(`${AGENT_API_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if(!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Agent communication failed');
      }

      return await response.json();
    } catch (error) {
      console.error("[aiAgentService] Error:", error);

      throw error;
    }
  }
};