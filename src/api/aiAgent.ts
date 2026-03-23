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
    id?: string; // Supabase ID if registered
    place_id?: string; // Google Place ID if not registered
    name: string;
    address: string;
    rating: number;
    distance: string;
    location: { lat: number; lng: number };
  }>;
}

// React Native FormData requires this specific shape
interface ReactNativeFile {
  uri: string;
  name: string;
  type: string;
}

// 2. The Service Class
const AGENT_API_URL = process.env.EXPO_PUBLIC_AGENT_API_URL || "http://192.168.1.145:8000";

export const aiAgentService = {

  // Captures current GPS and sends the conversation to the AI Agent
  sendChat: async (messages: ChatMessage[], userId?: string): Promise<AgentResponse> => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      const location = status === 'granted'
        ? await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })
        : null;
      
      const payload = {
        messages,
        lat: location?.coords.latitude || 45.4642, // Fallback to Milano if no GPS
        lng: location?.coords.longitude || 9.1900,
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
      console.log(`[aiAgentService] Attempting to reach: ${AGENT_API_URL}/voice-command`);
      
      let { status } = await Location.requestForegroundPermissionsAsync();
      const location = status === 'granted'
        ? await Location.getCurrentPositionAsync({})
        : null;
      
      const { data: { session } } = await supabase.auth.getSession();

      const formData = new FormData();

      // Extract file info
      const uriParts = audioUri.split('.');
      const fileType = uriParts[uriParts.length - 1];
      const fileName = `recording.${fileType}`;

      // Corrected FormData append for React Native
      const fileToUpload = {
        uri: audioUri,
        name: fileName,
        type: `audio/${fileType === 'm4a' ? 'mp4' : fileType}`,
      } as any;

      // @ts-ignore - FormData expects a specific blob-like structure on React Native
      formData.append('file', fileToUpload);

      // Add metadata as string fields (FastAPI will parse these)
      if (location) {
        formData.append('lat', location.coords.latitude.toString());
        formData.append('lng', location.coords.longitude.toString());
      } else {
        formData.append('lat', "45.4642");
        formData.append('lng', "9.1900");
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
        const errorText = await response.text();
        console.error("[aiAgentService] Server Raw Error:", errorText);
        throw new Error('Voice processing failed on server');
      }

      return await response.json();
    } catch (error) {
      console.error("[aiAgentService] Voice Error:", error);
      throw error;
    }
  }
};