import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withDelay,
  interpolate,
  Easing,
} from 'react-native-reanimated';

const ANIMATION_DURATION = 12000; // Slower, more realistic speed

// A single, more realistic cloud
const Cloud = ({ delay, startY, scale, duration }: { delay: number; startY:number; scale: number; duration: number }) => {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      delay,
      withRepeat(
        withTiming(1, {
          duration,
          easing: Easing.linear,
        }),
        -1,
        false
      )
    );
  }, [progress, delay, duration]);

  const animatedStyle = useAnimatedStyle(() => {
    const translateX = interpolate(progress.value, [0, 1], [100, -100]); // Move across the 80px container
    const opacity = interpolate(progress.value, [0, 0.1, 0.9, 1], [0, 0.9, 0.9, 0]);

    return {
      transform: [{ translateX }, { translateY: startY }, { scale }],
      opacity,
    };
  });

  return (
    <Animated.View style={[styles.cloudContainer, animatedStyle]}>
      <View style={styles.cloudBase} />
      <View style={[styles.cloudPuff, styles.puff1]} />
      <View style={[styles.cloudPuff, styles.puff2]} />
      <View style={[styles.cloudPuff, styles.puff3]} />
      <View style={[styles.cloudPuff, styles.puff4]} />
    </Animated.View>
  );
};

// The component that renders multiple clouds
const Clouds = () => {
  return (
    <View style={styles.container} pointerEvents="none">
      <Cloud delay={0} startY={15} scale={0.9} duration={12000} />
      <Cloud delay={5000} startY={5} scale={1.1} duration={15000} />
      <Cloud delay={9000} startY={25} scale={0.7} duration={10000} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 80,
    overflow: 'hidden',
    zIndex: 0,
  },
  cloudContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 60, // Container for one cloud
    height: 40,
  },
  cloudBase: {
    position: 'absolute',
    bottom: 0,
    left: 5,
    width: 50,
    height: 15,
    backgroundColor: 'rgba(235, 235, 235, 0.9)', // Slightly darker base
    borderRadius: 10,
  },
  cloudPuff: {
    position: 'absolute',
    backgroundColor: 'rgba(245, 245, 245, 0.9)', // Lighter puffs
    borderRadius: 50, // Large radius to ensure they are circles
  },
  puff1: {
    width: 25,
    height: 25,
    top: -5,
    left: 5,
  },
  puff2: {
    width: 30,
    height: 30,
    top: -15,
    left: 15,
  },
  puff3: {
    width: 25,
    height: 25,
    top: -8,
    right: 5,
  },
  puff4: {
    width: 20,
    height: 20,
    top: 0,
    right: 15,
  },
});

export default Clouds;


