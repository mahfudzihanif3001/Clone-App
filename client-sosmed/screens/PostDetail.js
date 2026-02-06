import React, { useContext, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { gql } from "@apollo/client";
import { useQuery, useMutation } from "@apollo/client/react";
import Feather from "@expo/vector-icons/Feather";
import { AuthContext } from "../context/AuthContext";
import { darkTheme } from "../config/theme";
import CustomAlert from "../components/CustomAlert";
import AntDesign from "@expo/vector-icons/AntDesign";

// Query untuk mengambil detail post berdasarkan ID
const GET_POST_DETAIL = gql`
  query GetPost($id: ID!) {
    post(id: $id) {
      _id
      content
      tags
      imgUrl
      authorId
      author {
        username
        name
      }
      likes {
        username
      }
      comments {
        content
        username
        createdAt
      }
      createdAt
    }
  }
`;

// Mutation untuk menambah komentar
const ADD_COMMENT = gql`
  mutation CommentPost($postId: ID!, $content: String!, $username: String!) {
    commentPost(postId: $postId, content: $content, username: $username) {
      content
      username
      createdAt
    }
  }
`;

// Mutation untuk like post
const LIKE_POST = gql`
  mutation LikePost($postId: ID!, $username: String!) {
    likePost(postId: $postId, username: $username) {
      username
    }
  }
`;

// Mutation untuk delete post
const DELETE_POST = gql`
  mutation DeletePost($id: ID!) {
    deletePost(id: $id) {
      _id
    }
  }
`;

export default function PostDetailScreen({ route, navigation }) {
  const { postId } = route.params;
  const { user } = useContext(AuthContext);
  const [commentText, setCommentText] = useState("");
  const [alert, setAlert] = useState({
    visible: false,
    title: "",
    message: "",
    type: "info",
    buttons: [],
  });

  // Fetch data post detail
  const { data, loading, error, refetch } = useQuery(GET_POST_DETAIL, {
    variables: { id: postId },
    fetchPolicy: "network-only",
  });

  // Setup mutation add comment
  const [addComment, { loading: mutationLoading }] = useMutation(ADD_COMMENT, {
    onCompleted: () => {
      setCommentText("");
      refetch(); // Refresh data setelah komen berhasil
    },
    onError: (err) => {
      setAlert({
        visible: true,
        title: "Error",
        message: err.message,
        type: "error",
        buttons: [{ text: "OK" }],
      });
    },
  });

  // Setup mutation like post
  const [likePost, { loading: likeLoading }] = useMutation(LIKE_POST, {
    onCompleted: () => {
      refetch(); // Refresh data setelah like berhasil
    },
    onError: (err) => {
      setAlert({
        visible: true,
        title: "Error",
        message: err.message,
        type: "error",
        buttons: [{ text: "OK" }],
      });
    },
  });

  // Setup mutation delete post
  const [deletePostMutation, { loading: deleteLoading }] = useMutation(
    DELETE_POST,
    {
      onCompleted: () => {
        setAlert({
          visible: true,
          title: "Success",
          message: "Post deleted successfully!",
          type: "success",
          buttons: [
            {
              text: "OK",
              onPress: () => {
                setAlert({ ...alert, visible: false });
                navigation.goBack();
              },
            },
          ],
        });
      },
      onError: (err) => {
        setAlert({
          visible: true,
          title: "Delete Failed",
          message: err.message,
          type: "error",
          buttons: [{ text: "OK" }],
        });
      },
    }
  );

  // Handler untuk like post
  const handleLike = () => {
    if (!user?.username) {
      setAlert({
        visible: true,
        title: "Login Required",
        message: "Please login to like posts",
        type: "warning",
        buttons: [{ text: "OK" }],
      });
      return;
    }

    likePost({
      variables: {
        postId,
        username: user.username,
      },
    });
  };

  // Handler untuk post comment
  const handlePostComment = () => {
    if (!commentText.trim()) {
      return;
    }

    if (!user?.username) {
      setAlert({
        visible: true,
        title: "Login Required",
        message: "Please login to comment",
        type: "warning",
        buttons: [{ text: "OK" }],
      });
      return;
    }

    addComment({
      variables: {
        postId,
        content: commentText,
        username: user.username,
      },
    });
  };

  // Handler untuk delete post
  const handleDeletePost = () => {
    setAlert({
      visible: true,
      title: "Delete Post?",
      message: "Are you sure you want to delete this post?",
      type: "warning",
      buttons: [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            setAlert({ ...alert, visible: false });
            deletePostMutation({ variables: { id: postId } });
          },
        },
      ],
    });
  };

  // Helper format tanggal
  const formatDate = (dateString) => {
    const date = new Date(Number(dateString) || dateString);
    return date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={darkTheme.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.errorText}>Error: {error.message}</Text>
        <TouchableOpacity onPress={() => refetch()} style={styles.retryButton}>
          <Text style={styles.retryText}>Coba Lagi</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const post = data?.post;

  if (!post) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.errorText}>Post tidak ditemukan</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Feather name="arrow-left" size={24} color={darkTheme.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Post Detail</Text>
        {user?._id === post.authorId && (
          <TouchableOpacity
            onPress={handleDeletePost}
            disabled={deleteLoading}
            style={styles.deleteHeaderButton}
          >
            <Feather name="trash-2" size={20} color={darkTheme.primary} />
          </TouchableOpacity>
        )}
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === "ios" ? 12 : 0}
      >
        <ScrollView
          style={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Image */}
          <Image
            source={{ uri: post.imgUrl }}
            style={styles.image}
            resizeMode="cover"
          />

          <View style={styles.detailsContainer}>
            {/* Author & Date */}
            <View style={styles.authorRow}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {(post.author?.name || post.author?.username || "U")
                    .charAt(0)
                    .toUpperCase()}
                </Text>
              </View>
              <View>
                <Text style={styles.authorName}>
                  {post.author?.name || post.author?.username || "Unknown"}
                </Text>
                <Text style={styles.dateText}>
                  {formatDate(post.createdAt)}
                </Text>
              </View>
            </View>

            {/* Content / Description */}
            <Text style={styles.description}>{post.content}</Text>

            {/* Tags */}
            <View style={styles.tagsRow}>
              {post.tags?.map((tag, index) => (
                <Text key={index} style={styles.tag}>
                  #{tag}
                </Text>
              ))}
            </View>

            {/* Like Button and Count */}
            <View style={styles.actionsRow}>
              <TouchableOpacity
                style={styles.likeButton}
                onPress={handleLike}
                disabled={likeLoading}
              >
                <Feather
                  name={
                    post.likes?.some((l) => l.username === user?.username)
                      ? "thumbs-up"
                      : "thumbs-up"
                  }
                  size={20}
                  color={
                    post.likes?.some((l) => l.username === user?.username)
                      ? darkTheme.primary
                      : darkTheme.text
                  }
                />
                <Text
                  style={[
                    styles.likeText,
                    post.likes?.some((l) => l.username === user?.username) && {
                      color: darkTheme.primary,
                    },
                  ]}
                >
                  {post.likes?.length || 0} Likes
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Comments Section */}
          <View style={styles.commentsContainer}>
            <Text style={styles.sectionTitle}>
              Komentar ({post.comments?.length || 0})
            </Text>

            {post.comments?.length === 0 ? (
              <Text style={styles.noComments}>Belum ada komentar.</Text>
            ) : (
              post.comments?.map((comment, index) => (
                <View key={index} style={styles.commentItem}>
                  <View style={styles.commentAvatar}>
                    <Text style={styles.commentAvatarText}>
                      {(comment.username || "U").charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.commentContent}>
                    <View style={styles.commentHeader}>
                      <Text style={styles.commentAuthor}>
                        {comment.username || "Unknown"}
                      </Text>
                      <Text style={styles.commentDate}>
                        {/* Handle date format if needed */}
                        {/* {formatDate(comment.createdAt)} */}
                      </Text>
                    </View>
                    <Text style={styles.commentText}>{comment.content}</Text>
                  </View>
                </View>
              ))
            )}
          </View>
          <View style={{ height: 20 }} />
        </ScrollView>

        {/* Input Komentar */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Tulis komentar..."
            placeholderTextColor={darkTheme.textSecondary}
            value={commentText}
            onChangeText={setCommentText}
            multiline
          />
          <TouchableOpacity
            style={styles.sendButton}
            onPress={handlePostComment}
            disabled={mutationLoading}
          >
            {mutationLoading ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <AntDesign name="send" size={20} color="#ffffff" />
            )}
          </TouchableOpacity>
        </View>
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
  centered: {
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: darkTheme.border,
    backgroundColor: darkTheme.surface,
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: darkTheme.text,
  },
  deleteHeaderButton: {
    marginLeft: "auto",
    padding: 8,
  },
  content: {
    flex: 1,
  },
  image: {
    width: "100%",
    height: 250,
    backgroundColor: darkTheme.card,
  },
  detailsContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: darkTheme.border,
  },
  authorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: darkTheme.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    color: darkTheme.text,
    fontWeight: "bold",
    fontSize: 18,
  },
  authorName: {
    color: darkTheme.text,
    fontWeight: "bold",
    fontSize: 16,
  },
  dateText: {
    color: darkTheme.textSecondary,
    fontSize: 12,
  },
  description: {
    fontSize: 16,
    color: darkTheme.text,
    marginBottom: 12,
    lineHeight: 22,
  },
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  tag: {
    color: darkTheme.primary,
    fontSize: 14,
  },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  likeButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: darkTheme.card,
  },
  likeText: {
    color: darkTheme.text,
    fontSize: 14,
    fontWeight: "600",
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statsText: {
    color: darkTheme.textSecondary,
    fontSize: 14,
  },
  commentsContainer: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: darkTheme.text,
    marginBottom: 16,
  },
  commentItem: {
    flexDirection: "row",
    marginBottom: 16,
    gap: 12,
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: darkTheme.card,
    justifyContent: "center",
    alignItems: "center",
  },
  commentAvatarText: {
    color: darkTheme.text,
    fontWeight: "bold",
    fontSize: 14,
  },
  commentContent: {
    flex: 1,
    backgroundColor: darkTheme.surface,
    padding: 12,
    borderRadius: 12,
  },
  commentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  commentAuthor: {
    color: darkTheme.text,
    fontWeight: "bold",
    fontSize: 14,
  },
  commentDate: {
    color: darkTheme.textSecondary,
    fontSize: 12,
  },
  commentText: {
    color: darkTheme.text,
    fontSize: 14,
  },
  noComments: {
    color: darkTheme.textSecondary,
    fontStyle: "italic",
  },
  inputContainer: {
    flexDirection: "row",
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: darkTheme.border,
    backgroundColor: darkTheme.surface,
    alignItems: "center",
    gap: 12,
  },
  input: {
    flex: 1,
    backgroundColor: darkTheme.card,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    color: darkTheme.text,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: "#808080",
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    color: darkTheme.error,
    fontSize: 16,
    marginBottom: 12,
  },
  retryButton: {
    padding: 10,
    backgroundColor: darkTheme.primary,
    borderRadius: 8,
  },
  retryText: {
    color: darkTheme.background,
    fontWeight: "bold",
  },
});
