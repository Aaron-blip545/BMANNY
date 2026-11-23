// Must run before Expo Router loads any screen that imports Pusher.
// Pusher uses crypto.getRandomValues when it establishes a WebSocket session.
import 'react-native-get-random-values';
import 'expo-router/entry';
