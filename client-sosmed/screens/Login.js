import { useNavigation } from "@react-navigation/native";
import { useContext, useState } from "react";
import {
  View,
  Text,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
} from "react-native";
import { AuthContext } from "../context/AuthContext";
import { gql } from "@apollo/client";
import { useMutation } from "@apollo/client/react";
import { setItemAsync } from "expo-secure-store";
import { darkTheme } from "../config/theme";
import { SafeAreaView } from "react-native-safe-area-context";
import Feather from "@expo/vector-icons/Feather";
import Entypo from "@expo/vector-icons/Entypo";
import CustomAlert from "../components/CustomAlert";

const LOGIN = gql`
  mutation Login($username: String!, $password: String!) {
    login(username: $username, password: $password) {
      token
      user {
        _id
        name
        username
        email
      }
    }
  }
`;

export default function LoginScreen() {
  const navigation = useNavigation();
  const { signIn } = useContext(AuthContext);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [alert, setAlert] = useState({
    visible: false,
    title: "",
    message: "",
    type: "info",
    buttons: [],
  });

  const [login, { loading }] = useMutation(LOGIN, {
    onCompleted: async (data) => {
      const token = data?.login?.token;
      const user = data?.login?.user;
      if (!token) {
        setAlert({
          visible: true,
          title: "Login Gagal",
          message: "Token tidak ditemukan",
          type: "error",
          buttons: [{ text: "OK" }],
        });
        return;
      }
      await setItemAsync("accessToken", token);
      await signIn(token, user);
    },
    onError: (err) => {
      setAlert({
        visible: true,
        title: "Login Gagal",
        message: err.message,
        type: "error",
        buttons: [{ text: "OK" }],
      });
    },
  });

  const handleLogin = () => {
    if (!username.trim() || !password.trim()) {
      setAlert({
        visible: true,
        title: "Data Belum Lengkap",
        message: "Isi username dan password",
        type: "warning",
        buttons: [{ text: "OK" }],
      });
      return;
    }
    login({
      variables: {
        username: username.trim(),
        password,
      },
    });
  };

  return (
    <SafeAreaView style={styles.screen} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 24 : 0}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.hero}>
            <View style={styles.logoContainer}>
              <Image
                source={require("../assets/youtube_logo.png")}
                style={styles.logoImage}
              />
              <Text style={styles.logoText}>YouTube</Text>
            </View>
            <Text style={styles.heroSubtitle}>
              Tetap terhubung dengan komunitas.
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.title}>Login</Text>
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Username</Text>
              <TextInput
                placeholder="Username"
                value={username}
                onChangeText={setUsername}
                style={styles.input}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  placeholder="Password"
                  value={password}
                  onChangeText={setPassword}
                  style={[styles.input, styles.inputWithIcon]}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowPassword((prev) => !prev)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Feather
                    name={showPassword ? "eye" : "eye-off"}
                    size={20}
                    color={darkTheme.textSecondary}
                  />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={loading}
            >
              <Text style={styles.buttonText}>
                {loading ? "Loading..." : "Login"}
              </Text>
            </TouchableOpacity>

            <View style={styles.footerRow}>
              <Text style={styles.footerText}>Belum punya akun?</Text>
              <TouchableOpacity onPress={() => navigation.navigate("Register")}>
                <Text style={styles.footerLink}>Daftar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <CustomAlert
        visible={alert.visible}
        title={alert.title}
        message={alert.message}
        type={alert.type}
        buttons={alert.buttons}
        onDismiss={() => setAlert({ ...alert, visible: false })}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: darkTheme.background,
  },
  logoImage: {
    width: 80,
    height: 60,
    resizeMode: "contain",
  },
  logoText: {
    fontSize: 28,
    fontWeight: "bold",
    color: darkTheme.text,
    letterSpacing: -0.5,
  },
  hero: {
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 32,
    backgroundColor: darkTheme.surface,
    alignItems: "center",
  },
  logoContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 24,
  },
  logoText: {
    fontSize: 32,
    fontWeight: "bold",
    color: darkTheme.text,
    letterSpacing: -1,
  },
  heroTitle: {
    color: darkTheme.text,
    fontSize: 32,
    fontWeight: "bold",
  },
  heroSubtitle: {
    color: darkTheme.textSecondary,
    marginTop: 6,
    fontSize: 14,
  },
  card: {
    flex: 1,
    marginTop: -24,
    backgroundColor: darkTheme.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 32,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: -2 },
    shadowRadius: 8,
    elevation: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: darkTheme.text,
    marginBottom: 20,
  },
  fieldGroup: {
    marginBottom: 16,
  },
  label: {
    color: darkTheme.textSecondary,
    marginBottom: 6,
    fontWeight: "600",
  },
  input: {
    borderWidth: 1,
    borderColor: darkTheme.inputBorder,
    backgroundColor: darkTheme.input,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: darkTheme.text,
  },
  inputWrapper: {
    position: "relative",
    justifyContent: "center",
  },
  inputWithIcon: {
    paddingRight: 44,
  },
  eyeButton: {
    position: "absolute",
    right: 12,
    height: "100%",
    justifyContent: "center",
  },
  button: {
    backgroundColor: "#ff0000",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: darkTheme.text,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 18,
  },
  footerText: {
    color: darkTheme.textSecondary,
  },
  footerLink: {
    color: darkTheme.primary,
    fontWeight: "bold",
    marginLeft: 6,
  },
});
