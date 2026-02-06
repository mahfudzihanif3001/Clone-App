import { useContext } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import LoginScreen from "../screens/Login";
import RegisterScreen from "../screens/Register";
import MainTabNavigator from "./MainTab";
import PostDetailScreen from "../screens/PostDetail";
import { AuthContext } from "../context/AuthContext";
import { darkTheme } from "../config/theme";

const Stack = createNativeStackNavigator();

export default function RootStack() {
  const { isSignedIn } = useContext(AuthContext);

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: darkTheme.primary },
        headerTintColor: darkTheme.text,
        headerTitleStyle: { fontWeight: "bold" },
      }}
    >
      {isSignedIn ? (
        <>
          <Stack.Screen
            name="Main"
            component={MainTabNavigator}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="PostDetail"
            component={PostDetailScreen}
            options={{ headerShown: false }}
          />
        </>
      ) : (
        <>
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Register"
            component={RegisterScreen}
            options={{
              title: "Daftar",
              headerStyle: { backgroundColor: darkTheme.surface },
            }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}
