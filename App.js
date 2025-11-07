import React, { useEffect, useRef } from 'react';
import { StyleSheet, StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
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

export default function App() {
  const navigationRef = useRef();

  useEffect(() => {
    // Listener de autenticación (sin notificaciones)
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        console.log('👤 Usuario autenticado:', user.uid);
      } else {
        console.log('👤 Usuario no autenticado');
      }
    });

    // Cleanup
    return () => unsubscribe();
  }, []);

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
