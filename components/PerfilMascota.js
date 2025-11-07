import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../Config/firebase';

const PerfilMascota = ({ navigation, route }) => {
  const mode = route?.params?.mode || 'create';
  const mascotaToEdit = route?.params?.mascota;
  const userId = route?.params?.userId;

  const [formData, setFormData] = useState({
    nombre: '',
    raza: '',
    edad: '',
    peso: '',
    genero: '',
    color: '',
    observaciones: '',
    foto: '🐕',
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [usuarioId, setUsuarioId] = useState(userId || null);

  const emojis = ['🐕', '🐶', '🐩', '🐕‍🦺', '🦮', '🐈', '🐱', '🦦', '🐢', '🐰'];

  useEffect(() => {
    cargarUsuarioId();
    if (mode === 'edit' && mascotaToEdit) {
      // Convertir los números a string para mostrarlos en los inputs
      setFormData({
        nombre: mascotaToEdit.nombre || '',
        raza: mascotaToEdit.raza || '',
        edad: String(mascotaToEdit.edad || ''),
        peso: String(mascotaToEdit.peso || ''),
        genero: mascotaToEdit.genero || '',
        color: mascotaToEdit.color || '',
        observaciones: mascotaToEdit.observaciones || '',
        foto: mascotaToEdit.foto || '🐕',
      });
    }
  }, []);

  const cargarUsuarioId = async () => {
    try {
      if (!usuarioId) {
        const id = await AsyncStorage.getItem('usuario_id');
        setUsuarioId(id);
        console.log('✅ Usuario ID cargado:', id);
      }
    } catch (error) {
      console.error('❌ Error al cargar usuario_id:', error);
    }
  };

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre es requerido';
    }
    if (!formData.raza.trim()) {
      newErrors.raza = 'La raza es requerida';
    }
    if (!formData.edad || isNaN(formData.edad) || parseFloat(formData.edad) < 0) {
      newErrors.edad = 'Edad inválida';
    }
    if (!formData.peso || isNaN(formData.peso) || parseFloat(formData.peso) <= 0) {
      newErrors.peso = 'Peso inválido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleGuardar = async () => {
    if (!validateForm()) return;

    if (!usuarioId) {
      Alert.alert('Error', 'No se pudo identificar el usuario. Inicia sesión nuevamente.');
      return;
    }

    setIsLoading(true);

    try {
      if (mode === 'create') {
        // Crear nueva mascota en Firestore
        const nuevaMascota = {
          usuario_id: usuarioId,
          nombre: formData.nombre.trim(),
          raza: formData.raza.trim(),
          edad: parseFloat(formData.edad),
          peso: parseFloat(formData.peso),
          genero: formData.genero || null,
          color: (formData.color && formData.color.trim()) || null,
          observaciones: (formData.observaciones && formData.observaciones.trim()) || null,
          foto: formData.foto,
          proximaCita: null,
          created_at: serverTimestamp(),
          updated_at: serverTimestamp(),
        };

        console.log('📤 Guardando mascota en Firestore:', nuevaMascota);
        const docRef = await addDoc(collection(db, 'mascotas'), nuevaMascota);
        console.log('✅ Mascota creada con ID:', docRef.id);

        Alert.alert(
          '¡Éxito!',
          'Mascota registrada correctamente',
          [
            {
              text: 'OK',
              onPress: () => navigation.navigate('Inicio'),
            },
          ]
        );
      } else {
        // Editar mascota existente en Firestore
        const mascotaActualizada = {
          nombre: formData.nombre.trim(),
          raza: formData.raza.trim(),
          edad: parseFloat(formData.edad),
          peso: parseFloat(formData.peso),
          genero: formData.genero || null,
          color: (formData.color && formData.color.trim()) || null,
          observaciones: (formData.observaciones && formData.observaciones.trim()) || null,
          foto: formData.foto,
          updated_at: serverTimestamp(),
        };

        console.log('📤 Actualizando mascota ID:', mascotaToEdit.id);
        console.log('📤 Datos a actualizar:', mascotaActualizada);

        const docRef = doc(db, 'mascotas', mascotaToEdit.id);
        await updateDoc(docRef, mascotaActualizada);
        
        console.log('✅ Mascota actualizada exitosamente');

        Alert.alert(
          '¡Éxito!',
          'Mascota actualizada correctamente',
          [
            {
              text: 'OK',
              onPress: () => navigation.navigate('Inicio'),
            },
          ]
        );
      }
    } catch (error) {
      console.error('❌ Error al guardar mascota:', error);
      Alert.alert('Error', 'No se pudo guardar la mascota: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEliminar = () => {
    Alert.alert(
      'Eliminar Mascota',
      `¿Estás seguro que deseas eliminar a ${formData.nombre}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('🗑️ Eliminando mascota:', mascotaToEdit.id);
              await deleteDoc(doc(db, 'mascotas', mascotaToEdit.id));
              console.log('✅ Mascota eliminada exitosamente');
              
              Alert.alert(
                'Éxito', 
                'Mascota eliminada correctamente',
                [
                  {
                    text: 'OK',
                    onPress: () => navigation.navigate('Inicio'),
                  },
                ]
              );
            } catch (error) {
              console.error('❌ Error al eliminar mascota:', error);
              Alert.alert('Error', 'No se pudo eliminar la mascota: ' + error.message);
            }
          },
        },
      ]
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" />
      
      <LinearGradient
        colors={['#FF6B9D', '#E91E63']}
        style={styles.header}
      >
        <View style={styles.headerTop}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="chevron-back" size={28} color="#FFFFFF" />
          </TouchableOpacity>
          
          <Text style={styles.headerTitle}>
            {mode === 'create' ? 'Nueva Mascota' : 'Editar Mascota'}
          </Text>
          
          {mode === 'edit' ? (
            <TouchableOpacity 
              onPress={handleEliminar}
              style={styles.deleteButton}
            >
              <Ionicons name="trash-outline" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          ) : (
            <View style={styles.deleteButton} />
          )}
        </View>
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.formContainer}>
          {/* Selector de emoji */}
          <View style={styles.emojiSection}>
            <Text style={styles.label}>Foto</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {emojis.map((emoji) => (
                <TouchableOpacity
                  key={emoji}
                  style={[
                    styles.emojiButton,
                    formData.foto === emoji && styles.emojiButtonActive,
                  ]}
                  onPress={() => updateField('foto', emoji)}
                >
                  <Text style={styles.emoji}>{emoji}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Nombre */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Nombre *</Text>
            <View style={[styles.inputWrapper, errors.nombre && styles.inputError]}>
              <TextInput
                style={styles.input}
                placeholder="Ej: Luna"
                value={formData.nombre}
                onChangeText={(text) => updateField('nombre', text)}
              />
            </View>
            {errors.nombre && <Text style={styles.errorText}>{errors.nombre}</Text>}
          </View>

          {/* Raza */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Raza *</Text>
            <View style={[styles.inputWrapper, errors.raza && styles.inputError]}>
              <TextInput
                style={styles.input}
                placeholder="Ej: Golden Retriever"
                value={formData.raza}
                onChangeText={(text) => updateField('raza', text)}
              />
            </View>
            {errors.raza && <Text style={styles.errorText}>{errors.raza}</Text>}
          </View>

          {/* Edad y Peso */}
          <View style={styles.rowInputs}>
            <View style={[styles.inputContainer, { flex: 1, marginRight: 10 }]}>
              <Text style={styles.label}>Edad (años) *</Text>
              <View style={[styles.inputWrapper, errors.edad && styles.inputError]}>
                <TextInput
                  style={styles.input}
                  placeholder="Ej: 3"
                  keyboardType="numeric"
                  value={formData.edad}
                  onChangeText={(text) => updateField('edad', text)}
                />
              </View>
              {errors.edad && <Text style={styles.errorText}>{errors.edad}</Text>}
            </View>

            <View style={[styles.inputContainer, { flex: 1, marginLeft: 10 }]}>
              <Text style={styles.label}>Peso (kg) *</Text>
              <View style={[styles.inputWrapper, errors.peso && styles.inputError]}>
                <TextInput
                  style={styles.input}
                  placeholder="Ej: 28"
                  keyboardType="numeric"
                  value={formData.peso}
                  onChangeText={(text) => updateField('peso', text)}
                />
              </View>
              {errors.peso && <Text style={styles.errorText}>{errors.peso}</Text>}
            </View>
          </View>

          {/* Género */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Género</Text>
            <View style={styles.genderButtons}>
              {['Macho', 'Hembra'].map((genero) => (
                <TouchableOpacity
                  key={genero}
                  style={[
                    styles.genderButton,
                    formData.genero === genero && styles.genderButtonActive,
                  ]}
                  onPress={() => updateField('genero', genero)}
                >
                  <Text
                    style={[
                      styles.genderText,
                      formData.genero === genero && styles.genderTextActive,
                    ]}
                  >
                    {genero}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Color */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Color</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="Ej: Dorado"
                value={formData.color}
                onChangeText={(text) => updateField('color', text)}
              />
            </View>
          </View>

          {/* Observaciones */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Observaciones</Text>
            <View style={[styles.inputWrapper, styles.textArea]}>
              <TextInput
                style={[styles.input, styles.textAreaInput]}
                placeholder="Notas especiales sobre tu mascota..."
                value={formData.observaciones}
                onChangeText={(text) => updateField('observaciones', text)}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          </View>

          {/* Botón Guardar */}
          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleGuardar}
            disabled={isLoading}
          >
            <LinearGradient
              colors={['#FF6B9D', '#E91E63']}
              style={styles.saveGradient}
            >
              <Text style={styles.saveText}>
                {isLoading ? 'Guardando...' : mode === 'create' ? 'Agregar Mascota' : 'Guardar Cambios'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default PerfilMascota;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 50 : 40,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    left: 0,
    padding: 4,
    zIndex: 10,
  },
  deleteButton: {
    position: 'absolute',
    right: 0,
    padding: 4,
    zIndex: 10,
    width: 32,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  scrollContent: {
    padding: 20,
  },
  formContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  emojiSection: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 8,
  },
  emojiButton: {
    width: 60,
    height: 60,
    borderRadius: 15,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  emojiButtonActive: {
    backgroundColor: '#FFE5EE',
    borderColor: '#FF6B9D',
  },
  emoji: {
    fontSize: 32,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputWrapper: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  inputError: {
    borderColor: '#FF3B30',
    backgroundColor: '#FFF5F5',
  },
  input: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#212121',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  rowInputs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  genderButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  genderButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
  },
  genderButtonActive: {
    backgroundColor: '#FFE5EE',
    borderColor: '#FF6B9D',
  },
  genderText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#757575',
  },
  genderTextActive: {
    color: '#E91E63',
    fontWeight: '600',
  },
  textArea: {
    minHeight: 100,
  },
  textAreaInput: {
    minHeight: 100,
    paddingTop: 12,
  },
  saveButton: {
    marginTop: 24,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#E91E63',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  saveGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
});