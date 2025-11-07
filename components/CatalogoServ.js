import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TextInput,
  StatusBar,
  Alert,
  Modal,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CatalogoServ = ({ navigation, route }) => {
  const [servicios, setServicios] = useState([]);
  const [serviciosSeleccionados, setServiciosSeleccionados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoriaActiva, setCategoriaActiva] = useState('todos');
  const [modalVisible, setModalVisible] = useState(false);
  const [servicioDetalle, setServicioDetalle] = useState(null);

  const categorias = [
    { id: 'todos', nombre: 'Todos', icono: 'apps' },
    { id: 'baño', nombre: 'Baño', icono: 'water' },
    { id: 'corte', nombre: 'Corte', icono: 'cut' },
    { id: 'estetica', nombre: 'Estética', icono: 'sparkles' },
    { id: 'salud', nombre: 'Salud', icono: 'medkit' },
  ];

  // Datos de servicios locales
  const serviciosData = [
    {
      id: 1,
      nombre: 'Baño Completo',
      descripcion: 'Baño con shampoo especial, secado y cepillado profesional',
      precio: 25,
      duracion: '45 min',
      icono: '🛁',
      categoria: 'baño',
      popular: true,
    },
    {
      id: 2,
      nombre: 'Corte de Pelo',
      descripcion: 'Corte profesional según raza y preferencias del dueño',
      precio: 35,
      duracion: '60 min',
      icono: '✂️',
      categoria: 'corte',
      popular: true,
    },
    {
      id: 3,
      nombre: 'Corte de Uñas',
      descripcion: 'Corte y limado de uñas con revisión de almohadillas',
      precio: 15,
      duracion: '20 min',
      icono: '🐾',
      categoria: 'estetica',
      popular: false,
    },
    {
      id: 4,
      nombre: 'Perfume Pet',
      descripcion: 'Aplicación de perfume especial para mascotas de larga duración',
      precio: 10,
      duracion: '10 min',
      icono: '🌸',
      categoria: 'estetica',
      popular: true,
    },
    {
      id: 5,
      nombre: 'Limpieza Dental',
      descripcion: 'Limpieza profunda y revisión dental completa por especialista',
      precio: 40,
      duracion: '30 min',
      icono: '🦷',
      categoria: 'salud',
      popular: false,
    },
    {
      id: 6,
      nombre: 'Anti-pulgas',
      descripcion: 'Aplicación de tratamiento preventivo contra pulgas y garrapatas',
      precio: 20,
      duracion: '15 min',
      icono: '🛡️',
      categoria: 'salud',
      popular: false,
    },
    {
      id: 7,
      nombre: 'Spa Completo',
      descripcion: 'Baño, corte, uñas, perfume y masaje relajante premium',
      precio: 80,
      duracion: '120 min',
      icono: '💎',
      categoria: 'estetica',
      popular: true,
    },
    {
      id: 8,
      nombre: 'Tinte Temporal',
      descripcion: 'Tinte temporal de orejas o cola con productos seguros y no tóxicos',
      precio: 25,
      duracion: '30 min',
      icono: '🎨',
      categoria: 'estetica',
      popular: false,
    },
    {
      id: 9,
      nombre: 'Baño Medicado',
      descripcion: 'Baño terapéutico con productos especiales para problemas de piel',
      precio: 35,
      duracion: '50 min',
      icono: '💊',
      categoria: 'salud',
      popular: false,
    },
    {
      id: 10,
      nombre: 'Deslanado',
      descripcion: 'Eliminación de pelo muerto para razas de doble capa',
      precio: 30,
      duracion: '45 min',
      icono: '🧹',
      categoria: 'corte',
      popular: false,
    },
  ];

  // Cargar servicios al iniciar
  useEffect(() => {
    cargarServicios();
    cargarSeleccionados();
  }, []);

  // Filtrar cuando cambia la categoría
  useEffect(() => {
    cargarServicios();
  }, [categoriaActiva]);

  const cargarServicios = async () => {
    try {
      setLoading(true);
      
      // Simular carga de API con setTimeout
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Filtrar por categoría
      let serviciosFiltrados = serviciosData;
      if (categoriaActiva !== 'todos') {
        serviciosFiltrados = serviciosData.filter(s => s.categoria === categoriaActiva);
      }
      
      setServicios(serviciosFiltrados);
    } catch (error) {
      console.error('Error al cargar servicios:', error);
      Alert.alert('Error', 'No se pudieron cargar los servicios');
    } finally {
      setLoading(false);
    }
  };

  const cargarSeleccionados = async () => {
    try {
      const guardados = await AsyncStorage.getItem('serviciosSeleccionados');
      if (guardados) {
        setServiciosSeleccionados(JSON.parse(guardados));
      }
    } catch (error) {
      console.error('Error al cargar servicios seleccionados:', error);
    }
  };

  const guardarSeleccionados = async (servicios) => {
    try {
      await AsyncStorage.setItem('serviciosSeleccionados', JSON.stringify(servicios));
    } catch (error) {
      console.error('Error al guardar servicios seleccionados:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await cargarServicios();
    setRefreshing(false);
  };

  const handleSearch = () => {
    cargarServicios();
  };

  // Función para agregar/quitar servicio del carrito
  const toggleServicio = (servicio) => {
    const existe = serviciosSeleccionados.find(s => s.id === servicio.id);
    let nuevosServicios;
    
    if (existe) {
      nuevosServicios = serviciosSeleccionados.filter(s => s.id !== servicio.id);
      Alert.alert('Removido', `${servicio.nombre} eliminado del carrito`);
    } else {
      nuevosServicios = [...serviciosSeleccionados, servicio];
      Alert.alert('Agregado', `${servicio.nombre} agregado al carrito`);
    }
    
    setServiciosSeleccionados(nuevosServicios);
    guardarSeleccionados(nuevosServicios);
  };

  // Calcular precio total
  const calcularTotal = () => {
    return serviciosSeleccionados.reduce((total, s) => total + s.precio, 0);
  };

  // Ver detalles del servicio
  const verDetalles = (servicio) => {
    setServicioDetalle(servicio);
    setModalVisible(true);
  };

  // Función para continuar a Citas
  const handleContinuar = async () => {
    if (serviciosSeleccionados.length === 0) {
      Alert.alert('Atención', 'Selecciona al menos un servicio');
      return;
    }

    try {
      // Guardar los servicios seleccionados en AsyncStorage
      await AsyncStorage.setItem('citaPendiente', JSON.stringify({
        servicios: serviciosSeleccionados,
        total: calcularTotal(),
        fecha: new Date().toISOString(),
      }));

      // Navegar a Citas
      navigation.navigate('Citas', {
        nuevaCita: true,
        servicios: serviciosSeleccionados,
        total: calcularTotal(),
      });

      // Limpiar carrito después de continuar
      setServiciosSeleccionados([]);
      await AsyncStorage.removeItem('serviciosSeleccionados');

    } catch (error) {
      console.error('Error al continuar:', error);
      Alert.alert('Error', 'No se pudo procesar la solicitud');
    }
  };

  // Limpiar carrito
  const limpiarCarrito = () => {
    Alert.alert(
      'Limpiar Carrito',
      '¿Estás seguro de que quieres eliminar todos los servicios?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Limpiar',
          style: 'destructive',
          onPress: () => {
            setServiciosSeleccionados([]);
            guardarSeleccionados([]);
          }
        }
      ]
    );
  };

  // Filtrar servicios por búsqueda
  const serviciosFiltrados = servicios.filter(s => 
    s.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.descripcion.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading && servicios.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B9D" />
        <Text style={styles.loadingText}>Cargando servicios...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <LinearGradient
        colors={['#FF6B9D', '#E91E63']}
        style={styles.header}
      >
        <View style={styles.headerTop}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={28} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Catálogo de Servicios</Text>
          {serviciosSeleccionados.length > 0 && (
            <TouchableOpacity onPress={limpiarCarrito}>
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{serviciosSeleccionados.length}</Text>
              </View>
            </TouchableOpacity>
          )}
          {serviciosSeleccionados.length === 0 && <View style={{ width: 28 }} />}
        </View>

        {/* Barra de búsqueda */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#9E9E9E" />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar servicios..."
            placeholderTextColor="#9E9E9E"
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#9E9E9E" />
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>

      {/* Categorías */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoriasScroll}
        contentContainerStyle={styles.categoriasContent}
      >
        {categorias.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            style={[
              styles.categoriaButton,
              categoriaActiva === cat.id && styles.categoriaButtonActive
            ]}
            onPress={() => setCategoriaActiva(cat.id)}
          >
            <Ionicons
              name={cat.icono}
              size={20}
              color={categoriaActiva === cat.id ? '#FFFFFF' : '#9E9E9E'}
            />
            <Text style={[
              styles.categoriaText,
              categoriaActiva === cat.id && styles.categoriaTextActive
            ]}>
              {cat.nombre}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Lista de Servicios */}
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#FF6B9D']} />
        }
      >
        {serviciosFiltrados.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="search-outline" size={64} color="#E0E0E0" />
            <Text style={styles.emptyText}>No se encontraron servicios</Text>
            <Text style={styles.emptySubtext}>Intenta con otra búsqueda</Text>
          </View>
        ) : (
          <View style={styles.serviciosList}>
            {serviciosFiltrados.map((servicio) => {
              const isSelected = serviciosSeleccionados.find(s => s.id === servicio.id);
              
              return (
                <TouchableOpacity
                  key={servicio.id}
                  style={[
                    styles.servicioCard,
                    isSelected && styles.servicioCardSelected
                  ]}
                  onPress={() => verDetalles(servicio)}
                  activeOpacity={0.8}
                >
                  {servicio.popular && (
                    <View style={styles.popularBadge}>
                      <Ionicons name="star" size={12} color="#FFFFFF" />
                      <Text style={styles.popularText}>Popular</Text>
                    </View>
                  )}

                  <View style={styles.servicioHeader}>
                    <View style={styles.servicioIconContainer}>
                      <Text style={styles.servicioIcon}>{servicio.icono}</Text>
                    </View>
                    <View style={styles.servicioInfo}>
                      <Text style={styles.servicioNombre}>{servicio.nombre}</Text>
                      <Text style={styles.servicioDescripcion} numberOfLines={2}>
                        {servicio.descripcion}
                      </Text>
                      <View style={styles.servicioDuracion}>
                        <Ionicons name="time-outline" size={14} color="#9E9E9E" />
                        <Text style={styles.servicioDuracionText}>{servicio.duracion}</Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.servicioFooter}>
                    <Text style={styles.servicioPrecio}>${servicio.precio}</Text>
                    <TouchableOpacity
                      style={[
                        styles.addButton,
                        isSelected && styles.addButtonSelected
                      ]}
                      onPress={(e) => {
                        e.stopPropagation();
                        toggleServicio(servicio);
                      }}
                    >
                      <Ionicons
                        name={isSelected ? 'checkmark' : 'add'}
                        size={20}
                        color="#FFFFFF"
                      />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Footer con precio total y botón */}
      {serviciosSeleccionados.length > 0 && (
        <View style={styles.footer}>
          <View style={styles.totalContainer}>
            <View>
              <Text style={styles.totalLabel}>
                {serviciosSeleccionados.length} servicio{serviciosSeleccionados.length > 1 ? 's' : ''}
              </Text>
              <Text style={styles.totalPrecio}>${calcularTotal()}</Text>
            </View>
            <TouchableOpacity
              style={styles.agendarButton}
              onPress={handleContinuar}
            >
              <LinearGradient
                colors={['#FF6B9D', '#E91E63']}
                style={styles.agendarGradient}
              >
                <Text style={styles.agendarText}>Continuar</Text>
                <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Modal de Detalles */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity
              style={styles.modalClose}
              onPress={() => setModalVisible(false)}
            >
              <Ionicons name="close" size={28} color="#212121" />
            </TouchableOpacity>

            {servicioDetalle && (
              <>
                <View style={styles.modalIconContainer}>
                  <Text style={styles.modalIcon}>{servicioDetalle.icono}</Text>
                </View>
                
                {servicioDetalle.popular && (
                  <View style={[styles.popularBadge, { alignSelf: 'center', marginBottom: 12 }]}>
                    <Ionicons name="star" size={12} color="#FFFFFF" />
                    <Text style={styles.popularText}>Más Solicitado</Text>
                  </View>
                )}
                
                <Text style={styles.modalNombre}>{servicioDetalle.nombre}</Text>
                <Text style={styles.modalDescripcion}>{servicioDetalle.descripcion}</Text>

                <View style={styles.modalInfo}>
                  <View style={styles.modalInfoItem}>
                    <Ionicons name="time-outline" size={20} color="#FF6B9D" />
                    <Text style={styles.modalInfoText}>{servicioDetalle.duracion}</Text>
                  </View>
                  <View style={styles.modalInfoItem}>
                    <Ionicons name="cash-outline" size={20} color="#FF6B9D" />
                    <Text style={styles.modalInfoText}>${servicioDetalle.precio}</Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.modalButton}
                  onPress={() => {
                    toggleServicio(servicioDetalle);
                    setModalVisible(false);
                  }}
                >
                  <LinearGradient
                    colors={['#FF6B9D', '#E91E63']}
                    style={styles.modalButtonGradient}
                  >
                    <Ionicons 
                      name={serviciosSeleccionados.find(s => s.id === servicioDetalle.id) ? 'checkmark-circle' : 'add-circle'} 
                      size={24} 
                      color="#FFFFFF" 
                    />
                    <Text style={styles.modalButtonText}>
                      {serviciosSeleccionados.find(s => s.id === servicioDetalle.id)
                        ? 'Quitar del carrito'
                        : 'Agregar al carrito'}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default CatalogoServ;

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
  header: {
    paddingTop: Platform.OS === 'ios' ? 50 : 40,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    width: 28,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  cartBadge: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartBadgeText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FF6B9D',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#212121',
  },
  categoriasScroll: {
    maxHeight: 60,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  categoriasContent: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 12,
  },
  categoriaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    gap: 8,
  },
  categoriaButtonActive: {
    backgroundColor: '#FF6B9D',
  },
  categoriaText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9E9E9E',
  },
  categoriaTextActive: {
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#9E9E9E',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#BDBDBD',
    marginTop: 8,
  },
  serviciosList: {
    padding: 20,
    paddingBottom: 120,
  },
  servicioCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
    position: 'relative',
  },
  servicioCardSelected: {
    borderWidth: 2,
    borderColor: '#FF6B9D',
    backgroundColor: '#FFF5F8',
  },
  popularBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFB300',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    gap: 4,
    zIndex: 10,
  },
  popularText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  servicioHeader: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  servicioIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  servicioIcon: {
    fontSize: 32,
  },
  servicioInfo: {
    flex: 1,
    paddingRight: 40,
  },
  servicioNombre: {
    fontSize: 18,
    fontWeight: '700',
    color: '#212121',
    marginBottom: 6,
  },
  servicioDescripcion: {
    fontSize: 14,
    color: '#9E9E9E',
    lineHeight: 20,
    marginBottom: 8,
  },
  servicioDuracion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  servicioDuracionText: {
    fontSize: 13,
    color: '#9E9E9E',
  },
  servicioFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
    paddingTop: 16,
  },
  servicioPrecio: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FF6B9D',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FF6B9D',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonSelected: {
    backgroundColor: '#4CAF50',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 14,
    color: '#9E9E9E',
    marginBottom: 4,
  },
  totalPrecio: {
    fontSize: 28,
    fontWeight: '700',
    color: '#212121',
  },
  agendarButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  agendarGradient: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    gap: 8,
  },
  agendarText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 30,
    paddingBottom: 40,
  },
  modalClose: {
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 10,
  },
  modalIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 20,
  },
  modalIcon: {
    fontSize: 40,
  },
  modalNombre: {
    fontSize: 24,
    fontWeight: '700',
    color: '#212121',
    textAlign: 'center',
    marginBottom: 12,
  },
  modalDescripcion: {
    fontSize: 16,
    color: '#9E9E9E',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  modalInfo: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 40,
    marginBottom: 30,
  },
  modalInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalInfoText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
  },
  modalButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  modalButtonGradient: {
    flexDirection: 'row',
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  modalButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});