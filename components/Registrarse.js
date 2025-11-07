import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, KeyboardAvoidingView, Platform, Alert, StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../Config/firebase';
import { useFocusEffect } from '@react-navigation/native'; // 👈 agregado

export default function Registrarse({ navigation }) {
  const [formData, setFormData] = useState({
    nombres: '',
    apellidos: '',
    telefono: '',
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  // 👇 limpia los datos al salir de la pantalla
  useFocusEffect(
    useCallback(() => {
      return () => {
        setFormData({
          nombres: '',
          apellidos: '',
          telefono: '',
          email: '',
          password: '',
        });
        setErrors({});
        setShowPassword(false);
      };
    }, [])
  );

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validatePhone = (phone) => /^[0-9]{8}$/.test(phone.replace(/\s/g, ''));

  const validateForm = () => {
    const newErrors = {};
    if (!formData.nombres.trim()) newErrors.nombres = 'El nombre es requerido';
    if (!formData.apellidos.trim()) newErrors.apellidos = 'Los apellidos son requeridos';
    if (!formData.telefono.trim()) newErrors.telefono = 'El teléfono es requerido';
    else if (!validatePhone(formData.telefono)) newErrors.telefono = 'Debe tener exactamente 8 dígitos';
    if (!formData.email.trim()) newErrors.email = 'El correo es requerido';
    else if (!validateEmail(formData.email)) newErrors.email = 'Correo inválido';
    if (!formData.password.trim()) newErrors.password = 'La contraseña es requerida';
    else if (formData.password.length < 6)
      newErrors.password = 'Debe tener al menos 6 caracteres';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;
    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );
      const user = userCredential.user;

      await setDoc(doc(db, "usuarios", user.uid), {
        nombres: formData.nombres.trim(),
        apellidos: formData.apellidos.trim(),
        telefono: formData.telefono.trim(),
        correo: formData.email.trim(),
        rol: 'cliente',
        creadoEn: serverTimestamp(),
      });

      Alert.alert("¡Registro exitoso!", "Tu cuenta ha sido creada correctamente", [
        { text: "Continuar", onPress: () => navigation.navigate("Login") },
      ]);
    } catch (error) {
      console.log("Error al registrar:", error);
      if (error.code === "auth/email-already-in-use") {
        Alert.alert("Error", "El correo ya está registrado");
      } else {
        Alert.alert("Error", "No se pudo crear la cuenta");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const updateField = (field, value) => {
    let validatedValue = value;

    if (field === 'telefono') {
      validatedValue = value.replace(/[^0-9]/g, '').slice(0, 8);
    }
    if (field === 'nombres' || field === 'apellidos') {
      validatedValue = value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '');
    }

    setFormData({ ...formData, [field]: validatedValue });
    if (errors[field]) setErrors({ ...errors, [field]: null });
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <StatusBar barStyle="dark-content" />
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={28} color="#212121" />
        </TouchableOpacity>

        <View style={styles.formContainer}>
          <Text style={styles.title}>Bienvenido a</Text>
          <Text style={styles.brandTitle}>PetStyle</Text>

          {["nombres", "apellidos", "telefono", "email", "password"].map((field, i) => (
            <View key={i} style={styles.inputContainer}>
              <View style={[styles.inputWrapper, errors[field] && styles.inputError]}>
                <Ionicons
                  name={
                    field === "telefono"
                      ? "call-outline"
                      : field === "email"
                      ? "mail-outline"
                      : field === "password"
                      ? "lock-closed-outline"
                      : "person-outline"
                  }
                  size={20}
                  color="#9E9E9E"
                />
                <TextInput
                  style={styles.input}
                  placeholder={
                    field === "nombres"
                      ? "Nombres"
                      : field === "apellidos"
                      ? "Apellidos"
                      : field === "telefono"
                      ? "Teléfono"
                      : field === "email"
                      ? "Correo electrónico"
                      : "Contraseña"
                  }
                  placeholderTextColor="#9E9E9E"
                  value={formData[field]}
                  onChangeText={(text) => updateField(field, text)}
                  keyboardType={field === "telefono" ? "phone-pad" : "default"}
                  secureTextEntry={field === "password" && !showPassword}
                />
                {field === "password" && (
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                    <Ionicons
                      name={showPassword ? "eye-outline" : "eye-off-outline"}
                      size={20}
                      color="#9E9E9E"
                    />
                  </TouchableOpacity>
                )}
              </View>
              {errors[field] && <Text style={styles.errorText}>{errors[field]}</Text>}
            </View>
          ))}

          <TouchableOpacity
            style={styles.registerButton}
            onPress={handleRegister}
            disabled={isLoading}
          >
            <LinearGradient
              colors={["#FF6B9D", "#E91E63"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.gradientButton}
            >
              <Text style={styles.registerButtonText}>
                {isLoading ? "Registrando..." : "Registrarse"}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>¿Ya tienes una cuenta? </Text>
            <TouchableOpacity onPress={() => navigation.navigate("Login")}>
              <Text style={styles.loginLink}>Iniciar Sesión</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  scrollContent: { flexGrow: 1, padding: 24 },
  backButton: { marginBottom: 32 },
  formContainer: { backgroundColor: '#FFF', borderRadius: 24, padding: 32, elevation: 5 },
  title: { fontSize: 28, fontWeight: '700', color: '#212121', marginBottom: 4 },
  brandTitle: { fontSize: 28, fontWeight: '700', color: '#FF6B9D', fontStyle: 'italic', marginBottom: 24 },
  inputContainer: { marginBottom: 16 },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F5F5F5', borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 16, gap: 12,
  },
  inputError: { borderWidth: 1, borderColor: '#F44336' },
  input: { flex: 1, fontSize: 16, color: '#212121' },
  errorText: { color: '#F44336', fontSize: 12, marginTop: 4, marginLeft: 4 },
  registerButton: { borderRadius: 16, overflow: 'hidden', marginTop: 12 },
  gradientButton: { paddingVertical: 18, alignItems: 'center' },
  registerButtonText: { color: '#FFF', fontSize: 17, fontWeight: '600' },
  loginContainer: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
  loginText: { fontSize: 14, color: '#9E9E9E' },
  loginLink: { fontSize: 14, color: '#FF6B9D', fontWeight: '600' },
});
