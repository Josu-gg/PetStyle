import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  StatusBar,
  Alert,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Configuracion = ({ navigation }) => {
  const [notificaciones, setNotificaciones] = useState(true);
  const [recordatorios, setRecordatorios] = useState(true);
  const [userRole, setUserRole] = useState(null);
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    cargarPreferencias();
    cargarDatosUsuario();
  }, []);

  // Cargar datos del usuario
  const cargarDatosUsuario = async () => {
    try {
      const userData = await AsyncStorage.getItem('user_data');
      if (userData) {
        const data = JSON.parse(userData);
        setUserData(data);
        setUserRole(data.rol);
        console.log('👤 Rol detectado:', data.rol);
      }
    } catch (error) {
      console.error('Error al cargar datos del usuario:', error);
    }
  };

  // Guardar y cargar preferencias locales
  const cargarPreferencias = async () => {
    try {
      const notif = await AsyncStorage.getItem('notificaciones');
      const record = await AsyncStorage.getItem('recordatorios');
      if (notif !== null) setNotificaciones(notif === 'true');
      if (record !== null) setRecordatorios(record === 'true');
    } catch (error) {
      console.error('Error al cargar preferencias:', error);
    }
  };

  const handleNotificacionesToggle = async (value) => {
    setNotificaciones(value);
    await AsyncStorage.setItem('notificaciones', value.toString());
  };

  const handleRecordatoriosToggle = async (value) => {
    if (value && !notificaciones) {
      Alert.alert(
        'Notificaciones desactivadas',
        'Primero debes activar las notificaciones push para recibir recordatorios.'
      );
      return;
    }
    setRecordatorios(value);
    await AsyncStorage.setItem('recordatorios', value.toString());
  };

  // Cerrar sesión
  const handleCerrarSesion = () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro que deseas cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar Sesión',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.clear();
            console.log('✅ Sesión cerrada');
            navigation.reset({
              index: 0,
              routes: [{ name: 'Login' }],
            });
          },
        },
      ]
    );
  };

  const colors = {
    background: '#F5F5F5',
    card: '#FFFFFF',
    text: '#212121',
    textSecondary: '#757575',
    border: '#F5F5F5',
    sectionTitle: '#9E9E9E',
  };

  const SettingItem = ({ icon, title, subtitle, onPress, rightElement }) => (
    <TouchableOpacity
      style={[stylesConfig.settingItem, { borderBottomColor: colors.border }]}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={stylesConfig.settingLeft}>
        <View style={stylesConfig.iconContainer}>
          <Ionicons name={icon} size={22} color="#FF6B9D" />
        </View>
        <View style={stylesConfig.settingText}>
          <Text style={[stylesConfig.settingTitle, { color: colors.text }]}>{title}</Text>
          {subtitle && <Text style={[stylesConfig.settingSubtitle, { color: colors.textSecondary }]}>{subtitle}</Text>}
        </View>
      </View>
      {rightElement || (
        onPress && <Ionicons name="chevron-forward" size={20} color="#BDBDBD" />
      )}
    </TouchableOpacity>
  );

  const SettingSection = ({ title, children }) => (
    <View style={stylesConfig.section}>
      <Text style={[stylesConfig.sectionTitle, { color: colors.sectionTitle }]}>{title}</Text>
      <View style={[stylesConfig.sectionContent, { backgroundColor: colors.card }]}>{children}</View>
    </View>
  );

  return (
    <View style={[stylesConfig.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="dark-content" />
      <LinearGradient colors={['#FF6B9D', '#E91E63']} style={stylesConfig.header}>
        <View style={stylesConfig.headerTop}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={stylesConfig.backButton}>
            <Ionicons name="chevron-back" size={28} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={stylesConfig.headerTitle}>Configuración</Text>
          <View style={stylesConfig.backButton} />
        </View>

        {userData && (
          <View style={stylesConfig.userInfoHeader}>
            <Text style={stylesConfig.userName}>
              {userData.nombres} {userData.apellidos}
            </Text>
            <View style={stylesConfig.roleBadgeHeader}>
              <Ionicons
                name={userRole === 'personal' ? 'briefcase' : 'person'}
                size={14}
                color="#FFFFFF"
              />
              <Text style={stylesConfig.roleTextHeader}>
                {userRole === 'personal' ? 'Personal' : 'Cliente'}
              </Text>
            </View>
          </View>
        )}
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={stylesConfig.scrollContent}>
        <SettingSection title="PERFIL">
          <SettingItem
            icon="person-outline"
            title="Editar Perfil"
            subtitle="Nombre, foto y más"
            onPress={() => navigation.navigate('EditarPerfil')}
          />

          {userRole === 'cliente' && (
            <SettingItem
              icon="paw-outline"
              title="Mis Mascotas"
              subtitle="Administra tus mascotas"
              onPress={() => navigation.navigate('MisMascotas')}
            />
          )}
        </SettingSection>

        {/* Switches (funcionan localmente, sin expo-notifications) */}
        <SettingSection title="NOTIFICACIONES">
          <SettingItem
            icon="notifications-outline"
            title="Notificaciones Push"
            subtitle="Recibe alertas importantes"
            rightElement={
              <Switch
                value={notificaciones}
                onValueChange={handleNotificacionesToggle}
                trackColor={{ false: '#E0E0E0', true: '#FFB3C6' }}
                thumbColor={notificaciones ? '#FF6B9D' : '#F5F5F5'}
              />
            }
          />
          <SettingItem
            icon="alarm-outline"
            title="Recordatorios"
            subtitle="Vacunas, medicinas y citas"
            rightElement={
              <Switch
                value={recordatorios}
                onValueChange={handleRecordatoriosToggle}
                trackColor={{ false: '#E0E0E0', true: '#FFB3C6' }}
                thumbColor={recordatorios ? '#FF6B9D' : '#F5F5F5'}
              />
            }
          />
        </SettingSection>

        <SettingSection title="GENERAL">
          <SettingItem
            icon="shield-checkmark-outline"
            title="Privacidad"
            subtitle="Controla tu información"
            onPress={() => Alert.alert('Privacidad', 'Función próximamente')}
          />
          <SettingItem
            icon="document-text-outline"
            title="Términos y Condiciones"
            onPress={() => navigation.navigate('TerminoCD')}
          />
          <SettingItem
            icon="information-circle-outline"
            title="Acerca de"
            subtitle="Versión 1.0.0"
            onPress={() => navigation.navigate('AcercaDe')}
          />
        </SettingSection>

        <View style={stylesConfig.actionButtons}>
          <TouchableOpacity
            style={[stylesConfig.logoutButton, { backgroundColor: colors.card }]}
            onPress={handleCerrarSesion}
          >
            <Ionicons name="log-out-outline" size={20} color="#FF6B9D" />
            <Text style={stylesConfig.logoutText}>Cerrar Sesión</Text>
          </TouchableOpacity>
        </View>

        <Text style={[stylesConfig.versionText, { color: colors.textSecondary }]}>
          PetStyle App v1.0.0{'\n'}
          © 2025 Todos los derechos reservados
        </Text>
      </ScrollView>
    </View>
  );
};

export default Configuracion;

const stylesConfig = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingTop: Platform.OS === 'ios' ? 50 : 40,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginBottom: 12,
  },
  backButton: {
    position: 'absolute',
    left: 0,
    padding: 4,
    zIndex: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  userInfoHeader: { alignItems: 'center', marginTop: 8 },
  userName: { fontSize: 16, fontWeight: '600', color: '#FFFFFF', marginBottom: 6 },
  roleBadgeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 6,
  },
  roleTextHeader: { fontSize: 12, fontWeight: '600', color: '#FFFFFF' },
  scrollContent: { padding: 20, paddingBottom: 40 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 12, fontWeight: '700', marginBottom: 12, marginLeft: 4 },
  sectionContent: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  settingLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#FFE5EE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingText: { flex: 1 },
  settingTitle: { fontSize: 16, fontWeight: '600', marginBottom: 2 },
  settingSubtitle: { fontSize: 13 },
  actionButtons: { marginTop: 12, gap: 12 },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FF6B9D',
    gap: 8,
  },
  logoutText: { fontSize: 16, fontWeight: '600', color: '#FF6B9D' },
  versionText: { textAlign: 'center', fontSize: 12, marginTop: 24, lineHeight: 18 },
});
