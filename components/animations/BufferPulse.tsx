import React, { useEffect } from 'react';
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withTiming,
} from 'react-native-reanimated';

interface BufferPulseProps {
  isHighlighted: boolean;
  children: React.ReactNode;
}

const BufferPulse: React.FC<BufferPulseProps> = ({ isHighlighted, children }) => {
  const scale = useSharedValue(1);

  useEffect(() => {
    if (isHighlighted) {
      scale.value = withRepeat(
        withTiming(1.2, {
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
        }),
        -1,
        true
      );
    } else {
      scale.value = withTiming(1, {
        duration: 500,
        easing: Easing.inOut(Easing.ease),
      });
    }
  }, [isHighlighted, scale]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  return (
    <Animated.View style={animatedStyle}>
      {children}
    </Animated.View>
  );
};

export default BufferPulse;
