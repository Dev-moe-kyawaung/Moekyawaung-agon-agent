/**
 * Portfolio 2026 — single-page HTML site.
 * The actual user-facing site lives in `web/index.html` and is served by
 * Expo's web target. App.tsx is intentionally a no-op on web so that our
 * custom HTML can render without interference.
 */
import { Platform, View, Text, StyleSheet } from 'react-native';

export default function App() {
  if (Platform.OS === 'web') return null;
  return (
    <View style={styles.container}>
      <Text style={styles.text}>
        This portfolio is a web project.{'\n'}Run `npm run web` to view it.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0f',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  text: {
    color: '#a3a3b8',
    fontSize: 16,
    textAlign: 'center',
    fontFamily: 'monospace',
  },
});
