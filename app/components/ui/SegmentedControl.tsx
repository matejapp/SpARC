import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radii, shadows, type } from '@/lib/theme';

type Option<T extends string> = { value: T; label: string };

// The board's Expense / Income switch: a hairline track, the chosen option lifted in white.
export function SegmentedControl<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string; // for screen readers; the options carry the visible text
  options: readonly Option<T>[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel={label} style={styles.track}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            accessibilityRole="radio"
            accessibilityState={{ checked: selected }}
            style={[styles.option, selected && styles.selected]}
          >
            <Text style={styles.text}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    gap: 4,
    padding: 4,
    borderRadius: radii.pill,
    backgroundColor: colors.segmentTrack,
  },
  option: {
    flex: 1,
    height: 44,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selected: { backgroundColor: colors.segmentThumb, boxShadow: shadows.segmentLift },
  text: { ...type.buttonSmall, color: colors.ink },
});
