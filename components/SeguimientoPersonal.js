// SeguimientoPersonal.js - CON NOTIFICACIONES INTEGRADAS
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

import { sendPushNotification } from '../utils/notificationService';


const PersonalScreen = ({ navigation, route }) => {
  const [citasEnProceso, setCitasEnProceso] = useState([]);
  const [citasFinalizadas, setCitasFinalizadas] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  // Catálogo de servicios con iconos y tiempos
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

  // Obtener fecha de hoy
  const obtenerFechaHoyISO = () => {
    const hoy = new Date();
    const año = hoy.getFullYear();
    const mes = String(hoy.getMonth() + 1).padStart(2, '0');
    const dia = String(hoy.getDate()).padStart(2, '0');
    return `${año}-${mes}-${dia}`;
  };

  // Cargar solo citas en proceso en tiempo real
  useEffect(() => {
    console.log('📡 Iniciando listener de citas en proceso');
    
    const fechaHoy = obtenerFechaHoyISO();
    const citasRef = collection(db, 'citas');
    
    // Query para citas en proceso
    const qEnProceso = query(
      citasRef,
      where('fecha', '==', fechaHoy),
      where('estado', '==', 'en_proceso')
    );

    // Query para citas completadas
    const qCompletadas = query(
      citasRef,
      where('fecha', '==', fechaHoy),
      where('estado', '==', 'completada')
    );

    // Listener para citas en proceso
    const unsubscribeEnProceso = onSnapshot(
      qEnProceso,
      (querySnapshot) => {
        const citasData = [];
        querySnapshot.forEach((docSnap) => {
          const data = docSnap.data();
          
          // Verificar que tenga servicios
          const servicios = data.servicios || [];
          const estados_servicios = data.estados_servicios || {};
          
          // Inicializar estados si no existen
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
      },
      (error) => {
        console.error('❌ Error en listener:', error);
        setLoading(false);
      }
    );

    // Listener para citas completadas
    const unsubscribeCompletadas = onSnapshot(
      qCompletadas,
      (querySnapshot) => {
        const citasData = [];
        querySnapshot.forEach((docSnap) => {
          citasData.push({
            id: docSnap.id,
            ...docSnap.data(),
          });
        });

        citasData.sort((a, b) => (a.hora || '').localeCompare(b.hora || ''));
        setCitasFinalizadas(citasData);
      }
    );

    return () => {
      unsubscribeEnProceso();
      unsubscribeCompletadas();
    };
  }, []);

  // ✅ FUNCIÓN ACTUALIZADA: Cambiar estado de un servicio específico
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

      const nombreMascota = citaData.mascota_nombre || citaData.mascota || 'Tu mascota';
      const usuarioId = citaData.usuario_id;

      // ✅ NOTIFICACIONES MEJORADAS
      if (nuevoEstado === 'completado') {
        // Verificar si todos los servicios están completados
        const servicios = citaData.servicios || [];
        const todosCompletados = servicios.every(s => 
          estadosActuales[s] === 'completado'
        );

        if (todosCompletados) {
          // 🔔 Marcar la cita completa como completada
          await updateDoc(citaRef, {
            estado: 'completada',
            proceso_actual: 100,
            completado_at: new Date(),
          });
          
          // 🔔 Notificar que TODOS LOS SERVICIOS están completados
          await notificarServicioCompletado({
            id: citaId,
            usuario_id: usuarioId,
            nombreMascota: nombreMascota,
            servicio: Array.isArray(citaData.servicios) 
              ? citaData.servicios.join(', ') 
              : citaData.servicio
          });

          console.log('✅ Todos los servicios completados - Cliente notificado');
        } else {
          // Solo se completó un servicio, no notificar aún
          console.log(`✅ Servicio "${servicio}" completado (quedan servicios pendientes)`);
        }
      }

      console.log(`✅ Estado actualizado: ${servicio} -> ${nuevoEstado}`);
    } catch (error) {
      console.error('❌ Error actualizando estado:', error);
      Alert.alert('Error', 'No se pudo actualizar el estado');
    }
  };

  // Marcar servicio como completado
  const marcarCompletado = (cita, servicio) => {
    const estadoActual = cita.estados_servicios[servicio];
    
    if (estadoActual === 'completado') {
      Alert.alert('Información', 'Este servicio ya está completado');
      return;
    }

    Alert.alert(
      'Completar Servicio',
      `¿Marcar "${servicio}" como completado para ${cita.mascota_nombre || cita.mascota || 'la mascota'}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Completar',
          style: 'default',
          onPress: () => cambiarEstadoServicio(cita.id, servicio, 'completado'),
        },
      ]
    );
  };

  // Marcar servicio en proceso
  const marcarEnProceso = (cita, servicio) => {
    cambiarEstadoServicio(cita.id, servicio, 'en_proceso');
  };

  // Calcular progreso total
  const calcularProgreso = (estados_servicios, servicios) => {
    if (!servicios || servicios.length === 0) return 0;
    
    const completados = servicios.filter(s => 
      estados_servicios[s] === 'completado'
    ).length;
    
    return Math.round((completados / servicios.length) * 100);
  };

  // Refresh manual
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
          <View style={styles.statsContainer}>
            <View style={styles.statBadge}>
              <Text style={styles.statNumber}>{citasEnProceso.length}</Text>
              <Text style={styles.statLabel}>En proceso</Text>
            </View>
            <View style={[styles.statBadge, { backgroundColor: 'rgba(76, 175, 80, 0.3)' }]}>
              <Text style={styles.statNumber}>{citasFinalizadas.length}</Text>
              <Text style={styles.statLabel}>Finalizadas</Text>
            </View>
          </View>
        </View>

        <View style={styles.autoRefreshBadge}>
          <View style={styles.pulseDot} />
          <Text style={styles.autoRefreshText}>Sincronizado en tiempo real</Text>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#6366F1']} />
        }
      >
        {citasEnProceso.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="hourglass-outline" size={24} color="#6366F1" />
              <Text style={styles.sectionTitle}>En Proceso ({citasEnProceso.length})</Text>
            </View>

            {citasEnProceso.map(cita => {
              const nombreMascota = cita.mascota_nombre || cita.mascota || 'Mascota';
              const raza = cita.mascota_raza || cita.raza || 'Sin especificar';
              const progreso = calcularProgreso(cita.estados_servicios, cita.servicios);

              return (
                <View key={cita.id} style={styles.citaCard}>
                  <View style={styles.citaHeader}>
                    <View style={styles.citaMainInfo}>
                      <View style={styles.mascotaIconContainer}>
                        <Text style={styles.mascotaIcon}>
                          {cita.mascota_foto || '🐕'}
                        </Text>
                      </View>
                      <View style={styles.citaTexts}>
                        <Text style={styles.citaNombre}>{nombreMascota}</Text>
                        <Text style={styles.citaRaza}>{raza}</Text>
                        <Text style={styles.citaHora}>
                          <Ionicons name="time-outline" size={14} color="#757575" /> {cita.hora}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.progresoCircular}>
                      <Text style={styles.progresoNumero}>{progreso}%</Text>
                    </View>
                  </View>

                  <View style={styles.progressBarContainer}>
                    <View style={styles.progressBar}>
                      <View style={[styles.progressFill, { width: `${progreso}%` }]} />
                    </View>
                  </View>

                  {/* Lista de servicios */}
                  <View style={styles.serviciosContainer}>
                    <Text style={styles.serviciosTitle}>Servicios Contratados:</Text>
                    {cita.servicios && cita.servicios.map((servicio, index) => {
                      const estado = cita.estados_servicios[servicio] || 'pendiente';
                      const servicioInfo = catalogoServicios[servicio] || { 
                        icono: 'checkmark-circle', 
                        color: '#9E9E9E',
                        tiempo: 0
                      };

                      return (
                        <View key={index} style={styles.servicioItem}>
                          <View style={styles.servicioInfo}>
                            <View style={[
                              styles.servicioIcono,
                              { backgroundColor: estado === 'completado' ? '#4CAF50' : 
                                               estado === 'en_proceso' ? '#FF9800' : '#E0E0E0' }
                            ]}>
                              <Ionicons 
                                name={estado === 'completado' ? 'checkmark' : servicioInfo.icono} 
                                size={20} 
                                color="#FFFFFF" 
                              />
                            </View>
                            <View style={styles.servicioTexts}>
                              <Text style={[
                                styles.servicioNombre,
                                estado === 'completado' && styles.servicioCompletado
                              ]}>
                                {servicio}
                              </Text>
                              {servicioInfo.tiempo > 0 && (
                                <Text style={styles.servicioTiempo}>
                                  ⏱️ {servicioInfo.tiempo} min
                                </Text>
                              )}
                            </View>
                          </View>

                          <View style={styles.servicioBotones}>
                            {estado === 'pendiente' && (
                              <TouchableOpacity
                                style={styles.botonEnProceso}
                                onPress={() => marcarEnProceso(cita, servicio)}
                              >
                                <Ionicons name="play-circle" size={18} color="#FF9800" />
                                <Text style={styles.botonEnProcesoText}>Iniciar</Text>
                              </TouchableOpacity>
                            )}

                            {estado === 'en_proceso' && (
                              <TouchableOpacity
                                style={styles.botonCompletar}
                                onPress={() => marcarCompletado(cita, servicio)}
                              >
                                <Ionicons name="checkmark-circle" size={18} color="#4CAF50" />
                                <Text style={styles.botonCompletarText}>Completar</Text>
                              </TouchableOpacity>
                            )}

                            {estado === 'completado' && (
                              <View style={styles.estadoCompletado}>
                                <Ionicons name="checkmark-done" size={18} color="#4CAF50" />
                                <Text style={styles.estadoCompletadoText}>Listo</Text>
                              </View>
                            )}
                          </View>
                        </View>
                      );
                    })}
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {citasFinalizadas.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="checkmark-done-circle" size={24} color="#4CAF50" />
              <Text style={styles.sectionTitle}>Finalizadas Hoy ({citasFinalizadas.length})</Text>
            </View>

            {citasFinalizadas.map(cita => {
              const nombreMascota = cita.mascota_nombre || cita.mascota || 'Mascota';
              const raza = cita.mascota_raza || cita.raza || 'Sin especificar';

              return (
                <View key={cita.id} style={[styles.citaCard, styles.citaFinalizada]}>
                  <View style={styles.citaHeader}>
                    <View style={styles.citaMainInfo}>
                      <View style={[styles.mascotaIconContainer, { backgroundColor: '#E8F5E9' }]}>
                        <Text style={styles.mascotaIcon}>
                          {cita.mascota_foto || '🐕'}
                        </Text>
                      </View>
                      <View style={styles.citaTexts}>
                        <Text style={styles.citaNombre}>{nombreMascota}</Text>
                        <Text style={styles.citaRaza}>{raza}</Text>
                        <Text style={styles.citaHora}>
                          <Ionicons name="time-outline" size={14} color="#757575" /> {cita.hora}
                        </Text>
                      </View>
                    </View>
                    <Ionicons name="checkmark-circle" size={40} color="#4CAF50" />
                  </View>

                  <View style={styles.finalizadoBadge}>
                    <Ionicons name="star" size={20} color="#FFB300" />
                    <Text style={styles.finalizadoText}>
                      ✨ Todos los servicios completados - Lista para recoger
                    </Text>
                  </View>

                  {/* Servicios completados */}
                  {cita.servicios && (
                    <View style={styles.serviciosCompletadosContainer}>
                      {cita.servicios.map((servicio, index) => (
                        <View key={index} style={styles.servicioChipCompletado}>
                          <Ionicons name="checkmark" size={14} color="#4CAF50" />
                          <Text style={styles.servicioChipText}>{servicio}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}

        {citasEnProceso.length === 0 && citasFinalizadas.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="pulse-outline" size={80} color="#E0E0E0" />
            <Text style={styles.emptyTitle}>No hay citas en seguimiento</Text>
            <Text style={styles.emptyText}>
              Las citas aparecerán aquí cuando presiones "Iniciar Atención" en el menú principal
            </Text>
            <TouchableOpacity
              style={styles.botonVolver}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={20} color="#6366F1" />
              <Text style={styles.botonVolverText}>Volver al Menú</Text>
            </TouchableOpacity>
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