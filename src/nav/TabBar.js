import React from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { colors, radius, spacing, type } from '../theme/tokens';

const TAB_LIST = [
  { key: 'vault', label: 'Vault', hint: 'Save · Grow · Borrow' },
  { key: 'duel', label: 'Duel', hint: 'Invite a friend' },
  { key: 'waiting', label: 'Cost', hint: 'What waiting costs' },
];

const CoinGlyph = ({ active }) => (
  <View
    style={[
      styles.glyph,
      { backgroundColor: active ? colors.brand : colors.borderStrong },
    ]}
  >
    <View
      style={[
        styles.glyphInner,
        { backgroundColor: active ? colors.brandInk : colors.textTertiary },
      ]}
    />
  </View>
);

const TabBar = ({ current, onChange }) => {
  const insets = useSafeAreaInsets();
  const bottomOffset = Math.max(insets.bottom, Platform.OS === 'android' ? 24 : 16);
  return (
    <View style={[styles.wrap, { bottom: bottomOffset }]}>
      <View style={styles.bar}>
        {TAB_LIST.map((tab) => {
          const active = current === tab.key;
          return (
            <Pressable
              key={tab.key}
              style={[styles.tab, active && styles.tabActive]}
              onPress={() => {
                if (current !== tab.key) {
                  Haptics.selectionAsync();
                  onChange(tab.key);
                }
              }}
            >
              <CoinGlyph active={active} />
              <Text style={[styles.label, active && styles.labelActive]}>{tab.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
  },
  bar: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 6,
    gap: 4,
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    borderRadius: radius.pill,
  },
  tabActive: {
    backgroundColor: 'rgba(190, 233, 85, 0.14)',
    borderWidth: 1,
    borderColor: colors.brand,
  },
  glyph: {
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  glyphInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  label: {
    ...type.body,
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  labelActive: {
    color: colors.brand,
  },
});

export default TabBar;
