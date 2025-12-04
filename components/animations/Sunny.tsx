import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Clouds from './Clouds'; // Import the Clouds component

const ROTATION_DURATION = 4000; // 4 seconds for a full rotation
const PULSE_DURATION = 2000; // 2 seconds for one pulse cycle

// Animated Sun Ray component
const SunRay = ({ angle, delay, length }: { angle: number; delay: number; length: number }) => {
  const opacity = useSharedValue(0.4);
  const scale = useSharedValue(1);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.9, { duration: PULSE_DURATION / 2 }),
        withTiming(0.4, { duration: PULSE_DURATION / 2 })
      ),
      -1,
      true
    );

    scale.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: PULSE_DURATION / 2 }),
        withTiming(1, { duration: PULSE_DURATION / 2 })
      ),
      -1,
      true
    );
  }, [opacity, scale]);

  const rayStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scaleY: scale.value }],
  }));

  return (
    <Animated.View
      style={[
        styles.ray,
        {
          height: length,
          transform: [
            { rotate: `${angle}deg` },
            { translateX: 18 },
          ],
        },
        rayStyle,
      ]}
    />
  );
};

const Sunny = () => {
  const rotation = useSharedValue(0);
  const scale = useSharedValue(1);

  useEffect(() => {
    // Loop the rotation from 0 to 360 degrees
    rotation.value = withRepeat(
      withTiming(360, {
        duration: ROTATION_DURATION,
        easing: Easing.linear,
      }),
      -1,
      false
    );

    // Loop the scaling effect
    scale.value = withRepeat(
      withSequence(
        withTiming(1.2, { duration: PULSE_DURATION / 2 }),
        withTiming(1, { duration: PULSE_DURATION / 2 })
      ),
      -1,
      true // Yoyo (reverses the animation)
    );
  }, [rotation, scale]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${rotation.value}deg` }, { scale: scale.value }],
    };
  });

  // Create 4 sun rays at different angles with shorter lengths
  const rays = Array.from({ length: 4 }, (_, i) => {
    const angle = i * 90; // 90 degrees apart for fewer rays
    const length = 8 + Math.sin(i * Math.PI / 2) * 2; // Vary length between 6-10
    return <SunRay key={i} angle={angle} delay={i * 50} length={length} />;
  });

  return (
    <View style={styles.container} pointerEvents="none">
      <Clouds />
      {/* Sun Outer Glow */}
      <View style={styles.sunOuterGlow} />
      {/* Sun Glow */}
      <View style={styles.sunGlow} />
      {/* Sun Core */}
      <Animated.View style={[styles.sun, animatedStyle]} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 80,
    height: 80,
    overflow: 'hidden',
  },
  sun: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFA500', // Orange color for more realistic sun
    opacity: 0.95,
    zIndex: 2,
    // Add a subtle shadow to make it pop
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 10,
  },
  sunGlow: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 165, 0, 0.4)', // Orange glow
    zIndex: 1,
  },
  sunOuterGlow: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 215, 0, 0.2)', // Yellow outer glow
    zIndex: 0,
  },
  ray: {
    position: 'absolute',
    top: 22,
    left: 22,
    width: 2,
    height: 15,
    backgroundColor: '#FFD700',
    opacity: 0.6,
    zIndex: 0,
  },
});

export default Sunny;


