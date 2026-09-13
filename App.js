import { useRef, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';

export default function App() {
  const [count, setCount] = useState(0);
  const scale = useRef(new Animated.Value(1)).current;

  const onPress = () => {
    setCount((c) => c + 1);
    scale.setValue(1);
    Animated.sequence([
      Animated.timing(scale, { toValue: 1.15, duration: 80, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, friction: 3, useNativeDriver: true }),
    ]).start();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.count}>{count} cookies</Text>
      <Pressable onPress={onPress}>
        <Animated.View style={{ transform: [{ scale }] }}>
          <Image source={require('./assets/cookie.svg')} style={styles.cookie} contentFit="contain" />
        </Animated.View>
      </Pressable>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
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
});
