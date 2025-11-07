// SeguimientoPersonal.js - Versión SIN NOTIFICACIONES
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Alert,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { collection, query, where, onSnapshot, doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../Config/firebase';

const PersonalScreen = ({ navigation }) => {
  const [citasEnProceso, setCitasEnProceso] = useState([]);
  const [citasFinalizadas, setCitasFinalizadas] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const catalogoServicios = {
    'Baño': { icono: 'water', color: '#2196F3', tiempo: 15 },
    'Baño Completo': { icono: 'water', color: '#2196F3', tiempo: 15 },
    'Corte de Pelo': { icono: 'cut', color: '#E91E63', tiempo: 20 },
    'Baño + Corte': { icono: 'cut', color: '#E91E63', tiempo: 35 },
    'Corte de Uñas': { icono: 'hand-left', color: '#FF9800', tiempo: 10 },
    'Limpieza Dental': { icono: 'medical', color: '#9C27B0', tiempo: 15 },
    'Limpieza de Oídos': { icono: 'ear', color: '#9C27B0', tiempo: 10 },
    'Cepillado': { icono: 'brush', color: '#4CAF50', tiempo: 15 },
    'Secado': { icono: 'thermometer', color: '#00BCD4', tiempo: 10 },
    'Deslanado': { icono: 'fitness', color: '#FF5722', tiempo: 25 },
    'Spa': { icono: 'leaf', color: '#8BC34A', tiempo: 30 },
    'Spa Completo': { icono: 'leaf', color: '#8BC34A', tiempo: 30 },
    'Tratamiento': { icono: 'medical', color: '#795548', tiempo: 20 },
  };

  const obtenerFechaHoyISO = () => {
    const hoy = new Date();
    const año = hoy.getFullYear();
    const mes = String(hoy.getMonth() + 1).padStart(2, '0');
    const dia = String(hoy.getDate()).padStart(2, '0');
    return `${año}-${mes}-${dia}`;
  };

  useEffect(() => {
    const fechaHoy = obtenerFechaHoyISO();
    const citasRef = collection(db, 'citas');

    const qEnProceso = query(
      citasRef,
      where('fecha', '==', fechaHoy),
      where('estado', '==', 'en_proceso')
    );

    const qCompletadas = query(
      citasRef,
      where('fecha', '==', fechaHoy),
      where('estado', '==', 'completada')
    );

    const unsubscribeEnProceso = onSnapshot(qEnProceso, (querySnapshot) => {
      const citasData = [];
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const servicios = data.servicios || [];
        const estados_servicios = data.estados_servicios || {};

        servicios.forEach(servicio => {
          if (!estados_servicios[servicio]) {
            estados_servicios[servicio] = 'pendiente';
          }
        });

        citasData.push({
          id: docSnap.id,
          ...data,
          servicios,
          estados_servicios,
        });
      });

      citasData.sort((a, b) => (a.hora || '').localeCompare(b.hora || ''));
      setCitasEnProceso(citasData);
      setLoading(false);
    });

    const unsubscribeCompletadas = onSnapshot(qCompletadas, (querySnapshot) => {
      const citasData = [];
      querySnapshot.forEach((docSnap) => {
        citasData.push({
          id: docSnap.id,
          ...docSnap.data(),
        });
      });

      citasData.sort((a, b) => (a.hora || '').localeCompare(b.hora || ''));
      setCitasFinalizadas(citasData);
    });

    return () => {
      unsubscribeEnProceso();
      unsubscribeCompletadas();
    };
  }, []);

  const cambiarEstadoServicio = async (citaId, servicio, nuevoEstado) => {
    try {
      const citaRef = doc(db, 'citas', citaId);
      const citaDoc = await getDoc(citaRef);

      if (!citaDoc.exists()) {
        Alert.alert('Error', 'No se encontró la cita');
        return;
      }

      const citaData = citaDoc.data();
      const estadosActuales = citaData.estados_servicios || {};
      estadosActuales[servicio] = nuevoEstado;

      await updateDoc(citaRef, {
        estados_servicios: estadosActuales,
      });

      if (nuevoEstado === 'completado') {
        const servicios = citaData.servicios || [];
        const todosCompletados = servicios.every(s => estadosActuales[s] === 'completado');

        if (todosCompletados) {
          await updateDoc(citaRef, {
            estado: 'completada',
            proceso_actual: 100,
            completado_at: new Date(),
          });
          console.log('✅ Cita completada totalmente');
        }
      }
    } catch (error) {
      console.error('❌ Error actualizando estado:', error);
      Alert.alert('Error', 'No se pudo actualizar el estado');
    }
  };

  const marcarCompletado = (cita, servicio) => {
    const estadoActual = cita.estados_servicios[servicio];

    if (estadoActual === 'completado') {
      Alert.alert('Información', 'Este servicio ya está completado');
      return;
    }

    Alert.alert(
      'Completar Servicio',
      `¿Marcar "${servicio}" como completado para ${cita.mascota_nombre || 'la mascota'}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Completar', onPress: () => cambiarEstadoServicio(cita.id, servicio, 'completado') },
      ]
    );
  };

  const marcarEnProceso = (cita, servicio) => {
    cambiarEstadoServicio(cita.id, servicio, 'en_proceso');
  };

  const calcularProgreso = (estados_servicios, servicios) => {
    if (!servicios || servicios.length === 0) return 0;
    const completados = servicios.filter(s => estados_servicios[s] === 'completado').length;
    return Math.round((completados / servicios.length) * 100);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 500);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Ionicons name="hourglass" size={50} color="#6366F1" />
        <Text style={styles.loadingText}>Cargando citas...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#6366F1', '#8B5CF6']} style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerTitle}>Panel Personal</Text>
            <Text style={styles.headerSubtitle}>Seguimiento de Servicios</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#6366F1']} />}
      >
        {/* Aquí va la misma UI de las citas (sin cambios en visual) */}
        {/* ... */}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F5F5' },
  loadingText: { fontSize: 16, color: '#9E9E9E', marginTop: 12 },
  header: { paddingTop: 50, paddingBottom: 20, paddingHorizontal: 20 },
  headerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  headerTitle: { fontSize: 28, fontWeight: '700', color: '#FFFFFF', marginBottom: 4 },
  headerSubtitle: { fontSize: 14, color: 'rgba(255, 255, 255, 0.9)' },
  statsContainer: { flexDirection: 'row', gap: 8 },
  statBadge: { backgroundColor: 'rgba(255, 255, 255, 0.25)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, alignItems: 'center' },
  statNumber: { fontSize: 20, fontWeight: '700', color: '#FFFFFF' },
  statLabel: { fontSize: 11, color: 'rgba(255, 255, 255, 0.9)', marginTop: 2 },
  autoRefreshBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(76, 175, 80, 0.3)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, alignSelf: 'flex-start', gap: 6 },
  pulseDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#4CAF50' },
  autoRefreshText: { fontSize: 11, fontWeight: '600', color: '#FFFFFF' },
  content: { flex: 1 },
  section: { marginBottom: 24, paddingHorizontal: 20 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 8, marginTop: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#212121' },
  citaCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 },
  citaFinalizada: { borderWidth: 2, borderColor: '#4CAF50' },
  citaHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  citaMainInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  mascotaIconContainer: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#E8EAF6', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  mascotaIcon: { fontSize: 28 },
  citaTexts: { flex: 1 },
  citaNombre: { fontSize: 18, fontWeight: '700', color: '#212121', marginBottom: 2 },
  citaRaza: { fontSize: 14, color: '#757575', marginBottom: 4 },
  citaHora: { fontSize: 13, color: '#9E9E9E' },
  progresoCircular: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#EEF2FF', justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#6366F1' },
  progresoNumero: { fontSize: 14, fontWeight: '700', color: '#6366F1' },
  progressBarContainer: { marginBottom: 16 },
  progressBar: { height: 8, backgroundColor: '#E0E0E0', borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#6366F1', borderRadius: 4 },
  serviciosContainer: { borderTopWidth: 1, borderTopColor: '#F0F0F0', paddingTop: 12 },
  serviciosTitle: { fontSize: 14, fontWeight: '700', color: '#212121', marginBottom: 12 },
  servicioItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 12, backgroundColor: '#FAFAFA', borderRadius: 12, marginBottom: 8 },
  servicioInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  servicioIcono: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  servicioTexts: { flex: 1 },
  servicioNombre: { fontSize: 15, fontWeight: '600', color: '#212121', marginBottom: 2 },
  servicioCompletado: { textDecorationLine: 'line-through', color: '#9E9E9E' },
  servicioTiempo: { fontSize: 12, color: '#757575' },
  servicioBotones: { flexDirection: 'row', gap: 6 },
  botonEnProceso: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF3E0', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, gap: 4 },
  botonEnProcesoText: { fontSize: 12, fontWeight: '600', color: '#FF9800' },
  botonCompletar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E8F5E9', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, gap: 4 },
  botonCompletarText: { fontSize: 12, fontWeight: '600', color: '#4CAF50' },
  estadoCompletado: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  estadoCompletadoText: { fontSize: 12, fontWeight: '600', color: '#4CAF50' },
  finalizadoBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF9E6', paddingVertical: 12, paddingHorizontal: 14, borderRadius: 10, gap: 10, marginBottom: 12 },
  finalizadoText: { fontSize: 13, fontWeight: '600', color: '#F57C00', flex: 1 },
  serviciosCompletadosContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  servicioChipCompletado: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E8F5E9', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, gap: 4 },
  servicioChipText: { fontSize: 12, fontWeight: '600', color: '#4CAF50' },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, paddingHorizontal: 40, marginTop: 40 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#9E9E9E', marginTop: 16, marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#BDBDBD', textAlign: 'center', lineHeight: 20 },
  botonVolver: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EEF2FF', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12, marginTop: 20, gap: 8 },
  botonVolverText: { fontSize: 15, fontWeight: '600', color: '#6366F1' },
});

export default PersonalScreen;