import { useContext, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from "react-native";
import Feather from "@expo/vector-icons/Feather";
import { SafeAreaView } from "react-native-safe-area-context";
import { AuthContext } from "../context/AuthContext";
import { darkTheme } from "../config/theme";
import { gql } from "@apollo/client";
import { useQuery } from "@apollo/client/react";

const ALL_POSTS = gql`
  query AllPosts {
    allposts {
      _id
      content
      tags
      imgUrl
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

export default function HomeScreen({ navigation }) {
  const { user, signOut } = useContext(AuthContext);
  const [selectedTag, setSelectedTag] = useState("All");
  const [selectedRelatedTag, setSelectedRelatedTag] = useState(null);
  const { data, loading, error, refetch } = useQuery(ALL_POSTS, {
    onError: (err) => {
      if (err.message.includes("401")) {
        signOut();
      }
    },
  });

  // Helper function to format time ago
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

  // Format count
  const formatViews = (count) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  // Get posts from query data or use empty array
  const posts = data?.allposts || [];

  const filteredPosts = posts.filter((post) => {
    // Filter by main tag
    let matchesMainTag = true;
    if (selectedTag !== "All") {
      matchesMainTag = post.tags?.some(
        (tag) => tag.toLowerCase() === selectedTag.toLowerCase()
      );
    }

    // Filter by related tag if selected
    let matchesRelatedTag = true;
    if (selectedRelatedTag) {
      matchesRelatedTag = post.tags?.some(
        (tag) => tag.toLowerCase() === selectedRelatedTag.toLowerCase()
      );
    }

    return matchesMainTag && matchesRelatedTag;
  });

  // Extract all unique tags from all posts
  const getAllTags = () => {
    const tagsSet = new Set();
    posts.forEach((post) => {
      post.tags?.forEach((tag) => {
        tagsSet.add(tag);
      });
    });
    return Array.from(tagsSet).sort();
  };

  const tags = [
    "All",
    "React Native",
    "JavaScript",
    "GraphQL",
    "MongoDB",
    "Node.js",
  ];

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.container}>
        {/* Header with Search */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Image
              source={require("../assets/youtube_logo.png")}
              style={styles.logoImage}
              resizeMode="contain"
            />
            <Text style={styles.logo}>Youtube</Text>
          </View>
          <View style={styles.headerIcons}>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => navigation.navigate("Search")}
            >
              <Feather name="search" size={24} color="white" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Related Tags Section */}
        {getAllTags().length > 0 && (
          <View style={styles.relatedTagsContainer}>
            <Text style={styles.relatedTagsLabel}>Related Tags</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.relatedTagsContent}
            >
              {getAllTags().map((tag, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.relatedTagChip,
                    selectedRelatedTag === tag && styles.relatedTagChipActive,
                  ]}
                  onPress={() =>
                    setSelectedRelatedTag(
                      selectedRelatedTag === tag ? null : tag
                    )
                  }
                >
                  <Text
                    style={[
                      styles.relatedTagText,
                      selectedRelatedTag === tag && styles.relatedTagTextActive,
                    ]}
                  >
                    {tag}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Posts/Videos List */}
        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={refetch}
              tintColor={darkTheme.text}
              colors={[darkTheme.primary]}
            />
          }
        >
          {loading && posts.length === 0 ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={darkTheme.primary} />
              <Text style={styles.loadingText}>Loading posts...</Text>
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>⚠️ Error loading posts</Text>
              <Text style={styles.errorSubtext}>{error.message}</Text>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={() => refetch()}
              >
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : posts.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>📭 No posts yet</Text>
              <Text style={styles.emptySubtext}>
                Be the first to create a post!
              </Text>
            </View>
          ) : (
            filteredPosts.map((post) => (
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
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>
                        {(post.author?.name || post.author?.username || "U")
                          .charAt(0)
                          .toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.postDetails}>
                      <Text style={styles.postTitle} numberOfLines={2}>
                        {post.content}
                      </Text>
                      <Text style={styles.postMeta}>
                        {post.author?.name ||
                          post.author?.username ||
                          "Unknown"}{" "}
                        • {formatViews(Math.floor(Math.random() * 1000000))}{" "}
                        views • {formatTimeAgo(post.createdAt)}
                      </Text>
                    </View>
                    <TouchableOpacity style={styles.moreButton}>
                      <Text style={styles.moreIcon}>⋮</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
          <View style={styles.bottomPadding} />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeAreaContainer: {
    flex: 1,
    backgroundColor: darkTheme.background,
  },
  container: {
    flex: 1,
    backgroundColor: darkTheme.background,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: darkTheme.surface,
    borderBottomWidth: 1,
    borderBottomColor: darkTheme.border,
  },
  logoContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  logoImage: {
    width: 32,
    height: 24,
  },
  logo: {
    fontSize: 20,
    // fontWeight: "700",
    fontFamily: Platform.select({
      ios: "Helvetica-Bold",
      android: "sans-serif-medium",
      default: "System",
    }),
    letterSpacing: -0.2,
    color: darkTheme.text,
  },
  headerIcons: {
    flexDirection: "row",
    gap: 12,
  },
  iconButton: {
    padding: 8,
  },
  iconText: {
    fontSize: 20,
  },
  tagsContainer: {
    backgroundColor: darkTheme.surface,
    borderBottomWidth: 1,
    borderBottomColor: darkTheme.border,
  },
  tagsContent: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 8,
  },
  tagChip: {
    backgroundColor: darkTheme.card,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: darkTheme.border,
  },
  tagChipActive: {
    backgroundColor: darkTheme.text,
  },
  tagText: {
    color: darkTheme.text,
    fontSize: 14,
    fontWeight: "500",
  },
  tagTextActive: {
    color: darkTheme.background,
  },
  relatedTagsContainer: {
    backgroundColor: darkTheme.surface,
    borderBottomWidth: 1,
    borderBottomColor: darkTheme.border,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  relatedTagsLabel: {
    color: darkTheme.text,
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 8,
    paddingHorizontal: 0,
  },
  relatedTagsContent: {
    gap: 8,
    paddingHorizontal: 0,
  },
  relatedTagChip: {
    backgroundColor: darkTheme.card,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: darkTheme.border,
  },
  relatedTagChipActive: {
    backgroundColor: darkTheme.primary,
    borderColor: darkTheme.primary,
  },
  relatedTagText: {
    color: darkTheme.text,
    fontSize: 12,
    fontWeight: "500",
  },
  relatedTagTextActive: {
    color: darkTheme.background,
  },
  content: {
    flex: 1,
  },
  postCard: {
    marginBottom: 16,
    backgroundColor: darkTheme.surface,
  },
  thumbnail: {
    width: "100%",
    height: 220,
    backgroundColor: darkTheme.card,
  },
  postInfo: {
    padding: 12,
  },
  postHeader: {
    flexDirection: "row",
    gap: 12,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: darkTheme.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: darkTheme.text,
    fontWeight: "bold",
    fontSize: 16,
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
  moreButton: {
    padding: 4,
  },
  moreIcon: {
    color: darkTheme.text,
    fontSize: 20,
  },
  bottomPadding: {
    height: 80,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 100,
  },
  loadingText: {
    color: darkTheme.textSecondary,
    marginTop: 12,
    fontSize: 14,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 100,
    paddingHorizontal: 32,
  },
  errorText: {
    color: darkTheme.error,
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },
  errorSubtext: {
    color: darkTheme.textSecondary,
    fontSize: 14,
    textAlign: "center",
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: darkTheme.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: darkTheme.text,
    fontWeight: "bold",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 100,
  },
  emptyText: {
    color: darkTheme.text,
    fontSize: 24,
    marginBottom: 8,
  },
  emptySubtext: {
    color: darkTheme.textSecondary,
    fontSize: 14,
  },
});
