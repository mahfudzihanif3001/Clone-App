import React from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from "react-native";
import { darkTheme } from "../config/theme";
import Feather from "@expo/vector-icons/Feather";

export default function CustomAlert({
  visible,
  title,
  message,
  type = "info", // 'success', 'error', 'warning', 'info'
  buttons = [],
  onDismiss,
}) {
  const getIcon = () => {
    switch (type) {
      case "success":
        return { name: "check-circle", color: "#4caf50" };
      case "error":
        return { name: "x-circle", color: "#ff0000" };
      case "warning":
        return { name: "alert-circle", color: "#ff9800" };
      default:
        return { name: "info", color: "#2196f3" };
    }
  };

  const icon = getIcon();

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <View style={styles.overlay}>
        <View style={styles.alertContainer}>
          {/* Icon */}
          <View style={styles.iconContainer}>
            <Feather name={icon.name} size={48} color={icon.color} />
          </View>

          {/* Title */}
          {title && <Text style={styles.title}>{title}</Text>}

          {/* Message */}
          {message && <Text style={styles.message}>{message}</Text>}

          {/* Buttons */}
          <View style={styles.buttonsContainer}>
            {buttons.length > 0 ? (
              buttons.map((button, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.button,
                    button.style === "destructive" && styles.buttonDestructive,
                    button.style === "cancel" && styles.buttonCancel,
                    buttons.length === 1 && styles.buttonSingle,
                  ]}
                  onPress={() => {
                    button.onPress && button.onPress();
                    onDismiss && onDismiss();
                  }}
                >
                  <Text
                    style={[
                      styles.buttonText,
                      button.style === "destructive" &&
                        styles.buttonTextDestructive,
                      button.style === "cancel" && styles.buttonTextCancel,
                    ]}
                  >
                    {button.text}
                  </Text>
                </TouchableOpacity>
              ))
            ) : (
              <TouchableOpacity
                style={[styles.button, styles.buttonSingle]}
                onPress={onDismiss}
              >
                <Text style={styles.buttonText}>OK</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  alertContainer: {
    backgroundColor: darkTheme.card,
    borderRadius: 16,
    padding: 24,
    width: "100%",
    maxWidth: 340,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 1,
    borderColor: darkTheme.border,
  },
  iconContainer: {
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: darkTheme.text,
    marginBottom: 8,
    textAlign: "center",
  },
  message: {
    fontSize: 14,
    color: darkTheme.textSecondary,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  buttonsContainer: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  button: {
    flex: 1,
    backgroundColor: darkTheme.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonSingle: {
    flex: 1,
  },
  buttonCancel: {
    backgroundColor: darkTheme.surface,
    borderWidth: 1,
    borderColor: darkTheme.border,
  },
  buttonDestructive: {
    backgroundColor: "#d32f2f",
  },
  buttonText: {
    color: darkTheme.text,
    fontWeight: "bold",
    fontSize: 14,
  },
  buttonTextCancel: {
    color: darkTheme.textSecondary,
  },
  buttonTextDestructive: {
    color: "#fff",
  },
});
