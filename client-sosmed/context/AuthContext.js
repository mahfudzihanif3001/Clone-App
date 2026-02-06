import { createContext, useEffect, useMemo, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const AuthContext = createContext({
  token: null,
  user: null,
  isSignedIn: false,
  signIn: async () => {},
  signOut: async () => {},
  setUser: () => {},
});

export default function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const restoreSession = async () => {
      try {
        const [savedToken, savedUser] = await Promise.all([
          AsyncStorage.getItem("accessToken"),
          AsyncStorage.getItem("userInfo"),
        ]);

        if (savedToken) setToken(savedToken);
        if (savedUser) setUser(JSON.parse(savedUser));
      } catch (err) {
        console.warn("Failed to restore auth session", err);
      } finally {
        setHydrated(true);
      }
    };

    restoreSession();
  }, []);

  const signIn = async (nextToken, nextUser) => {
    setToken(nextToken);
    setUser(nextUser ?? null);
    await Promise.all([
      AsyncStorage.setItem("accessToken", nextToken),
      nextUser
        ? AsyncStorage.setItem("userInfo", JSON.stringify(nextUser))
        : AsyncStorage.removeItem("userInfo"),
    ]);
  };

  const signOut = async () => {
    setToken(null);
    setUser(null);
    await Promise.all([
      AsyncStorage.removeItem("accessToken"),
      AsyncStorage.removeItem("userInfo"),
    ]);
  };

  const value = useMemo(
    () => ({
      token,
      user,
      isSignedIn: Boolean(token),
      signIn,
      signOut,
      setUser,
    }),
    [token, user]
  );

  if (!hydrated) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color="#cc0000" />
      </View>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
