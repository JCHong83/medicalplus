import * as Location from 'expo-location';
import Constants from 'expo-constants';
import { supabase } from "./supabase";

// 1. Define types to match your FastAPI Pydantic models
export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface AgentResponse {
  status: string;
  transcript?: string;
  metadata: {
    process_id?: string;
    is_emergency: boolean;
  };
  diagnosis: {
    detected_symptoms: string[];
    recommended_specialty: string;
  };
  response_text: string;
  audio?: string;
  doctors: Array<{
    id?: string; // Supabase ID if registered
    place_id?: string; // Google Place ID if not registered
    name: string;
    address: string;
    rating: number;
    distance: string;
    isRegistered: boolean;
    location: { lat: number; lng: number };
  }>;
}

// Dynamic IP Logic
const getAgentBaseUrl = () => {
  // If we have an override in .env, use it (highest priority)
  if (process.env.EXPO_PUBLIC_AGENT_API_URL) {
    return process.env.EXPO_PUBLIC_AGENT_API_URL;
  }

  // Fallback to dynamic IP detection
  const hostUri = Constants.expoConfig?.hostUri;
  if (!hostUri) {
    // Fallback for production or when hostUri is missing
    return "http://localhost:8000";
  }

  // hostUri looks like "192.168.1.150:8081", we want the IP part
  const ip = hostUri.split(':')[0];
  return `http://${ip}:8000`;
};


const AGENT_API_URL = getAgentBaseUrl();

// 2. The Service Class

export const aiAgentService = {

  // Standard Text Chat (Keep headers as JSON)
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
  sendVoiceCommand: async (audioUri: string, history: ChatMessage[]): Promise<AgentResponse> => {
    try {
      console.log(`[aiAgentService] Voice Targeting: ${AGENT_API_URL}/voice-command`);
      
      let { status } = await Location.requestForegroundPermissionsAsync();
      const location = status === 'granted'
        ? await Location.getCurrentPositionAsync({})
        : null;
      
      const { data: { session } } = await supabase.auth.getSession();

      const formData = new FormData();

      // Extract file info
      const uriParts = audioUri.split('.');
      const fileType = uriParts[uriParts.length - 1];
      // Corrected FormData append for React Native
      const fileToUpload = {
        uri: audioUri,
        name: `recording.${fileType}`,
        type: `audio/${fileType === 'm4a' ? 'mp4' : fileType}`,
      } as any;

      // @ts-ignore - FormData expects a specific blob-like structure on React Native
      formData.append('file', fileToUpload);

      // Add metadata as string fields (FastAPI will parse these)
      formData.append('lat', (location?.coords.latitude || 45.4642).toString());
      formData.append('lng', (location?.coords.longitude || 9.1900).toString());
      
      // Add conversation history
      formData.append('history', JSON.stringify(history));

      if (session?.user.id) {
        formData.append('user_id', session.user.id);
      }

      // Call FastAPI Voice Endpoint
      const response = await fetch(`${AGENT_API_URL}/voice-command`, {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("[aiAgentService] Server Error:", errorText);
        throw new Error('Voice processing failed on server');
      }

      return await response.json();
    } catch (error) {
      console.error("[aiAgentService] Voice Error:", error);
      throw error;
    }
  }
};