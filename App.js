import { useEffect, useRef, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Animated, Button, Modal, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { Image } from 'expo-image';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DarkTheme, DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { increment, onValue, ref, update } from 'firebase/database';
import { auth, db } from './firebase';
import AuthScreen from './AuthScreen';
import LeaderboardScreen from './LeaderboardScreen';

// accent is the cookie brown, lightened in dark mode so it stays visible.
const themes = {
  light: {
    background: '#fff',
    text: '#000',
    muted: '#6e6e73',
    card: '#f2f2f2',
    border: '#ccc',
    accent: '#6D3C17',
    onAccent: '#fff',
  },
  dark: {
    background: '#121212',
    text: '#fff',
    muted: '#98989f',
    card: '#1e1e1e',
    border: '#444',
    accent: '#D59241',
    onAccent: '#121212',
  },
};

// A stack navigator: opening a screen slides it on top, and back pops it off.
const Stack = createNativeStackNavigator();

// Root component. Tracks who is signed in and the theme, then picks which screens to show.
export default function App() {
  const [user, setUser] = useState(undefined); // undefined = loading, null = signed out
  const [dark, setDark] = useState(false);

  // Firebase calls setUser on sign-in and sign-out. Returning the unsubscribe
  // function removes the listener if App ever unmounts.
  useEffect(() => onAuthStateChanged(auth, setUser), []);

  // Remember the theme choice between launches.
  useEffect(() => {
    AsyncStorage.getItem('darkMode').then((value) => setDark(value === 'true'));
  }, []);

  const toggleDark = (value) => {
    setDark(value);
    AsyncStorage.setItem('darkMode', String(value));
  };

  const colors = dark ? themes.dark : themes.light;

  // The navigation header follows the app's own dark mode switch too.
  const base = dark ? DarkTheme : DefaultTheme;
  const navTheme = {
    ...base,
    colors: {
      ...base.colors,
      primary: colors.accent,
      background: colors.background,
      card: colors.background,
      text: colors.text,
      border: colors.border,
    },
  };

  if (user === undefined) return null; // still checking for a saved session

  // Signed-out users only get the sign-in screen, so back can't return to it after signing in.
  return (
    <SafeAreaProvider>
      <NavigationContainer theme={navTheme}>
        <Stack.Navigator>
          {user ? (
            <>
              <Stack.Screen name="Clicker" options={{ title: 'Clicky', headerShown: false }}>
                {({ navigation }) => (
                  <CookieScreen
                    user={user}
                    colors={colors}
                    dark={dark}
                    onToggleDark={toggleDark}
                    onOpenLeaderboard={() => navigation.navigate('Leaderboard')}
                  />
                )}
              </Stack.Screen>
              <Stack.Screen
                name="Leaderboard"
                options={{ headerLargeTitle: true, headerShadowVisible: false }}
              >
                {() => <LeaderboardScreen uid={user.uid} colors={colors} />}
              </Stack.Screen>
            </>
          ) : (
            <Stack.Screen name="SignIn" options={{ headerShown: false }}>
              {() => <AuthScreen colors={colors} />}
            </Stack.Screen>
          )}
        </Stack.Navigator>
      </NavigationContainer>
      <StatusBar style={dark ? 'light' : 'dark'} />
    </SafeAreaProvider>
  );
}

// Main screen: the cookie, this account's count, a settings popup, and a leaderboard button.
function CookieScreen({ user, colors, dark, onToggleDark, onOpenLeaderboard }) {
  const [myCount, setMyCount] = useState(0);
  const [settingsOpen, setSettingsOpen] = useState(false);
  // Cookie size multiplier for the bounce animation (1 = normal size).
  const scale = useRef(new Animated.Value(1)).current;
  // Space used by the notch and home indicator, so buttons don't sit underneath them.
  const insets = useSafeAreaInsets();

  // This account's own clicks. onValue fires once right away, then again on
  // every change, including taps from this account on other devices.
  useEffect(
    () => onValue(ref(db, `users/${user.uid}/clicks`), (snap) => setMyCount(snap.val() ?? 0)),
    [user.uid]
  );

  const onPress = () => {
    // increment(1) is applied by the server, so taps from two devices at once both count.
    // Also saves the name, so a record missing it gets fixed on the next tap.
    update(ref(db, `users/${user.uid}`), {
      clicks: increment(1),
      name: user.displayName ?? 'Anonymous',
    });
    // Bounce: grow to 115% quickly, then spring back to normal size.
    scale.setValue(1);
    Animated.sequence([
      Animated.timing(scale, { toValue: 1.15, duration: 80, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, friction: 3, useNativeDriver: true }),
    ]).start();
  };

  const onSignOut = () => {
    setSettingsOpen(false);
    signOut(auth);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Gear icon in the top-right corner opens settings */}
      <Pressable
        style={[styles.settingsButton, { top: insets.top + 8 }]}
        onPress={() => setSettingsOpen(true)}
        hitSlop={12}
        accessibilityLabel="Settings"
      >
        <Image
          source={dark ? require('./assets/gear-white.svg') : require('./assets/gear-black.svg')}
          style={styles.settingsIcon}
          contentFit="contain"
        />
      </Pressable>

      {/* The count and the cookie itself */}
      <Text style={[styles.count, { color: colors.text }]}>{myCount} cookies</Text>
      <Pressable onPress={onPress}>
        <Animated.View style={{ transform: [{ scale }] }}>
          <Image source={require('./assets/cookie.svg')} style={styles.cookie} contentFit="contain" />
        </Animated.View>
      </Pressable>

      {/* Full-width button pinned to the bottom; shrinks slightly while pressed */}
      <Pressable
        onPress={onOpenLeaderboard}
        accessibilityRole="button"
        style={({ pressed }) => [
          styles.leaderboardButton,
          {
            bottom: insets.bottom + 16,
            backgroundColor: colors.accent,
            opacity: pressed ? 0.85 : 1,
            transform: [{ scale: pressed ? 0.97 : 1 }],
          },
        ]}
      >
        <Text style={[styles.leaderboardLabel, { color: colors.onAccent }]}>Leaderboard</Text>
      </Pressable>

      {/* Settings popup over a dimmed background. onRequestClose handles Android's back button. */}
      <Modal
        visible={settingsOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setSettingsOpen(false)}
      >
        <View style={styles.backdrop}>
          <View style={[styles.sheet, { backgroundColor: colors.card }]}>
            <Text style={[styles.sheetTitle, { color: colors.text }]}>Settings</Text>
            <Text style={[styles.signedInAs, { color: colors.text }]}>
              Signed in as {user.displayName ?? user.email}
            </Text>
            <View style={[styles.row, { borderColor: colors.border }]}>
              <Text style={[styles.rowLabel, { color: colors.text }]}>Dark mode</Text>
              <Switch value={dark} onValueChange={onToggleDark} />
            </View>
            <Button title="Sign out" color="red" onPress={onSignOut} />
            <Button title="Close" onPress={() => setSettingsOpen(false)} />
          </View>
        </View>
      </Modal>
    </View>
  );
}

// Layout and sizing. Theme colors are applied inline above so they can change at runtime.
const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsButton: {
    position: 'absolute',
    right: 24,
    padding: 8,
  },
  settingsIcon: {
    width: 28,
    height: 28,
  },
  count: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 40,
  },
  cookie: {
    width: 220,
    height: 220,
  },
  leaderboardButton: {
    position: 'absolute',
    left: 24,
    right: 24,
    height: 56,
    borderRadius: 28,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
  },
  leaderboardLabel: {
    fontSize: 17,
    fontWeight: '600',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    padding: 24,
  },
  sheet: {
    borderRadius: 16,
    padding: 24,
  },
  sheetTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  signedInAs: {
    opacity: 0.6,
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: 12,
    marginBottom: 16,
  },
  rowLabel: {
    fontSize: 18,
  },
});
