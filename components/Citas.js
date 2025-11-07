// AgendarCita.js - CON VALIDACIÓN MEJORADA DE HORARIOS
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  SafeAreaView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { db } from '../Config/firebase';

const AgendarCita = ({ navigation }) => {
  // Estados del formulario
  const [mascotaSeleccionada, setMascotaSeleccionada] = useState(null);
  const [mascotas, setMascotas] = useState([]);
  const [serviciosSeleccionados, setServiciosSeleccionados] = useState([]);
  const [notas, setNotas] = useState('');
  const [usuarioId, setUsuarioId] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingMascotas, setLoadingMascotas] = useState(true);
  
  // Estado para el modal del selector
  const [modalVisible, setModalVisible] = useState(false);

  // Estados para DateTimePicker
  const [fecha, setFecha] = useState(new Date());
  const [hora, setHora] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  // 🆕 Estados para horarios disponibles
  const [horariosDisponibles, setHorariosDisponibles] = useState([]);
  const [loadingHorarios, setLoadingHorarios] = useState(false);
  const [mostrarHorarios, setMostrarHorarios] = useState(false);

  // Servicios disponibles
  const serviciosDisponibles = [
    { id: 'bano', nombre: 'Baño Completo', precio: 25, duracion: '45 min', icono: '🛁' },
    { id: 'corte', nombre: 'Corte de Pelo', precio: 30, duracion: '1 hora', icono: '✂️' },
    { id: 'bano_corte', nombre: 'Baño + Corte', precio: 45, duracion: '1.5 horas', icono: '💇' },
    { id: 'unas', nombre: 'Corte de Uñas', precio: 10, duracion: '20 min', icono: '💅' },
    { id: 'dental', nombre: 'Limpieza Dental', precio: 35, duracion: '45 min', icono: '🦷' },
    { id: 'spa', nombre: 'Spa Completo', precio: 65, duracion: '2 horas', icono: '✨' },
  ];

  // 🆕 Horarios base del negocio
  const horariosBase = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '14:00', '14:30', '15:00', '15:30',
    '16:00', '16:30', '17:00', '17:30', '18:00'
  ];

  // Cargar usuario_id y mascotas al montar
  useEffect(() => {
    inicializar();
  }, []);

  // 🆕 Cargar horarios disponibles cuando cambia la fecha
  useEffect(() => {
    if (fecha) {
      cargarHorariosDisponibles(convertirFechaAISO(fecha));
    }
  }, [fecha]);

  const inicializar = async () => {
    await cargarUsuarioId();
  };

  const cargarUsuarioId = async () => {
    try {
      const userId = await AsyncStorage.getItem('usuario_id');
      if (userId) {
        setUsuarioId(userId);
        console.log('✅ Usuario ID cargado:', userId);
        await cargarMascotas(userId);
      } else {
        console.log('⚠️ No hay usuario_id en AsyncStorage');
        Alert.alert('Error', 'No se pudo identificar el usuario. Inicia sesión nuevamente.');
      }
    } catch (error) {
      console.error('❌ Error al cargar usuario_id:', error);
    }
  };

  const cargarMascotas = async (userId) => {
    try {
      setLoadingMascotas(true);
      console.log('📥 Cargando mascotas para usuario:', userId);
      
      const mascotasRef = collection(db, 'mascotas');
      const q = query(mascotasRef, where('usuario_id', '==', userId));
      const querySnapshot = await getDocs(q);
      
      const mascotasData = [];
      querySnapshot.forEach((doc) => {
        mascotasData.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      setMascotas(mascotasData);
      console.log('✅ Mascotas cargadas:', mascotasData.length);
    } catch (error) {
      console.error('❌ Error al cargar mascotas:', error);
      Alert.alert('Error', 'No se pudieron cargar las mascotas: ' + error.message);
    } finally {
      setLoadingMascotas(false);
    }
  };

  // 🆕 Cargar horarios disponibles para una fecha específica
  const cargarHorariosDisponibles = async (fechaISO) => {
    try {
      setLoadingHorarios(true);
      console.log('🕐 Cargando horarios disponibles para:', fechaISO);

      const citasRef = collection(db, 'citas');
      const q = query(
        citasRef,
        where('fecha', '==', fechaISO),
        where('estado', '!=', 'cancelada')
      );

      const querySnapshot = await getDocs(q);
      const horasOcupadas = querySnapshot.docs.map(doc => doc.data().hora);

      const disponibles = horariosBase.filter(hora => !horasOcupadas.includes(hora));
      
      console.log('✅ Horarios disponibles:', disponibles.length);
      console.log('❌ Horarios ocupados:', horasOcupadas);
      
      setHorariosDisponibles(disponibles);
    } catch (error) {
      console.error('❌ Error al cargar horarios:', error);
    } finally {
      setLoadingHorarios(false);
    }
  };

  // Seleccionar mascota desde el modal
  const seleccionarMascota = (mascota) => {
    setMascotaSeleccionada(mascota);
    setModalVisible(false);
  };

  // Seleccionar/deseleccionar servicio
  const toggleServicio = (servicio) => {
    const index = serviciosSeleccionados.findIndex(s => s.id === servicio.id);
    
    if (index > -1) {
      setServiciosSeleccionados(serviciosSeleccionados.filter(s => s.id !== servicio.id));
    } else {
      setServiciosSeleccionados([...serviciosSeleccionados, servicio]);
    }
  };

  const estaSeleccionado = (servicioId) => {
    return serviciosSeleccionados.some(s => s.id === servicioId);
  };

  // Manejar cambio de fecha
  const onChangeFecha = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setFecha(selectedDate);
      // Reiniciar la hora cuando cambia la fecha
      setMostrarHorarios(false);
    }
  };

  // 🆕 Manejar selección de horario disponible
  const seleccionarHorario = (horarioStr) => {
    const [horas, minutos] = horarioStr.split(':');
    const nuevaHora = new Date();
    nuevaHora.setHours(parseInt(horas), parseInt(minutos), 0, 0);
    setHora(nuevaHora);
    setMostrarHorarios(false);
  };

  // Manejar cambio de hora (método alternativo)
  const onChangeHora = (event, selectedTime) => {
    setShowTimePicker(false);
    if (selectedTime) {
      setHora(selectedTime);
    }
  };

  // Formatear fecha para mostrar (DD/MM/YYYY)
  const formatearFechaDisplay = (date) => {
    const dia = String(date.getDate()).padStart(2, '0');
    const mes = String(date.getMonth() + 1).padStart(2, '0');
    const año = date.getFullYear();
    return `${dia}/${mes}/${año}`;
  };

  // Formatear hora para mostrar (HH:MM)
  const formatearHoraDisplay = (date) => {
    const horas = String(date.getHours()).padStart(2, '0');
    const minutos = String(date.getMinutes()).padStart(2, '0');
    return `${horas}:${minutos}`;
  };

  // Convertir fecha a formato ISO (YYYY-MM-DD)
  const convertirFechaAISO = (date) => {
    const año = date.getFullYear();
    const mes = String(date.getMonth() + 1).padStart(2, '0');
    const dia = String(date.getDate()).padStart(2, '0');
    return `${año}-${mes}-${dia}`;
  };

  // 🆕 Validar si ya existe una cita en esa fecha/hora (MEJORADA)
  const validarCitaDuplicada = async (fechaISO, horaFormateada) => {
    try {
      const citasRef = collection(db, 'citas');
      const q = query(
        citasRef,
        where('fecha', '==', fechaISO),
        where('hora', '==', horaFormateada),
        where('estado', '!=', 'cancelada')
      );

      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const citaExistente = querySnapshot.docs[0].data();
        return {
          existe: true,
          mascota: citaExistente.mascota
        };
      }
      
      return { existe: false };
    } catch (error) {
      console.error('Error al validar cita duplicada:', error);
      return { existe: false };
    }
  };

  // Validar formulario
  const validarFormulario = () => {
    if (!mascotaSeleccionada) {
      Alert.alert('Mascota requerida', 'Por favor selecciona una mascota');
      return false;
    }

    if (serviciosSeleccionados.length === 0) {
      Alert.alert('Servicios requeridos', 'Por favor selecciona al menos un servicio');
      return false;
    }
    
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const fechaSeleccionada = new Date(fecha);
    fechaSeleccionada.setHours(0, 0, 0, 0);
    
    if (fechaSeleccionada < hoy) {
      Alert.alert('Fecha inválida', 'No puedes agendar citas en fechas pasadas');
      return false;
    }

    return true;
  };

  // Calcular totales
  const calcularTotales = () => {
    const precioTotal = serviciosSeleccionados.reduce((sum, s) => sum + s.precio, 0);
    
    const duracionTotal = serviciosSeleccionados.reduce((sum, s) => {
      const duracion = s.duracion;
      let minutos = 0;
      
      if (duracion.includes('hora')) {
        const horas = parseFloat(duracion);
        minutos = horas * 60;
      } else if (duracion.includes('min')) {
        minutos = parseInt(duracion);
      }
      
      return sum + minutos;
    }, 0);

    const duracionFormateada = duracionTotal >= 60 
      ? `${Math.floor(duracionTotal / 60)}h ${duracionTotal % 60}min`
      : `${duracionTotal} min`;

    return { precioTotal, duracionFormateada };
  };

  // 🆕 Guardar cita con validación mejorada
  const guardarCita = async () => {
    if (!validarFormulario()) return;
    if (!usuarioId) {
      Alert.alert('Error', 'No se pudo identificar el usuario');
      return;
    }

    setLoading(true);
    
    try {
      const fechaISO = convertirFechaAISO(fecha);
      const horaFormateada = formatearHoraDisplay(hora);

      // 🆕 Validación mejorada con información de conflicto
      const validacion = await validarCitaDuplicada(fechaISO, horaFormateada);
      
      if (validacion.existe) {
        Alert.alert(
          '⚠️ Horario no disponible',
          `Ya existe una cita para ${validacion.mascota} en este horario.\n\n¿Deseas ver los horarios disponibles?`,
          [
            { text: 'Cancelar', style: 'cancel' },
            { 
              text: 'Ver horarios',
              onPress: () => {
                setLoading(false);
                setMostrarHorarios(true);
              }
            }
          ]
        );
        setLoading(false);
        return;
      }

      const { precioTotal, duracionFormateada } = calcularTotales();
      const nombresServicios = serviciosSeleccionados.map(s => s.nombre);
      const serviciosPrincipal = nombresServicios.join(' + ');

      const nuevaCita = {
        usuario_id: usuarioId,
        mascota: mascotaSeleccionada.nombre,
        mascota_raza: mascotaSeleccionada.raza,
        mascota_foto: mascotaSeleccionada.foto,
        mascota_edad: mascotaSeleccionada.edad,
        mascota_peso: mascotaSeleccionada.peso,
        mascota_genero: mascotaSeleccionada.genero,
        servicio: serviciosPrincipal,
        servicios: nombresServicios,
        fecha: fechaISO,
        hora: horaFormateada,
        precio: precioTotal,
        duracion: duracionFormateada,
        detalles: null,
        notas: notas.trim() || null,
        estado: 'pendiente', // 🆕 La cita inicia como pendiente hasta que el personal la acepte
        estado_confirmacion: 'pendiente', // 🆕 Nuevo campo para el flujo de confirmación
        proceso_actual: 0,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      };

      console.log('📤 Guardando cita en Firestore:', nuevaCita);

      const docRef = await addDoc(collection(db, 'citas'), nuevaCita);

      console.log('✅ Cita guardada exitosamente con ID:', docRef.id);

      Alert.alert(
        '✅ Solicitud Enviada',
        `Tu solicitud de cita para ${mascotaSeleccionada.nombre} ha sido enviada.\n\nEl personal confirmará el horario del ${formatearFechaDisplay(fecha)} a las ${horaFormateada} o te propondrá uno alternativo.`,
        [
          {
            text: 'Ver mis citas',
            onPress: () => navigation.navigate('Citas'),
          },
          {
            text: 'Agendar otra',
            onPress: () => limpiarFormulario(),
          },
        ]
      );

    } catch (error) {
      console.error('❌ Error al guardar cita:', error);
      Alert.alert('Error', 'Ocurrió un error al guardar la cita: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Limpiar formulario
  const limpiarFormulario = () => {
    setMascotaSeleccionada(null);
    setServiciosSeleccionados([]);
    setFecha(new Date());
    setHora(new Date());
    setNotas('');
    setMostrarHorarios(false);
  };

  const { precioTotal, duracionFormateada } = calcularTotales();

  if (loadingMascotas) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B9D" />
        <Text style={styles.loadingText}>Cargando mascotas...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#212121" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Agendar Cita</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Selección de Mascota */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🐾 Selecciona tu Mascota *</Text>
            
            {mascotas.length === 0 ? (
              <View style={styles.noMascotasCard}>
                <Ionicons name="paw-outline" size={48} color="#BDBDBD" />
                <Text style={styles.noMascotasText}>No tienes mascotas registradas</Text>
                <TouchableOpacity
                  style={styles.agregarMascotaButton}
                  onPress={() => navigation.navigate('PerfilMascota', { mode: 'create' })}
                >
                  <Text style={styles.agregarMascotaText}>+ Agregar Mascota</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.dropdownButton}
                onPress={() => setModalVisible(true)}
              >
                <View style={styles.dropdownContent}>
                  {mascotaSeleccionada ? (
                    <>
                      <Text style={styles.dropdownEmoji}>{mascotaSeleccionada.foto}</Text>
                      <View style={styles.dropdownTextContainer}>
                        <Text style={styles.dropdownNombre}>{mascotaSeleccionada.nombre}</Text>
                        <Text style={styles.dropdownRaza}>{mascotaSeleccionada.raza}</Text>
                      </View>
                    </>
                  ) : (
                    <Text style={styles.dropdownPlaceholder}>Selecciona una mascota</Text>
                  )}
                </View>
                <Ionicons name="chevron-down" size={24} color="#757575" />
              </TouchableOpacity>
            )}
          </View>

          {/* Modal para seleccionar mascota */}
          <Modal
            visible={modalVisible}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setModalVisible(false)}
          >
            <TouchableOpacity 
              style={styles.modalOverlay}
              activeOpacity={1}
              onPress={() => setModalVisible(false)}
            >
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Selecciona una mascota</Text>
                  <TouchableOpacity onPress={() => setModalVisible(false)}>
                    <Ionicons name="close" size={24} color="#757575" />
                  </TouchableOpacity>
                </View>
                
                <ScrollView style={styles.modalList}>
                  {mascotas.map((mascota) => (
                    <TouchableOpacity
                      key={mascota.id}
                      style={[
                        styles.modalItem,
                        mascotaSeleccionada?.id === mascota.id && styles.modalItemSelected
                      ]}
                      onPress={() => seleccionarMascota(mascota)}
                    >
                      <Text style={styles.modalItemEmoji}>{mascota.foto}</Text>
                      <View style={styles.modalItemText}>
                        <Text style={styles.modalItemNombre}>{mascota.nombre}</Text>
                        <Text style={styles.modalItemRaza}>{mascota.raza}</Text>
                      </View>
                      {mascotaSeleccionada?.id === mascota.id && (
                        <Ionicons name="checkmark-circle" size={24} color="#FF6B9D" />
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </TouchableOpacity>
          </Modal>

          {/* Selección de Servicios */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>✂️ Selecciona los Servicios *</Text>
            <Text style={styles.sectionSubtitle}>Puedes seleccionar múltiples servicios</Text>
            
            <View style={styles.serviciosGrid}>
              {serviciosDisponibles.map((servicio) => {
                const seleccionado = estaSeleccionado(servicio.id);
                
                return (
                  <TouchableOpacity
                    key={servicio.id}
                    style={[
                      styles.servicioCard,
                      seleccionado && styles.servicioCardActive
                    ]}
                    onPress={() => toggleServicio(servicio)}
                  >
                    {seleccionado && (
                      <View style={styles.servicioCheckmark}>
                        <Ionicons name="checkmark-circle" size={20} color="#FF6B9D" />
                      </View>
                    )}
                    <Text style={styles.servicioEmoji}>{servicio.icono}</Text>
                    <Text style={styles.servicioNombre}>{servicio.nombre}</Text>
                    <Text style={styles.servicioPrecio}>${servicio.precio}</Text>
                    <Text style={styles.servicioDuracion}>{servicio.duracion}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {serviciosSeleccionados.length > 0 && (
              <View style={styles.resumenCard}>
                <View style={styles.resumenRow}>
                  <Text style={styles.resumenLabel}>Servicios seleccionados:</Text>
                  <Text style={styles.resumenValor}>{serviciosSeleccionados.length}</Text>
                </View>
                <View style={styles.resumenRow}>
                  <Text style={styles.resumenLabel}>Duración estimada:</Text>
                  <Text style={styles.resumenValor}>{duracionFormateada}</Text>
                </View>
                <View style={[styles.resumenRow, styles.resumenTotal]}>
                  <Text style={styles.resumenLabelTotal}>Total:</Text>
                  <Text style={styles.resumenValorTotal}>${precioTotal}</Text>
                </View>
              </View>
            )}
          </View>

          {/* Fecha y Hora */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📅 Fecha y Hora *</Text>
            
            <Text style={styles.label}>Fecha</Text>
            <TouchableOpacity
              style={styles.dateTimeButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Ionicons name="calendar-outline" size={20} color="#FF6B9D" />
              <Text style={styles.dateTimeText}>{formatearFechaDisplay(fecha)}</Text>
            </TouchableOpacity>

            {showDatePicker && (
              <DateTimePicker
                value={fecha}
                mode="date" 
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={onChangeFecha}
                minimumDate={new Date()}
              />
            )}

            <Text style={styles.label}>Hora</Text>
            <TouchableOpacity
              style={styles.dateTimeButton}
              onPress={() => setMostrarHorarios(true)}
            >
              <Ionicons name="time-outline" size={20} color="#FF6B9D" />
              <Text style={styles.dateTimeText}>{formatearHoraDisplay(hora)}</Text>
              <Text style={styles.verDisponiblesText}>Ver disponibles</Text>
            </TouchableOpacity>

            {/* 🆕 Modal de horarios disponibles */}
            <Modal
              visible={mostrarHorarios}
              transparent={true}
              animationType="slide"
              onRequestClose={() => setMostrarHorarios(false)}
            >
              <View style={styles.horariosModalOverlay}>
                <View style={styles.horariosModalContent}>
                  <View style={styles.horariosHeader}>
                    <Text style={styles.horariosTitle}>
                      Horarios Disponibles
                    </Text>
                    <Text style={styles.horariosSubtitle}>
                      {formatearFechaDisplay(fecha)}
                    </Text>
                    <TouchableOpacity 
                      style={styles.closeHorariosButton}
                      onPress={() => setMostrarHorarios(false)}
                    >
                      <Ionicons name="close" size={28} color="#757575" />
                    </TouchableOpacity>
                  </View>

                  {loadingHorarios ? (
                    <View style={styles.loadingHorarios}>
                      <ActivityIndicator size="large" color="#FF6B9D" />
                      <Text style={styles.loadingText}>Cargando horarios...</Text>
                    </View>
                  ) : horariosDisponibles.length === 0 ? (
                    <View style={styles.noHorariosContainer}>
                      <Ionicons name="time-outline" size={64} color="#E0E0E0" />
                      <Text style={styles.noHorariosText}>
                        No hay horarios disponibles para esta fecha
                      </Text>
                      <Text style={styles.noHorariosSubtext}>
                        Intenta con otra fecha
                      </Text>
                    </View>
                  ) : (
                    <ScrollView style={styles.horariosScroll}>
                      <View style={styles.horariosGrid}>
                        {horariosDisponibles.map((horario, index) => (
                          <TouchableOpacity
                            key={index}
                            style={[
                              styles.horarioButton,
                              formatearHoraDisplay(hora) === horario && styles.horarioButtonSelected
                            ]}
                            onPress={() => seleccionarHorario(horario)}
                          >
                            <Ionicons 
                              name="time" 
                              size={20} 
                              color={formatearHoraDisplay(hora) === horario ? '#FFFFFF' : '#FF6B9D'} 
                            />
                            <Text 
                              style={[
                                styles.horarioText,
                                formatearHoraDisplay(hora) === horario && styles.horarioTextSelected
                              ]}
                            >
                              {horario}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                      <View style={styles.horarioInfo}>
                        <Ionicons name="information-circle" size={20} color="#2196F3" />
                        <Text style={styles.horarioInfoText}>
                          Los horarios mostrados están disponibles. El personal confirmará tu cita.
                        </Text>
                      </View>
                    </ScrollView>
                  )}
                </View>
              </View>
            </Modal>

            {showTimePicker && (
              <DateTimePicker
                value={hora}
                mode="time"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={onChangeHora}
                is24Hour={true}
              />
            )}
          </View>

          {/* Notas Especiales */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📝 Notas Especiales (Opcional)</Text>
            
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Ej: Mi mascota es nerviosa, tiene alergia a ciertos productos, comportamiento especial..."
              value={notas}
              onChangeText={setNotas}
              multiline
              numberOfLines={4}
              placeholderTextColor="#BDBDBD"
            />
          </View>

          {/* Botón Agendar */}
          <TouchableOpacity
            style={styles.agendarButton}
            onPress={guardarCita}
            disabled={loading || mascotas.length === 0}
          >
            <LinearGradient
              colors={loading || mascotas.length === 0 ? ['#BDBDBD', '#9E9E9E'] : ['#FF6B9D', '#E91E63']}
              style={styles.agendarGradient}
            >
              <Ionicons name="checkmark-circle" size={24} color="#FFFFFF" />
              <Text style={styles.agendarText}>
                {loading ? 'Guardando...' : 'Enviar Solicitud'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default AgendarCita;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F5F5' },
  loadingText: { marginTop: 12, fontSize: 16, color: '#9E9E9E' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, backgroundColor: '#F5F5F5' },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  headerTitle: { fontSize: 24, fontWeight: '700', color: '#212121' },
  scrollContent: { padding: 20 },
  section: { marginBottom: 32 },
  sectionTitle: { fontSize: 20, fontWeight: '700', color: '#212121', marginBottom: 8 },
  sectionSubtitle: { fontSize: 13, color: '#757575', marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', color: '#757575', marginBottom: 8, marginTop: 12 },
  
  // Dropdown de mascotas
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  dropdownContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  dropdownEmoji: {
    fontSize: 32,
    marginRight: 12,
  },
  dropdownTextContainer: {
    flex: 1,
  },
  dropdownNombre: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
  },
  dropdownRaza: {
    fontSize: 13,
    color: '#757575',
    marginTop: 2,
  },
  dropdownPlaceholder: {
    fontSize: 16,
    color: '#BDBDBD',
  },
  
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    maxHeight: '70%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#212121',
  },
  modalList: {
    maxHeight: 400,
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  modalItemSelected: {
    backgroundColor: '#FFE8F0',
  },
  modalItemEmoji: {
    fontSize: 32,
    marginRight: 12,
  },
  modalItemText: {
    flex: 1,
  },
  modalItemNombre: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
  },
  modalItemRaza: {
    fontSize: 13,
    color: '#757575',
    marginTop: 2,
  },
  
  // Mascotas sin registrar
  noMascotasCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 32, alignItems: 'center', borderWidth: 2, borderColor: '#E0E0E0', borderStyle: 'dashed' },
  noMascotasText: { fontSize: 14, color: '#757575', marginTop: 12, marginBottom: 16 },
  agregarMascotaButton: { backgroundColor: '#FF6B9D', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 12 },
  agregarMascotaText: { fontSize: 14, fontWeight: '600', color: '#FFFFFF' },
  
  // Servicios
  serviciosGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  servicioCard: { width: '48%', backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, alignItems: 'center', borderWidth: 2, borderColor: '#E0E0E0', position: 'relative' },
  servicioCardActive: { borderColor: '#FF6B9D', backgroundColor: '#FFE8F0' },
  servicioCheckmark: { position: 'absolute', top: 8, right: 8 },
  servicioEmoji: { fontSize: 36, marginBottom: 8 },
  servicioNombre: { fontSize: 13, fontWeight: '600', color: '#212121', textAlign: 'center', marginBottom: 4 },
  servicioPrecio: { fontSize: 16, fontWeight: '700', color: '#FF6B9D', marginBottom: 2 },
  servicioDuracion: { fontSize: 11, color: '#757575' },
  
  // Resumen
  resumenCard: { backgroundColor: '#FFF9E6', borderRadius: 12, padding: 16, marginTop: 16 },
  resumenRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  resumenLabel: { fontSize: 14, color: '#757575' },
  resumenValor: { fontSize: 14, fontWeight: '600', color: '#212121' },
  resumenTotal: { borderTopWidth: 1, borderTopColor: '#FFD54F', paddingTop: 12, marginTop: 4 },
  resumenLabelTotal: { fontSize: 16, fontWeight: '700', color: '#212121' },
  resumenValorTotal: { fontSize: 20, fontWeight: '700', color: '#FF6B9D' },
  
  // Fecha/Hora
  dateTimeButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, borderWidth: 1, borderColor: '#E0E0E0', gap: 12 },
  dateTimeText: { fontSize: 16, color: '#212121', fontWeight: '500', flex: 1 },
  verDisponiblesText: { fontSize: 12, color: '#FF6B9D', fontWeight: '600' },
  
  // 🆕 Modal de horarios disponibles
  horariosModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  horariosModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '75%',
    paddingBottom: 20,
  },
  horariosHeader: {
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    alignItems: 'center',
  },
  horariosTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#212121',
    marginBottom: 4,
  },
  horariosSubtitle: {
    fontSize: 14,
    color: '#757575',
  },
  closeHorariosButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingHorarios: {
    padding: 60,
    alignItems: 'center',
  },
  noHorariosContainer: {
    padding: 60,
    alignItems: 'center',
  },
  noHorariosText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#424242',
    marginTop: 16,
    textAlign: 'center',
  },
  noHorariosSubtext: {
    fontSize: 14,
    color: '#757575',
    marginTop: 8,
    textAlign: 'center',
  },
  horariosScroll: {
    flex: 1,
  },
  horariosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 12,
  },
  horarioButton: {
    width: '30%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderWidth: 2,
    borderColor: '#FF6B9D',
    gap: 6,
  },
  horarioButtonSelected: {
    backgroundColor: '#FF6B9D',
    borderColor: '#FF6B9D',
  },
  horarioText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FF6B9D',
  },
  horarioTextSelected: {
    color: '#FFFFFF',
  },
  horarioInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#E3F2FD',
    margin: 16,
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
  horarioInfoText: {
    flex: 1,
    fontSize: 12,
    color: '#1976D2',
    lineHeight: 18,
  },
  
  // Notas
  input: { backgroundColor: '#FFFFFF', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, color: '#212121', borderWidth: 1, borderColor: '#E0E0E0' },
  textArea: { height: 120, textAlignVertical: 'top', paddingTop: 14 },
  
  // Botón
  agendarButton: { borderRadius: 16, overflow: 'hidden', marginTop: 24, shadowColor: '#FF6B9D', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  agendarGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 18, gap: 10 },
  agendarText: { fontSize: 18, fontWeight: '700', color: '#FFFFFF' },
});