import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import HomeScreen from "../screens/Home";
import SearchScreen from "../screens/Search";
import ProfileScreen from "../screens/Profile";
import AddPostScreen from "../screens/AddPost";
import { darkTheme } from "../config/theme";
import { View, Text, Animated, Easing } from "react-native";
import Entypo from "@expo/vector-icons/Entypo";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import Fontisto from "@expo/vector-icons/Fontisto";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useEffect, useRef } from "react";
import AntDesign from "@expo/vector-icons/AntDesign";
import { SafeAreaView } from "react-native-safe-area-context";
import Feather from "@expo/vector-icons/Feather";

const Tab = createBottomTabNavigator();

// Animated AddPost Icon Component
function AnimatedAddPostIcon({ focused }) {
  const colorAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (focused) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(colorAnim, {
            toValue: 1,
            duration: 600,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: false,
          }),
          Animated.timing(colorAnim, {
            toValue: 0,
            duration: 600,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: false,
          }),
        ])
      ).start();
    } else {
      colorAnim.setValue(0);
    }
  }, [focused]);

  const iconColor = colorAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["#FF0000", "#FFFFFF"],
  });

  return (
    <View
      style={{
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "black",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Animated.View style={{ color: iconColor }}>
        <Fontisto
          name="plus-a"
          size={20}
          color={focused ? "#FF0000" : "white"}
        />
      </Animated.View>
    </View>
  );
}

// Placeholder Subscriber Screen
function SubscriberScreen() {
  return (
    <SafeAreaView
      edges={["top"]}
      style={{
        flex: 1,
        backgroundColor: darkTheme.background,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Text style={{ color: darkTheme.text, fontSize: 24 }}>
        Subscriber Screen
      </Text>
      <Text style={{ color: darkTheme.textSecondary, marginTop: 8 }}>
        Coming Soon
      </Text>
    </SafeAreaView>
  );
}

export default function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: darkTheme.surface,
          borderTopColor: darkTheme.border,
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: darkTheme.text,
        tabBarInactiveTintColor: darkTheme.textSecondary,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "500",
        },
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{
          tabBarLabel: "Home",
          tabBarIcon: ({ color, size }) => (
            <Entypo name="home" size={24} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Search"
        component={SearchScreen}
        options={{
          tabBarLabel: "Search",
          tabBarIcon: ({ color, size }) => (
            <Feather name="search" size={24} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="AddPost"
        component={AddPostScreen}
        options={{
          tabBarLabel: "AddPost",
          tabBarIcon: ({ color, focused }) => (
            <AntDesign name="plus-circle" size={24} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Subscriber"
        component={SubscriberScreen}
        options={{
          tabBarLabel: "Subscriber",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name="youtube-subscription"
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: "Profile",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={24} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
