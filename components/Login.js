import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../Config/firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { registerForPushNotificationsAsync } from '../utils/notificationService';
import { useFocusEffect } from '@react-navigation/native'; // 👈 agregado

export default function Login({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  // 👇 limpiar los campos cuando se sale de la pantalla
  useFocusEffect(
    useCallback(() => {
      return () => {
        setEmail('');
        setPassword('');
        setErrors({});
        setShowPassword(false);
      };
    }, [])
  );

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = () => {
    const newErrors = {};

    if (!email.trim()) {
      newErrors.email = 'El correo es requerido';
    } else if (!validateEmail(email)) {
      newErrors.email = 'Ingresa un correo válido';
    }

    if (!password) {
      newErrors.password = 'La contraseña es requerida';
    } else if (password.length < 6) {
      newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (validateForm()) {
      setIsLoading(true);
      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        const userDocRef = doc(db, 'usuarios', user.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const userData = userDoc.data();
          const userRol = userData.rol;

          await AsyncStorage.setItem('usuario_id', user.uid);
          await AsyncStorage.setItem('user_email', user.email);
          await AsyncStorage.setItem('user_rol', userRol);
          await AsyncStorage.setItem('user_data', JSON.stringify({
            uid: user.uid,
            email: user.email,
            ...userData
          }));

          console.log('✅ Usuario guardado en AsyncStorage:', user.uid);

          try {
            const pushToken = await registerForPushNotificationsAsync();
            if (pushToken) {
              await setDoc(doc(db, 'usuarios', user.uid), {
                pushToken: pushToken,
                tokenUpdatedAt: new Date()
              }, { merge: true });
              
              console.log('✅ Token de notificaciones registrado:', pushToken);
            }
          } catch (error) {
            console.log('⚠️ No se pudo registrar el token de notificaciones:', error);
          }

          const rolMessage = userRol === 'personal' 
            ? '¡Bienvenido al equipo!' 
            : '¡Bienvenido!';

          Alert.alert(
            rolMessage,
            `Inicio de sesión exitoso como ${userRol === 'personal' ? 'Personal' : 'Cliente'}`,
            [
              {
                text: 'OK',
                onPress: () => {
                  if (userRol === 'personal') {
                    navigation.navigate('MenuPersonal');
                  } else {
                    navigation.navigate('Inicio');
                  }
                },
              },
            ]
          );
        } else {
          Alert.alert('Error', 'No se encontraron datos del usuario.');
        }
      } catch (error) {
        console.error('Error al iniciar sesión:', error);
        if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
          Alert.alert('Error', 'Correo o contraseña incorrectos.');
        } else if (error.code === 'auth/too-many-requests') {
          Alert.alert('Error', 'Demasiados intentos. Intenta más tarde.');
        } else {
          Alert.alert('Error', 'No se pudo iniciar sesión. Intenta de nuevo.');
        }
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={stylesLogin.container}
    >
      <StatusBar barStyle="dark-content" />
      <ScrollView
        contentContainerStyle={stylesLogin.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableOpacity
          style={stylesLogin.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={28} color="#212121" />
        </TouchableOpacity>

        <View style={stylesLogin.formContainer}>
          <View style={stylesLogin.titleContainer}>
            <Text style={stylesLogin.title}>Bienvenido a</Text>
            <Text style={stylesLogin.brandTitle}>PetStyle</Text>
          </View>

          {/* Email Input */}
          <View style={stylesLogin.inputContainer}>
            <View style={[stylesLogin.inputWrapper, errors.email && stylesLogin.inputError]}>
              <Ionicons name="mail-outline" size={20} color="#9E9E9E" />
              <TextInput
                style={stylesLogin.input}
                placeholder="Correo electrónico"
                placeholderTextColor="#9E9E9E"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (errors.email) setErrors({ ...errors, email: null });
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
            {errors.email && <Text style={stylesLogin.errorText}>{errors.email}</Text>}
          </View>

          {/* Password Input */}
          <View style={stylesLogin.inputContainer}>
            <View style={[stylesLogin.inputWrapper, errors.password && stylesLogin.inputError]}>
              <Ionicons name="lock-closed-outline" size={20} color="#9E9E9E" />
              <TextInput
                style={stylesLogin.input}
                placeholder="Contraseña"
                placeholderTextColor="#9E9E9E"
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  if (errors.password) setErrors({ ...errors, password: null });
                }}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons
                  name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                  size={20}
                  color="#9E9E9E"
                />
              </TouchableOpacity>
            </View>
            {errors.password && <Text style={stylesLogin.errorText}>{errors.password}</Text>}
          </View>

          {/* Login Button */}
          <TouchableOpacity
            style={stylesLogin.loginButton}
            onPress={handleLogin}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#FF6B9D', '#E91E63']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={stylesLogin.gradientButton}
            >
              <Text style={stylesLogin.loginButtonText}>
                {isLoading ? 'Iniciando...' : 'Iniciar Sesión'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Register Link */}
          <View style={stylesLogin.registerContainer}>
            <Text style={stylesLogin.registerText}>¿No tienes una cuenta? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Registrarse')}>
              <Text style={stylesLogin.registerLink}>Crear Cuenta</Text>
            </TouchableOpacity>
          </View>

          {/* Footer Links */}
          <View style={stylesLogin.footerLinks}>
            <TouchableOpacity style={stylesLogin.footerButton}>
              <Text style={stylesLogin.footerText}>
                <Text style={stylesLogin.footerBold}>Políticas</Text>{'\n'}de privacidad
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={stylesLogin.footerButton}>
              <Text style={stylesLogin.footerText}>
                <Text style={stylesLogin.footerBold}>Términos</Text>{'\n'}y condiciones
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const stylesLogin = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  scrollContent: { flexGrow: 1, padding: 24 },
  backButton: { marginBottom: 32 },
  formContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 5,
  },
  titleContainer: { alignItems: 'center', marginBottom: 40 },
  title: { fontSize: 28, fontWeight: '700', color: '#212121', marginBottom: 8 },
  brandTitle: { fontSize: 28, fontWeight: '700', color: '#FF6B9D', fontStyle: 'italic' },
  inputContainer: { marginBottom: 20 },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  inputError: { borderWidth: 1, borderColor: '#F44336' },
  input: { flex: 1, fontSize: 16, color: '#212121' },
  errorText: { color: '#F44336', fontSize: 12, marginTop: 6, marginLeft: 4 },
  loginButton: {
    marginTop: 12,
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#E91E63',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 5,
  },
  gradientButton: { paddingVertical: 18, alignItems: 'center' },
  loginButtonText: { color: '#FFFFFF', fontSize: 17, fontWeight: '600' },
  registerContainer: { flexDirection: 'row', justifyContent: 'center', marginBottom: 24 },
  registerText: { fontSize: 14, color: '#9E9E9E' },
  registerLink: { fontSize: 14, color: '#FF6B9D', fontWeight: '600' },
  footerLinks: { flexDirection: 'row', justifyContent: 'space-around', gap: 8, borderTopWidth: 1, borderTopColor: '#F5F5F5', paddingTop: 24 },
  footerButton: { backgroundColor: '#F5F5F5', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12, flex: 1 },
  footerText: { fontSize: 12, color: '#212121', textAlign: 'center' },
  footerBold: { fontWeight: '700' },
});
