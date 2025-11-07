import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Platform,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const AcercaDe = ({ navigation }) => {
  const handleOpenURL = (url) => {
    Linking.openURL(url);
  };

  const InfoCard = ({ icon, title, content, color = '#FF6B9D' }) => (
    <View style={styles.infoCard}>
      <View style={[styles.infoIconContainer, { backgroundColor: `${color}15` }]}>
        <Ionicons name={icon} size={28} color={color} />
      </View>
      <Text style={styles.infoTitle}>{title}</Text>
      <Text style={styles.infoContent}>{content}</Text>
    </View>
  );

  const ContactButton = ({ icon, label, onPress }) => (
    <TouchableOpacity style={styles.contactButton} onPress={onPress}>
      <Ionicons name={icon} size={22} color="#FF6B9D" />
      <Text style={styles.contactText}>{label}</Text>
      <Ionicons name="chevron-forward" size={20} color="#BDBDBD" />
    </TouchableOpacity>
  );

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
          
          <Text style={styles.headerTitle}>Acerca de</Text>
          
          <View style={styles.backButton} />
        </View>
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Logo/Icono de la App */}
        <View style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoEmoji}>🐾</Text>
          </View>
          <Text style={styles.appName}>PetStyle</Text>
          <Text style={styles.version}>Versión 1.0.0</Text>
        </View>

        {/* Descripción */}
        <View style={styles.descriptionCard}>
          <Text style={styles.descriptionText}>
           PetStyle es tu compañero ideal para el cuidado y la belleza de tu mascota.
           Gestiona citas para baños, peinados, limpiezas dentales y tratamientos especiales,
           todo en un solo lugar para que tu peludo siempre luzca y se sienta increíble.
          </Text>
        </View>

        {/* Características */}
        <Text style={styles.sectionTitle}>CARACTERÍSTICAS</Text>
        <View style={styles.cardsContainer}>
          <InfoCard
            icon="calendar-outline"
            title="Gestión de Citas"
            content="Programa y recibe recordatorios"
            color="#FF6B9D"
          />
          <InfoCard
            icon="medkit-outline"
            title="Historial de citas"
            content="Registro completo de tus citas"
            color="#E91E63"
          />
          <InfoCard
            icon="notifications-outline"
            title="Recordatorios"
            content="Nunca olvides baños"
            color="#F06292"
          />
          <InfoCard
            icon="paw-outline"
            title="Multi-Mascotas"
            content="Administra todas tus mascotas"
            color="#EC407A"
          />
        </View>

        {/* Contacto */}
        <Text style={styles.sectionTitle}>CONTÁCTANOS</Text>
        <View style={styles.contactContainer}>
          <ContactButton
            icon="mail-outline"
            label="soporte@petStyle.com"
            onPress={() => handleOpenURL('mailto:soporte@petStyle.com')}
          />
          <ContactButton
            icon="globe-outline"
            label="www.petStyle.com"
            onPress={() => handleOpenURL('https://www.petStyle.com')}
          />
          <ContactButton
            icon="logo-instagram"
            label="@petStyle_app"
            onPress={() => handleOpenURL('https://instagram.com/petStyle_app')}
          />
        </View>

        {/* Información Legal */}
        <View style={styles.legalContainer}>
          <Text style={styles.legalText}>
            © 2025 PetStyle Todos los derechos reservados.
          </Text>
          <Text style={styles.legalText}>
            Desarrollado con ❤️ para amantes de las mascotas
          </Text>
        </View>

        {/* Créditos */}
        <View style={styles.creditsCard}>
          <Ionicons name="people-outline" size={24} color="#757575" />
          <Text style={styles.creditsText}>
            Equipo de Desarrollo NINA
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

export default AcercaDe;

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
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
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
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginVertical: 30,
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  logoEmoji: {
    fontSize: 50,
  },
  appName: {
    fontSize: 32,
    fontWeight: '700',
    color: '#212121',
    marginTop: 16,
  },
  version: {
    fontSize: 16,
    color: '#757575',
    marginTop: 4,
  },
  descriptionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  descriptionText: {
    fontSize: 15,
    lineHeight: 24,
    color: '#424242',
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#9E9E9E',
    letterSpacing: 0.5,
    marginBottom: 12,
    marginLeft: 4,
  },
  cardsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  infoCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  infoIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#212121',
    textAlign: 'center',
    marginBottom: 4,
  },
  infoContent: {
    fontSize: 12,
    color: '#757575',
    textAlign: 'center',
  },
  contactContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  contactText: {
    flex: 1,
    fontSize: 15,
    color: '#424242',
    marginLeft: 12,
  },
  legalContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  legalText: {
    fontSize: 12,
    color: '#9E9E9E',
    textAlign: 'center',
    marginVertical: 4,
  },
  creditsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  creditsText: {
    fontSize: 14,
    color: '#757575',
    fontWeight: '500',
  },
});