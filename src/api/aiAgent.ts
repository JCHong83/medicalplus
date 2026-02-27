import * as Location from 'expo-location';
import { supabase } from "./supabase";

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
  },

  // --- Voice Command Method ---
  sendVoiceCommand: async (audioUri: string): Promise<AgentResponse> => {
    try {
      // Get Location (Same as sendChat logic)
      let { status } = await Location.requestForegroundPermissionsAsync();
      const location = status === 'granted'
        ? await Location.getCurrentPositionAsync({})
        : null;
      
      // Get Auth Session (to identify the user on the backend)
      const { data: { session } } = await supabase.auth.getSession();

      // Prepare FormData
      const formData = new FormData();

      // Extract file extension and prepare file object
      const uriParts = audioUri.split('.');
      const fileType = uriParts[uriParts.length - 1];

      // @ts-ignore - FormData expects a specific blob-like structure on React Native
      formData.append('file', {
        uri: audioUri,
        name: `recording.${fileType}`,
        type: `audio/${fileType}`
      });

      // Add metadata as string fields (FastAPI will parse these)
      if (location) {
        formData.append('lat', location.coords.latitude.toString());
        formData.append('lng', location.coords.longitude.toString());
      }
      if (session?.user.id) {
        formData.append('user_id', session.user.id);
      }

      // Call FastAPI Voice Endpoint
      const response = await fetch(`${AGENT_API_URL}/voice-command`, {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json',
          // Note: Do NOT set Content-Type header manually when using FormData
          // The browser/RN adds the boundary automatically.
          'Authorization': `Bearer ${session?.access_token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Voice processing failed');
      }

      return await response.json();
    } catch (error) {
      console.error("[aiAgentService] Voice Error:", error);
      throw error;
    }
  }
};