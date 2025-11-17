import React from "react";
import { FlatList, TouchableOpacity, View, Text } from "react-native";
import { styles } from "./styles";

export default function FriendsListView({
  friends,
  userProfile,
  openProfile,
  openSelfEditor,
}) {
  return (
    <FlatList
      data={friends}
      keyExtractor={(item) => item.id}
      ListHeaderComponent={() => (
        <TouchableOpacity
          style={[styles.friendRow, styles.userRow]}
          onPress={openSelfEditor}
        >
          <View
            style={[
              styles.avatar,
              { backgroundColor: userProfile.avatarColor },
            ]}
          >
            <Text style={styles.avatarText}>{userProfile.name.charAt(0)}</Text>
          </View>
          <View style={styles.friendInfo}>
            <Text style={styles.friendName}>{userProfile.name}</Text>
            <Text style={styles.friendSubtitle}>{userProfile.status}</Text>
            <Text style={styles.profileTag}>내 프로필</Text>
          </View>
        </TouchableOpacity>
      )}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={styles.friendRow}
          onPress={() => openProfile(item)}
        >
          <View
            style={[
              styles.avatar,
              { backgroundColor: item.avatarColor || "#ddd" },
            ]}
          >
            <Text style={styles.avatarText}>{item.name.charAt(0)}</Text>
          </View>
          <View style={styles.friendInfo}>
            <Text style={styles.friendName}>{item.name}</Text>
            <Text style={styles.friendSubtitle}>{item.status}</Text>
          </View>
        </TouchableOpacity>
      )}
    />
  );
}
