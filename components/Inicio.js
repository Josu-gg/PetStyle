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
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

const { width } = Dimensions.get('window');

const Inicio = ({ navigation }) => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('inicio');
  const [currentTipIndex, setCurrentTipIndex] = useState(0);

  // Tips para mascotas
  const petTips = [
    {
      icon: '💧',
      title: 'Hidratación',
      description: 'Asegúrate de que tu mascota siempre tenga agua fresca y limpia disponible.',
      color: ['#4FC3F7', '#29B6F6']
    },
    {
      icon: '🎾',
      title: 'Ejercicio Diario',
      description: 'El ejercicio regular mantiene a tu mascota feliz, saludable y con energía positiva.',
      color: ['#81C784', '#66BB6A']
    },
    {
      icon: '🥗',
      title: 'Alimentación',
      description: 'Una dieta balanceada es clave para la salud y el pelaje brillante de tu mascota.',
      color: ['#FFB74D', '#FFA726']
    },
    {
      icon: '💤',
      title: 'Descanso',
      description: 'Tu mascota necesita de 12-14 horas de sueño diario para estar saludable.',
      color: ['#BA68C8', '#AB47BC']
    },
    {
      icon: '🏥',
      title: 'Chequeos',
      description: 'Visita al veterinario regularmente para prevenir enfermedades y mantener vacunas al día.',
      color: ['#E57373', '#EF5350']
    }
  ];

  // Datos de bienestar
  const wellnessData = [
    { icon: 'fitness', label: 'Actividad', value: '85%', color: '#66BB6A' },
    { icon: 'water', label: 'Hidratación', value: '92%', color: '#29B6F6' },
    { icon: 'restaurant', label: 'Nutrición', value: '78%', color: '#FFA726' },
    { icon: 'moon', label: 'Descanso', value: '90%', color: '#AB47BC' }
  ];

  const fetchUserData = async () => {
    try {
      const response = await fetch('https://tu-api.com/api/usuario', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) throw new Error('Error al cargar usuario');
      
      const data = await response.json();
      setUserData(data);
    } catch (error) {
      console.error('Error fetching user:', error);
      setUserData({
        nombre: 'María',
        apellido: 'González',
        mascota: 'Max'
      });
    }
  };

  useEffect(() => {
    loadData();
    
    // Cambiar tip cada 5 segundos
    const tipInterval = setInterval(() => {
      setCurrentTipIndex((prev) => (prev + 1) % petTips.length);
    }, 5000);

    return () => clearInterval(tipInterval);
  }, []);

  const loadData = async () => {
    setLoading(true);
    await fetchUserData();
    setLoading(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    
    switch(tabId) {
      case 'inicio':
        break;
      case 'servicios':
        if (navigation) navigation.navigate('CatalogoServ');
        break;
      case 'perfil-mascota':
        if (navigation) navigation.navigate('PerfilMascota');
        break;
      case 'citas':
        if (navigation) navigation.navigate('Citas');
        break;
      case 'historial':
        if (navigation) navigation.navigate('Historial');
        break;
      case 'seguimiento':
        if (navigation) navigation.navigate('Seguimiento');
        break;
      case 'configuracion':
        if (navigation) navigation.navigate('Perfil');
        break;
      default:
        break;
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B9D" />
        <Text style={styles.loadingText}>Cargando...</Text>
      </View>
    );
  }

  const currentTip = petTips[currentTipIndex];

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
        <View style={styles.content}>
          {/* Tip del día - Card animado */}
          <TouchableOpacity
            style={styles.tipCard}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={currentTip.color}
              style={styles.tipGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.tipHeader}>
                <Text style={styles.tipIcon}>{currentTip.icon}</Text>
                <View style={styles.tipBadge}>
                  <Text style={styles.tipBadgeText}>Tip del día</Text>
                </View>
              </View>
              <Text style={styles.tipTitle}>{currentTip.title}</Text>
              <Text style={styles.tipDescription}>{currentTip.description}</Text>
              
              {/* Indicadores de tips */}
              <View style={styles.tipIndicators}>
                {petTips.map((_, index) => (
                  <View
                    key={index}
                    style={[
                      styles.indicator,
                      index === currentTipIndex && styles.indicatorActive
                    ]}
                  />
                ))}
              </View>
            </LinearGradient>
          </TouchableOpacity>

          {/* Bienestar de la mascota */}
          <View style={styles.wellnessSection}>
            <Text style={styles.sectionTitle}>Servicios destacados</Text>
            <View style={styles.wellnessGrid}>
              <View style={styles.wellnessCard}>
                <View style={[styles.wellnessIconContainer, { backgroundColor: '#FF6B9D20' }]}>
                  <Ionicons name="cut" size={24} color="#FF6B9D" />
                </View>
                <Text style={styles.wellnessLabel}>Corte</Text>
                <Text style={[styles.wellnessValue, { color: '#FF6B9D' }]}>Premium</Text>
              </View>
              <View style={styles.wellnessCard}>
                <View style={[styles.wellnessIconContainer, { backgroundColor: '#29B6F620' }]}>
                  <Ionicons name="water" size={24} color="#29B6F6" />
                </View>
                <Text style={styles.wellnessLabel}>Baño</Text>
                <Text style={[styles.wellnessValue, { color: '#29B6F6' }]}>Spa</Text>
              </View>
              <View style={styles.wellnessCard}>
                <View style={[styles.wellnessIconContainer, { backgroundColor: '#FFA72620' }]}>
                  <Ionicons name="sparkles" size={24} color="#FFA726" />
                </View>
                <Text style={styles.wellnessLabel}>Estética</Text>
                <Text style={[styles.wellnessValue, { color: '#FFA726' }]}>Completa</Text>
              </View>
              <View style={styles.wellnessCard}>
                <View style={[styles.wellnessIconContainer, { backgroundColor: '#AB47BC20' }]}>
                  <Ionicons name="medkit" size={24} color="#AB47BC" />
                </View>
                <Text style={styles.wellnessLabel}>Cuidado</Text>
                <Text style={[styles.wellnessValue, { color: '#AB47BC' }]}>Médico</Text>
              </View>
            </View>
          </View>

          {/* Botón principal a servicios */}
          <TouchableOpacity
            style={styles.mainServiceButton}
            onPress={() => navigation?.navigate('CatalogoServ')}
            activeOpacity={0.95}
          >
            <LinearGradient
              colors={['#FF6B9D', '#E91E63']}
              style={styles.serviceButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.serviceButtonContent}>
                <View>
                  <Text style={styles.serviceButtonTitle}>Explorar Servicios</Text>
                  <Text style={styles.serviceButtonSubtitle}>Descubre todo lo que podemos hacer por tu mascota</Text>
                </View>
                <View style={styles.serviceButtonIcon}>
                  <Ionicons name="arrow-forward" size={28} color="#FFFFFF" />
                </View>
              </View>
            </LinearGradient>
          </TouchableOpacity>

          {/* Cards informativos */}
          <View style={styles.infoCardsContainer}>
            <TouchableOpacity style={[styles.infoCard, styles.infoCardPrimary]}>
              <View style={styles.infoCardIcon}>
                <Ionicons name="calendar" size={28} color="#FFB300" />
              </View>
              <Text style={styles.infoCardTitle}>Agendar Cita</Text>
              <Text style={styles.infoCardText}>Reserva tu próxima visita</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.infoCard, styles.infoCardSecondary]}>
              <View style={styles.infoCardIcon}>
                <Ionicons name="heart" size={28} color="#E91E63" />
              </View>
              <Text style={styles.infoCardTitle}>Perfil Mascota</Text>
              <Text style={styles.infoCardText}>Información completa</Text>
            </TouchableOpacity>
          </View>

          {/* Información adicional */}
          <View style={styles.extraInfoSection}>
            <View style={styles.extraInfoCard}>
              <Ionicons name="shield-checkmark" size={32} color="#66BB6A" />
              <View style={styles.extraInfoContent}>
                <Text style={styles.extraInfoTitle}>Personal Certificado</Text>
                <Text style={styles.extraInfoText}>Profesionales capacitados para el cuidado de tu mascota</Text>
              </View>
            </View>

            <View style={styles.extraInfoCard}>
              <Ionicons name="time" size={32} color="#29B6F6" />
              <View style={styles.extraInfoContent}>
                <Text style={styles.extraInfoTitle}>Horarios Flexibles</Text>
                <Text style={styles.extraInfoText}>Abierto de lunes a domingo para tu comodidad</Text>
              </View>
            </View>

            <View style={styles.extraInfoCard}>
              <Ionicons name="star" size={32} color="#FFB300" />
              <View style={styles.extraInfoContent}>
                <Text style={styles.extraInfoTitle}>Calidad Garantizada</Text>
                <Text style={styles.extraInfoText}>Productos premium y resultados excepcionales</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Menú Glassmorphism */}
      <View style={styles.glassMenuContainer}>
        <BlurView intensity={80} tint="light" style={styles.blurContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.menuContainer}
          >
            {[
              { id: 'inicio', icon: 'home', label: 'Inicio' },
              { id: 'servicios', icon: 'briefcase', label: 'Servicios' },
              { id: 'perfil-mascota', icon: 'heart', label: 'Mascota' },
              { id: 'citas', icon: 'calendar', label: 'Citas' },
              { id: 'historial', icon: 'time', label: 'Historial' },
              { id: 'seguimiento', icon: 'pulse', label: 'Seguimiento' },
              { id: 'configuracion', icon: 'settings', label: 'Config' }
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
          </ScrollView>
        </BlurView>
      </View>
    </SafeAreaView>
  );
};

export default Inicio;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#9E9E9E',
  },
  scrollContent: {
    paddingTop: 20,
  },
  content: {
    padding: 20,
    paddingBottom: 120,
  },
  
  // Header
  header: {
    marginBottom: 24,
  },
  greeting: {
    fontSize: 16,
    color: '#757575',
    marginBottom: 4,
  },
  userName: {
    fontSize: 28,
    fontWeight: '700',
    color: '#212121',
  },
  notificationButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  notificationBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#E91E63',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },

  // Tip Card
  tipCard: {
    marginBottom: 24,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  tipGradient: {
    padding: 24,
    minHeight: 200,
  },
  tipHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  tipIcon: {
    fontSize: 48,
  },
  tipBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  tipBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  tipTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  tipDescription: {
    fontSize: 16,
    lineHeight: 24,
    color: 'rgba(255, 255, 255, 0.95)',
    marginBottom: 20,
  },
  tipIndicators: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 'auto',
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  indicatorActive: {
    width: 24,
    backgroundColor: '#FFFFFF',
  },

  // Wellness Section
  wellnessSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#212121',
    marginBottom: 16,
  },
  wellnessGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  wellnessCard: {
    width: (width - 56) / 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  wellnessIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  wellnessLabel: {
    fontSize: 14,
    color: '#757575',
    marginBottom: 4,
  },
  wellnessValue: {
    fontSize: 20,
    fontWeight: '700',
  },

  // Main Service Button
  mainServiceButton: {
    marginBottom: 24,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#E91E63',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  serviceButtonGradient: {
    padding: 24,
  },
  serviceButtonContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  serviceButtonTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  serviceButtonSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    maxWidth: '80%',
  },
  serviceButtonIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Info Cards
  infoCardsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  infoCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  infoCardPrimary: {
    borderLeftWidth: 4,
    borderLeftColor: '#FFB300',
  },
  infoCardSecondary: {
    borderLeftWidth: 4,
    borderLeftColor: '#E91E63',
  },
  infoCardIcon: {
    marginBottom: 12,
  },
  infoCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#212121',
    marginBottom: 6,
  },
  infoCardText: {
    fontSize: 13,
    color: '#757575',
    lineHeight: 18,
  },

  // Extra Info Section
  extraInfoSection: {
    gap: 16,
  },
  extraInfoCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    gap: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  extraInfoContent: {
    flex: 1,
  },
  extraInfoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#212121',
    marginBottom: 6,
  },
  extraInfoText: {
    fontSize: 14,
    color: '#757575',
    lineHeight: 20,
  },
  
  // Menu Glassmorphism
  glassMenuContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    zIndex: 1000,
  },
  blurContainer: {
    borderRadius: 50,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  menuContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 8,
  },
  menuItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    minWidth: 80,
  },
  menuItemActive: {
    backgroundColor: '#E91E63',
    shadowColor: '#E91E63',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 5,
  },
  menuLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#374151',
    marginTop: 4,
  },
  menuLabelActive: {
    color: '#fff',
  },
});