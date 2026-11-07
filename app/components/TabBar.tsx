import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { Pressable, Text, View } from 'react-native';

import { ActivityIcon, AnalyticsIcon, CalendarIcon, HomeIcon, PlusIcon } from '@/components/icons';
import { makeStyles, radii, type, useTheme } from '@/lib/theme';

// The bottom bar: Home · Activity · ＋ · Analytics · Calendar (D-028 added Calendar, Sprint 3
// Analytics; board → Analytics tab). The add button sits in the middle, two tabs either side.
// It replaces the default tab bar, so it does the default's job too: emit `tabPress` and switch
// tabs. Tabs share the width, so the bar fits a 320 pt phone.

const TABS: Record<string, { label: string; Icon: (p: { color: string; active: boolean; size?: number }) => React.JSX.Element }> = {
  index: { label: 'Home', Icon: HomeIcon },
  transactions: { label: 'Activity', Icon: ActivityIcon },
  analytics: { label: 'Analytics', Icon: AnalyticsIcon },
  calendar: { label: 'Calendar', Icon: (p) => <CalendarIcon {...p} size={22} /> },
};

export function TabBar({ state, emitter, navigateToTab, insets }: BottomTabBarProps) {
  const styles = useStyles();
  const { colors, gradients } = useTheme();
  const tab = (index: number) => {
    const route = state.routes[index];
    const { label, Icon } = TABS[route.name];
    const focused = index === state.index;
    const color = focused ? colors.tabActive : colors.ink2;

    const onPress = () => {
      const event = emitter.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
      if (!focused && !event.defaultPrevented) navigateToTab(route.key);
    };

    return (
      <Pressable
        key={route.key}
        onPress={onPress}
        accessibilityRole="tab"
        accessibilityState={{ selected: focused }}
        style={styles.tab}
      >
        <Icon color={color} active={focused} />
        <Text style={[focused ? type.tabLabelActive : type.tabLabel, { color }]}>{label}</Text>
      </Pressable>
    );
  };

  return (
    <View
      accessibilityRole="tablist"
      style={[styles.bar, { paddingBottom: Math.max(insets.bottom - 4, 10) }]}
    >
      {tab(0)}
      {tab(1)}
      <Pressable
        onPress={() => router.push('/add')}
        accessibilityRole="button"
        accessibilityLabel="Add transaction"
        style={styles.add}
      >
        <LinearGradient {...gradients.accent} style={styles.addFill}>
          <PlusIcon color={colors.onAccent} />
        </LinearGradient>
      </Pressable>
      {tab(2)}
      {tab(3)}
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  bar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    paddingHorizontal: 16,
    backgroundColor: t.tabBarBackground,
    boxShadow: t.shadows.tabBar,
  },
  tab: {
    flex: 1,
    minHeight: 48,
    alignItems: 'center',
    gap: 4,
  },
  add: {
    width: 56,
    height: 56,
    marginTop: -26,
    marginHorizontal: 4,
    borderRadius: radii.pill,
    boxShadow: t.shadows.addButton,
  },
  addFill: {
    flex: 1,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
}));
