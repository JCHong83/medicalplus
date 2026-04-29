import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions, Alert } from 'react-native';
import { useRouter } from 'expo-router'; // Added for navigation
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolateColor,
  withSpring,
} from 'react-native-reanimated';
import { Mic, MessageSquare } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Audio } from 'expo-av';

import { useVoiceHandler } from "../../../../src/hooks/useVoiceHandler";
import { aiAgentService } from "../../../../src/api/aiAgent";


const { width } = Dimensions.get('window');

type AssistantState = 'ready' | 'listening' | 'thinking' | 'replying';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export default function AiAssistantScreen() {
  const router = useRouter(); // Initialize router
  const [status, setStatus] = useState<AssistantState>('ready');
  const [sound, setSound] = useState<Audio.Sound | null>(null); // Manages sound object
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isInitialGreeted, setIsInitialGreeted] = useState(false);

  const glowValue = useSharedValue(0);
  const orbScale = useSharedValue(1);
  const { startRecording, stopRecording } = useVoiceHandler();

  // Initial Greeting Effect
  useEffect(() => {
    const triggerGreeting = async () => {
      if (!isInitialGreeted) {
        // Add a 500ms buffer to ensure networking is stable
        await new Promise(resolve => setTimeout(resolve, 500));

        setStatus('thinking');
        try {
          // Sending an empty history triggers the 'Greeting' logic in our updated IntakeAgent
          const response = await aiAgentService.sendVoiceCommand("", []);
          if (response.audio) {
            await playBase64Audio(response.audio);
          }
          setIsInitialGreeted(true);
        } catch (e) {
          console.error("Greeting failed", e);
          setStatus('ready');
        }
      }
    };
    triggerGreeting();
  }, []);

  // Cleanup sound on unmount to prevent memory leaks
  useEffect(() => {
    return sound ? () => { sound.unloadAsync(); } : undefined;
  }, [sound]);

  useEffect(() => {
    glowValue.value = withRepeat(withTiming(1, { duration: 1500 }), -1, true);
  }, []);

  
  // Function to play Base64 Audio
  const playBase64Audio = async (base64Data: string) => {
    try {
      // If a sound is already playing, stop it
      if (sound) await sound.unloadAsync();
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: `data:audio/mp3;base64,${base64Data}` },
        { shouldPlay: true }
      );
      setSound(newSound);
      // Update UI state while speaking
      setStatus('replying');
      newSound.setOnPlaybackStatusUpdate((playbackStatus) => {
        if (playbackStatus.isLoaded && playbackStatus.didJustFinish) {
          setStatus('ready');
        }
      });
    } catch (error) {
      console.error("Playback error:", error);
      setStatus('ready');
    }
  };
  
  const handlePressIn = async () => {
    // Stop any current audio if the user starts talking
    if (sound) await sound.stopAsync();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    orbScale.value = withSpring(0.85);
    setStatus('listening');
    try {
      await startRecording();
    } catch (e) {
      setStatus('ready');
    }
  };

  const handlePressOut = async () => {
    orbScale.value = withSpring(1);
    // Move to thinking state immediately
    setStatus('thinking');
    try {
      const uri = await stopRecording();
      if (uri) {
        await processVoice(uri);
      } else {
        setStatus('ready');
      }
    } catch (e) {
      setStatus('ready');
    }
  };

  const processVoice = async (uri: string) => {
    try {
      const response = await aiAgentService.sendVoiceCommand(uri, chatHistory);

      if (response.transcript || response.response_text) {
        setChatHistory(prev => [
          ...prev,
          { role: 'user', content: response.transcript || "" },
          { role: 'assistant', content: response.response_text }
        ]);
      }

      // Handle AI Voice Response
      if (response.audio) {
        await playBase64Audio(response.audio);
      }
      
      if (response?.metadata?.is_emergency) {
        setStatus('replying');
        Alert.alert(
          "🚨 Emergency Warning",
          response.response_text,
        );
        return;
      }

      if (response.doctors && response.doctors.length > 0) {
        // We keep the data exactly as the backend sent it
        const finalResults = response.doctors; 
        
        router.push({
          pathname: "/(protected)/(patient)/results-display",
          params: { 
            data: JSON.stringify(response.doctors),
            title: response.diagnosis?.recommended_specialty || "Specialisti"
          }
        });
      }
    } catch (error) {
      console.error("Agent Error:", error);
      setStatus('ready');
    }
  };

  // Animated Styles
  const animatedGlow = useAnimatedStyle(() => {
    const color = interpolateColor(
      glowValue.value,
      [0, 1],
      status === 'listening' ? ['#ef4444', '#fca5a5'] : 
      status === 'thinking' ? ['#8b5cf6', '#c4b5fd'] : 
      status === 'replying' ? ['#10b981', '#a7f3d0'] :
      ['#0077b6', '#90e0ef'] 
    );

    return {
      transform: [{ scale: status === 'listening' ? 1.2 + glowValue.value * 0.3 : 1 + glowValue.value * 0.2 }],
      shadowColor: color,
      backgroundColor: color,
      opacity: status === 'listening' ? 0.6 : 0.4,
    };
  });

  const orbStyle = useAnimatedStyle(() => ({
    transform: [{ scale: orbScale.value }]
  }));


  return (
    <View style={styles.container}>
      <View style={styles.textContainer}>
        <Text style={styles.statusTitle}>
          {status === 'ready' && "Medical+ AI"}
          {status === 'listening' && "Ti ascolto..."}
          {status === 'thinking' && "Analisi in corso..."}
          {status === 'replying' && "Assistente"}
        </Text>
        <Text style={styles.statusSubtitle}>
          {status === 'ready' && "Tieni premuto il cerchio per parlare"}
          {status === 'thinking' && "Cerco la soluzione migliore..."}
          {status === 'replying' && "In attesa di altre informazioni"}
        </Text>
      </View>

      <View style={styles.centerSection}>
        <Animated.View
          pointerEvents="none"
          style={[styles.glowLayer, animatedGlow]}
        />
        {/* Use Pressable with delayLongPress set to 0 to make it reactive */}
        <Pressable
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          hitSlop={20}
          delayLongPress={0}
          style={({ pressed }) => [
            { opacity: 1 }
          ]}
        >
          <Animated.View style={[styles.orb, orbStyle]}>
            <Mic size={42} color="white" strokeWidth={2} />
          </Animated.View>
        </Pressable>
      </View>

      <View style={styles.footer}>
        <Pressable style={styles.chatTrigger}>
          <MessageSquare size={20} color="#666" />
          <Text style={styles.chatTriggerText}>Cronologia</Text>
        </Pressable>
      </View>
    </View>
  );
}



const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 80 },
  textContainer: { alignItems: 'center' },
  statusTitle: { fontSize: 28, fontWeight: '700', color: '#333' },
  statusSubtitle: { fontSize: 16, color: '#999', marginTop: 8 },
  centerSection: { alignItems: 'center', justifyContent: 'center' },
  orb: {
    width: width * 0.4,
    height: width * 0.4,
    borderRadius: (width * 0.4) / 2,
    backgroundColor: '#0077b6',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
  },
  glowLayer: {
    position: 'absolute',
    width: width * 0.45,
    height: width * 0.45,
    borderRadius: (width * 0.45) / 2,
    zIndex: 1,
  },
  footer: { alignItems: 'center', marginBottom: 20 },
  chatTrigger: { flexDirection: 'row', alignItems: 'center', padding: 15, backgroundColor: '#f5f5f5', borderRadius: 30 },
  chatTriggerText: { marginLeft: 10, color: '#666', fontWeight: '600' }
});