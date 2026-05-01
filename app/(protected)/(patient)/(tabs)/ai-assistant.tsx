import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native'; // Added for re-entry logic
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
import { aiAgentService, ChatMessage } from "../../../../src/api/aiAgent";
import { supabase } from '@/api/supabase';

const { width } = Dimensions.get('window');
type AssistantState = 'ready' | 'listening' | 'thinking' | 'replying';

export default function AiAssistantScreen() {
  const router = useRouter();
  const [status, setStatus] = useState<AssistantState>('ready');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  
  // Use a ref for sound to ensure we can always stop it immediately
  const soundRef = useRef<Audio.Sound | null>(null);

  const glowValue = useSharedValue(0);
  const orbScale = useSharedValue(1);
  const { startRecording, stopRecording } = useVoiceHandler();

  // Fix Issue #4 & #5: Re-trigger greeting and reset state on focus
  useFocusEffect(
    useCallback(() => {
      let isMounted = true;
      
      // Reset logic
      setChatHistory([]);
      setStatus('ready');

      const triggerGreeting = async () => {
        // Wait for screen transition to finish
        await new Promise(resolve => setTimeout(resolve, 800));
        const { data: { session } } = await supabase.auth.getSession();

        if (isMounted && session) {
          setStatus('thinking');
          try {
            // Sending empty history to main.py greeting logic
            const response = await aiAgentService.sendVoiceCommand("", []);
            if (response.audio && isMounted) {
              await playBase64Audio(response.audio);
            }
          } catch (e) {
            console.warn("Greeting skipped:", e);
            setStatus('ready');
          }
        }
      };

      triggerGreeting();

      return () => {
        isMounted = false;
        if (soundRef.current) {
          soundRef.current.unloadAsync();
        }
      };
    }, [])
  );

  useEffect(() => {
    glowValue.value = withRepeat(withTiming(1, { duration: 1500 }), -1, true);
  }, []);

  const playBase64Audio = async (base64Data: string) => {
    try {
      // Stop and unload existing sound
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
      }

      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: `data:audio/mp3;base64,${base64Data}` },
        { shouldPlay: true }
      );
      
      soundRef.current = newSound;
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
    // Immediate audio stop
    if (soundRef.current) {
      await soundRef.current.stopAsync();
    }
    
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

      // Update history
      if (response.transcript || response.response_text) {
        setChatHistory(prev => [
          ...prev,
          { role: 'user', content: response.transcript || "" },
          { role: 'assistant', content: response.response_text }
        ]);
      }

      // Handle audio playback
      if (response.audio) {
        await playBase64Audio(response.audio);
      }
      
      if (response?.metadata?.is_emergency) {
        Alert.alert("🚨 Emergenza", response.response_text);
        return;
      }

      // Handle results navigation
      if (response.doctors && response.doctors.length > 0) {
        // Navigation after the AI finished its "Found doctors" sentence
        setTimeout(() => {
          router.push({
            pathname: "/(protected)/(patient)/results-display",
            params: { 
              data: JSON.stringify(response.doctors),
              title: response.diagnosis?.recommended_specialty || "Specialisti"
            }
          });
        }, 2000); 
      }
    } catch (error) {
      console.error("Agent Error:", error);
      setStatus('ready');
    }
  };

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
      transform: [{ scale: status === 'listening' ? 1.5 : 1.2 }],
      shadowColor: color,
      backgroundColor: color,
      opacity: status === 'listening' ? 0.7 : 0.4,
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
          {status === 'thinking' && "Analisi..."}
          {status === 'replying' && "Assistente"}
        </Text>
        <Text style={styles.statusSubtitle}>
          {status === 'ready' && "Tieni premuto il cerchio per parlare"}
          {status === 'thinking' && "Elaborazione in corso..."}
          {status === 'replying' && "Ti rispondo..."}
        </Text>
      </View>

      <View style={styles.centerSection}>
        <Animated.View pointerEvents="none" style={[styles.glowLayer, animatedGlow]} />
        <Pressable
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          delayLongPress={0}
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