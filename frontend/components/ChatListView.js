import React from "react";
import { ScrollView, TouchableOpacity, View, Text, Image } from "react-native";
import { styles } from "./styles";

export default function ChatListView({ friends, openChatSession }) {
  return (
    <ScrollView>
      {friends.map((friend) => (
        <TouchableOpacity
          key={friend.id}
          style={styles.chatRow}
          onPress={() => openChatSession(friend)}
        >
          {friend.imageUri ? (
            <Image
              source={{ uri: friend.imageUri }}
              style={styles.avatarSmall}
            />
          ) : (
            <View
              style={[
                styles.avatarSmall,
                { backgroundColor: friend.avatarColor || "#ddd" },
              ]}
            >
              <Text style={styles.avatarText}>{friend.name.charAt(0)}</Text>
            </View>
          )}
          <View style={{ flex: 1 }}>
            <Text style={{ fontWeight: "600" }}>{friend.name}</Text>
            <Text style={styles.chatHint}>터치해서 이전 대화 보기</Text>
          </View>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}
