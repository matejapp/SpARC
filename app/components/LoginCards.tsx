import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';

import { CardRings } from '@/components/CardRings';
import { formatAmount } from '@/lib/money';
import { colors, gradients, radii, shadows, tabularNums, type } from '@/lib/theme';

// The two tilted month cards above the login headline (board → Login). An illustration of the
// product, not data: the amount is fixed and hidden from screen readers.
export function LoginCards() {
  return (
    <View style={styles.stage} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <LinearGradient {...gradients.charcoal} style={[styles.card, styles.back]} />
      <LinearGradient {...gradients.accent} style={[styles.card, styles.front]}>
        <CardRings size={200} opacity={0.18} />
        <Text style={styles.period}>THIS MONTH</Text>
        <View>
          <Text style={styles.caption}>Left to spend</Text>
          <Text style={styles.amount}>
            {formatAmount(48799.5)} <Text style={styles.currency}>RSD</Text>
          </Text>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  stage: { height: 196, marginTop: 20 },
  card: { position: 'absolute', borderRadius: radii.card },
  back: { left: 40, top: 20, width: 290, height: 176, transform: [{ rotate: '-7deg' }] },
  front: {
    left: 24,
    top: 12,
    width: 300,
    height: 184,
    overflow: 'hidden',
    paddingVertical: 20,
    paddingHorizontal: 22,
    justifyContent: 'space-between',
    boxShadow: shadows.monthCard,
    transform: [{ rotate: '3deg' }],
  },
  period: { ...type.tabLabelActive, letterSpacing: 1.68, color: colors.onInk, alignSelf: 'flex-end' },
  caption: { ...type.caption, fontFamily: type.label.fontFamily, color: colors.onCard },
  amount: {
    ...type.display,
    fontSize: 28,
    lineHeight: 34,
    letterSpacing: -0.56,
    color: colors.onInk,
    ...tabularNums,
  },
  currency: { ...type.buttonSmall, fontSize: 14 },
});
