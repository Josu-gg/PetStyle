import React, { useEffect, useRef } from 'react';
import { StyleSheet, StatusBar, Platform, Alert } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as Notifications from 'expo-notifications';
import { auth } from './Config/firebase';

// Pantallas de autenticación
import Bienvenida from './components/Bienvenida';
import Login from './components/Login';
import Registrarse from './components/Registrarse';

// Pantallas principales - Cliente
import Inicio from './components/Inicio';
import Citas from './components/Citas';
import Historial from './components/Historial';
import CatalogoServ from './components/CatalogoServ';
import PerfilMascota from './components/PerfilMascota';
import Perfil from './components/Perfil';
import Seguimiento from './components/Seguimiento';
import AcercaDe from './components/AcercaDe';
import TerminoCD from './components/TerminoCD';
import EditarPerfil from './components/EditarPerfil';
import MisMascotas from './components/Mismascotas';

// Pantallas principales - Personal
import MenuPersonal from './components/MenuPersonal';
import SeguimientoPersonal from './components/SeguimientoPersonal';
import CitasPersonal from './components/CitasPersonal';

const Stack = createNativeStackNavigator();

// 🔔 CONFIGURACIÓN GLOBAL DE NOTIFICACIONES
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export default function App() {
  const navigationRef = useRef();
  const notificationListener = useRef();
  const responseListener = useRef();

  useEffect(() => {
    // 🔔 Configurar notificaciones al iniciar la app
    configurarNotificaciones();

    // 📱 Listener: Notificación recibida mientras la app está abierta
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('🔔 Notificación recibida en foreground:', notification);
      const { title, body } = notification.request.content;
      
      // Mostrar alerta cuando la app está abierta
      Alert.alert(
        title || '🔔 Notificación',
        body || 'Tienes una nueva actualización',
        [{ text: 'OK', style: 'default' }]
      );
    });

    // 👆 Listener: Usuario toca la notificación
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('👆 Usuario tocó la notificación:', response);
      
      const data = response.notification.request.content.data;
      
      // Navegar según el tipo de notificación
      if (data && navigationRef.current) {
        handleNotificationNavigation(data);
      }
    });

    // 👤 Listener: Cambios en autenticación
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        console.log('👤 Usuario autenticado:', user.uid);
      } else {
        console.log('👤 Usuario no autenticado');
      }
    });

    // Cleanup
    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
      unsubscribe();
    };
  }, []);

  // 🔧 Configurar notificaciones (permisos y canal de Android)
  const configurarNotificaciones = async () => {
    try {
      console.log('🔧 Configurando notificaciones...');

      // Configurar canal de notificaciones en Android
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'Notificaciones de Servicios',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#6366F1',
          sound: 'default',
          enableVibrate: true,
          showBadge: true,
        });
        console.log('✅ Canal de Android configurado');
      }

      // Solicitar permisos al usuario
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      
      if (existingStatus !== 'granted') {
        console.log('⚠️ Solicitando permisos de notificaciones...');
        const { status } = await Notifications.requestPermissionsAsync();
        
        if (status !== 'granted') {
          console.warn('❌ Permisos de notificaciones denegados');
          return;
        }
      }

      console.log('✅ Permisos de notificaciones otorgados');
    } catch (error) {
      console.error('❌ Error configurando notificaciones:', error);
    }
  };

  // 🧭 Navegar según el tipo de notificación
  const handleNotificationNavigation = (data) => {
    try {
      console.log('🧭 Navegando según notificación:', data);

      switch (data.tipo) {
        case 'servicio_iniciado':
        case 'servicio_completado':
          // Navegar a la pantalla de seguimiento
          navigationRef.current?.navigate('Seguimiento', {
            citaId: data.citaId,
            refresh: true,
          });
          break;

        case 'cita_completa':
          // Navegar a la pantalla de seguimiento con mensaje especial
          navigationRef.current?.navigate('Seguimiento', {
            citaId: data.citaId,
            mostrarMensajeCompleto: true,
            refresh: true,
          });
          break;

        case 'cita_recordatorio':
          // Navegar a mis citas
          navigationRef.current?.navigate('Citas');
          break;

        default:
          // Por defecto, ir al inicio
          navigationRef.current?.navigate('Inicio');
          break;
      }
    } catch (error) {
      console.error('❌ Error navegando desde notificación:', error);
    }
  };

  return (
    <NavigationContainer ref={navigationRef}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F5F5" />
      <Stack.Navigator
        initialRouteName="Bienvenida"
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      >
        {/* Pantallas de Autenticación */}
        <Stack.Screen name="Bienvenida" component={Bienvenida} />
        <Stack.Screen name="Login" component={Login} />
        <Stack.Screen name="Registrarse" component={Registrarse} />

        {/* Pantallas Principales - Cliente */}
        <Stack.Screen name="Inicio" component={Inicio} />
        <Stack.Screen name="CatalogoServ" component={CatalogoServ} />
        <Stack.Screen name="PerfilMascota" component={PerfilMascota} />
        <Stack.Screen name="Citas" component={Citas} />
        <Stack.Screen name="Historial" component={Historial} />
        <Stack.Screen name="Seguimiento" component={Seguimiento} />
        <Stack.Screen name="Perfil" component={Perfil} />
        
        {/* Pantallas Adicionales */}
        <Stack.Screen name="AcercaDe" component={AcercaDe} />
        <Stack.Screen name="TerminoCD" component={TerminoCD} />
        <Stack.Screen name="EditarPerfil" component={EditarPerfil} />
        <Stack.Screen name="MisMascotas" component={MisMascotas} />

        {/* Pantallas del Personal */}
        <Stack.Screen name="MenuPersonal" component={MenuPersonal} />
        <Stack.Screen name="SeguimientoPersonal" component={SeguimientoPersonal} />
        <Stack.Screen name="CitasPersonal" component={CitasPersonal} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});