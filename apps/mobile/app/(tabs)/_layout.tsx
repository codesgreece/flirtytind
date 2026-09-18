import { Tabs } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import {
  DiscoverTabIcon,
  ExploreTabIcon,
  LikesTabIcon,
  MessagesTabIcon,
  ProfileTabIcon,
} from '../../src/components/TabIcons';
import { useLikesReceived } from '../../src/hooks/queries';
import { colors } from '../../src/theme/colors';

export default function TabsLayout() {
  const likes = useLikesReceived();
  const likeCount = likes.data?.count ?? 0;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarActiveTintColor: colors.tabActive,
        tabBarInactiveTintColor: colors.tabInactive,
        tabBarStyle: {
          height: 60,
          paddingTop: 8,
          borderTopColor: colors.border,
        },
      }}
    >
      <Tabs.Screen
        name="discover"
        options={{
          tabBarIcon: ({ focused, color }) => (
            <DiscoverTabIcon focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          tabBarIcon: ({ focused, color }) => (
            <ExploreTabIcon focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="likes"
        options={{
          tabBarIcon: ({ focused, color }) => (
            <View>
              <LikesTabIcon focused={focused} color={color} />
              {likeCount > 0 ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{likeCount > 9 ? '9+' : likeCount}</Text>
                </View>
              ) : null}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          tabBarIcon: ({ focused, color }) => (
            <MessagesTabIcon focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ focused, color }) => (
            <ProfileTabIcon focused={focused} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: -4,
    right: -10,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: { color: colors.white, fontSize: 10, fontWeight: '700' },
});
