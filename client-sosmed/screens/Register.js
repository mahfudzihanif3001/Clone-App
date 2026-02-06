import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
  Image,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { gql } from "@apollo/client";
import { useMutation } from "@apollo/client/react";
import { darkTheme } from "../config/theme";
import { SafeAreaView } from "react-native-safe-area-context";
import Feather from "@expo/vector-icons/Feather";
import CustomAlert from "../components/CustomAlert";

const REGISTER = gql`
  mutation Register(
    $name: String
    $username: String!
    $email: String!
    $password: String!
  ) {
    register(
      name: $name
      username: $username
      email: $email
      password: $password
    ) {
      _id
      name
      username
      email
    }
  }
`;

export default function RegisterScreen() {
  const navigation = useNavigation();
  const [form, setForm] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [alert, setAlert] = useState({
    visible: false,
    title: "",
    message: "",
    type: "info",
    buttons: [],
  });

  const [register, { loading }] = useMutation(REGISTER, {
    onCompleted: () => {
      setAlert({
        visible: true,
        title: "Registrasi Berhasil",
        message: "Silakan login untuk melanjutkan.",
        type: "success",
        buttons: [
          {
            text: "OK",
            onPress: () => navigation.navigate("Login"),
          },
        ],
      });
    },
    onError: (err) => {
      setAlert({
        visible: true,
        title: "Registrasi Gagal",
        message: err.message,
        type: "error",
        buttons: [{ text: "OK" }],
      });
    },
  });

  const handleRegister = () => {
    if (!form.username.trim() || !form.email.trim() || !form.password.trim()) {
      setAlert({
        visible: true,
        title: "Data Belum Lengkap",
        message: "Isi username, email, dan password.",
        type: "warning",
        buttons: [{ text: "OK" }],
      });
      return;
    }

    register({
      variables: {
        name: form.name.trim(),
        username: form.username.trim(),
        email: form.email.trim(),
        password: form.password,
      },
    });
  };

  const updateField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <SafeAreaView style={styles.screen} edges={["bottom"]}>
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
              Buat akun baru dan mulai berbagi.
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.title}>Registrasi</Text>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Nama</Text>
              <TextInput
                placeholder="Nama lengkap"
                value={form.name}
                onChangeText={(text) => updateField("name", text)}
                style={styles.input}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Username</Text>
              <TextInput
                placeholder="Username"
                value={form.username}
                onChangeText={(text) => updateField("username", text)}
                style={styles.input}
                autoCapitalize="none"
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                placeholder="Email"
                value={form.email}
                onChangeText={(text) => updateField("email", text)}
                style={styles.input}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  placeholder="Password"
                  value={form.password}
                  onChangeText={(text) => updateField("password", text)}
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
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>DAFTAR</Text>
              )}
            </TouchableOpacity>

            <View style={styles.footerRow}>
              <Text style={styles.footerText}>Sudah punya akun?</Text>
              <TouchableOpacity onPress={() => navigation.navigate("Login")}>
                <Text style={styles.footerLink}>Login</Text>
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
  hero: {
    paddingTop: 20,
    paddingHorizontal: 24,
    paddingBottom: 28,
    backgroundColor: darkTheme.surface,
    alignItems: "center",
  },
  logoContainer: {
    marginBottom: 16,
    alignItems: "center",
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
