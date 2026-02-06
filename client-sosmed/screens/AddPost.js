import { useContext, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Feather from "@expo/vector-icons/Feather";
import { darkTheme } from "../config/theme";
import { AuthContext } from "../context/AuthContext";
import { gql } from "@apollo/client";
import { useMutation } from "@apollo/client/react";
import CustomAlert from "../components/CustomAlert";

const ADD_POST = gql`
  mutation AddPost(
    $content: String!
    $tags: [String]
    $imgUrl: String
    $authorId: ID!
  ) {
    addPost(
      content: $content
      tags: $tags
      imgUrl: $imgUrl
      authorId: $authorId
    ) {
      _id
      content
      tags
      imgUrl
      authorId
      createdAt
    }
  }
`;

export default function AddPostScreen({ navigation }) {
  const { user } = useContext(AuthContext);
  const [content, setContent] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [imgUrl, setImgUrl] = useState("");
  const [alert, setAlert] = useState({
    visible: false,
    title: "",
    message: "",
    type: "info",
    buttons: [],
  });

  const [addPost, { loading }] = useMutation(ADD_POST, {
    onCompleted: () => {
      // Reset form
      setContent("");
      setTagsInput("");
      setImgUrl("");

      setAlert({
        visible: true,
        title: "Berhasil",
        message: "Post berhasil dibuat!",
        type: "success",
        buttons: [
          {
            text: "OK",
            onPress: () => navigation.navigate("HomeTab"),
          },
        ],
      });
    },
    onError: (error) => {
      setAlert({
        visible: true,
        title: "Error",
        message: error.message,
        type: "error",
        buttons: [{ text: "OK" }],
      });
    },
  });

  const handleSubmit = () => {
    // Validation
    if (!content.trim()) {
      setAlert({
        visible: true,
        title: "Error",
        message: "Content tidak boleh kosong",
        type: "warning",
        buttons: [{ text: "OK" }],
      });
      return;
    }

    if (!user?._id) {
      setAlert({
        visible: true,
        title: "Error",
        message: "Silakan login terlebih dahulu",
        type: "warning",
        buttons: [{ text: "OK" }],
      });
      return;
    }

    // Parse tags from comma-separated string
    const tagsArray = tagsInput
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);

    // Call mutation
    addPost({
      variables: {
        content: content.trim(),
        tags: tagsArray.length > 0 ? tagsArray : null,
        imgUrl: imgUrl.trim() || null,
        authorId: user._id,
      },
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.closeButton}
          >
            <Feather name="x" size={24} color={darkTheme.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Post</Text>
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={loading || !content.trim()}
            style={[
              styles.submitButton,
              (loading || !content.trim()) && styles.submitButtonDisabled,
            ]}
          >
            {loading ? (
              <ActivityIndicator size="small" color={darkTheme.text} />
            ) : (
              <Text style={styles.submitButtonText}>Post</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* User Info */}
          <View style={styles.userInfo}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {(user?.name || user?.username || "U").charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.userDetails}>
              <Text style={styles.userName}>{user?.name || "User"}</Text>
              <Text style={styles.userUsername}>
                @{user?.username || "username"}
              </Text>
            </View>
          </View>

          {/* Content Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Content <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.textArea}
              placeholder="What's on your mind?"
              placeholderTextColor={darkTheme.textSecondary}
              value={content}
              onChangeText={setContent}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />
            <Text style={styles.charCount}>{content.length} characters</Text>
          </View>

          {/* Image URL Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Image URL</Text>
            <TextInput
              style={styles.input}
              placeholder="https://example.com/image.jpg"
              placeholderTextColor={darkTheme.textSecondary}
              value={imgUrl}
              onChangeText={setImgUrl}
              autoCapitalize="none"
              keyboardType="url"
            />
            <Text style={styles.helperText}>
              Optional: Add an image URL to make your post
            </Text>
          </View>

          {/* Tags Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Tags</Text>
            <TextInput
              style={styles.input}
              placeholder="Animation, Music, Coding, etc."
              placeholderTextColor={darkTheme.textSecondary}
              value={tagsInput}
              onChangeText={setTagsInput}
              autoCapitalize="none"
            />
            <Text style={styles.helperText}>
              Separate tags with commas (e.g., React, Node.js, MongoDB)
            </Text>
            {tagsInput.trim().length > 0 && (
              <View style={styles.tagsPreview}>
                <Text style={styles.tagsPreviewLabel}>Preview:</Text>
                <View style={styles.tagsPreviewContainer}>
                  {tagsInput
                    .split(",")
                    .map((tag) => tag.trim())
                    .filter((tag) => tag.length > 0)
                    .map((tag, index) => (
                      <View key={index} style={styles.tagChip}>
                        <Text style={styles.tagChipText}>#{tag}</Text>
                      </View>
                    ))}
                </View>
              </View>
            )}
          </View>

          {/* Guidelines */}
          <View style={styles.guidelines}>
            <Text style={styles.guidelinesTitle}>📝 Posting Guidelines</Text>
            <View style={styles.guidelineItem}>
              <Text style={styles.guidelineBullet}>•</Text>
              <Text style={styles.guidelineText}>
                Content is required and should be descriptive
              </Text>
            </View>
            <View style={styles.guidelineItem}>
              <Text style={styles.guidelineBullet}>•</Text>
              <Text style={styles.guidelineText}>
                Tags help others discover your post
              </Text>
            </View>
            <View style={styles.guidelineItem}>
              <Text style={styles.guidelineBullet}>•</Text>
              <Text style={styles.guidelineText}>
                Image URLs should be valid and accessible
              </Text>
            </View>
            <View style={styles.guidelineItem}>
              <Text style={styles.guidelineBullet}>•</Text>
              <Text style={styles.guidelineText}>
                Be respectful and follow community guidelines
              </Text>
            </View>
          </View>

          <View style={{ height: 40 }} />
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
  container: {
    flex: 1,
    backgroundColor: darkTheme.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: darkTheme.border,
    backgroundColor: darkTheme.surface,
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: darkTheme.text,
    flex: 1,
    textAlign: "center",
    marginHorizontal: 16,
  },
  submitButton: {
    backgroundColor: darkTheme.primary,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 70,
    alignItems: "center",
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: darkTheme.text,
    fontSize: 14,
    fontWeight: "bold",
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: darkTheme.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: darkTheme.text,
    fontWeight: "bold",
    fontSize: 20,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    color: darkTheme.text,
    fontSize: 16,
    fontWeight: "bold",
  },
  userUsername: {
    color: darkTheme.textSecondary,
    fontSize: 14,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    color: darkTheme.text,
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  required: {
    color: darkTheme.primary,
  },
  input: {
    backgroundColor: darkTheme.surface,
    borderWidth: 1,
    borderColor: darkTheme.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: darkTheme.text,
    fontSize: 14,
  },
  textArea: {
    backgroundColor: darkTheme.surface,
    borderWidth: 1,
    borderColor: darkTheme.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: darkTheme.text,
    fontSize: 14,
    minHeight: 120,
    textAlignVertical: "top",
  },
  charCount: {
    color: darkTheme.textSecondary,
    fontSize: 12,
    marginTop: 4,
    textAlign: "right",
  },
  helperText: {
    color: darkTheme.textSecondary,
    fontSize: 12,
    marginTop: 4,
  },
  tagsPreview: {
    marginTop: 12,
  },
  tagsPreviewLabel: {
    color: darkTheme.textSecondary,
    fontSize: 12,
    marginBottom: 8,
  },
  tagsPreviewContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tagChip: {
    backgroundColor: darkTheme.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tagChipText: {
    color: darkTheme.text,
    fontSize: 12,
    fontWeight: "500",
  },
  guidelines: {
    backgroundColor: darkTheme.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: darkTheme.border,
  },
  guidelinesTitle: {
    color: darkTheme.text,
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 12,
  },
  guidelineItem: {
    flexDirection: "row",
    marginBottom: 8,
  },
  guidelineBullet: {
    color: darkTheme.primary,
    fontSize: 14,
    marginRight: 8,
  },
  guidelineText: {
    color: darkTheme.textSecondary,
    fontSize: 13,
    flex: 1,
    lineHeight: 18,
  },
});
