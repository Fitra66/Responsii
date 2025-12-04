// Fallback for using FontAwesome5 on Android and web.

import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { SymbolViewProps, SymbolWeight } from 'expo-symbols';
import { ComponentProps } from 'react';
import { OpaqueColorValue, type StyleProp, type TextStyle } from 'react-native';

type IconMapping = Record<SymbolViewProps['name'], ComponentProps<typeof FontAwesome5>['name']>;
type IconSymbolName = keyof typeof MAPPING;

/**
 * Add your SF Symbols to FontAwesome 5 mappings here.
 * - see FontAwesome 5 in the [Icons Directory](https://icons.expo.fyi).
 * - see SF Symbols in the [SF Symbols](https://developer.apple.com/sf-symbols/) app.
 */
const MAPPING = {
  'map.fill': 'map-marked-alt',
  'list.bullet': 'list-ul',
  'cloud.sun.fill': 'cloud-sun',
  'chevron.right': 'chevron-right',
  'bell.fill': 'bell',
  'chart.bar.fill': 'chart-bar',
};

/**
 * An icon component that uses native SF Symbols on iOS, and FontAwesome 5 on Android and web.
 * This ensures a consistent look across platforms, and optimal resource usage.
 * Icon `name`s are based on SF Symbols and require manual mapping to FontAwesome 5.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  return <FontAwesome5 color={color} size={size} name={MAPPING[name]} style={style} />;
}
