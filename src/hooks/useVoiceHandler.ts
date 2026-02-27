import { useState, useEffect } from 'react';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

export const useVoiceHandler = () => {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [audioUri, setAudioUri] = useState<string | null>(null);

  useEffect(() => {
    // Request permissions on mount
    (async () => {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        console.warn('Microphone permission not granted');
      }
      // Configure audio for both iOS and Android
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
    })();
  }, []);

  async function startRecording() {
    try {
      // Clear previous recording
      setAudioUri(null);

      // High-quality preset for better transcription
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      setRecording(recording);
      setIsRecording(true);
      console.log('Recording started');
    } catch (err) {
      console.error('Failed to start recording', err);
    }
  }

  async function stopRecording() {
    if (!recording) return;

    try {
      setIsRecording(false);
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setAudioUri(uri);
      setRecording(null);
      console.log('Recording stopped. URI:', uri);
      return uri; // Return for immediate processing
    } catch (err) {
      console.error('Failed to stop recording', err);
    }
  }

  return {
    isRecording,
    audioUri,
    startRecording,
    stopRecording,
  };
};