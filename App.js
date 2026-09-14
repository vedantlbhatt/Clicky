import { useEffect, useRef, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Animated, Button, Modal, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { Image } from 'expo-image';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { increment, onValue, ref, update } from 'firebase/database';
import { auth, db } from './firebase';
import AuthScreen from './AuthScreen';

const themes = {
  light: { background: '#fff', text: '#000', card: '#f2f2f2', border: '#ccc' },
  dark: { background: '#121212', text: '#fff', card: '#1e1e1e', border: '#444' },
};

export default function App() {
  const [user, setUser] = useState(undefined);
  const [dark, setDark] = useState(false);

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

  let screen = null; // null while checking for a saved session
  if (user === null) screen = <AuthScreen colors={colors} />;
  if (user) screen = <CookieScreen user={user} colors={colors} dark={dark} onToggleDark={toggleDark} />;

  return (
    <>
      {screen}
      <StatusBar style={dark ? 'light' : 'dark'} />
    </>
  );
}

function CookieScreen({ user, colors, dark, onToggleDark }) {
  const [myCount, setMyCount] = useState(0);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const scale = useRef(new Animated.Value(1)).current;

  // This account's own clicks.
  useEffect(
    () => onValue(ref(db, `users/${user.uid}/clicks`), (snap) => setMyCount(snap.val() ?? 0)),
    [user.uid]
  );

  const onPress = () => {
    // Also saves the name, so a record missing it gets fixed on the next tap.
    update(ref(db, `users/${user.uid}`), {
      clicks: increment(1),
      name: user.displayName ?? 'Anonymous',
    });
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
      <Pressable
        style={styles.settingsButton}
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

      <Text style={[styles.count, { color: colors.text }]}>{myCount} cookies</Text>
      <Pressable onPress={onPress}>
        <Animated.View style={{ transform: [{ scale }] }}>
          <Image source={require('./assets/cookie.svg')} style={styles.cookie} contentFit="contain" />
        </Animated.View>
      </Pressable>

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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsButton: {
    position: 'absolute',
    top: 60,
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
