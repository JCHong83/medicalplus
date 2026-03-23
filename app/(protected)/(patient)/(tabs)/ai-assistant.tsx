import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions, Alert } from 'react-native';
import { useRouter } from 'expo-router'; // Added for navigation
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolateColor,
  withSpring,
  runOnJS
} from 'react-native-reanimated';
import { Mic, MessageSquare } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import { useVoiceHandler } from "../../../../src/hooks/useVoiceHandler";
import { aiAgentService } from "../../../../src/api/aiAgent";

const { width } = Dimensions.get('window');

type AssistantState = 'ready' | 'listening' | 'thinking' | 'replying';

export default function AiAssistantScreen() {
  const router = useRouter(); // Initialize router
  const [status, setStatus] = useState<AssistantState>('ready');
  const glowValue = useSharedValue(0);
  const orbScale = useSharedValue(1);

  const { startRecording, stopRecording } = useVoiceHandler();

  useEffect(() => {
    glowValue.value = withRepeat(
      withTiming(1, { duration: 1500 }),
      -1,
      true
    );
  }, []);

  const animatedGlow = useAnimatedStyle(() => {
    const color = interpolateColor(
      glowValue.value,
      [0, 1],
      status === 'listening' ? ['#ef4444', '#fca5a5'] : 
      status === 'thinking' ? ['#8b5cf6', '#c4b5fd'] : 
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

  const handlePressIn = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    orbScale.value = withSpring(0.85);
    setStatus('listening');
    try {
      await startRecording();
    } catch (e) {
      console.error("Recording start failed", e);
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
      console.error("Recording stop failed", e);
      setStatus('ready');
    }
  };

  const processVoice = async (uri: string) => {
    try {
      console.log("Sending audio to AI Agent...");
      const response = await aiAgentService.sendVoiceCommand(uri);

      console.log(`AGENT RECEIVED ${response.doctors?.length || 0} DOCTORS`);
      
      if (response?.metadata?.is_emergency) {
        setStatus('replying');
        Alert.alert(
          "🚨 Emergency Warning",
          response.response_text,
          [{ text: "Dismiss", onPress: () => setStatus('ready') }]
        );
        return;
      }

      const mappedResults = (response.doctors || []).map((doc: any) => ({
        ...doc,
        id: doc.id || doc.place_id,
        isRegistered: !!doc.id,
        category: response.diagnosis?.recommended_specialty || "Specialist",
        distance: doc.distance || "Nearby"
      }));

      if (mappedResults.length > 0) {
        router.push({
          pathname: "/(protected)/(patient)/results-display",
          params: { 
            data: JSON.stringify(mappedResults),
            title: response.diagnosis?.recommended_specialty || "Specialists"
          }
        });
      } else {
        Alert.alert("No Results", "No doctors found in your immediate area.");
      }

      setStatus('ready');

    } catch (error) {
      console.error("Agent Error:", error);
      setStatus('ready');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.textContainer}>
        <Text style={styles.statusTitle}>
          {status === 'ready' && "I'm Listening"}
          {status === 'listening' && "Listening..."}
          {status === 'thinking' && "Analyzing..."}
          {status === 'replying' && "Notice"}
        </Text>
        <Text style={styles.statusSubtitle}>
          {status === 'ready' ? "Hold the orb to describe symptoms" : "Medical+ AI"}
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
          <Text style={styles.chatTriggerText}>View History</Text>
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