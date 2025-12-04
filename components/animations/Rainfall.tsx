import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Clouds from './Clouds'; // Import the Clouds component

const RAINDROP_COUNT = 10;
const ANIMATION_DURATION = 2000; // 2 seconds for a drop to fall

// A single raindrop
const Raindrop = ({ delay, startX }: { delay: number; startX: number }) => {
  const progress = useSharedValue(0);

  useEffect(() => {
    // withDelay allows each drop to start at a different time
    // withRepeat makes the animation loop forever
    progress.value = withDelay(
      delay,
      withRepeat(
        withTiming(1, {
          duration: ANIMATION_DURATION,
          easing: Easing.linear, // Constant speed
        }),
        -1, // Infinite repeat
        false // Do not reverse
      )
    );
  }, [progress, delay]);

  const animatedStyle = useAnimatedStyle(() => {
    // Interpolate progress (0 to 1) to a Y position within the new container
    const translateY = interpolate(progress.value, [0, 1], [-10, 80]);
    // Fade the drop out as it reaches the bottom
    const opacity = interpolate(progress.value, [0, 0.8, 1], [0.7, 0.7, 0]);

    return {
      transform: [{ translateY }, { translateX: startX }, { rotate: '10deg' }],
      opacity,
    };
  });

  return <Animated.View style={[styles.raindrop, animatedStyle]} />;
};

// The component that renders multiple drops
const Rainfall = () => {
  return (
    <View style={styles.container} pointerEvents="none">
      <Clouds />
      {/* Create an array of raindrops with different start positions and delays */}
      {Array.from({ length: RAINDROP_COUNT }).map((_, i) => (
        <Raindrop
          key={i}
          startX={Math.random() * 80 - 40} // Random horizontal position within the new width
          delay={Math.random() * ANIMATION_DURATION} // Random start delay
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    right: 0, // Align to the right corner
    height: 80, // Constrain height to avoid overlap
    width: 80, // Constrain width
    overflow: 'hidden',
  },
  raindrop: {
    position: 'absolute',
    width: 2,
    height: 15,
    backgroundColor: '#007AFF',
    borderRadius: 1,
    zIndex: 1, // Ensure raindrops are in front of clouds
  },
});

export default Rainfall;


