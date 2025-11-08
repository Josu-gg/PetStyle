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
  const [periodo, setPeriodo] = useState('AM');
  const [notasPersonal, setNotasPersonal] = useState('');

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

  const abrirModalConfirmacion = (cita) => {
    setCitaSeleccionada(cita);
    setNuevoHorario(cita.hora || '');
    setPeriodo('AM');
    setNotasPersonal('');
    setModalVisible(true);
  };

  const confirmarCita = async () => {
    if (!citaSeleccionada || !nuevoHorario) {
      Alert.alert('Falta información', 'Debes ingresar una hora válida.');
      return;
    }

    try {
      const citaRef = doc(db, 'citas', citaSeleccionada.id);
      const updateData = {
        estado_confirmacion: 'confirmada',
        estado: 'confirmada',
        hora_confirmada: `${nuevoHorario} ${periodo}`,
        notas_personal: notasPersonal.trim() || null,
        confirmada_por: 'personal',
        confirmada_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      };

      await updateDoc(citaRef, updateData);
      Alert.alert('✅ Cita confirmada', 'La cita ha sido actualizada correctamente.');
      setModalVisible(false);
      cargarCitas();
    } catch (error) {
      Alert.alert('Error', 'No se pudo confirmar la cita');
    }
  };

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

  const citasFiltradas = filtrarCitas();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B9D" />
        <Text style={styles.loadingText}>Cargando citas...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#FF6B9D', '#E91E63']} style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={28} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Gestión de Citas</Text>
          <TouchableOpacity onPress={cargarCitas}>
            <Ionicons name="refresh" size={28} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
        <Text style={styles.headerSubtitle}>Panel de administración</Text>
      </LinearGradient>

      {/* Filtros */}
      <View style={styles.filterContainer}>
        {['pendientes', 'confirmadas', 'rechazadas'].map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterButton, filter === f && styles.filterButtonActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Lista de citas */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {citasFiltradas.length === 0 ? (
          <View style={styles.noCitasContainer}>
            <Ionicons name="calendar-outline" size={80} color="#E0E0E0" />
            <Text style={styles.noCitasTitle}>No hay citas {filter}</Text>
          </View>
        ) : (
          citasFiltradas.map((cita) => (
            <View key={cita.id} style={styles.citaCard}>
              <View style={styles.citaHeader}>
                <View style={styles.mascotaInfo}>
                  <Text style={styles.mascotaEmoji}>🐾</Text>
                  <View style={styles.mascotaTexto}>
                    <Text style={styles.mascotaNombre}>{cita.mascota}</Text>
                    <Text style={styles.mascotaRaza}>{cita.servicio}</Text>
                  </View>
                </View>
                <View style={[styles.estadoBadge, { backgroundColor: getEstadoColor(cita.estado_confirmacion) }]}>
                  <Text style={styles.estadoText}>{getEstadoTexto(cita.estado_confirmacion)}</Text>
                </View>
              </View>

              <View style={styles.citaInfo}>
                <View style={styles.infoRow}>
                  <Ionicons name="calendar-outline" size={18} color="#FF6B9D" />
                  <Text style={styles.infoText}>Fecha: {cita.fecha}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Ionicons name="time-outline" size={18} color="#FF6B9D" />
                  <Text style={styles.infoText}>
                    Hora: {cita.hora_confirmada || cita.hora || 'Sin asignar'}
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <Ionicons name="person-outline" size={18} color="#FF6B9D" />
                  <Text style={styles.infoText}>Cliente: {cita.nombre_cliente}</Text>
                </View>
              </View>

              {cita.estado_confirmacion === 'pendiente' && (
                <View style={styles.citaAcciones}>
                  <TouchableOpacity
                    style={styles.confirmarButton}
                    onPress={() => abrirModalConfirmacion(cita)}
                  >
                    <Ionicons name="checkmark-circle-outline" size={18} color="#FFFFFF" />
                    <Text style={styles.confirmarButtonText}>Confirmar</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.rechazarButton}
                    onPress={() => rechazarCita(cita)}
                  >
                    <Ionicons name="close-circle-outline" size={18} color="#FFFFFF" />
                    <Text style={styles.rechazarButtonText}>Rechazar</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))
        )}
      </ScrollView>

      {/* Modal Confirmación */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Confirmar cita</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={26} color="#757575" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.modalLabel}>Nueva hora</Text>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TextInput
                  style={[styles.modalInput, { flex: 1 }]}
                  placeholder="Ej. 10:30"
                  value={nuevoHorario}
                  onChangeText={setNuevoHorario}
                />
                <TouchableOpacity
                  style={[styles.filterButton, periodo === 'AM' && styles.filterButtonActive]}
                  onPress={() => setPeriodo('AM')}
                >
                  <Text style={[styles.filterText, periodo === 'AM' && styles.filterTextActive]}>AM</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.filterButton, periodo === 'PM' && styles.filterButtonActive]}
                  onPress={() => setPeriodo('PM')}
                >
                  <Text style={[styles.filterText, periodo === 'PM' && styles.filterTextActive]}>PM</Text>
                </TouchableOpacity>
              </View>

              <Text style={[styles.modalLabel, { marginTop: 20 }]}>Notas del personal</Text>
              <TextInput
                style={[styles.modalInput, styles.modalTextArea]}
                multiline
                placeholder="Agrega alguna nota u observación (opcional)"
                value={notasPersonal}
                onChangeText={setNotasPersonal}
              />

              <TouchableOpacity style={styles.modalConfirmButton} onPress={confirmarCita}>
                <LinearGradient colors={['#FF6B9D', '#E91E63']} style={styles.modalConfirmGradient}>
                  <Ionicons name="checkmark-circle" size={22} color="#FFFFFF" />
                  <Text style={styles.modalConfirmText}>Confirmar cita</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default PanelPersonalCitas;

// 🟣 FUNCIONES AUXILIARES
const getEstadoColor = (estado) => {
  switch (estado) {
    case 'pendiente': return '#FFB300';
    case 'confirmada': return '#4CAF50';
    case 'rechazada': return '#E91E63';
    default: return '#9E9E9E';
  }
};
const getEstadoTexto = (estado) => {
  switch (estado) {
    case 'pendiente': return 'Pendiente';
    case 'confirmada': return 'Confirmada';
    case 'rechazada': return 'Rechazada';
    default: return estado;
  }
};


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