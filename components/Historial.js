// Citas.js - Pantalla Unificada de Lista de Citas con Firestore + WhatsApp
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
  Alert,
  SafeAreaView,
  Linking, // ⬅️ AGREGADO PARA WHATSAPP
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { collection, query, where, getDocs, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../Config/firebase';
import { useFocusEffect } from '@react-navigation/native';

const Citas = ({ navigation }) => {
  const [citas, setCitas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [usuarioId, setUsuarioId] = useState('');
  const [filter, setFilter] = useState('todas');

  // ⬇️ 🔧 CONFIGURACIÓN DE WHATSAPP - CAMBIA ESTE NÚMERO ⬇️
  const WHATSAPP_NEGOCIO = '50372706713'; // Sin espacios, con código de país
  // Ejemplos de formato correcto:
  // El Salvador: 50372720113

  // Cargar usuario al montar
  useEffect(() => {
    cargarUsuarioId();
  }, []);

  // Recargar citas cada vez que la pantalla gana foco
  useFocusEffect(
    useCallback(() => {
      if (usuarioId) {
        cargarCitas();
      }
    }, [usuarioId])
  );

  const cargarUsuarioId = async () => {
    try {
      const userId = await AsyncStorage.getItem('usuario_id');
      if (userId) {
        setUsuarioId(userId);
        console.log('✅ Usuario ID cargado:', userId);
      } else {
        Alert.alert('Error', 'No se pudo identificar el usuario');
      }
    } catch (error) {
      console.error('❌ Error al cargar usuario_id:', error);
    }
  };

  const cargarCitas = async () => {
    if (!usuarioId) return;

    try {
      setLoading(true);
      console.log('📡 Cargando citas para usuario:', usuarioId);

      const citasRef = collection(db, 'citas');
      const q = query(
        citasRef,
        where('usuario_id', '==', usuarioId),
        orderBy('created_at', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const citasArray = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      console.log('✅ Citas cargadas:', citasArray.length);
      setCitas(citasArray);
    } catch (error) {
      console.error('❌ Error al cargar citas:', error);
      
      if (error.code === 'failed-precondition') {
        Alert.alert(
          'Configuración necesaria',
          'Se necesita crear un índice en Firestore. Revisa la consola de Firebase.'
        );
      } else {
        Alert.alert('Error', 'No se pudieron cargar las citas: ' + error.message);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    cargarCitas();
  };

  // ⬇️ NUEVA FUNCIÓN: Contactar por WhatsApp ⬇️
  const contactarPorWhatsApp = async (cita) => {
    try {
      // Mensaje personalizado según el estado de la cita
      let mensaje = '';
      
      if (cita.estado === 'confirmada') {
        const horarioConfirmado = cita.hora_confirmada || cita.hora;
        mensaje = `Hola! Me comunico sobre la cita de *${cita.mascota}* confirmada para el *${formatearFecha(cita.fecha)}* a las *${horarioConfirmado}*. No podré asistir en ese horario, ¿podríamos reprogramarla?`;
      } else if (cita.estado === 'pendiente') {
        mensaje = `Hola! Me gustaría confirmar el estado de la cita de *${cita.mascota}* solicitada para el *${formatearFecha(cita.fecha)}* a las *${cita.hora}*.`;
      } else {
        mensaje = `Hola! Me comunico sobre la cita de *${cita.mascota}* agendada para el *${formatearFecha(cita.fecha)}*.`;
      }
      
      const mensajeEncoded = encodeURIComponent(mensaje);
      const url = `https://wa.me/${WHATSAPP_NEGOCIO}?text=${mensajeEncoded}`;
      
      const supported = await Linking.canOpenURL(url);
      
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert(
          'WhatsApp no disponible', 
          'No se pudo abrir WhatsApp. Asegúrate de tener la aplicación instalada.'
        );
      }
    } catch (error) {
      console.error('❌ Error al abrir WhatsApp:', error);
      Alert.alert('Error', 'No se pudo abrir WhatsApp: ' + error.message);
    }
  };
  // ⬆️ FIN NUEVA FUNCIÓN ⬆️

  const obtenerFechaHoyISO = () => {
    const hoy = new Date();
    const año = hoy.getFullYear();
    const mes = String(hoy.getMonth() + 1).padStart(2, '0');
    const dia = String(hoy.getDate()).padStart(2, '0');
    return `${año}-${mes}-${dia}`;
  };

  const esCitaHoy = (fechaISO) => {
    if (!fechaISO) return false;
    return fechaISO === obtenerFechaHoyISO();
  };

  const formatearFecha = (fechaISO) => {
    if (!fechaISO) return 'Fecha no disponible';
    
    try {
      const [año, mes, dia] = fechaISO.split('-');
      const fecha = new Date(año, mes - 1, dia);
      
      const opciones = { weekday: 'short', day: 'numeric', month: 'short' };
      return fecha.toLocaleDateString('es', opciones);
    } catch (error) {
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

  const verSeguimiento = (cita) => {
    if (!cita.id) {
      Alert.alert('Error', 'No se pudo obtener el ID de la cita');
      return;
    }
    navigation.navigate('Seguimiento', { citaId: cita.id });
  };

  const cancelarCita = (cita) => {
    Alert.alert(
      'Cancelar Cita',
      `¿Estás seguro de que deseas cancelar la cita de ${cita.mascota}?`,
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Sí, cancelar',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'citas', cita.id));
              Alert.alert('✅ Cita Cancelada', 'La cita ha sido cancelada exitosamente');
              cargarCitas();
            } catch (error) {
              console.error('Error al cancelar cita:', error);
              Alert.alert('Error', 'No se pudo cancelar la cita');
            }
          },
        },
      ]
    );
  };

  const filtrarCitas = () => {
    switch (filter) {
      case 'proximas':
        return citas.filter(cita => cita.estado === 'pendiente' || cita.estado === 'confirmada');
      case 'completadas':
        return citas.filter(cita => cita.estado === 'completada');
      case 'canceladas':
        return citas.filter(cita => cita.estado === 'cancelada');
      default:
        return citas;
    }
  };

  const stats = {
    total: citas.length,
    proximas: citas.filter(c => c.estado === 'pendiente' || c.estado === 'confirmada').length,
    completadas: citas.filter(c => c.estado === 'completada').length,
    canceladas: citas.filter(c => c.estado === 'cancelada').length,
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
      
      {/* Header */}
      <LinearGradient colors={['#FF6B9D', '#E91E63']} style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={28} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Mis Citas</Text>
          <TouchableOpacity onPress={() => navigation.navigate('AgendarCita')}>
            <Ionicons name="add-circle" size={32} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
        
        {stats.total > 0 && (
          <Text style={styles.headerSubtitle}>
            {stats.total} {stats.total === 1 ? 'cita registrada' : 'citas registradas'}
          </Text>
        )}
      </LinearGradient>

      {/* Estadísticas */}
      {stats.total > 0 && (
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Ionicons name="time" size={20} color="#FFB300" />
            <Text style={styles.statNumber}>{stats.proximas}</Text>
            <Text style={styles.statLabel}>Próximas</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="checkmark-circle" size={20} color="#9C27B0" />
            <Text style={styles.statNumber}>{stats.completadas}</Text>
            <Text style={styles.statLabel}>Completadas</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="close-circle" size={20} color="#E91E63" />
            <Text style={styles.statNumber}>{stats.canceladas}</Text>
            <Text style={styles.statLabel}>Canceladas</Text>
          </View>
        </View>
      )}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#FF6B9D']} />
        }
      >
        {/* Filtros */}
        {stats.total > 0 && (
          <View style={styles.filterContainer}>
            {['todas', 'proximas', 'completadas', 'canceladas'].map((filterType) => (
              <TouchableOpacity
                key={filterType}
                style={[
                  styles.filterButton,
                  filter === filterType && styles.filterButtonActive
                ]}
                onPress={() => setFilter(filterType)}
              >
                <Text
                  style={[
                    styles.filterText,
                    filter === filterType && styles.filterTextActive
                  ]}
                >
                  {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Lista de Citas */}
        {citasFiltradas.length === 0 ? (
          <View style={styles.noCitasContainer}>
            <Ionicons name="calendar-outline" size={80} color="#E0E0E0" />
            <Text style={styles.noCitasTitle}>
              {stats.total === 0 ? 'No tienes citas agendadas' : `No hay citas ${filter}`}
            </Text>
            <Text style={styles.noCitasText}>
              {stats.total === 0
                ? 'Agenda tu primera cita para darle el mejor cuidado a tu mascota'
                : 'Cambia el filtro para ver otras citas'}
            </Text>
            {stats.total === 0 && (
              <TouchableOpacity
                style={styles.agendarButton}
                onPress={() => navigation.navigate('AgendarCita')}
              >
                <LinearGradient
                  colors={['#FF6B9D', '#E91E63']}
                  style={styles.agendarGradient}
                >
                  <Ionicons name="add-circle-outline" size={24} color="#FFFFFF" />
                  <Text style={styles.agendarButtonText}>Agendar Cita</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <>
            {citasFiltradas.map((cita) => {
              const esHoy = esCitaHoy(cita.fecha);
              const horarioConfirmado = cita.hora_confirmada || cita.hora;
              
              return (
                <View key={cita.id} style={styles.citaCard}>
                  {/* Header de la tarjeta */}
                  <View style={styles.citaHeader}>
                    <View style={styles.mascotaInfo}>
                      <Text style={styles.mascotaEmoji}>{cita.mascota_foto || '🐾'}</Text>
                      <View style={styles.mascotaTexto}>
                        <Text style={styles.mascotaNombre}>{cita.mascota}</Text>
                        <Text style={styles.mascotaRaza}>{cita.mascota_raza}</Text>
                      </View>
                    </View>
                    <View
                      style={[
                        styles.estadoBadge,
                        { backgroundColor: getEstadoColor(cita.estado) },
                      ]}
                    >
                      <Text style={styles.estadoText}>{getEstadoTexto(cita.estado)}</Text>
                    </View>
                  </View>

                  {/* ⬇️ NUEVO: Badge de Cita Confirmada ⬇️ */}
                  {cita.estado === 'confirmada' && (
                    <View style={styles.confirmacionCard}>
                      <View style={styles.confirmacionHeader}>
                        <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                        <Text style={styles.confirmacionTitulo}>¡Cita Confirmada!</Text>
                      </View>
                      <Text style={styles.confirmacionHorario}>
                        Tu cita ha sido confirmada para las <Text style={styles.confirmacionHoraBold}>{horarioConfirmado}</Text>
                      </Text>
                      {cita.hora !== horarioConfirmado && (
                        <Text style={styles.confirmacionCambio}>
                          (Horario modificado: {cita.hora} → {horarioConfirmado})
                        </Text>
                      )}
                      <Text style={styles.confirmacionMensaje}>
                        📱 Si no puedes asistir en este horario, contáctanos por WhatsApp
                      </Text>
                    </View>
                  )}
                  {/* ⬆️ FIN Badge de Cita Confirmada ⬆️ */}

                  {/* Información de la cita */}
                  <View style={styles.citaInfo}>
                    <View style={styles.infoRow}>
                      <Ionicons name="calendar-outline" size={18} color="#757575" />
                      <Text style={styles.infoText}>{formatearFecha(cita.fecha)}</Text>
                      {esHoy && (
                        <View style={styles.hoyTag}>
                          <Text style={styles.hoyTagText}>HOY</Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.infoRow}>
                      <Ionicons name="time-outline" size={18} color="#757575" />
                      <Text style={styles.infoText}>{horarioConfirmado}</Text>
                      {cita.estado === 'confirmada' && (
                        <View style={styles.confirmadoTag}>
                          <Ionicons name="checkmark" size={12} color="#4CAF50" />
                        </View>
                      )}
                    </View>
                    <View style={styles.infoRow}>
                      <Ionicons name="cut-outline" size={18} color="#757575" />
                      <Text style={styles.infoText} numberOfLines={2}>
                        {Array.isArray(cita.servicios) 
                          ? cita.servicios.join(', ') 
                          : cita.servicio}
                      </Text>
                    </View>
                    {cita.duracion && (
                      <View style={styles.infoRow}>
                        <Ionicons name="hourglass-outline" size={18} color="#757575" />
                        <Text style={styles.infoText}>{cita.duracion}</Text>
                      </View>
                    )}
                    <View style={styles.infoRow}>
                      <Ionicons name="cash-outline" size={18} color="#757575" />
                      <Text style={styles.infoText}>${cita.precio}</Text>
                    </View>
                  </View>

                  {/* Badge si es hoy */}
                  {esHoy && cita.estado !== 'cancelada' && (
                    <View style={styles.hoyBadge}>
                      <View style={styles.pulseDot} />
                      <Text style={styles.hoyBadgeText}>¡Cita de hoy! - Seguimiento disponible</Text>
                    </View>
                  )}

                  {/* Notas si existen */}
                  {cita.notas && (
                    <View style={styles.notasCard}>
                      <Ionicons name="document-text-outline" size={16} color="#757575" />
                      <Text style={styles.notasText} numberOfLines={2}>{cita.notas}</Text>
                    </View>
                  )}

                  {/* Acciones */}
                  <View style={styles.citaAcciones}>
                    <TouchableOpacity
                      style={styles.accionButton}
                      onPress={() => verSeguimiento(cita)}
                    >
                      <Ionicons name="eye-outline" size={20} color="#FF6B9D" />
                      <Text style={styles.accionText}>Ver Seguimiento</Text>
                    </TouchableOpacity>

                    {/* ⬇️ NUEVO: Botón WhatsApp para citas confirmadas ⬇️ */}
                    {cita.estado === 'confirmada' && (
                      <TouchableOpacity
                        style={[styles.accionButton, styles.whatsappButton]}
                        onPress={() => contactarPorWhatsApp(cita)}
                      >
                        <Ionicons name="logo-whatsapp" size={20} color="#25D366" />
                        <Text style={[styles.accionText, { color: '#25D366' }]}>WhatsApp</Text>
                      </TouchableOpacity>
                    )}
                    {/* ⬆️ FIN Botón WhatsApp ⬆️ */}

                    {cita.estado === 'pendiente' && (
                      <TouchableOpacity
                        style={[styles.accionButton, styles.cancelarButton]}
                        onPress={() => cancelarCita(cita)}
                      >
                        <Ionicons name="close-circle-outline" size={20} color="#E91E63" />
                        <Text style={[styles.accionText, { color: '#E91E63' }]}>Cancelar</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            })}
          </>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Botón flotante para agendar (solo si hay citas) */}
      {stats.total > 0 && (
        <TouchableOpacity
          style={styles.fabButton}
          onPress={() => navigation.navigate('Citas')}
        >
          <LinearGradient
            colors={['#FF6B9D', '#E91E63']}
            style={styles.fabGradient}
          >
            <Ionicons name="add" size={32} color="#FFFFFF" />
          </LinearGradient>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
};

export default Citas;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F5F5' },
  loadingText: { marginTop: 12, fontSize: 16, color: '#9E9E9E' },
  
  header: { paddingTop: 50, paddingBottom: 20, paddingHorizontal: 20 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255, 255, 255, 0.2)', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 28, fontWeight: '700', color: '#FFFFFF' },
  headerSubtitle: { fontSize: 14, color: 'rgba(255, 255, 255, 0.9)', marginTop: 4 },
  
  statsContainer: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 16, paddingHorizontal: 20, backgroundColor: '#FFFFFF', marginTop: -10, marginHorizontal: 20, borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  statCard: { alignItems: 'center' },
  statNumber: { fontSize: 20, fontWeight: '700', color: '#212121', marginTop: 6 },
  statLabel: { fontSize: 11, color: '#757575', marginTop: 2 },
  
  scrollContent: { paddingHorizontal: 20, paddingTop: 20 },
  
  filterContainer: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 16 },
  filterButton: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, backgroundColor: '#E0E0E0' },
  filterButtonActive: { backgroundColor: '#FF6B9D' },
  filterText: { fontSize: 13, color: '#757575', fontWeight: '600' },
  filterTextActive: { color: '#FFFFFF' },
  
  noCitasContainer: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 40 },
  noCitasTitle: { fontSize: 20, fontWeight: '700', color: '#212121', marginTop: 24, marginBottom: 8, textAlign: 'center' },
  noCitasText: { fontSize: 14, color: '#757575', textAlign: 'center', lineHeight: 20, marginBottom: 32 },
  
  agendarButton: { borderRadius: 16, overflow: 'hidden', shadowColor: '#FF6B9D', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  agendarGradient: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 32, gap: 10 },
  agendarButtonText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  
  citaCard: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 20, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 },
  
  citaHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
  mascotaInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  mascotaEmoji: { fontSize: 40, marginRight: 12 },
  mascotaTexto: { flex: 1 },
  mascotaNombre: { fontSize: 18, fontWeight: '700', color: '#212121', marginBottom: 2 },
  mascotaRaza: { fontSize: 13, color: '#757575' },
  
  estadoBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  estadoText: { fontSize: 11, fontWeight: '700', color: '#FFFFFF', textTransform: 'uppercase' },
  
  // ⬇️ NUEVOS ESTILOS: Card de Confirmación ⬇️
  confirmacionCard: {
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  confirmacionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  confirmacionTitulo: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2E7D32',
  },
  confirmacionHorario: {
    fontSize: 14,
    color: '#388E3C',
    marginBottom: 4,
    lineHeight: 20,
  },
  confirmacionHoraBold: {
    fontWeight: '700',
    fontSize: 16,
    color: '#1B5E20',
  },
  confirmacionCambio: {
    fontSize: 12,
    color: '#558B2F',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  confirmacionMensaje: {
    fontSize: 13,
    color: '#558B2F',
    marginTop: 8,
    fontWeight: '500',
  },
  // ⬆️ FIN NUEVOS ESTILOS ⬆️
  
  citaInfo: { marginBottom: 12 },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 10 },
  infoText: { fontSize: 14, color: '#424242', flex: 1 },
  
  confirmadoTag: {
    backgroundColor: '#E8F5E9',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  
  hoyTag: { backgroundColor: '#FFB300', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, marginLeft: 8 },
  hoyTagText: { fontSize: 10, fontWeight: '700', color: '#FFFFFF' },
  
  hoyBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF9E6', borderRadius: 8, paddingVertical: 8, paddingHorizontal: 12, marginBottom: 12 },
  pulseDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#FFB300', marginRight: 8 },
  hoyBadgeText: { fontSize: 12, fontWeight: '600', color: '#F57C00', flex: 1 },
  
  notasCard: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#F5F5F5', borderRadius: 8, padding: 10, marginBottom: 12, gap: 8 },
  notasText: { fontSize: 12, color: '#616161', flex: 1, lineHeight: 16 },
  
  citaAcciones: { flexDirection: 'row', gap: 10 },
  accionButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F5F5F5', borderRadius: 12, paddingVertical: 12, gap: 6 },
  cancelarButton: { backgroundColor: '#FFEBEE' },
  whatsappButton: { 
    backgroundColor: '#E8F5E9', 
    borderWidth: 1.5, 
    borderColor: '#25D366' 
  },
  accionText: { fontSize: 13, fontWeight: '600', color: '#FF6B9D' },
  
  fabButton: { position: 'absolute', bottom: 30, right: 30, borderRadius: 30, overflow: 'hidden', shadowColor: '#FF6B9D', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 8 },
  fabGradient: { width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center' },
});