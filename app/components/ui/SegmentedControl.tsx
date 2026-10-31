import { Pressable, Text, View } from 'react-native';

import { makeStyles, radii, type } from '@/lib/theme';

type Option<T extends string> = { value: T; label: string };

// The board's Expense / Income switch: a recessed track, the chosen option lifted out of it.
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
  const styles = useStyles();
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

const useStyles = makeStyles((t) => ({
  track: {
    flexDirection: 'row',
    gap: 4,
    padding: 4,
    borderRadius: radii.pill,
    backgroundColor: t.colors.segmentTrack,
  },
  option: {
    flex: 1,
    height: 44,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selected: { backgroundColor: t.colors.segmentThumb, boxShadow: t.shadows.segmentLift },
  text: { ...type.buttonSmall, color: t.colors.ink },
}));
