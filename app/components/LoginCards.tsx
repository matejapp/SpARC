import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';

import { CardRings } from '@/components/CardRings';
import { formatAmount } from '@/lib/money';
import { colors, gradients, radii, shadows, tabularNums, type } from '@/lib/theme';

// The two tilted month cards above the login headline (board → Login). An illustration of the
// product, not data: the amount is fixed and hidden from screen readers. Corners match the
// month card (D-032). The front card clips its rings, so its shadow and tilt sit on an outer
// view; on iOS the clipping would otherwise swallow the shadow.
export function LoginCards() {
  return (
    <View style={styles.stage} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <LinearGradient {...gradients.cardBack} style={[styles.card, styles.back]} />
      <View style={[styles.card, styles.front]}>
        <LinearGradient {...gradients.accent} style={styles.frontFace}>
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
    </View>
  );
}

const styles = StyleSheet.create({
  stage: { height: 196, marginTop: 20 },
  card: { position: 'absolute', borderRadius: radii.bankCard },
  back: { left: 40, top: 20, width: 290, height: 176, transform: [{ rotate: '-7deg' }] },
  front: {
    left: 24,
    top: 12,
    width: 300,
    height: 184,
    boxShadow: shadows.monthCard,
    transform: [{ rotate: '3deg' }],
  },
  frontFace: {
    flex: 1,
    borderRadius: radii.bankCard,
    overflow: 'hidden',
    paddingVertical: 20,
    paddingHorizontal: 22,
    justifyContent: 'space-between',
  },
  period: { ...type.tabLabelActive, letterSpacing: 1.68, color: colors.onAccent, alignSelf: 'flex-end' },
  caption: { ...type.caption, fontFamily: type.label.fontFamily, color: colors.onCard },
  amount: {
    ...type.display,
    fontSize: 28,
    lineHeight: 34,
    letterSpacing: -0.56,
    color: colors.onAccent,
    ...tabularNums,
  },
  currency: { ...type.buttonSmall, fontSize: 14 },
});
