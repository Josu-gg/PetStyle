// Seguimiento.js - Cliente con Seguimiento de Servicios Individuales
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Alert,
  Animated,
  Linking,
  AppState,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { doc, onSnapshot, collection, query, where, getDocs } from 'firebase/firestore';
import { db, auth } from '../Config/firebase';

const Seguimiento = ({ navigation, route }) => {
  const SALON_INFO = {
    telefono: '72706713',
    telefonoDisplay: '7270-6713',
    whatsapp: '50372706713',
    email: 'contacto@petstyle.com',
    nombre: 'PetStyle Salón',
  };

  const [citaId, setCitaId] = useState(route?.params?.citaId || null);
  const [usuarioId, setUsuarioId] = useState('');
  const [citaData, setCitaData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [citaCompletada, setCitaCompletada] = useState(false);
  const [diasHastaCita, setDiasHastaCita] = useState(null);
  const [mensajeFecha, setMensajeFecha] = useState('');

  const appState = useRef(AppState.currentState);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const unsubscribe = useRef(null);

  // Catálogo de servicios con iconos
  const catalogoServicios = {
    'Baño': { icono: 'water', color: '#2196F3' },
    'Corte de Pelo': { icono: 'cut', color: '#E91E63' },
    'Corte de Uñas': { icono: 'hand-left', color: '#FF9800' },
    'Limpieza de Oídos': { icono: 'ear', color: '#9C27B0' },
    'Cepillado': { icono: 'brush', color: '#4CAF50' },
    'Secado': { icono: 'thermometer', color: '#00BCD4' },
    'Deslanado': { icono: 'fitness', color: '#FF5722' },
    'Spa': { icono: 'leaf', color: '#8BC34A' },
    'Tratamiento': { icono: 'medical', color: '#795548' },
  };

  // 🔹 Obtener fecha de hoy en formato ISO
  const obtenerFechaHoyISO = () => {
    const hoy = new Date();
    return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;
  };

  // 🔹 Calcular días hasta la cita
  const calcularDiasHastaCita = (fechaISO) => {
    if (!fechaISO) return null;
    try {
      const [año, mes, dia] = fechaISO.split('-');
      const fechaCitaDate = new Date(año, mes - 1, dia);
      fechaCitaDate.setHours(0, 0, 0, 0);
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      return Math.floor((fechaCitaDate - hoy) / (1000 * 60 * 60 * 24));
    } catch {
      return null;
    }
  };

  // 🔹 Formatear fecha para mostrar
  const formatearFechaDisplay = (fechaISO) => {
    if (!fechaISO) return 'Fecha no disponible';
    try {
      const [año, mes, dia] = fechaISO.split('-');
      const fecha = new Date(año, mes - 1, dia);
      return fecha.toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    } catch {
      return fechaISO;
    }
  };

  // 🔹 Buscar cita más cercana
  const buscarCitaMasCercana = async (userId) => {
    try {
      const citasRef = collection(db, 'citas');
      const q = query(citasRef, where('usuario_id', '==', userId));
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) return null;

      const citasFuturas = [];
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.estado === 'cancelada') return;
        const diasHasta = calcularDiasHastaCita(data.fecha);
        if (diasHasta !== null && diasHasta >= 0) {
          citasFuturas.push({ id: docSnap.id, ...data, diasHasta });
        }
      });

      if (citasFuturas.length === 0) return null;
      citasFuturas.sort((a, b) => a.diasHasta - b.diasHasta);
      return citasFuturas[0];
    } catch {
      return null;
    }
  };

  // 🔹 Calcular progreso
  const calcularProgreso = (estados_servicios, servicios) => {
    if (!servicios?.length) return 0;
    const completados = servicios.filter((s) => estados_servicios?.[s] === 'completado').length;
    return Math.round((completados / servicios.length) * 100);
  };

  // 🔹 Inicializar componente
  const inicializarComponente = async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        Alert.alert('Error', 'Por favor inicia sesión nuevamente');
        setLoading(false);
        return;
      }
      const userId = currentUser.uid;
      setUsuarioId(userId);

      const cita = await buscarCitaMasCercana(userId);
      if (!cita) {
        setCitaData(null);
        setDiasHastaCita(null);
        setLoading(false);
        return;
      }

      setCitaId(cita.id);
      setCitaData(cita);
      setDiasHastaCita(cita.diasHasta);

      if (cita.diasHasta === 0) setMensajeFecha('');
      else if (cita.diasHasta === 1) setMensajeFecha('mañana');
      else if (cita.diasHasta === 2) setMensajeFecha('pasado mañana');
      else if (cita.diasHasta > 2) setMensajeFecha(`en ${cita.diasHasta} días`);

      sincronizarEstadoRealTime(cita.id);
      setLoading(false);
    } catch {
      Alert.alert('Error', 'No se pudo cargar el seguimiento');
      setLoading(false);
    }
  };

  // 🔹 Sincronizar en tiempo real
  const sincronizarEstadoRealTime = (citaIdParam) => {
    if (!citaIdParam) return;
    const citaRef = doc(db, 'citas', citaIdParam);
    unsubscribe.current = onSnapshot(citaRef, (docSnap) => {
      if (!docSnap.exists()) return;
      const data = docSnap.data();
      setCitaData(data);
      const dias = calcularDiasHastaCita(data.fecha);
      setDiasHastaCita(dias);
      setCitaCompletada(
        (data.servicios || []).every((s) => data.estados_servicios?.[s] === 'completado') ||
        data.estado === 'completada'
      );
    });
  };

  // 🔹 Efectos
  useEffect(() => {
    inicializarComponente();
    return () => unsubscribe.current && unsubscribe.current();
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      appState.current = nextAppState;
    });
    return () => subscription.remove();
  }, []);

  // 🔹 Funciones de contacto
  const handleLlamar = async () => {
    const phoneNumber = `tel:${SALON_INFO.telefono}`;
    const supported = await Linking.canOpenURL(phoneNumber);
    if (supported) Linking.openURL(phoneNumber);
    else Alert.alert('Error', 'No se puede realizar llamadas');
  };

  const handleEnviarMensaje = async () => {
    const nombreMascota = citaData?.mascota_nombre || 'mi mascota';
    const mensaje = encodeURIComponent(`Hola ${SALON_INFO.nombre}, necesito información sobre ${nombreMascota}`);
    const whatsappURL = `whatsapp://send?phone=${SALON_INFO.whatsapp}&text=${mensaje}`;
    const supported = await Linking.canOpenURL(whatsappURL);
    if (supported) Linking.openURL(whatsappURL);
    else Alert.alert('WhatsApp no disponible');
  };

  const mostrarOpcionesContacto = () => {
    Alert.alert('Contactar', 'Elige una opción:', [
      { text: '📞 Llamar', onPress: handleLlamar },
      { text: '💬 WhatsApp', onPress: handleEnviarMensaje },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  };

  // 🔹 Animaciones
  useEffect(() => {
    if (citaData) {
      const progreso = calcularProgreso(citaData.estados_servicios, citaData.servicios);
      Animated.timing(progressAnim, { toValue: progreso, duration: 800, useNativeDriver: false }).start();
    }
  }, [citaData]);

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.2, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  // RENDERIZADO
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B9D" />
        <Text style={styles.loadingText}>Cargando seguimiento...</Text>
      </View>
    );
  }

  // Si no hay citas
  if (diasHastaCita === null || !citaData) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />
        <LinearGradient colors={['#FF6B9D', '#E91E63']} style={styles.header}>
          <View style={styles.headerTop}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Ionicons name="chevron-back" size={28} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Seguimiento</Text>
            <View style={{ width: 28 }} />
          </View>
        </LinearGradient>

        <View style={styles.noCitaHoyContainer}>
          <View style={styles.noCitaHoyCard}>
            <View style={styles.calendarIcon}>
              <Ionicons name="calendar-outline" size={64} color="#FF6B9D" />
            </View>
            
            <Text style={styles.noCitaHoyTitle}>No hay citas programadas</Text>
            <Text style={styles.noCitaHoyText}>
              No tienes ninguna cita futura. Agenda una para ver el seguimiento.
            </Text>
            
            <TouchableOpacity 
              style={styles.verCitasButton} 
              onPress={() => navigation.navigate('Citas')}
            >
              <LinearGradient
                colors={['#FF6B9D', '#E91E63']}
                style={styles.verCitasGradient}
              >
                <Ionicons name="calendar" size={20} color="#FFFFFF" />
                <Text style={styles.verCitasText}>Ver mis citas</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.agendarNuevaButton} 
              onPress={() => navigation.navigate('AgendarCita')}
            >
              <Text style={styles.agendarNuevaText}>+ Agendar nueva cita</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  const nombreMascota = citaData.mascota_nombre || citaData.mascota || 'Mascota';
  const fotoMascota = citaData.mascota_foto || '🐾';
  const razaMascota = citaData.mascota_raza || citaData.raza || 'Sin especificar';
  
  const serviciosArray = citaData.servicios || [];
  const estadosServicios = citaData.estados_servicios || {};
  
  const progreso = calcularProgreso(estadosServicios, serviciosArray);

  // Si la cita NO es hoy
  if (diasHastaCita > 0) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />
        
        <LinearGradient colors={['#FF6B9D', '#E91E63']} style={styles.header}>
          <View style={styles.headerTop}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Ionicons name="chevron-back" size={28} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Seguimiento</Text>
            <View style={{ width: 28 }} />
          </View>

          <View style={styles.mascotaCard}>
            <View style={styles.mascotaIcon}>
              <Text style={styles.mascotaEmoji}>{fotoMascota}</Text>
            </View>
            <View style={styles.mascotaInfo}>
              <Text style={styles.mascotaNombre}>{nombreMascota}</Text>
              <Text style={styles.mascotaRaza}>{razaMascota}</Text>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.noCitaHoyContainer}>
          <View style={styles.noCitaHoyCard}>
            <View style={styles.calendarIcon}>
              <Ionicons name="calendar-outline" size={64} color="#FF6B9D" />
            </View>
            
            <Text style={styles.noCitaHoyTitle}>Seguimiento disponible {mensajeFecha}</Text>
            <Text style={styles.noCitaHoyText}>
              El seguimiento en tiempo real estará disponible el día de tu cita.
            </Text>
            
            <View style={styles.fechaCitaCard}>
              <Ionicons name="time-outline" size={24} color="#FF6B9D" />
              <View style={styles.fechaCitaInfo}>
                <Text style={styles.fechaCitaLabel}>Fecha de tu cita:</Text>
                <Text style={styles.fechaCitaValor}>
                  {formatearFechaDisplay(citaData.fecha)}
                </Text>
                <Text style={styles.fechaCitaHora}>Hora: {citaData.hora}</Text>
              </View>
            </View>

            {serviciosArray.length > 0 && (
              <View style={styles.serviciosPreview}>
                <Text style={styles.serviciosPreviewTitle}>Servicios contratados:</Text>
                {serviciosArray.map((servicio, index) => (
                  <View key={index} style={styles.servicioPreviewItem}>
                    <Ionicons name="checkmark-circle-outline" size={18} color="#4CAF50" />
                    <Text style={styles.servicioPreviewText}>{servicio}</Text>
                  </View>
                ))}
              </View>
            )}

            <TouchableOpacity 
              style={styles.verCitasButton} 
              onPress={() => navigation.navigate('Citas')}
            >
              <LinearGradient
                colors={['#FF6B9D', '#E91E63']}
                style={styles.verCitasGradient}
              >
                <Ionicons name="calendar" size={20} color="#FFFFFF" />
                <Text style={styles.verCitasText}>Ver mis citas</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  // SI LA CITA ES HOY - Seguimiento completo con servicios
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <LinearGradient colors={['#FF6B9D', '#E91E63']} style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={28} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Seguimiento</Text>
          <TouchableOpacity onPress={mostrarOpcionesContacto}>
            <Ionicons name="call-outline" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.syncBadge}>
          <View style={styles.syncDot} />
          <Text style={styles.syncText}>En tiempo real</Text>
        </View>

        <View style={styles.mascotaCard}>
          <View style={styles.mascotaIcon}>
            <Text style={styles.mascotaEmoji}>{fotoMascota}</Text>
          </View>
          <View style={styles.mascotaInfo}>
            <Text style={styles.mascotaNombre}>{nombreMascota}</Text>
            <Text style={styles.mascotaRaza}>{razaMascota}</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.content}>
        {citaCompletada && (
          <View style={styles.completadoCard}>
            <LinearGradient colors={['#4CAF50', '#66BB6A']} style={styles.completadoGradient}>
              <Ionicons name="checkmark-circle" size={64} color="#FFFFFF" />
              <Text style={styles.completadoTitle}>¡Todo listo! 🎉</Text>
              <Text style={styles.completadoText}>
                {nombreMascota} te está esperando.{'\n'}Puedes venir a recogerla.
              </Text>
              <TouchableOpacity style={styles.llamarButton} onPress={handleLlamar}>
                <Ionicons name="call" size={20} color="#4CAF50" />
                <Text style={styles.llamarText}>Llamar al salón</Text>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        )}

        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressTitle}>Progreso</Text>
            <Text style={styles.progressPercent}>{progreso}%</Text>
          </View>
          <View style={styles.progressBarContainer}>
            <Animated.View
              style={[
                styles.progressBarFill,
                { width: progressWidth, backgroundColor: citaCompletada ? '#4CAF50' : '#FF6B9D' },
              ]}
            />
          </View>
        </View>

        {/* Lista de servicios con estado en tiempo real */}
        <View style={styles.serviciosSection}>
          <Text style={styles.serviciosSectionTitle}>Servicios Contratados</Text>
          
          {serviciosArray.map((servicio, index) => {
            const estado = estadosServicios[servicio] || 'pendiente';
            const servicioInfo = catalogoServicios[servicio] || { 
              icono: 'checkmark-circle', 
              color: '#9E9E9E' 
            };

            const isCompleted = estado === 'completado';
            const isCurrent = estado === 'en_proceso';
            const isPending = estado === 'pendiente';

            return (
              <Animated.View
                key={index}
                style={[
                  styles.servicioCard,
                  isCurrent && { transform: [{ scale: pulseAnim }] }
                ]}
              >
                <View
                  style={[
                    styles.servicioIconContainer,
                    isCompleted && { backgroundColor: '#4CAF50' },
                    isCurrent && { backgroundColor: servicioInfo.color },
                    isPending && { backgroundColor: '#E0E0E0' },
                  ]}
                >
                  <Ionicons 
                    name={isCompleted ? 'checkmark' : servicioInfo.icono} 
                    size={24} 
                    color="#FFFFFF" 
                  />
                </View>

                <View style={styles.servicioInfo}>
                  <View style={styles.servicioHeader}>
                    <Text
                      style={[
                        styles.servicioNombre,
                        (isCompleted || isCurrent) && styles.servicioNombreActive,
                        isCompleted && styles.servicioCompletado,
                      ]}
                    >
                      {servicio}
                    </Text>
                    {isCurrent && (
                      <View style={styles.currentBadge}>
                        <Text style={styles.currentBadgeText}>En proceso</Text>
                      </View>
                    )}
                    {isCompleted && (
                      <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                    )}
                  </View>

                  <Text
                    style={[
                      styles.servicioDescripcion,
                      isCompleted && styles.servicioDescripcionCompleted,
                      isCurrent && styles.servicioDescripcionCurrent,
                    ]}
                  >
                    {isCompleted
                      ? '✓ Completado'
                      : isCurrent
                      ? '🔄 En proceso...'
                      : '⏳ Pendiente'}
                  </Text>
                </View>
              </Animated.View>
            );
          })}
        </View>

        <View style={styles.actionsContainer}>
          <TouchableOpacity style={styles.actionButton} onPress={handleEnviarMensaje}>
            <Ionicons name="logo-whatsapp" size={24} color="#25D366" />
            <Text style={styles.actionButtonText}>WhatsApp</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={mostrarOpcionesContacto}>
            <Ionicons name="call-outline" size={24} color="#FF6B9D" />
            <Text style={styles.actionButtonText}>Contactar</Text>
          </TouchableOpacity>
        </View>

        {citaData?.notas && (
          <View style={styles.comentariosSection}>
            <Text style={styles.serviciosSectionTitle}>Notas:</Text>
            <Text style={styles.comentariosText}>{citaData.notas}</Text>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};



const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F5F5' },
  loadingText: { fontSize: 16, color: '#9E9E9E', marginTop: 12 },
  header: { paddingTop: 50, paddingBottom: 20, paddingHorizontal: 20 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  headerTitle: { fontSize: 24, fontWeight: '700', color: '#FFFFFF' },
  syncBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 12,
    gap: 6,
  },
  syncDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#4CAF50' },
  syncText: { fontSize: 12, fontWeight: '600', color: '#FFFFFF' },
  mascotaCard: { flexDirection: 'row', backgroundColor: 'rgba(255, 255, 255, 0.2)', borderRadius: 16, padding: 16, alignItems: 'center' },
  mascotaIcon: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  mascotaEmoji: { fontSize: 32 },
  mascotaInfo: { flex: 1 },
  mascotaNombre: { fontSize: 20, fontWeight: '700', color: '#FFFFFF', marginBottom: 4 },
  mascotaRaza: { fontSize: 14, color: 'rgba(255, 255, 255, 0.9)' },
  content: { flex: 1 },
  
  noCitaHoyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  noCitaHoyCard: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 32, alignItems: 'center', width: '100%', maxWidth: 400, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 5 },
  calendarIcon: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#FFE8F0', justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  noCitaHoyTitle: { fontSize: 22, fontWeight: '700', color: '#212121', marginBottom: 12, textAlign: 'center' },
  noCitaHoyText: { fontSize: 15, color: '#757575', textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  
  fechaCitaCard: { flexDirection: 'row', backgroundColor: '#FFF9E6', borderRadius: 16, padding: 16, marginBottom: 24, alignItems: 'center', gap: 12, width: '100%' },
  fechaCitaInfo: { flex: 1 },
  fechaCitaLabel: { fontSize: 12, color: '#F57C00', fontWeight: '600', marginBottom: 4 },
  fechaCitaValor: { fontSize: 16, fontWeight: '700', color: '#212121', marginBottom: 2 },
  fechaCitaHora: { fontSize: 14, color: '#757575' },
  
  serviciosPreview: { width: '100%', marginBottom: 24 },
  serviciosPreviewTitle: { fontSize: 14, fontWeight: '700', color: '#212121', marginBottom: 8 },
  servicioPreviewItem: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  servicioPreviewText: { fontSize: 14, color: '#616161' },
  
  verCitasButton: { borderRadius: 12, overflow: 'hidden', width: '100%', marginBottom: 12 },
  verCitasGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, gap: 8 },
  verCitasText: { fontSize: 15, fontWeight: '600', color: '#FFFFFF' },
  
  agendarNuevaButton: { paddingVertical: 12 },
  agendarNuevaText: { fontSize: 14, fontWeight: '600', color: '#FF6B9D' },
  
  completadoCard: { margin: 20, borderRadius: 20, overflow: 'hidden', shadowColor: '#4CAF50', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 5 },
  completadoGradient: { padding: 32, alignItems: 'center' },
  completadoTitle: { fontSize: 28, fontWeight: '700', color: '#FFFFFF', marginTop: 16, marginBottom: 12 },
  completadoText: { fontSize: 16, color: 'rgba(255, 255, 255, 0.95)', textAlign: 'center', lineHeight: 24, marginBottom: 24 },
  llamarButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 12, gap: 8 },
  llamarText: { fontSize: 16, fontWeight: '600', color: '#4CAF50' },
  
  progressSection: { padding: 20, paddingBottom: 10 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  progressTitle: { fontSize: 18, fontWeight: '700', color: '#212121' },
  progressPercent: { fontSize: 18, fontWeight: '700', color: '#FF6B9D' },
  progressBarContainer: { height: 8, backgroundColor: '#E0E0E0', borderRadius: 4, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 4 },
  
  serviciosSection: { paddingHorizontal: 20, paddingTop: 10 },
  serviciosSectionTitle: { fontSize: 18, fontWeight: '700', color: '#212121', marginBottom: 16 },
  
  servicioCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    alignItems: 'center',
  },
  servicioIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  servicioInfo: { flex: 1 },
  servicioHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  servicioNombre: { fontSize: 16, fontWeight: '600', color: '#9E9E9E' },
  servicioNombreActive: { color: '#212121' },
  servicioCompletado: { textDecorationLine: 'line-through', color: '#9E9E9E' },
  servicioDescripcion: { fontSize: 14, color: '#BDBDBD' },
  servicioDescripcionCompleted: { color: '#4CAF50', fontWeight: '600' },
  servicioDescripcionCurrent: { color: '#FF9800', fontWeight: '600' },
  
  currentBadge: {
    backgroundColor: '#FF6B9D',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  currentBadgeText: { fontSize: 10, color: '#FFFFFF', fontWeight: '700' },

  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
    paddingHorizontal: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  actionButtonText: { fontSize: 15, fontWeight: '600', color: '#212121' },
  
  comentariosSection: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  comentariosText: {
    fontSize: 14,
    color: '#616161',
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 8,
    lineHeight: 20,
  },
});

export default Seguimiento;
