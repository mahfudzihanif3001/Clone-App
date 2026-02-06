import { useContext, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Image,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Feather from "@expo/vector-icons/Feather";
import { gql } from "@apollo/client";
import { useQuery, useMutation } from "@apollo/client/react";
import { darkTheme } from "../config/theme";
import { AuthContext } from "../context/AuthContext";
import CustomAlert from "../components/CustomAlert";

const ALL_POSTS = gql`
  query AllPosts {
    allposts {
      _id
      content
      imgUrl
      authorId
      createdAt
      likes {
        username
      }
      comments {
        username
        content
        createdAt
      }
    }
  }
`;

const GET_USER_PROFILE = gql`
  query GetUser($id: ID!) {
    user(id: $id) {
      _id
      name
      username
      email
      followers
    }
  }
`;

const LIKE_POST = gql`
  mutation LikePost($postId: ID!, $username: String!) {
    likePost(postId: $postId, username: $username) {
      username
    }
  }
`;

const COMMENT_POST = gql`
  mutation CommentPost($postId: ID!, $content: String!, $username: String!) {
    commentPost(postId: $postId, content: $content, username: $username) {
      content
      username
      createdAt
    }
  }
`;

const DELETE_POST = gql`
  mutation DeletePost($id: ID!) {
    deletePost(id: $id) {
      _id
    }
  }
`;

const FOLLOW = gql`
  mutation Follow($followingId: ID!, $followerId: ID!) {
    follow(followingId: $followingId, followerId: $followerId) {
      _id
      followingId
      followerId
    }
  }
`;

export default function ProfileScreen({ navigation }) {
  const { user, signOut } = useContext(AuthContext);
  const [commentInputs, setCommentInputs] = useState({});
  const [alert, setAlert] = useState({
    visible: false,
    title: "",
    message: "",
    type: "info",
    buttons: [],
  });

  const { data, loading, error, refetch } = useQuery(ALL_POSTS, {
    fetchPolicy: "cache-and-network",
  });

  const { data: profileData } = useQuery(GET_USER_PROFILE, {
    variables: { id: user?._id },
    skip: !user?._id,
    fetchPolicy: "cache-and-network",
  });

  const [likePost, { loading: likeLoading }] = useMutation(LIKE_POST, {
    onCompleted: () => refetch(),
    onError: (err) =>
      setAlert({
        visible: true,
        title: "Like Failed",
        message: err.message,
        type: "error",
        buttons: [{ text: "OK" }],
      }),
  });

  const [commentPost, { loading: commentLoading }] = useMutation(COMMENT_POST, {
    onCompleted: () => refetch(),
    onError: (err) =>
      setAlert({
        visible: true,
        title: "Comment Failed",
        message: err.message,
        type: "error",
        buttons: [{ text: "OK" }],
      }),
  });

  const [deletePost, { loading: deleteLoading }] = useMutation(DELETE_POST, {
    onCompleted: () => {
      setAlert({
        visible: true,
        title: "Success",
        message: "Post deleted successfully!",
        type: "success",
        buttons: [{ text: "OK" }],
      });
      refetch();
    },
    onError: (err) =>
      setAlert({
        visible: true,
        title: "Delete Failed",
        message: err.message,
        type: "error",
        buttons: [{ text: "OK" }],
      }),
  });

  const myPosts = useMemo(
    () => (data?.allposts || []).filter((p) => p.authorId === user?._id),
    [data, user]
  );

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    const intervals = {
      year: 31536000,
      month: 2592000,
      week: 604800,
      day: 86400,
      hour: 3600,
      minute: 60,
    };
    for (const [unit, secondsInUnit] of Object.entries(intervals)) {
      const interval = Math.floor(seconds / secondsInUnit);
      if (interval >= 1)
        return `${interval} ${unit}${interval > 1 ? "s" : ""} ago`;
    }
    return "just now";
  };

  const formatViews = (count) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  const handleLike = async (postId) => {
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
    await likePost({ variables: { postId, username: user.username } });
  };

  const handleComment = async (postId) => {
    const text = (commentInputs[postId] || "").trim();
    if (!text) {
      setAlert({
        visible: true,
        title: "Empty Comment",
        message: "Please write something first",
        type: "warning",
        buttons: [{ text: "OK" }],
      });
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
    await commentPost({
      variables: { postId, content: text, username: user.username },
    });
    setCommentInputs((prev) => ({ ...prev, [postId]: "" }));
  };

  const handleDeletePost = (postId) => {
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
          onPress: async () => {
            setAlert({ ...alert, visible: false });
            await deletePost({ variables: { id: postId } });
          },
        },
      ],
    });
  };

  const userInitial = (user?.name || user?.username || "U")
    .charAt(0)
    .toUpperCase();

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
        <TouchableOpacity style={styles.logoutIcon} onPress={signOut}>
          <Feather name="log-out" size={20} color={darkTheme.text} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{userInitial}</Text>
          </View>
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.name}>{user?.name || "User"}</Text>
          <Text style={styles.username}>@{user?.username || "username"}</Text>
          {user?.email && <Text style={styles.email}>{user.email}</Text>}
        </View>

        {/* Subscriber Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {profileData?.user?.followers || 0}
            </Text>
            <Text style={styles.statLabel}>
              {profileData?.user?.followers === 1
                ? "Subscriber"
                : "Subscribers"}
            </Text>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Postingan Saya</Text>
        </View>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={darkTheme.primary} />
          </View>
        ) : error ? (
          <View style={styles.loadingBox}>
            <Text style={styles.errorText}>Gagal memuat postingan</Text>
            <Text style={styles.errorSub}>{error.message}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={refetch}>
              <Text style={styles.retryText}>Coba lagi</Text>
            </TouchableOpacity>
          </View>
        ) : myPosts.length === 0 ? (
          <View style={styles.loadingBox}>
            <Text style={styles.emptyText}>Belum ada postingan</Text>
            <Text style={styles.emptySub}>Buat konten pertama kamu</Text>
          </View>
        ) : (
          myPosts.map((post) => {
            const likedByMe = post.likes?.some(
              (l) => l.username === user?.username
            );
            const likeCount = post.likes?.length || 0;
            return (
              <TouchableOpacity
                key={post._id}
                style={styles.postCard}
                onPress={() =>
                  navigation.navigate("PostDetail", { postId: post._id })
                }
              >
                <Image
                  source={{
                    uri:
                      post.imgUrl ||
                      `https://via.placeholder.com/400x225/${Math.floor(
                        Math.random() * 16777215
                      ).toString(16)}/ffffff?text=${encodeURIComponent(
                        post.content.substring(0, 20)
                      )}`,
                  }}
                  style={styles.postImage}
                />
                <Text style={styles.postContent} numberOfLines={2}>
                  {post.content}
                </Text>
                <Text style={styles.postMeta}>
                  {formatViews(Math.floor(Math.random() * 1000000))} views •{" "}
                  {formatTimeAgo(post.createdAt)}
                </Text>

                <View style={styles.postHeader}>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDeletePost(post._id)}
                    disabled={deleteLoading}
                  >
                    <Feather
                      name="trash-2"
                      size={18}
                      color={darkTheme.primary}
                    />
                  </TouchableOpacity>
                </View>

                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleLike(post._id)}
                    disabled={likeLoading}
                  >
                    <Feather
                      name={likedByMe ? "thumbs-up" : "thumbs-up"}
                      size={18}
                      color={likedByMe ? darkTheme.primary : darkTheme.text}
                    />
                    <Text style={styles.actionText}>{likeCount}</Text>
                  </TouchableOpacity>

                  <View
                    style={[
                      styles.commentBox,
                      commentLoading && styles.buttonDisabled,
                    ]}
                  >
                    <TextInput
                      placeholder="Tulis komentar..."
                      placeholderTextColor={darkTheme.textSecondary}
                      style={styles.commentInput}
                      value={commentInputs[post._id] || ""}
                      onChangeText={(text) =>
                        setCommentInputs((prev) => ({
                          ...prev,
                          [post._id]: text,
                        }))
                      }
                    />
                    <TouchableOpacity
                      style={styles.sendButton}
                      onPress={() => handleComment(post._id)}
                      disabled={commentLoading}
                    >
                      {commentLoading ? (
                        <ActivityIndicator
                          size="small"
                          color={darkTheme.background}
                        />
                      ) : (
                        <Feather
                          name="send"
                          size={16}
                          color={darkTheme.background}
                        />
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

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
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: darkTheme.surface,
    borderBottomWidth: 1,
    borderBottomColor: darkTheme.border,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: darkTheme.text,
  },
  logoutIcon: {
    padding: 8,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 32,
    marginVertical: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: darkTheme.border,
    width: "100%",
  },
  statItem: {
    alignItems: "center",
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: darkTheme.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: darkTheme.textSecondary,
  },
  content: {
    flexGrow: 1,
    alignItems: "center",
    paddingTop: 24,
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: darkTheme.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: darkTheme.text,
    fontWeight: "bold",
    fontSize: 40,
  },
  infoSection: {
    alignItems: "center",
    marginBottom: 24,
  },
  name: {
    fontSize: 24,
    fontWeight: "bold",
    color: darkTheme.text,
    marginBottom: 4,
  },
  username: {
    fontSize: 16,
    color: darkTheme.textSecondary,
    marginBottom: 2,
  },
  email: {
    fontSize: 14,
    color: darkTheme.textSecondary,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    paddingHorizontal: 4,
    marginBottom: 12,
  },
  sectionTitle: {
    color: darkTheme.text,
    fontSize: 18,
    fontWeight: "bold",
  },
  loadingBox: {
    width: "100%",
    backgroundColor: darkTheme.surface,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: darkTheme.border,
  },
  errorText: {
    color: darkTheme.error,
    fontWeight: "700",
    marginBottom: 6,
  },
  errorSub: {
    color: darkTheme.textSecondary,
    textAlign: "center",
    marginBottom: 10,
  },
  retryButton: {
    backgroundColor: darkTheme.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  retryText: {
    color: darkTheme.text,
    fontWeight: "bold",
  },
  emptyText: {
    color: darkTheme.text,
    fontWeight: "700",
    marginBottom: 6,
  },
  emptySub: {
    color: darkTheme.textSecondary,
  },
  postCard: {
    width: "100%",
    backgroundColor: darkTheme.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: darkTheme.border,
  },
  postImage: {
    width: "100%",
    height: 160,
    borderRadius: 10,
    marginBottom: 10,
    backgroundColor: darkTheme.card,
  },
  postContent: {
    color: darkTheme.text,
    fontSize: 15,
    marginBottom: 6,
  },
  postMeta: {
    color: darkTheme.textSecondary,
    fontSize: 12,
  },
  postHeader: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 10,
    marginBottom: 8,
  },
  deleteButton: {
    padding: 8,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 8,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: darkTheme.border,
  },
  actionText: {
    color: darkTheme.text,
  },
  commentBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: darkTheme.card,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  commentInput: {
    flex: 1,
    color: darkTheme.text,
    fontSize: 14,
  },
  sendButton: {
    backgroundColor: darkTheme.primary,
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
