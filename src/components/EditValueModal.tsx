import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/useColorScheme';

interface EditValueModalProps {
  visible: boolean;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  message?: string;
  initialValue: number;
  suffix?: string;
  decimal?: boolean;
  /** Return an error message to block saving, or null if valid */
  validate?: (value: number) => string | null;
  onSubmit: (value: number) => void;
  onClose: () => void;
}

/**
 * Cross-platform number editor (Alert.prompt only exists on iOS).
 */
export function EditValueModal({
  visible, icon, title, message, initialValue, suffix, decimal, validate, onSubmit, onClose,
}: EditValueModalProps) {
  const { colors } = useColorScheme();
  const [text, setText] = useState(String(initialValue));
  const [error, setError] = useState<string | null>(null);

  // Fresh value every time the dialog opens
  const handleShow = () => {
    setText(String(initialValue));
    setError(null);
  };

  const handleSave = () => {
    const value = decimal ? parseFloat(text.replace(',', '.')) : parseInt(text, 10);
    if (isNaN(value) || value < 0) {
      setError('Geçerli bir sayı gir.');
      return;
    }
    const problem = validate?.(value) ?? null;
    if (problem) {
      setError(problem);
      return;
    }
    onSubmit(value);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} onShow={handleShow} statusBarTranslucent>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <View style={[styles.iconCircle, { backgroundColor: colors.primary + '20' }]}>
            <Ionicons name={icon} size={28} color={colors.primary} />
          </View>
          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
          {message ? <Text style={[styles.message, { color: colors.textSecondary }]}>{message}</Text> : null}

          <View style={[styles.inputRow, { borderColor: error ? colors.error : colors.cardBorder, backgroundColor: colors.background }]}>
            <TextInput
              style={[styles.input, { color: colors.text }]}
              value={text}
              onChangeText={(t) => { setText(t); setError(null); }}
              keyboardType={decimal ? 'decimal-pad' : 'number-pad'}
              autoFocus
              selectTextOnFocus
              maxLength={7}
            />
            {suffix ? <Text style={[styles.suffix, { color: colors.textSecondary }]}>{suffix}</Text> : null}
          </View>
          {error ? <Text style={[styles.error, { color: colors.error }]}>{error}</Text> : null}

          <View style={styles.buttons}>
            <TouchableOpacity style={[styles.button, { backgroundColor: colors.cardBorder }]} onPress={onClose}>
              <Text style={[styles.buttonText, { color: colors.text }]}>İptal</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, { backgroundColor: colors.primary }]} onPress={handleSave}>
              <Text style={[styles.buttonText, { color: '#FFF' }]}>Kaydet</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: 6,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
    borderWidth: 2,
    borderRadius: 12,
    paddingHorizontal: 14,
    marginTop: 18,
  },
  input: {
    flex: 1,
    fontSize: 22,
    fontWeight: '700',
    paddingVertical: 12,
  },
  suffix: {
    fontSize: 15,
    fontWeight: '600',
  },
  error: {
    alignSelf: 'flex-start',
    fontSize: 13,
    marginTop: 6,
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
    alignSelf: 'stretch',
    marginTop: 20,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
  },
});
