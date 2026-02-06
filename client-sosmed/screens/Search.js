import { useState, useContext, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  TextInput,
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Feather from "@expo/vector-icons/Feather";
import { darkTheme } from "../config/theme";
import { gql } from "@apollo/client";
import { useQuery, useMutation } from "@apollo/client/react";
import { AuthContext } from "../context/AuthContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import CustomAlert from "../components/CustomAlert";
import client from "../config/apollo";

const SEARCH_USERS = gql`
  query SearchUsers($search: String) {
    searchUsers(search: $search) {
      _id
      name
      username
      email
      followers
    }
  }
`;

const GET_ALL_POSTS = gql`
  query AllPosts {
    allposts {
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
      createdAt
    }
  }
`;

const GET_USER_FOLLOWS = gql`
  query GetUserFollows($userId: ID!) {
    getUserFollows(userId: $userId) {
      _id
      followingId
    }
  }
`;

const FOLLOW_USER = gql`
  mutation Follow($followingId: ID!, $followerId: ID!) {
    follow(followingId: $followingId, followerId: $followerId) {
      success
      message
      user {
        _id
        name
        username
        followers
      }
    }
  }
`;

const UNFOLLOW_USER = gql`
  mutation Unfollow($followingId: ID!, $followerId: ID!) {
    unfollow(followingId: $followingId, followerId: $followerId) {
      success
      message
      user {
        _id
        name
        username
        followers
      }
    }
  }
`;

export default function SearchScreen({ navigation }) {
  const { user } = useContext(AuthContext);
  const [searchText, setSearchText] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [subscribedUsers, setSubscribedUsers] = useState([]);
  const [alert, setAlert] = useState({
    visible: false,
    title: "",
    message: "",
    type: "info",
    buttons: [],
  });

  // Load subscribed users from backend on mount
  useEffect(() => {
    const loadExistingFollows = async () => {
      if (user?._id) {
        try {
          // Will be loaded via GraphQL query below
        } catch (error) {
          console.error("Error loading follows:", error);
        }
      }
    };
    loadExistingFollows();
  }, [user]);

  // Load subscribed users from AsyncStorage on mount
  useEffect(() => {
    const loadSubscribedUsers = async () => {
      try {
        const stored = await AsyncStorage.getItem("subscribedUsers");
        if (stored) {
          setSubscribedUsers(JSON.parse(stored));
        }
      } catch (error) {
        console.error("Error loading subscribed users:", error);
      }
    };
    loadSubscribedUsers();
  }, []);

  // Save subscribed users to AsyncStorage whenever it changes
  useEffect(() => {
    const saveSubscribedUsers = async () => {
      try {
        await AsyncStorage.setItem(
          "subscribedUsers",
          JSON.stringify(subscribedUsers)
        );
      } catch (error) {
        console.error("Error saving subscribed users:", error);
      }
    };
    saveSubscribedUsers();
  }, [subscribedUsers]);

  // Clear subscribed users when user logs out
  useEffect(() => {
    if (!user) {
      setSubscribedUsers([]);
      AsyncStorage.removeItem("subscribedUsers");
    }
  }, [user]);

  // Fetch user's existing follows from backend
  useEffect(() => {
    const fetchUserFollows = async () => {
      if (user?._id) {
        try {
          const { data } = await client.query({
            query: GET_USER_FOLLOWS,
            variables: { userId: user._id },
            fetchPolicy: "network-only",
          });

          if (data?.getUserFollows) {
            const followedIds = data.getUserFollows.map(
              (follow) => follow.followingId
            );
            setSubscribedUsers(followedIds);
            await AsyncStorage.setItem(
              "subscribedUsers",
              JSON.stringify(followedIds)
            );
          }
        } catch (error) {
          console.error("Error fetching user follows:", error);
        }
      }
    };

    fetchUserFollows();
  }, [user?._id]);

  const {
    data: searchData,
    loading: searchLoading,
    refetch: refetchSearch,
  } = useQuery(SEARCH_USERS, {
    variables: { search: searchText },
    skip: searchText.length === 0,
  });

  const { data: postsData, loading: postsLoading } = useQuery(GET_ALL_POSTS);

  const [followUser, { loading: followLoading }] = useMutation(FOLLOW_USER, {
    onError: (error) => {
      console.error("Follow error:", error);
    },
  });

  const [unfollowUser, { loading: unfollowLoading }] = useMutation(
    UNFOLLOW_USER,
    {
      onError: (error) => {
        console.error("Unfollow error:", error);
      },
    }
  );

  const handleFollow = async (followingId) => {
    if (!user?._id) {
      setAlert({
        visible: true,
        title: "Login Required",
        message: "Please login first",
        type: "warning",
        buttons: [{ text: "OK" }],
      });
      return;
    }

    // Prevent subscribing to self
    if (followingId === user._id) {
      setAlert({
        visible: true,
        title: "Cannot Subscribe",
        message: "You cannot subscribe to yourself",
        type: "warning",
        buttons: [{ text: "OK" }],
      });
      return;
    }

    // Check if already subscribed
    const isAlreadySubscribed = subscribedUsers.includes(followingId);

    try {
      if (isAlreadySubscribed) {
        // Unfollow
        const result = await unfollowUser({
          variables: {
            followingId: followingId,
            followerId: user._id,
          },
        });
        if (result.data.unfollow.success) {
          setSubscribedUsers(
            subscribedUsers.filter((id) => id !== followingId)
          );
          // Update selected user's followers count
          if (selectedUser._id === followingId) {
            setSelectedUser({
              ...selectedUser,
              followers: result.data.unfollow.user.followers,
            });
          }
          setAlert({
            visible: true,
            title: "Unsubscribed",
            message: "Unsubscribed successfully!",
            type: "success",
            buttons: [{ text: "OK" }],
          });
        } else {
          setAlert({
            visible: true,
            title: "Error",
            message: result.data.unfollow.message,
            type: "error",
            buttons: [{ text: "OK" }],
          });
        }
      } else {
        // Follow
        const result = await followUser({
          variables: {
            followingId: followingId,
            followerId: user._id,
          },
        });
        if (result.data.follow.success) {
          setSubscribedUsers([...subscribedUsers, followingId]);
          // Update selected user's followers count
          if (selectedUser._id === followingId) {
            setSelectedUser({
              ...selectedUser,
              followers: result.data.follow.user.followers,
            });
          }
          setAlert({
            visible: true,
            title: "Subscribed",
            message: "Subscribed successfully!",
            type: "success",
            buttons: [{ text: "OK" }],
          });
        } else {
          setAlert({
            visible: true,
            title: "Error",
            message: result.data.follow.message,
            type: "error",
            buttons: [{ text: "OK" }],
          });
        }
      }
    } catch (error) {
      console.error("Follow error:", error);
      setAlert({
        visible: true,
        title: "Error",
        message: error.message,
        type: "error",
        buttons: [{ text: "OK" }],
      });
    }
  };

  const handleSearch = (text) => {
    setSearchText(text);
    setSelectedUser(null);
  };

  const handleSelectUser = (selectedUser) => {
    setSelectedUser(selectedUser);
    setSearchText("");
  };

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
      if (interval >= 1) {
        return `${interval} ${unit}${interval > 1 ? "s" : ""} ago`;
      }
    }
    return "just now";
  };

  const formatViews = (count) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  const users = searchData?.searchUsers || [];
  const allPosts = postsData?.allposts || [];
  const userPosts = selectedUser
    ? allPosts.filter((post) => post.authorId === selectedUser._id)
    : [];

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 12 : 0}
      >
        {/* Header with Search */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() =>
              selectedUser
                ? setSelectedUser(null)
                : navigation.navigate("HomeTab")
            }
          >
            <Feather name="arrow-left" size={24} color="white" />
          </TouchableOpacity>
          <View style={styles.searchContainer}>
            <Feather
              name="search"
              size={20}
              color={darkTheme.textSecondary}
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Search users..."
              placeholderTextColor={darkTheme.textSecondary}
              value={searchText}
              onChangeText={handleSearch}
              autoCapitalize="none"
              returnKeyType="search"
            />
            {searchText.length > 0 && (
              <TouchableOpacity onPress={() => setSearchText("")}>
                <Feather
                  name="x"
                  size={20}
                  color={darkTheme.textSecondary}
                  style={styles.clearIcon}
                />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Content */}
        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {selectedUser ? (
            // User Profile View
            <View>
              {/* User Info Header */}
              <View style={styles.profileHeader}>
                <View style={styles.profileInfo}>
                  <View style={styles.largeAvatar}>
                    <Text style={styles.largeAvatarText}>
                      {selectedUser.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.userDetails}>
                    <Text style={styles.userName}>{selectedUser.name}</Text>
                    <Text style={styles.userUsername}>
                      @{selectedUser.username}
                    </Text>
                    <View style={styles.statsContainer}>
                      <View style={styles.statItem}>
                        <Text style={styles.statNumber}>
                          {userPosts.length}
                        </Text>
                        <Text style={styles.statLabel}>
                          {userPosts.length === 1 ? "Post" : "Posts"}
                        </Text>
                      </View>
                      <View style={styles.statItem}>
                        <Text style={styles.statNumber}>
                          {selectedUser.followers || 0}
                        </Text>
                        <Text style={styles.statLabel}>
                          {selectedUser.followers === 1
                            ? "Follower"
                            : "Followers"}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
                <TouchableOpacity
                  style={[
                    styles.subscribeButton,
                    subscribedUsers.includes(selectedUser._id) &&
                      styles.subscribeButtonSubscribed,
                    followLoading && styles.subscribeButtonDisabled,
                  ]}
                  onPress={() => handleFollow(selectedUser._id)}
                  disabled={followLoading}
                >
                  {followLoading ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Text
                      style={[
                        styles.subscribeButtonText,
                        subscribedUsers.includes(selectedUser._id) &&
                          styles.subscribeButtonTextSubscribed,
                      ]}
                    >
                      {subscribedUsers.includes(selectedUser._id)
                        ? "Subscribed"
                        : "Subscribe"}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>

              {/* User Posts */}
              <View style={styles.postsSection}>
                <Text style={styles.sectionTitle}>Videos</Text>
                {postsLoading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={darkTheme.primary} />
                  </View>
                ) : userPosts.length === 0 ? (
                  <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>No posts yet</Text>
                  </View>
                ) : (
                  userPosts.map((post) => (
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
                        style={styles.thumbnail}
                      />
                      <View style={styles.postInfo}>
                        <View style={styles.postHeader}>
                          <View style={styles.postDetails}>
                            <Text style={styles.postTitle} numberOfLines={2}>
                              {post.content}
                            </Text>
                            <Text style={styles.postMeta}>
                              {formatViews(Math.floor(Math.random() * 1000000))}{" "}
                              views • {formatTimeAgo(post.createdAt)}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))
                )}
              </View>
            </View>
          ) : searchText.length > 0 ? (
            // Search Results
            <View>
              {searchLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={darkTheme.primary} />
                  <Text style={styles.loadingText}>Searching...</Text>
                </View>
              ) : users.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>No users found</Text>
                  <Text style={styles.emptySubtext}>
                    Try searching with a different name or username
                  </Text>
                </View>
              ) : (
                users.map((user) => (
                  <TouchableOpacity
                    key={user._id}
                    style={styles.userCard}
                    onPress={() => handleSelectUser(user)}
                  >
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>
                        {user.name.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.userInfo}>
                      <Text style={styles.userName}>{user.name}</Text>
                      <Text style={styles.userUsername}>@{user.username}</Text>
                    </View>
                    <Feather
                      name="chevron-right"
                      size={24}
                      color={darkTheme.textSecondary}
                    />
                  </TouchableOpacity>
                ))
              )}
            </View>
          ) : (
            // Initial State
            <View style={styles.initialContainer}>
              <Feather
                name="search"
                size={64}
                color={darkTheme.textSecondary}
              />
              <Text style={styles.initialText}>Search for users</Text>
              <Text style={styles.initialSubtext}>
                Find and follow your favorite creators
              </Text>
            </View>
          )}
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: darkTheme.surface,
    borderBottomWidth: 1,
    borderBottomColor: darkTheme.border,
    gap: 12,
  },
  backButton: {
    width: 24,
  },
  searchContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: darkTheme.card,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 40,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: darkTheme.text,
    fontSize: 16,
  },
  clearIcon: {
    marginLeft: 8,
  },
  content: {
    flex: 1,
  },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: darkTheme.surface,
    borderBottomWidth: 1,
    borderBottomColor: darkTheme.border,
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
  userInfo: {
    flex: 1,
  },
  userName: {
    color: darkTheme.text,
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  userUsername: {
    color: darkTheme.textSecondary,
    fontSize: 14,
  },
  profileHeader: {
    padding: 16,
    backgroundColor: darkTheme.surface,
    borderBottomWidth: 1,
    borderBottomColor: darkTheme.border,
  },
  profileInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 16,
  },
  largeAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: darkTheme.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  largeAvatarText: {
    color: darkTheme.text,
    fontWeight: "bold",
    fontSize: 36,
  },
  userDetails: {
    flex: 1,
  },
  statsContainer: {
    flexDirection: "row",
    marginTop: 12,
    gap: 20,
  },
  statItem: {
    alignItems: "center",
  },
  statNumber: {
    color: darkTheme.text,
    fontSize: 18,
    fontWeight: "bold",
  },
  statLabel: {
    color: darkTheme.textSecondary,
    fontSize: 12,
    marginTop: 4,
  },
  postCount: {
    color: darkTheme.textSecondary,
    fontSize: 14,
    marginTop: 4,
  },
  subscribeButton: {
    backgroundColor: darkTheme.primary,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 120,
  },
  subscribeButtonDisabled: {
    opacity: 0.6,
  },
  subscribeButtonText: {
    color: darkTheme.text,
    fontSize: 14,
    fontWeight: "bold",
  },
  subscribeButtonSubscribed: {
    backgroundColor: darkTheme.card,
    borderWidth: 1,
    borderColor: darkTheme.primary,
  },
  subscribeButtonTextSubscribed: {
    color: darkTheme.primary,
  },
  postsSection: {
    padding: 16,
  },
  sectionTitle: {
    color: darkTheme.text,
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
  },
  postCard: {
    marginBottom: 16,
    backgroundColor: darkTheme.surface,
    borderRadius: 8,
    overflow: "hidden",
  },
  thumbnail: {
    width: "100%",
    height: 180,
    backgroundColor: darkTheme.card,
  },
  postInfo: {
    padding: 12,
  },
  postHeader: {
    flexDirection: "row",
    gap: 12,
  },
  postDetails: {
    flex: 1,
  },
  postTitle: {
    color: darkTheme.text,
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 4,
    lineHeight: 20,
  },
  postMeta: {
    color: darkTheme.textSecondary,
    fontSize: 12,
  },
  loadingContainer: {
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  loadingText: {
    color: darkTheme.textSecondary,
    marginTop: 12,
    fontSize: 14,
  },
  emptyContainer: {
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyText: {
    color: darkTheme.text,
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
  },
  emptySubtext: {
    color: darkTheme.textSecondary,
    fontSize: 14,
    textAlign: "center",
  },
  initialContainer: {
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 100,
    paddingHorizontal: 32,
  },
  initialText: {
    color: darkTheme.text,
    fontSize: 20,
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 8,
  },
  initialSubtext: {
    color: darkTheme.textSecondary,
    fontSize: 14,
    textAlign: "center",
  },
});
