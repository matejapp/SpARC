import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { Pressable, Text, View } from 'react-native';

import { ActivityIcon, CalendarIcon, HomeIcon, PlusIcon } from '@/components/icons';
import { makeStyles, radii, type, useTheme } from '@/lib/theme';

// The board's bottom bar — Home, Activity, the cantaloupe add button — plus Calendar, which
// joins in Sprint 2 (D-028). It replaces the default tab bar, so it does the default's job too:
// emit `tabPress` and switch tabs.

const TABS: Record<string, { label: string; Icon: (p: { color: string; active: boolean; size?: number }) => React.JSX.Element }> = {
  index: { label: 'Home', Icon: HomeIcon },
  transactions: { label: 'Activity', Icon: ActivityIcon },
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
    width: 72,
    minHeight: 48,
    alignItems: 'center',
    gap: 4,
  },
  add: {
    width: 56,
    height: 56,
    marginTop: -26,
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
