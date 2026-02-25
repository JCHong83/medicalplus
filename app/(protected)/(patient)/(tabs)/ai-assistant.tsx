import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolateColor,
  withSpring
} from 'react-native-reanimated';
import { Mic, MessageSquare } from 'lucide-react-native';

const { width } = Dimensions.get('window');

type AssistantState = 'ready' | 'listening' | 'thinking' | 'replying';

export default function AiAssistantScreen() {
  const [status, setStatus] = useState<AssistantState>('ready');
  const glowValue = useSharedValue(0);
  const orbScale = useSharedValue(1);

  // Animation Logic: Pulsing Glow
  useEffect(() => {
    glowValue.value = withRepeat(
      withTiming(1, { duration: 1500 }),
      -1, // Infinite
      true // Reverse
    );
  }, []);

  // Dynamic Glow Styles based on Status
  const animatedGlow = useAnimatedStyle(() => {
    const color = interpolateColor(
      glowValue.value,
      [0, 1],
      status === 'listening' ? ['#ef4444', '#fca5a5'] : // Red Pulse
      status === 'thinking' ? ['#8b5cf6', 'c4b5fd'] : // Purple pulse
      ['#0077b6', '#90e0ef'] // Blue pulse (Ready/Replying)
    );

    return {
      transform: [{ scale: 1 + glowValue.value * 0.2 }],
      shadowColor: color,
      backgroundColor: color,
      opacity: 0.4 + glowValue.value * 0.3,
    };
  });

  const orbStyle = useAnimatedStyle(() => ({
    transform: [{ scale: orbScale.value }]
  }));

  const handlePressIn = () => {
    orbScale.value = withSpring(0.9);
    setStatus('listening');
    // Start STT Logic here
  };

  const handlePressOut = () => {
    orbScale.value = withSpring(1);
    setStatus('thinking');
    // Call aiAgentService here
  };

  return (
    <View style={styles.container}>
      {/* STATUS TEXT */}
      <View style={styles.textContainer}>
        <Text style={styles.statusTitle}>
          {status === 'ready' ? "I'm Listening" :
          status === 'listening' ? "Go ahead..." :
          status === 'thinking' ? "Thinking..." : "Assistant"}
        </Text>
        <Text style={styles.statusSubtitle}>
          {status === 'ready' ? "Press and hold the orb to speak" : "Medical+ AI"}
        </Text>
      </View>

      {/* THE ORB & GLOW */}
      <View style={styles.centerSection}>
        <Animated.View style={[styles.glowLayer, animatedGlow]} />
        <Pressable
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
        >
          <Animated.View style={[styles.orb, orbStyle]}>
            <Mic size={40} color="white" strokeWidth={1.5} />
          </Animated.View>
        </Pressable>
      </View>

      {/* CHAT DRAWER TRIGGER */}
      <Pressable style={styles.chatTrigger}>
        <MessageSquare size={24} color="#666" />
        <Text style={styles.chatTriggerText}>View Transcript</Text>
      </Pressable>
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
  chatTrigger: { flexDirection: 'row', alignItems: 'center', padding: 15, backgroundColor: '#f5f5f5', borderRadius: 30 },
  chatTriggerText: { marginLeft: 10, color: '#666', fontWeight: '600' }
});