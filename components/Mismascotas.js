import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
  doc
} from 'firebase/firestore';
import { db } from '../Config/firebase';

const MisMascotas = ({ navigation }) => {
  const [mascotas, setMascotas] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    cargarUsuarioId();
  }, []);

  // Recargar mascotas cada vez que la pantalla se enfoca
  useFocusEffect(
    React.useCallback(() => {
      if (userId) {
        cargarMascotas();
      }
    }, [userId])
  );

  const cargarUsuarioId = async () => {
    try {
      const id = await AsyncStorage.getItem('usuario_id');
      console.log('🔍 ID desde AsyncStorage:', id);
      console.log('🔍 Tipo:', typeof id);
      
      if (id) {
        setUserId(id);
        console.log('✅ Usuario ID cargado:', id);
        
        // Debug: Comparar con el ID que está en Firestore
        console.log('🔍 ¿Coincide con dcM3fpKhfZdHRFO5MtwjPPTlbN72?', id === 'dcM3fpKhfZdHRFO5MtwjPPTlbN72');
      } else {
        console.log('⚠️ No hay usuario_id en AsyncStorage');
        Alert.alert('Error', 'No hay usuario autenticado. Por favor inicia sesión nuevamente.');
        navigation.goBack();
      }
    } catch (error) {
      console.error('❌ Error al cargar usuario_id:', error);
    }
  };

  const cargarMascotas = async () => {
    try {
      setIsLoading(true);
      console.log('📥 Cargando mascotas para usuario:', userId);
      console.log('📥 Tipo de userId:', typeof userId);
      
      const mascotasRef = collection(db, 'mascotas');
      const q = query(mascotasRef, where('usuario_id', '==', userId));
      const querySnapshot = await getDocs(q);
      
      const mascotasData = [];
      querySnapshot.forEach((doc) => {
        console.log('📄 Documento encontrado:', doc.id, doc.data());
        mascotasData.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      setMascotas(mascotasData);
      console.log('✅ Mascotas cargadas:', mascotasData.length);
      
      // Debug: Cargar TODAS las mascotas sin filtro para verificar
      const allMascotasSnapshot = await getDocs(collection(db, 'mascotas'));
      console.log('🔍 Total de mascotas en Firestore:', allMascotasSnapshot.size);
      allMascotasSnapshot.forEach((doc) => {
        console.log('🔍 Mascota en DB - usuario_id:', doc.data().usuario_id, 'tipo:', typeof doc.data().usuario_id);
      });
      
    } catch (error) {
      console.error('❌ Error al cargar mascotas:', error);
      Alert.alert('Error', 'No se pudieron cargar las mascotas: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAgregarMascota = () => {
    navigation.navigate('PerfilMascota', { mode: 'create', userId });
  };

  const handleEditarMascota = (mascota) => {
    navigation.navigate('PerfilMascota', { 
      mode: 'edit', 
      mascota: mascota,
      userId 
    });
  };

  const handleEliminarMascota = (mascota) => {
    Alert.alert(
      'Eliminar Mascota',
      `¿Estás seguro que deseas eliminar a ${mascota.nombre}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('🗑️ Eliminando mascota:', mascota.id);
              
              // Eliminar de Firestore
              await deleteDoc(doc(db, 'mascotas', mascota.id));
              
              // Actualizar estado local
              setMascotas(mascotas.filter(m => m.id !== mascota.id));
              
              Alert.alert('Éxito', `${mascota.nombre} ha sido eliminado`);
              console.log('✅ Mascota eliminada exitosamente');
            } catch (error) {
              console.error('❌ Error al eliminar:', error);
              Alert.alert('Error', 'No se pudo eliminar la mascota: ' + error.message);
            }
          },
        },
      ]
    );
  };

  const MascotaCard = ({ mascota }) => (
    <TouchableOpacity
      style={styles.mascotaCard}
      onPress={() => handleEditarMascota(mascota)}
      activeOpacity={0.7}
    >
      <View style={styles.mascotaHeader}>
        <View style={styles.mascotaAvatarContainer}>
          <Text style={styles.mascotaAvatar}>{mascota.foto}</Text>
        </View>
        
        <View style={styles.mascotaInfo}>
          <Text style={styles.mascotaNombre}>{mascota.nombre}</Text>
          <Text style={styles.mascotaRaza}>{mascota.raza}</Text>
          <View style={styles.mascotaDetalles}>
            <View style={styles.detalle}>
              <Ionicons name="calendar-outline" size={14} color="#757575" />
              <Text style={styles.detalleText}>{mascota.edad} años</Text>
            </View>
            <View style={styles.detalle}>
              <Ionicons name="fitness-outline" size={14} color="#757575" />
              <Text style={styles.detalleText}>{mascota.peso} kg</Text>
            </View>
            {mascota.genero && (
              <View style={styles.detalle}>
                <Ionicons 
                  name={mascota.genero === 'Macho' ? 'male' : 'female'} 
                  size={14} 
                  color={mascota.genero === 'Macho' ? '#2196F3' : '#FF6B9D'} 
                />
                <Text style={styles.detalleText}>{mascota.genero}</Text>
              </View>
            )}
          </View>
        </View>

        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => handleEliminarMascota(mascota)}
        >
          <Ionicons name="trash-outline" size={20} color="#FF3B30" />
        </TouchableOpacity>
      </View>

      {mascota.proximaCita && (
        <View style={styles.citaBadge}>
          <Ionicons name="alert-circle" size={16} color="#FF9800" />
          <Text style={styles.citaText}>Próxima cita: {mascota.proximaCita}</Text>
        </View>
      )}

      <View style={styles.cardFooter}>
        <TouchableOpacity style={styles.footerButton}>
          <Ionicons name="document-text-outline" size={18} color="#FF6B9D" />
          <Text style={styles.footerButtonText}>Historial</Text>
        </TouchableOpacity>
        <View style={styles.footerDivider} />
        <TouchableOpacity style={styles.footerButton}>
          <Ionicons name="calendar-outline" size={18} color="#FF6B9D" />
          <Text style={styles.footerButtonText}>Citas</Text>
        </TouchableOpacity>
        <View style={styles.footerDivider} />
        <TouchableOpacity 
          style={styles.footerButton}
          onPress={() => handleEditarMascota(mascota)}
        >
          <Ionicons name="create-outline" size={18} color="#FF6B9D" />
          <Text style={styles.footerButtonText}>Editar</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#FF6B9D" />
        <Text style={{ marginTop: 10, color: '#757575' }}>Cargando mascotas...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <LinearGradient
        colors={['#FF6B9D', '#E91E63']}
        style={styles.header}
      >
        <View style={styles.headerTop}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="chevron-back" size={28} color="#FFFFFF" />
          </TouchableOpacity>
          
          <Text style={styles.headerTitle}>Mis Mascotas</Text>
          
          <TouchableOpacity 
            onPress={handleAgregarMascota}
            style={styles.addButton}
          >
            <Ionicons name="add" size={28} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{mascotas.length}</Text>
            <Text style={styles.statLabel}>Mascotas</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {mascotas.filter(m => m.proximaCita).length}
            </Text>
            <Text style={styles.statLabel}>Citas Próximas</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {mascotas.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIcon}>
              <Ionicons name="paw-outline" size={60} color="#E0E0E0" />
            </View>
            <Text style={styles.emptyTitle}>No tienes mascotas registradas</Text>
            <Text style={styles.emptyText}>
              Agrega tu primera mascota para comenzar a llevar un registro de su salud y citas.
            </Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={handleAgregarMascota}
            >
              <LinearGradient
                colors={['#FF6B9D', '#E91E63']}
                style={styles.emptyButtonGradient}
              >
                <Ionicons name="add" size={24} color="#FFFFFF" />
                <Text style={styles.emptyButtonText}>Agregar Mascota</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {mascotas.map((mascota) => (
              <MascotaCard key={mascota.id} mascota={mascota} />
            ))}

            <TouchableOpacity
              style={styles.addMoreButton}
              onPress={handleAgregarMascota}
            >
              <Ionicons name="add-circle-outline" size={24} color="#FF6B9D" />
              <Text style={styles.addMoreText}>Agregar otra mascota</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </View>
  );
};

export default MisMascotas;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
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
    padding: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  addButton: {
    padding: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 16,
    padding: 16,
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: 13,
    color: '#FFFFFF',
    marginTop: 4,
    opacity: 0.9,
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 16,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  mascotaCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  mascotaHeader: {
    flexDirection: 'row',
    padding: 16,
  },
  mascotaAvatarContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#FFE5EE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  mascotaAvatar: {
    fontSize: 36,
  },
  mascotaInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  mascotaNombre: {
    fontSize: 20,
    fontWeight: '700',
    color: '#212121',
    marginBottom: 4,
  },
  mascotaRaza: {
    fontSize: 14,
    color: '#757575',
    marginBottom: 8,
  },
  mascotaDetalles: {
    flexDirection: 'row',
    gap: 12,
  },
  detalle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detalleText: {
    fontSize: 12,
    color: '#757575',
  },
  menuButton: {
    padding: 8,
  },
  citaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    paddingVertical: 8,
    paddingHorizontal: 16,
    gap: 8,
  },
  citaText: {
    fontSize: 13,
    color: '#F57C00',
    fontWeight: '500',
  },
  cardFooter: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  footerButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
  },
  footerButtonText: {
    fontSize: 13,
    color: '#FF6B9D',
    fontWeight: '600',
  },
  footerDivider: {
    width: 1,
    backgroundColor: '#F0F0F0',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#212121',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 15,
    color: '#757575',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  emptyButton: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#E91E63',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  emptyButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    gap: 8,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  addMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#FFE5EE',
    borderStyle: 'dashed',
    gap: 8,
    marginTop: 8,
  },
  addMoreText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FF6B9D',
  },
});