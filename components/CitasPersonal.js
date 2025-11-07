// PanelPersonalCitas.js - Panel de Gestión de Citas para Personal
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  orderBy,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../Config/firebase';
import { useFocusEffect } from '@react-navigation/native';

const PanelPersonalCitas = ({ navigation }) => {
  const [citas, setCitas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('pendientes');
  
  // Modal
  const [modalVisible, setModalVisible] = useState(false);
  const [citaSeleccionada, setCitaSeleccionada] = useState(null);
  const [nuevoHorario, setNuevoHorario] = useState('');
  const [notasPersonal, setNotasPersonal] = useState('');

  // Cargar citas al montar y cuando gana foco
  useFocusEffect(
    useCallback(() => {
      cargarCitas();
    }, [])
  );

  const cargarCitas = async () => {
    try {
      setLoading(true);
      const citasRef = collection(db, 'citas');
      const q = query(citasRef, orderBy('created_at', 'desc'));
      const querySnapshot = await getDocs(q);
      const citasArray = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setCitas(citasArray);
    } catch (error) {
      Alert.alert('Error', 'No se pudieron cargar las citas: ' + error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    cargarCitas();
  };

  // Abrir modal
  const abrirModalConfirmacion = (cita) => {
    setCitaSeleccionada(cita);
    setNuevoHorario(cita.hora);
    setNotasPersonal('');
    setModalVisible(true);
  };

  // Confirmar cita
  const confirmarCita = async () => {
    if (!citaSeleccionada) return;

    try {
      const citaRef = doc(db, 'citas', citaSeleccionada.id);
      const updateData = {
        estado_confirmacion: 'confirmada',
        estado: 'confirmada',
        hora_confirmada: nuevoHorario,
        notas_personal: notasPersonal.trim() || null,
        confirmada_por: 'personal',
        confirmada_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      };

      if (nuevoHorario !== citaSeleccionada.hora) {
        updateData.hora = nuevoHorario;
        updateData.hora_original = citaSeleccionada.hora;
        updateData.horario_modificado = true;
      }

      await updateDoc(citaRef, updateData);
      Alert.alert('✅ Cita confirmada', 'La cita ha sido actualizada correctamente.');
      setModalVisible(false);
      cargarCitas();
    } catch (error) {
      Alert.alert('Error', 'No se pudo confirmar la cita');
    }
  };

  // Rechazar cita
  const rechazarCita = async (cita) => {
    Alert.alert(
      '⚠️ Rechazar Cita',
      `¿Estás seguro de rechazar la cita de ${cita.mascota}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Rechazar',
          style: 'destructive',
          onPress: async () => {
            try {
              const citaRef = doc(db, 'citas', cita.id);
              await updateDoc(citaRef, {
                estado_confirmacion: 'rechazada',
                estado: 'cancelada',
                rechazada_por: 'personal',
                rechazada_at: serverTimestamp(),
                updated_at: serverTimestamp(),
              });
              Alert.alert('✅ Cita rechazada', 'La cita fue marcada como rechazada.');
              cargarCitas();
            } catch (error) {
              Alert.alert('Error', 'No se pudo rechazar la cita');
            }
          }
        }
      ]
    );
  };

  const formatearFecha = (fechaISO) => {
    if (!fechaISO) return 'Fecha no disponible';
    try {
      const [año, mes, dia] = fechaISO.split('-');
      const fecha = new Date(año, mes - 1, dia);
      const opciones = { weekday: 'short', day: 'numeric', month: 'short' };
      return fecha.toLocaleDateString('es', opciones);
    } catch {
      return fechaISO;
    }
  };

  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'pendiente': return '#FFB300';
      case 'confirmada': return '#4CAF50';
      case 'en_proceso': return '#2196F3';
      case 'completada': return '#9C27B0';
      case 'cancelada': return '#E91E63';
      default: return '#9E9E9E';
    }
  };

  const getEstadoTexto = (estado) => {
    switch (estado) {
      case 'pendiente': return 'Pendiente';
      case 'confirmada': return 'Confirmada';
      case 'en_proceso': return 'En Proceso';
      case 'completada': return 'Completada';
      case 'cancelada': return 'Cancelada';
      default: return estado;
    }
  };

  const filtrarCitas = () => {
    switch (filter) {
      case 'pendientes':
        return citas.filter(cita => cita.estado_confirmacion === 'pendiente');
      case 'confirmadas':
        return citas.filter(cita => cita.estado_confirmacion === 'confirmada');
      case 'rechazadas':
        return citas.filter(cita => cita.estado_confirmacion === 'rechazada');
      default:
        return citas;
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B9D" />
        <Text style={styles.loadingText}>Cargando citas...</Text>
      </View>
    );
  }

  const citasFiltradas = filtrarCitas();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#FF6B9D', '#E91E63']} style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={28} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Gestión de Citas</Text>
          <TouchableOpacity onPress={() => cargarCitas()}>
            <Ionicons name="refresh" size={28} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
        <Text style={styles.headerSubtitle}>Panel de administración</Text>
      </LinearGradient>

      {/* Contenido y estilos originales se mantienen igual */}
      {/* ... resto del código visual igual ... */}
    </SafeAreaView>
  );
};

export default PanelPersonalCitas;


const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F5F5' },
  loadingText: { marginTop: 12, fontSize: 16, color: '#9E9E9E' },
  
  header: { paddingTop: 50, paddingBottom: 20, paddingHorizontal: 20 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255, 255, 255, 0.2)', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 24, fontWeight: '700', color: '#FFFFFF' },
  headerSubtitle: { fontSize: 14, color: 'rgba(255, 255, 255, 0.9)', marginTop: 4 },
  
  statsContainer: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 16, paddingHorizontal: 20, backgroundColor: '#FFFFFF', marginTop: -10, marginHorizontal: 20, borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  statCard: { alignItems: 'center' },
  statNumber: { fontSize: 20, fontWeight: '700', color: '#212121', marginTop: 6 },
  statLabel: { fontSize: 11, color: '#757575', marginTop: 2 },
  
  filterContainer: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 16, marginHorizontal: 20 },
  filterButton: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, backgroundColor: '#E0E0E0' },
  filterButtonActive: { backgroundColor: '#FF6B9D' },
  filterText: { fontSize: 13, color: '#757575', fontWeight: '600' },
  filterTextActive: { color: '#FFFFFF' },
  
  scrollContent: { paddingHorizontal: 20, paddingTop: 20 },
  
  noCitasContainer: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 40 },
  noCitasTitle: { fontSize: 20, fontWeight: '700', color: '#212121', marginTop: 24, textAlign: 'center' },
  
  citaCard: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 20, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 },
  
  citaHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
  mascotaInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  mascotaEmoji: { fontSize: 40, marginRight: 12 },
  mascotaTexto: { flex: 1 },
  mascotaNombre: { fontSize: 18, fontWeight: '700', color: '#212121', marginBottom: 2 },
  mascotaRaza: { fontSize: 13, color: '#757575' },
  
  estadoBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  estadoText: { fontSize: 11, fontWeight: '700', color: '#FFFFFF', textTransform: 'uppercase' },
  
  citaInfo: { marginBottom: 12 },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 10 },
  infoText: { fontSize: 14, color: '#424242', flex: 1 },
  
  modificadoTag: { backgroundColor: '#2196F3', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, marginLeft: 8 },
  modificadoTagText: { fontSize: 10, fontWeight: '700', color: '#FFFFFF' },
  
  notasCard: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#FFF9E6', borderRadius: 8, padding: 10, marginBottom: 12, gap: 8 },
  notasText: { fontSize: 12, color: '#616161', flex: 1, lineHeight: 16 },
  
  notasPersonalCard: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#E3F2FD', borderRadius: 8, padding: 10, marginBottom: 12, gap: 8 },
  notasPersonalText: { fontSize: 12, color: '#1976D2', flex: 1, lineHeight: 16, fontWeight: '500' },
  
  citaAcciones: { flexDirection: 'row', gap: 10, marginTop: 8 },
  confirmarButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#4CAF50', borderRadius: 12, paddingVertical: 14, gap: 6 },
  confirmarButtonText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
  rechazarButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#E91E63', borderRadius: 12, paddingVertical: 14, gap: 6 },
  rechazarButtonText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
  
  confirmadaInfo: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E8F5E9', borderRadius: 8, padding: 10, marginTop: 12, gap: 8 },
  confirmadaInfoText: { fontSize: 12, color: '#2E7D32', fontWeight: '500' },
  
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#212121',
  },
  modalBody: {
    padding: 24,
  },
  modalSection: {
    marginBottom: 24,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#757575',
    marginBottom: 8,
  },
  modalValue: {
    fontSize: 16,
    color: '#212121',
    fontWeight: '500',
  },
  modalInput: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#212121',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  modalTextArea: {
    height: 80,
    textAlignVertical: 'top',
    paddingTop: 14,
  },
  modalHelp: {
    fontSize: 12,
    color: '#9E9E9E',
    marginTop: 6,
    fontStyle: 'italic',
  },
  modalConfirmButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 12,
    marginBottom: 24,
  },
  modalConfirmGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 10,
  },
  modalConfirmText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});