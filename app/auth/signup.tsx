import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { supabase } from '../../src/api/supabaseClient';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import Button from '../../src/components/Button';
import Input from '../../src/components/Input';
import Card from '../../src/components/Card';

type UserRole = 'patient' | 'doctor';

interface BaseFormData {
  email: string;
  password: string;
  confirmPassword: string;
  fullName: string;
  phone: string;
}

interface PatientFormData extends BaseFormData {}

interface DoctorFormData extends BaseFormData {
  specialties: string[];
  bio: string;
  licenseNumber: string;
  yearsExperience: number;
}

// Validation schemas
const baseSchema = yup.object({
  email: yup.string().email('Invalid email').required('Email is required'),
  password: yup
    .string()
    .min(8, 'Password must be at least 8 characters')
    .required('Password is required'),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('password')], 'Passwords must match')
    .required('Confirm password is required'),
  fullName: yup.string().required('Full name is required'),
  phone: yup.string().required('Phone number is required'),
});

const patientSchema = baseSchema;

const doctorSchema = baseSchema.shape({
  specialties: yup
    .array()
    .of(yup.string())
    .min(1, 'Please select at least one specialty')
    .required('Specialties are required'),
  bio: yup.string().required('Bio is required'),
  licenseNumber: yup.string().required('License number is required'),
  yearsExperience: yup
    .number()
    .min(0, 'Years of experience must be 0 or more')
    .required('Years of experience is required'),
});

const SPECIALTIES = [
  'General Practice',
  'Internal Medicine',
  'Pediatrics',
  'Cardiology',
  'Dermatology',
  'Orthopedics',
  'Neurology',
  'Psychiatry',
  'Gynecology',
  'Ophthalmology',
  'ENT',
  'Emergency Medicine',
  'Radiology',
  'Anesthesiology',
  'Surgery',
  'Oncology',
  'Endocrinology',
  'Gastroenterology',
  'Pulmonology',
  'Urology',
];

export default function SignupScreen() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<any>({
    resolver: yupResolver(selectedRole === 'doctor' ? doctorSchema : patientSchema),
  });

  const selectedSpecialties = watch('specialties') || [];

  const handleRoleSelection = (role: UserRole) => {
    setSelectedRole(role);
    // Reset form when role changes
    setValue('specialties', []);
  };

  const toggleSpecialty = (specialty: string) => {
    const current = selectedSpecialties;
    const updated = current.includes(specialty)
      ? current.filter((s: string) => s !== specialty)
      : [...current, specialty];
    setValue('specialties', updated);
  };

  const onSubmit = async (data: PatientFormData | DoctorFormData) => {
    setIsLoading(true);
    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            role: selectedRole,
            full_name: data.fullName,
          },
        },
      });

      if (authError) {
        Alert.alert('Error', authError.message);
        return;
      }

      if (!authData.user) {
        Alert.alert('Error', 'Failed to create user');
        return;
      }

      // Create profile
      const { error: profileError } = await supabase.from('profiles').insert({
        id: authData.user.id,
        full_name: data.fullName,
        phone: data.phone,
        role: selectedRole,
      });

      if (profileError) {
        Alert.alert('Error', profileError.message);
        return;
      }

      // If doctor, create doctor record
      if (selectedRole === 'doctor') {
        const doctorData = data as DoctorFormData;
        const { error: doctorError } = await supabase.from('doctors').insert({
          id: authData.user.id,
          specialties: doctorData.specialties,
          bio: doctorData.bio,
          license_number: doctorData.licenseNumber,
          years_experience: doctorData.yearsExperience,
          verification_status: 'pending',
        });

        if (doctorError) {
          Alert.alert('Error', doctorError.message);
          return;
        }
      }

      Alert.alert(
        'Success',
        selectedRole === 'doctor'
          ? 'Account created! Your verification is pending. You will be notified once approved.'
          : 'Account created successfully!',
        [
          {
            text: 'OK',
            onPress: () => router.replace('/auth/login'),
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  if (!selectedRole) {
    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Join Medical+</Text>
            <Text style={styles.subtitle}>
              Choose your account type to get started
            </Text>
          </View>

          <View style={styles.roleContainer}>
            <Card style={styles.roleCard}>
              <View style={styles.roleHeader}>
                <Text style={styles.roleIcon}>👤</Text>
                <Text style={styles.roleTitle}>Patient</Text>
              </View>
              <Text style={styles.roleDescription}>
                Book appointments with verified doctors, manage your health records,
                and access quality healthcare services.
              </Text>
              <Button
                title="Sign up as Patient"
                onPress={() => handleRoleSelection('patient')}
                style={styles.roleButton}
              />
            </Card>

            <Card style={styles.roleCard}>
              <View style={styles.roleHeader}>
                <Text style={styles.roleIcon}>👨‍⚕️</Text>
                <Text style={styles.roleTitle}>Doctor</Text>
              </View>
              <Text style={styles.roleDescription}>
                Join our network of healthcare professionals, manage your practice,
                and provide quality care to patients.
              </Text>
              <Button
                title="Sign up as Doctor"
                onPress={() => handleRoleSelection('doctor')}
                variant="outline"
                style={styles.roleButton}
              />
            </Card>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Already have an account?{' '}
              <Text
                style={styles.linkText}
                onPress={() => router.push('/auth/login')}
              >
                Sign in
              </Text>
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>
            {selectedRole === 'doctor' ? 'Doctor Registration' : 'Patient Registration'}
          </Text>
          <Text style={styles.subtitle}>
            {selectedRole === 'doctor'
              ? 'Join our network of healthcare professionals'
              : 'Create your patient account'}
          </Text>
        </View>

        <Card style={styles.formCard}>
          <Controller
            control={control}
            name="fullName"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Full Name"
                placeholder="Enter your full name"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={(errors.fullName as any)?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Email"
                placeholder="Enter your email"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                keyboardType="email-address"
                autoCapitalize="none"
                error={(errors.email as any)?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="phone"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Phone Number"
                placeholder="Enter your phone number"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                keyboardType="phone-pad"
                error={(errors.phone as any)?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Password"
                placeholder="Create a password"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                secureTextEntry
                error={(errors.password as any)?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="confirmPassword"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Confirm Password"
                placeholder="Confirm your password"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                secureTextEntry
                error={(errors.confirmPassword as any)?.message}
              />
            )}
          />

          {selectedRole === 'doctor' && (
            <>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Medical Information</Text>
              </View>

              <View style={styles.specialtiesContainer}>
                <Text style={styles.label}>Specialties *</Text>
                <Text style={styles.specialtiesSubtext}>
                  Select all that apply
                </Text>
                <View style={styles.specialtiesGrid}>
                  {SPECIALTIES.map((specialty) => (
                    <Button
                      key={specialty}
                      title={specialty}
                      onPress={() => toggleSpecialty(specialty)}
                      variant={
                        selectedSpecialties.includes(specialty)
                          ? 'primary'
                          : 'outline'
                      }
                      size="small"
                      style={styles.specialtyButton}
                    />
                  ))}
                </View>
                {errors.specialties && (
                  <Text style={styles.errorText}>
                    {(errors.specialties as any)?.message}
                  </Text>
                )}
              </View>

              <Controller
                control={control}
                name="licenseNumber"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label="Medical License Number"
                    placeholder="Enter your license number"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={(errors.licenseNumber as any)?.message}
                  />
                )}
              />

              <Controller
                control={control}
                name="yearsExperience"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label="Years of Experience"
                    placeholder="Enter years of experience"
                    value={value?.toString() || ''}
                    onChangeText={(text) => onChange(parseInt(text) || 0)}
                    onBlur={onBlur}
                    keyboardType="numeric"
                    error={(errors.yearsExperience as any)?.message}
                  />
                )}
              />

              <Controller
                control={control}
                name="bio"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label="Professional Bio"
                    placeholder="Tell us about your medical background and approach to patient care"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    multiline
                    numberOfLines={4}
                    style={styles.bioInput}
                    error={(errors.bio as any)?.message}
                  />
                )}
              />
            </>
          )}

          <View style={styles.buttonContainer}>
            <Button
              title="Back"
              onPress={() => setSelectedRole(null)}
              variant="outline"
              style={styles.backButton}
            />
            <Button
              title="Create Account"
              onPress={handleSubmit(onSubmit)}
              loading={isLoading}
              style={styles.submitButton}
            />
          </View>
        </Card>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Already have an account?{' '}
            <Text
              style={styles.linkText}
              onPress={() => router.push('/auth/login')}
            >
              Sign in
            </Text>
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 20,
  },
  title: {
    fontSize: typography.fontSize['3xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: typography.lineHeight.relaxed * typography.fontSize.base,
  },
  roleContainer: {
    gap: 16,
    marginBottom: 32,
  },
  roleCard: {
    padding: 24,
  },
  roleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  roleIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  roleTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  roleDescription: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    lineHeight: typography.lineHeight.relaxed * typography.fontSize.base,
    marginBottom: 20,
  },
  roleButton: {
    width: '100%',
  },
  formCard: {
    padding: 24,
    marginBottom: 32,
  },
  sectionHeader: {
    marginTop: 24,
    marginBottom: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
  },
  specialtiesContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.primary,
    marginBottom: 4,
  },
  specialtiesSubtext: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
    marginBottom: 12,
  },
  specialtiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  specialtyButton: {
    marginBottom: 8,
  },
  bioInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  backButton: {
    flex: 1,
  },
  submitButton: {
    flex: 2,
  },
  footer: {
    alignItems: 'center',
    marginTop: 20,
  },
  footerText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  linkText: {
    color: colors.primary,
    fontWeight: typography.fontWeight.medium,
  },
  errorText: {
    fontSize: typography.fontSize.xs,
    color: colors.error,
    marginTop: 4,
  },
});