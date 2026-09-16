import { ReactNode, useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';

const LOGO = require('../../assets/images/icon.png');
const BACKGROUND_COLOR = '#150C29';
const FADE_IN_DURATION = 900;
const HOLD_DURATION = 400;
const FADE_OUT_DURATION = 500;

type Props = {
  children: ReactNode;
};

export default function AnimatedSplash({ children }: Props) {
  const [isAppReady, setIsAppReady] = useState(false);
  const [isAnimationDone, setIsAnimationDone] = useState(false);

  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.85)).current;
  const overlayOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    (async () => {
      try {
        await SplashScreen.hideAsync();
      } catch {
        // Splash nativa ja pode ter sido escondida; seguro ignorar.
      }
      setIsAppReady(true);
    })();
  }, []);

  useEffect(() => {
    if (!isAppReady) {
      return;
    }

    Animated.sequence([
      Animated.parallel([
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: FADE_IN_DURATION,
          useNativeDriver: true,
        }),
        Animated.spring(logoScale, {
          toValue: 1,
          friction: 5,
          tension: 40,
          useNativeDriver: true,
        }),
      ]),
      Animated.delay(HOLD_DURATION),
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: FADE_OUT_DURATION,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setIsAnimationDone(true);
    });
  }, [isAppReady, logoOpacity, logoScale, overlayOpacity]);

  return (
    <View style={styles.root}>
      {children}

      {isAppReady && !isAnimationDone && (
        <Animated.View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFillObject,
            styles.overlay,
            { opacity: overlayOpacity },
          ]}
        >
          <Animated.Image
            source={LOGO}
            resizeMode="contain"
            style={[
              styles.logo,
              {
                opacity: logoOpacity,
                transform: [{ scale: logoScale }],
              },
            ]}
          />
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  overlay: {
    backgroundColor: BACKGROUND_COLOR,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  logo: {
    width: 220,
    height: 220,
  },
});
