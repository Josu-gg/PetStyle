import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  StatusBar,
  SafeAreaView,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "../Config/firebase";

export default function EditarPerfil({ navigation }) {
  const [formData, setFormData] = useState({
    nombres: "",
    apellidos: "",
    telefono: "",
    correo: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    cargarPerfil();
  }, []);

  const cargarPerfil = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const docRef = doc(db, "usuarios", user.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        setFormData({
          nombres: data.nombres || "",
          apellidos: data.apellidos || "",
          telefono: data.telefono || "",
          correo: data.correo || user.email,
        });
        await AsyncStorage.setItem("perfil", JSON.stringify(data));
      } else {
        const localData = await AsyncStorage.getItem("perfil");
        if (localData) setFormData(JSON.parse(localData));
      }
    } catch (error) {
      console.error("Error al cargar perfil:", error);
    }
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.nombres.trim()) {
      newErrors.nombres = "Los nombres son requeridos";
    }
    if (!formData.apellidos.trim()) {
      newErrors.apellidos = "Los apellidos son requeridos";
    }
    if (!formData.telefono.trim()) {
      newErrors.telefono = "El teléfono es requerido";
    } else if (formData.telefono.length < 8) {
      newErrors.telefono = "El teléfono debe tener al menos 8 dígitos";
    }
    if (!formData.correo.trim()) {
      newErrors.correo = "El correo es requerido";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.correo)) {
      newErrors.correo = "Ingresa un correo válido";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleGuardar = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert("Error", "Usuario no autenticado");
        return;
      }

      const docRef = doc(db, "usuarios", user.uid);
      
      await updateDoc(docRef, {
        nombres: formData.nombres,
        apellidos: formData.apellidos,
        telefono: formData.telefono,
        correo: formData.correo,
      });

      await AsyncStorage.setItem("perfil", JSON.stringify(formData));

      Alert.alert("¡Éxito!", "Tu perfil ha sido actualizado correctamente", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      console.error("Error al actualizar perfil:", error);
      Alert.alert("Error", "No se pudo actualizar el perfil. Intenta de nuevo.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" />
      <SafeAreaView style={styles.safeAreaTop}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={28} color="#212121" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Editar Perfil</Text>
          <View style={{ width: 28 }} />
        </View>
      </SafeAreaView>

      <ScrollView 
        style={styles.container}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          {/* Icono de perfil */}
          <View style={styles.avatarContainer}>
            <LinearGradient
              colors={['#FF6B9D', '#E91E63']}
              style={styles.avatar}
            >
              <Ionicons name="person" size={40} color="#FFF" />
            </LinearGradient>
          </View>

          <Text style={styles.subtitle}>Actualiza tu información personal</Text>

          {/* Formulario */}
          <View style={styles.form}>
            {/* Nombres */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Nombres</Text>
              <View style={[styles.inputWrapper, errors.nombres && styles.inputError]}>
                <Ionicons name="person-outline" size={20} color="#9E9E9E" />
                <TextInput
                  style={styles.input}
                  value={formData.nombres}
                  onChangeText={(text) => handleChange("nombres", text)}
                  placeholder="Ingresa tus nombres"
                  placeholderTextColor="#9E9E9E"
                />
              </View>
              {errors.nombres && <Text style={styles.errorText}>{errors.nombres}</Text>}
            </View>

            {/* Apellidos */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Apellidos</Text>
              <View style={[styles.inputWrapper, errors.apellidos && styles.inputError]}>
                <Ionicons name="person-outline" size={20} color="#9E9E9E" />
                <TextInput
                  style={styles.input}
                  value={formData.apellidos}
                  onChangeText={(text) => handleChange("apellidos", text)}
                  placeholder="Ingresa tus apellidos"
                  placeholderTextColor="#9E9E9E"
                />
              </View>
              {errors.apellidos && <Text style={styles.errorText}>{errors.apellidos}</Text>}
            </View>

            {/* Teléfono */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Teléfono</Text>
              <View style={[styles.inputWrapper, errors.telefono && styles.inputError]}>
                <Ionicons name="call-outline" size={20} color="#9E9E9E" />
                <TextInput
                  style={styles.input}
                  value={formData.telefono}
                  onChangeText={(text) => handleChange("telefono", text)}
                  keyboardType="phone-pad"
                  placeholder="Ej: 71234567"
                  placeholderTextColor="#9E9E9E"
                  maxLength={15}
                />
              </View>
              {errors.telefono && <Text style={styles.errorText}>{errors.telefono}</Text>}
            </View>

            {/* Correo */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Correo electrónico</Text>
              <View style={[styles.inputWrapper, errors.correo && styles.inputError]}>
                <Ionicons name="mail-outline" size={20} color="#9E9E9E" />
                <TextInput
                  style={styles.input}
                  value={formData.correo}
                  onChangeText={(text) => handleChange("correo", text)}
                  keyboardType="email-address"
                  placeholder="correo@ejemplo.com"
                  placeholderTextColor="#9E9E9E"
                  autoCapitalize="none"
                />
              </View>
              {errors.correo && <Text style={styles.errorText}>{errors.correo}</Text>}
            </View>

            {/* Botón Guardar */}
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleGuardar}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#FF6B9D', '#E91E63']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.gradientButton}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={24} color="#FFF" />
                    <Text style={styles.saveText}>Guardar Cambios</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  safeAreaTop: {
    backgroundColor: '#FFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#212121',
  },
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  content: {
    padding: 24,
    paddingTop: 40,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#E91E63',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  subtitle: {
    fontSize: 14,
    color: '#757575',
    textAlign: 'center',
    marginBottom: 32,
  },
  form: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  inputError: {
    borderWidth: 1,
    borderColor: '#F44336',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#212121',
  },
  errorText: {
    color: '#F44336',
    fontSize: 12,
    marginTop: 6,
    marginLeft: 4,
  },
  saveButton: {
    marginTop: 24,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#E91E63',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 5,
  },
  gradientButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  saveText: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: '600',
  },
});