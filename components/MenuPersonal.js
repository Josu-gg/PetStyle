// MenuPersonal.js - Firebase Integration con Navegación a Citas
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  StatusBar,
  SafeAreaView,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { collection, query, where, orderBy, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../Config/firebase';

const MenuPersonal = ({ navigation }) => {
  const [userData, setUserData] = useState(null);
  const [citasHoy, setCitasHoy] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('inicio');

  // Función para obtener fecha de hoy en formato ISO (YYYY-MM-DD)
  const obtenerFechaHoyISO = () => {
    const hoy = new Date();
    const año = hoy.getFullYear();
    const mes = String(hoy.getMonth() + 1).padStart(2, '0');
    const dia = String(hoy.getDate()).padStart(2, '0');
    return `${año}-${mes}-${dia}`;
  };

  // Función para obtener datos del personal desde AsyncStorage
  const fetchUserData = async () => {
    try {
      const userData = await AsyncStorage.getItem('user_data');
      if (userData) {
        const data = JSON.parse(userData);
        setUserData(data);
      } else {
        setUserData({
          nombres: 'Personal',
          apellidos: 'PetStyle',
          rol: 'personal'
        });
      }
    } catch (error) {
      console.error('Error fetching user:', error);
      setUserData({
        nombres: 'Personal',
        apellidos: 'PetStyle',
        rol: 'personal'
      });
    }
  };

  // Función para cargar TODAS las citas del día desde Firebase
  const cargarCitasDelDia = async () => {
    try {
      const fechaHoyISO = obtenerFechaHoyISO();
      
      console.log('📅 Buscando citas para la fecha:', fechaHoyISO);

      // Query a Firebase
      const citasRef = collection(db, 'citas');
      const q = query(
        citasRef,
        where('fecha', '==', fechaHoyISO),
        orderBy('hora', 'asc')
      );

      const querySnapshot = await getDocs(q);
      const citasArray = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        // Excluir citas canceladas
        if (data.estado !== 'cancelada') {
          citasArray.push({
            id: doc.id,
            ...data
          });
        }
      });

      console.log(`✅ ${citasArray.length} citas encontradas para hoy`);
      setCitasHoy(citasArray);
    } catch (error) {
      console.error('❌ Error al cargar citas:', error);
      
      // Si es error de índice de Firestore
      if (error.code === 'failed-precondition') {
        Alert.alert(
          'Configuración necesaria',
          'Se necesita crear un índice en Firestore. Revisa la consola de Firebase y crea el índice compuesto para: fecha (Ascending) + hora (Ascending)',
          [{ text: 'OK' }]
        );
      }
      
      setCitasHoy([]);
    }
  };

  // Cargar datos al montar el componente
  useEffect(() => {
    loadData();
    
    // Recargar cada vez que se enfoca la pantalla
    const unsubscribe = navigation.addListener('focus', () => {
      setActiveTab('inicio');
      cargarCitasDelDia();
    });
    
    return unsubscribe;
  }, [navigation]);

  const loadData = async () => {
    setLoading(true);
    await fetchUserData();
    await cargarCitasDelDia();
    setLoading(false);
  };

  // Función para refrescar datos
  const onRefresh = async () => {
    setRefreshing(true);
    await cargarCitasDelDia();
    setRefreshing(false);
  };

  // Manejar cambio de pestaña en el menú
  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    
    switch(tabId) {
      case 'inicio':
        // Ya estamos en inicio, no hacer nada
        break;
      case 'citas':
        if (navigation) navigation.navigate('CitasPersonal');
        break;
      case 'seguimiento':
        if (navigation) navigation.navigate('SeguimientoPersonal');
        break;
      case 'configuracion':
        if (navigation) navigation.navigate('Perfil');
        break;
      default:
        break;
    }
  };

  const obtenerColorEstado = (estado) => {
    switch (estado) {
      case 'pendiente':
        return '#FFA726';
      case 'en_proceso':
        return '#42A5F5';
      case 'completada':
        return '#66BB6A';
      case 'cancelada':
        return '#EF5350';
      default:
        return '#9E9E9E';
    }
  };

  const obtenerTextoEstado = (estado) => {
    switch (estado) {
      case 'pendiente':
        return 'Pendiente';
      case 'en_proceso':
        return 'En Proceso';
      case 'completada':
        return 'Completada';
      case 'cancelada':
        return 'Cancelada';
      default:
        return estado;
    }
  };

  const obtenerIconoEstado = (estado) => {
    switch (estado) {
      case 'pendiente':
        return 'time-outline';
      case 'en_proceso':
        return 'play-circle';
      case 'completada':
        return 'checkmark-circle';
      case 'cancelada':
        return 'close-circle';
      default:
        return 'help-circle';
    }
  };

  const cambiarEstadoCita = async (citaId, nuevoEstado) => {
    try {
      const citaRef = doc(db, 'citas', citaId);
      await updateDoc(citaRef, {
        estado: nuevoEstado,
        updated_at: new Date()
      });

      console.log('✅ Estado actualizado exitosamente');
      cargarCitasDelDia();
    } catch (error) {
      console.error('❌ Error al actualizar estado:', error);
      Alert.alert('Error', 'No se pudo actualizar el estado');
    }
  };

  // Inicializar servicios cuando se inicia la cita
  const iniciarCita = async (cita) => {
    Alert.alert(
      'Iniciar Cita',
      `¿Comenzar atención de ${cita.mascota}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Iniciar',
          onPress: async () => {
            try {
              // Inicializar estados de servicios
              const servicios = cita.servicios || [];
              const estados_servicios = {};
              
              // Todos los servicios comienzan en 'pendiente'
              servicios.forEach(servicio => {
                estados_servicios[servicio] = 'pendiente';
              });

              // Actualizar en Firebase
              const citaRef = doc(db, 'citas', cita.id);
              await updateDoc(citaRef, {
                estado: 'en_proceso',
                estados_servicios: estados_servicios,
                updated_at: new Date()
              });

              console.log('✅ Cita iniciada con seguimiento de servicios:', estados_servicios);

              // Navegar a la pantalla de seguimiento
              if (navigation) {
                navigation.navigate('SeguimientoPersonal');
              }
            } catch (error) {
              console.error('❌ Error al iniciar cita:', error);
              Alert.alert('Error', 'No se pudo iniciar la cita');
            }
          }
        }
      ]
    );
  };

  const completarCita = (cita) => {
    Alert.alert(
      'Completar Cita',
      `¿Marcar como completada la cita de ${cita.mascota}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Completar',
          onPress: () => cambiarEstadoCita(cita.id, 'completada')
        }
      ]
    );
  };

  // Obtener estadísticas del día
  const obtenerEstadisticas = () => {
    const total = citasHoy.length;
    const pendientes = citasHoy.filter(c => c.estado === 'pendiente').length;
    const enProceso = citasHoy.filter(c => c.estado === 'en_proceso').length;
    const completadas = citasHoy.filter(c => c.estado === 'completada').length;
    const ingresos = citasHoy
      .filter(c => c.estado === 'completada')
      .reduce((sum, c) => sum + (parseFloat(c.precio) || 0), 0);

    return {
      citasHoy: total,
      completadas,
      pendientes,
      enProceso,
      ingresos: ingresos.toFixed(2)
    };
  };

  const stats = obtenerEstadisticas();

  const renderCitaCard = (cita) => {
    const colorEstado = obtenerColorEstado(cita.estado);
    
    return (
      <TouchableOpacity
        key={cita.id}
        style={styles.citaCard}
        onPress={() => {
          if (cita.estado === 'pendiente') {
            iniciarCita(cita);
          } else if (cita.estado === 'en_proceso') {
            if (navigation) {
              navigation.navigate('SeguimientoPersonal');
            }
          }
        }}
        activeOpacity={0.8}
      >
        {/* Línea lateral de color según estado */}
        <View style={[styles.citaColorBar, { backgroundColor: colorEstado }]} />
        
        <View style={styles.citaContent}>
          {/* Header: Hora y Estado */}
          <View style={styles.citaHeader}>
            <View style={styles.horaContainer}>
              <Ionicons name="time" size={20} color="#FF6B9D" />
              <Text style={styles.citaHora}>{cita.hora}</Text>
            </View>
            
            <View style={[styles.estadoBadge, { backgroundColor: colorEstado }]}>
              <Ionicons name={obtenerIconoEstado(cita.estado)} size={14} color="#FFFFFF" />
              <Text style={styles.estadoText}>
                {obtenerTextoEstado(cita.estado)}
              </Text>
            </View>
          </View>

          {/* Información de la mascota */}
          <View style={styles.mascotaInfo}>
            <View style={styles.mascotaHeader}>
              <Text style={styles.mascotaEmoji}>{cita.mascota_foto || '🐾'}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.mascotaNombre}>{cita.mascota}</Text>
                <Text style={styles.mascotaRaza}>{cita.mascota_raza}</Text>
              </View>
            </View>
          </View>

          {/* Cliente */}
          <View style={styles.clienteInfo}>
            <Ionicons name="person-outline" size={16} color="#757575" />
            <Text style={styles.clienteNombre}>Cliente</Text>
          </View>

          {/* Servicios contratados */}
          {cita.servicios && Array.isArray(cita.servicios) && (
            <View style={styles.serviciosListContainer}>
              <Ionicons name="list-outline" size={16} color="#757575" />
              <View style={styles.serviciosChips}>
                {cita.servicios.map((servicio, index) => (
                  <View key={index} style={styles.servicioChip}>
                    <Text style={styles.servicioChipText}>{servicio}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Detalles adicionales */}
          {cita.detalles && (
            <View style={styles.detallesContainer}>
              <Text style={styles.detallesText} numberOfLines={2}>
                {cita.detalles}
              </Text>
            </View>
          )}

          {/* Notas */}
          {cita.notas && (
            <View style={styles.notasContainer}>
              <Ionicons name="document-text-outline" size={14} color="#F57C00" />
              <Text style={styles.notasText} numberOfLines={2}>
                {cita.notas}
              </Text>
            </View>
          )}

          {/* Footer: Duración y Precio */}
          <View style={styles.citaFooter}>
            <View style={styles.duracionContainer}>
              <Ionicons name="hourglass-outline" size={14} color="#9E9E9E" />
              <Text style={styles.duracionText}>{cita.duracion || '45 min'}</Text>
            </View>
            
            {cita.precio && (
              <Text style={styles.precioText}>${cita.precio}</Text>
            )}
          </View>

          {/* Botones de acción */}
          {cita.estado === 'pendiente' && (
            <TouchableOpacity
              style={styles.accionButton}
              onPress={() => iniciarCita(cita)}
            >
              <LinearGradient
                colors={['#4CAF50', '#45A049']}
                style={styles.accionGradient}
              >
                <Ionicons name="play-circle" size={20} color="#FFFFFF" />
                <Text style={styles.accionText}>Iniciar Atención</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}

          {cita.estado === 'en_proceso' && (
            <View style={styles.accionesRow}>
              <TouchableOpacity
                style={[styles.accionButton, { flex: 1, marginRight: 8 }]}
                onPress={() => {
                  if (navigation) {
                    navigation.navigate('SeguimientoPersonal');
                  }
                }}
              >
                <View style={[styles.accionGradient, { backgroundColor: '#42A5F5' }]}>
                  <Ionicons name="eye" size={20} color="#FFFFFF" />
                  <Text style={styles.accionText}>Ver Seguimiento</Text>
                </View>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B9D" />
        <Text style={styles.loadingText}>Cargando...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F5F5" />
      
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#FF6B9D']} />
        }
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header de bienvenida */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerSubtitle}>Bienvenido de nuevo</Text>
            <Text style={styles.headerTitle}>
              {userData?.nombres || 'Personal'}
            </Text>
          </View>
          <View style={styles.roleBadge}>
            <Ionicons name="briefcase" size={16} color="#FF6B9D" />
            <Text style={styles.roleText}>Personal</Text>
          </View>
        </View>

        {/* Fecha actual */}
        <View style={styles.dateContainer}>
          <Ionicons name="calendar" size={18} color="#757575" />
          <Text style={styles.dateText}>
            {new Date().toLocaleDateString('es', { 
              weekday: 'long', 
              day: 'numeric', 
              month: 'long' 
            })}
          </Text>
        </View>

        {/* Contenido */}
        <View style={styles.content}>
          {/* Estadísticas del día */}
          <View style={styles.statsContainer}>
            <LinearGradient
              colors={['#FF6B9D', '#E91E63']}
              style={styles.statsGradient}
            >
              <Text style={styles.statsTitle}>Resumen del Día</Text>
              <View style={styles.statsGrid}>
                <View style={styles.statItem}>
                  <Ionicons name="calendar" size={24} color="#FFFFFF" />
                  <Text style={styles.statNumber}>{stats.citasHoy}</Text>
                  <Text style={styles.statLabel}>Citas Totales</Text>
                </View>
                <View style={styles.statItem}>
                  <Ionicons name="checkmark-circle" size={24} color="#FFFFFF" />
                  <Text style={styles.statNumber}>{stats.completadas}</Text>
                  <Text style={styles.statLabel}>Completadas</Text>
                </View>
                <View style={styles.statItem}>
                  <Ionicons name="time" size={24} color="#FFFFFF" />
                  <Text style={styles.statNumber}>{stats.pendientes}</Text>
                  <Text style={styles.statLabel}>Pendientes</Text>
                </View>
                <View style={styles.statItem}>
                  <Ionicons name="cash" size={24} color="#FFFFFF" />
                  <Text style={styles.statNumber}>${stats.ingresos}</Text>
                  <Text style={styles.statLabel}>Ingresos</Text>
                </View>
              </View>
            </LinearGradient>
          </View>

          {/* Citas de Hoy */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Citas de Hoy</Text>
              <TouchableOpacity onPress={onRefresh}>
                <Ionicons name="refresh" size={24} color="#FF6B9D" />
              </TouchableOpacity>
            </View>

            {citasHoy.length > 0 ? (
              <View>
                {citasHoy.map(cita => renderCitaCard(cita))}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="calendar-outline" size={64} color="#E0E0E0" />
                <Text style={styles.emptyTitle}>No hay citas para hoy</Text>
                <Text style={styles.emptyText}>Disfruta tu día libre o revisa otras fechas</Text>
              </View>
            )}
          </View>

          {/* Accesos rápidos */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Accesos Rápidos</Text>
            <View style={styles.quickAccessGrid}>
              <TouchableOpacity
                style={styles.quickAccessCard}
                onPress={() => {
                  if (navigation) navigation.navigate('CitasPersonal');
                }}
              >
                <Ionicons name="calendar" size={32} color="#FF6B9D" />
                <Text style={styles.quickAccessText}>Todas las Citas</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.quickAccessCard}
                onPress={() => {
                  if (navigation) navigation.navigate('SeguimientoPersonal');
                }}
              >
                <Ionicons name="pulse" size={32} color="#FF6B9D" />
                <Text style={styles.quickAccessText}>Seguimiento</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Menú Glassmorphism - 4 opciones */}
      <View style={styles.glassMenuContainer}>
        <BlurView intensity={80} tint="light" style={styles.blurContainer}>
          <View style={styles.menuContainer}>
            {[
              { id: 'inicio', icon: 'home', label: 'Inicio' },
              { id: 'citas', icon: 'calendar', label: 'Citas' },
              { id: 'seguimiento', icon: 'pulse', label: 'Seguimiento' },
              { id: 'configuracion', icon: 'settings', label: 'Ajustes' }
            ].map((item) => {
              const isActive = activeTab === item.id;
              return (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => handleTabChange(item.id)}
                  style={[
                    styles.menuItem,
                    isActive && styles.menuItemActive
                  ]}
                >
                  <Ionicons
                    name={item.icon}
                    size={22}
                    color={isActive ? '#fff' : '#374151'}
                  />
                  <Text style={[
                    styles.menuLabel,
                    isActive && styles.menuLabelActive
                  ]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </BlurView>
      </View>
    </SafeAreaView>
  );
};

export default MenuPersonal;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F5F5' },
  loadingText: { marginTop: 12, fontSize: 16, color: '#9E9E9E' },
  scrollContent: { paddingTop: 10, paddingBottom: 120 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
  headerSubtitle: { fontSize: 14, color: '#9E9E9E', marginBottom: 4 },
  headerTitle: { fontSize: 24, fontWeight: '700', color: '#212121' },
  roleBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, gap: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  roleText: { fontSize: 12, fontWeight: '600', color: '#FF6B9D' },
  dateContainer: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20, marginBottom: 16 },
  dateText: { fontSize: 14, color: '#757575', fontWeight: '500', textTransform: 'capitalize' },
  content: { paddingHorizontal: 20 },
  statsContainer: { marginBottom: 24, borderRadius: 20, overflow: 'hidden', shadowColor: '#FF6B9D', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 12, elevation: 5 },
  statsGradient: { padding: 24 },
  statsTitle: { fontSize: 18, fontWeight: '700', color: '#FFFFFF', marginBottom: 20 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  statItem: { width: '47%', alignItems: 'center', backgroundColor: 'rgba(255, 255, 255, 0.2)', borderRadius: 16, padding: 16 },
  statNumber: { fontSize: 28, fontWeight: '700', color: '#FFFFFF', marginTop: 8 },
  statLabel: { fontSize: 12, color: 'rgba(255, 255, 255, 0.9)', marginTop: 4, textAlign: 'center' },
  section: { marginBottom: 24 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 20, fontWeight: '700', color: '#212121' },
  citaCard: { backgroundColor: '#FFFFFF', borderRadius: 20, marginBottom: 16, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 },
  citaColorBar: { height: 6 },
  citaContent: { padding: 16 },
  citaHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  horaContainer: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  citaHora: { fontSize: 18, fontWeight: '700', color: '#212121' },
  estadoBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 12 },
  estadoText: { fontSize: 11, fontWeight: '600', color: '#FFFFFF' },
  mascotaInfo: { marginBottom: 12 },
  mascotaHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  mascotaEmoji: { fontSize: 48 },
  mascotaNombre: { fontSize: 20, fontWeight: '700', color: '#212121', marginBottom: 4 },
  mascotaRaza: { fontSize: 14, color: '#757575' },
  clienteInfo: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  clienteNombre: { fontSize: 14, color: '#757575' },
  serviciosListContainer: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginBottom: 12 },
  serviciosChips: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  servicioChip: { backgroundColor: '#E8EAF6', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  servicioChipText: { fontSize: 11, color: '#6366F1', fontWeight: '600' },
  detallesContainer: { backgroundColor: '#F5F5F5', padding: 12, borderRadius: 12, marginBottom: 8 },
  detallesText: { fontSize: 13, color: '#757575', lineHeight: 18 },
  notasContainer: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, backgroundColor: '#FFF9E6', padding: 12, borderRadius: 12, marginBottom: 12 },
  notasText: { flex: 1, fontSize: 12, color: '#F57C00', lineHeight: 16 },
  citaFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F5F5F5', marginBottom: 12 },
  duracionContainer: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  duracionText: { fontSize: 13, color: '#9E9E9E' },
  precioText: { fontSize: 18, fontWeight: '700', color: '#FF6B9D' },
  accionButton: { borderRadius: 12, overflow: 'hidden' },
  accionGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, gap: 8 },
  accionText: { fontSize: 15, fontWeight: '600', color: '#FFFFFF' },
  accionesRow: { flexDirection: 'row', gap: 8 },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, backgroundColor: '#FFFFFF', borderRadius: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#757575', marginTop: 16 },
  emptyText: { fontSize: 14, color: '#9E9E9E', marginTop: 8, textAlign: 'center' },
  quickAccessGrid: { flexDirection: 'row', gap: 16 },
  quickAccessCard: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 16, padding: 24, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
  quickAccessText: { fontSize: 14, fontWeight: '600', color: '#212121', marginTop: 12 },
  glassMenuContainer: { position: 'absolute', bottom: 20, left: 20, right: 20, zIndex: 1000 },
  blurContainer: { borderRadius: 50, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.3)', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 10 },
  menuContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', paddingVertical: 12, paddingHorizontal: 8 },
  menuItem: { alignItems: 'center', justifyContent: 'center', paddingVertical: 10, paddingHorizontal: 12, borderRadius: 20, flex: 1 },
  menuItemActive: { backgroundColor: '#E91E63', shadowColor: '#E91E63', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 5 },
  menuLabel: { fontSize: 10, fontWeight: '600', color: '#374151', marginTop: 4 },
  menuLabelActive: { color: '#fff' },
});