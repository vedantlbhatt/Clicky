import { useState } from 'react';
import { Button, StyleSheet, Text, TextInput, View } from 'react-native';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';
import { ref, set } from 'firebase/database';
import { auth, db } from './firebase';

export default function AuthScreen({ colors }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const submit = async () => {
    setError('');
    try {
      if (isSignUp) {
        const { user } = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(user, { displayName: name });
        // Every account starts with its own click count at /users/{uid}.
        await set(ref(db, `users/${user.uid}`), { name, clicks: 0 });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (e) {
      setError(e.message);
    }
  };

  const inputStyle = [styles.input, { color: colors.text, borderColor: colors.border }];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>{isSignUp ? 'Create account' : 'Sign in'}</Text>
      {isSignUp && (
        <TextInput
          style={inputStyle}
          placeholder="Display name"
          placeholderTextColor="#888"
          value={name}
          onChangeText={setName}
        />
      )}
      <TextInput
        style={inputStyle}
        placeholder="Email"
        placeholderTextColor="#888"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        style={inputStyle}
        placeholder="Password (6+ characters)"
        placeholderTextColor="#888"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      {!!error && <Text style={styles.error}>{error}</Text>}
      <Button title={isSignUp ? 'Sign up' : 'Sign in'} onPress={submit} />
      <Button
        title={isSignUp ? 'Have an account? Sign in' : 'New here? Create an account'}
        onPress={() => setIsSignUp(!isSignUp)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  error: {
    color: 'red',
    marginBottom: 12,
  },
});
