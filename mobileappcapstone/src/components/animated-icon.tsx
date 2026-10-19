import { Image } from 'expo-image';
import * as SplashScreen from 'expo-splash-screen';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, Keyframe } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

const DURATION = 1700;

/**
 * Expo Go's own loading view cannot be branded. This overlay is the first
 * app screen after it, so Expo Go users still see a BMANNY splash screen.
 */
export function AnimatedSplashOverlay() {
  const [animate, setAnimate] = useState(false);
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  const exitKeyframe = new Keyframe({
    0: { opacity: 1 },
    72: { opacity: 1 },
    100: { opacity: 0, easing: Easing.out(Easing.cubic) },
  });

  const contents = (
    <>
      <Image
        source={require('@/assets/images/homepageicon/background.png')}
        style={styles.backgroundImage}
        contentFit="cover"
      />
      <View style={styles.backdrop} />
      <View style={styles.content}>
        <Image
          source={require('@/assets/images/bmanny-logo-hd.png')}
          style={styles.logo}
          contentFit="contain"
        />
        <Text style={styles.brandName}>BMANNY</Text>
        <Text style={styles.companyName}>PARTNERS INC.</Text>
      </View>
    </>
  );

  return animate ? (
    <Animated.View
      entering={exitKeyframe.duration(DURATION).withCallback((finished) => {
        'worklet';
        if (finished) scheduleOnRN(setVisible, false);
      })}
      style={styles.splashOverlay}>
      {contents}
    </Animated.View>
  ) : (
    <View
      onLayout={() => {
        SplashScreen.hideAsync().finally(() => setAnimate(true));
      }}
      style={styles.splashOverlay}>
      {contents}
    </View>
  );
}

export function AnimatedIcon() {
  return (
    <View style={styles.iconContainer}>
      <Image source={require('@/assets/images/homepageicon/BMANNYLOGO.png')} style={styles.iconLogo} contentFit="contain" />
    </View>
  );
}

const styles = StyleSheet.create({
  splashOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#0D1734',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  backgroundImage: {
    ...StyleSheet.absoluteFill,
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(8, 16, 43, 0.2)',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 28,
  },
  logo: {
    width: 230,
    height: 230,
    marginBottom: 30,
  },
  brandName: {
    color: '#2196F3',
    fontSize: 46,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  companyName: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginTop: 4,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 128,
    height: 128,
  },
  iconLogo: {
    width: 98,
    height: 98,
  },
});
