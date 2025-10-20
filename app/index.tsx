import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';

export default function LandingPage() {

  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Text style={styles.logo}>Medical</Text>
        <Text style={styles.plus}>+</Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.buttonPrimary} onPress={() => router.push('/auth/login')}>
          <Text style={styles.buttonText}>Login</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.buttonSecondary} onPress={() => router.push('/auth/signup')}>
          <Text style={styles.buttonTextAlt}>Sign Up</Text>
        </TouchableOpacity>
      </View>

      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 60,
  },
  logo: {
    fontSize: 48,
    fontWeight: '600',
    color: '#0077b6',
  },
  plus: {
    fontSize: 56,
    fontWeight: '700',
    color: '#03045e',
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
  },
  buttonPrimary: {
    backgroundColor: '#0077b6',
    paddingVertical: 14,
    width: '100%',
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  buttonSecondary: {
    borderWidth: 1,
    borderColor: '#0077b6',
    paddingVertical: 14,
    width: '100%',
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonTextAlt: {
    color: '#0077b6',
    fontSize: 16,
    fontWeight: '600',
  },
});
