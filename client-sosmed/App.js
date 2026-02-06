import { NavigationContainer } from "@react-navigation/native";
import RootStack from "./navigators/RootStack";
import { ApolloProvider } from "@apollo/client/react";
import client from "./config/apollo";
import AuthProvider from "./context/AuthContext";
import { SafeAreaProvider } from "react-native-safe-area-context";

export default function App() {
  return (
    <SafeAreaProvider>
      <ApolloProvider client={client}>
        <AuthProvider>
          <NavigationContainer>
            <RootStack />
          </NavigationContainer>
        </AuthProvider>
      </ApolloProvider>
    </SafeAreaProvider>
  );
}
