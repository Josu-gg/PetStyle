import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const TerminosCondiciones = ({ navigation }) => {
  const Section = ({ title, children }) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionContent}>{children}</Text>
    </View>
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
          
          <Text style={styles.headerTitle}>Términos y Condiciones</Text>
          
          <View style={styles.backButton} />
        </View>
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.card}>
          <View style={styles.dateContainer}>
            <Ionicons name="calendar-outline" size={18} color="#757575" />
            <Text style={styles.dateText}>Última actualización: Enero 2025</Text>
          </View>

          <Text style={styles.intro}>
           Al utilizar nuestra aplicación, aceptas los siguientes términos y condiciones.
           Por favor, léelos cuidadosamente antes de usar nuestros servicios.
          </Text>

          <Section title="1. Aceptación de Términos">
            Al descargar, instalar o usar PetStyle, aceptas estar sujeto a estos Términos y Condiciones.
            Si no estás de acuerdo con alguna parte de estos términos, no debes usar la aplicación.
          </Section>

          <Section title="2. Uso de la Aplicación">
           PetStyle es una herramienta diseñada para ayudarte a gestionar los servicios de estética bienestar   de tu mascota.
            {'\n\n'}• Proporcionar información precisa y actualizada
            {'\n'}• Mantener la seguridad de tu cuenta
            {'\n'}• No usar la aplicación con fines ilegales
            {'\n'}• No intentar acceder a áreas restringidas de la aplicación
          </Section>

          <Section title="3. Privacidad y Datos">
         Tu privacidad es importante para nosotros. La información que proporcionas se utiliza únicamente para:
            {'\n\n'}Gestionar los perfiles y citas de tus mascotas
            {'\n'}• Recordar servicios como baños, peinados, limpiezas dentales y tratamientos
            {'\n'}• Mejorar nuestros servicios
            {'\n\n'}No compartimos tu información personal con terceros sin tu consentimiento explícito.
          </Section>

          <Section title="4. Responsabilidad Médica">
            PetStyle es una herramienta de organización y gestión, no un sustituto del cuidado profesional directo.
Todos los tratamientos y servicios deben ser realizados por personal calificado de estética canina.
          </Section>

          <Section title="5. Contenido del Usuario">
           Contenido del Usuario Eres responsable de todo el contenido que agregues a la aplicación, incluyendo:
            {'\n\n'}• Información de mascotas
            {'\n'}• Fotos y documentos
            {'\n'}• Notas y observaciones
            {'\n\n'}Nos reservamos el derecho de eliminar contenido que consideremos inapropiado.
          </Section>

          <Section title="6. Disponibilidad del Servicio">
           Nos esforzamos por mantener PetStyle disponible las 24 horas del día, los 7 días de la semana.
           Sin embargo, no garantizamos que el servicio sea ininterrumpido o libre de errores.
           Podemos realizar mantenimientos programados que afecten temporalmente la disponibilidad.
          </Section>

          <Section title="7. Modificaciones">
           Nos reservamos el derecho de modificar estos términos en cualquier momento.
           Te notificaremos sobre cambios importantes dentro de la aplicación.
           El uso continuado de PetStyle después de los cambios implica tu aceptación de los nuevos términos.
          </Section>

          <Section title="8. Cancelación de Cuenta">
            Puedes cancelar tu cuenta en cualquier momento desde la configuración de la aplicación.
            Al hacerlo, toda tu información será eliminada de forma permanente y no podrá recuperarse.
          </Section>

          <Section title="9. Limitación de Responsabilidad">
            PetStyle y sus desarrolladores no serán responsables por:
            {'\n\n'}• Pérdida de datos
            {'\n'}• Daños indirectos o consecuentes
            {'\n'}• Interrupciones del servicio
            {'\n'}• Decisiones tomadas basadas en la información de la app
          </Section>

          <Section title="10. Contacto">
            Si tienes preguntas sobre estos Términos y Condiciones, contáctanos en:
            {'\n\n'}📧 legal@petStyle.com
            {'\n'}🌐 www.petStyle.com/terminos
          </Section>

          <View style={styles.footer}>
            <Ionicons name="shield-checkmark" size={24} color="#4CAF50" />
            <Text style={styles.footerText}>
              Al usar PetStyle, confirmas que has leído, entendido y aceptado estos términos y condiciones.
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default TerminosCondiciones;

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
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  dateText: {
    fontSize: 13,
    color: '#757575',
    fontWeight: '500',
  },
  intro: {
    fontSize: 15,
    lineHeight: 24,
    color: '#424242',
    marginBottom: 24,
    padding: 16,
    backgroundColor: '#FFF3F6',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#FF6B9D',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#212121',
    marginBottom: 12,
  },
  sectionContent: {
    fontSize: 14,
    lineHeight: 22,
    color: '#616161',
  },
  footer: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#F1F8F4',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  footerText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 20,
    color: '#2E7D32',
    fontWeight: '500',
  },
});