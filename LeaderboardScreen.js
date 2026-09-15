import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { onValue, orderByChild, query, ref } from 'firebase/database';
import { db } from './firebase';

// Gold, silver, and bronze badges for the top three ranks.
const medals = ['#E5A823', '#A3ABB5', '#C07F4A'];

// Every account ranked by click count, highest first. uid is the signed-in user, to highlight their row.
export default function LeaderboardScreen({ uid, colors }) {
  const [players, setPlayers] = useState(null); // null until the first snapshot arrives
  const [error, setError] = useState('');

  // Every account's name and clicks, kept live as anyone taps.
  useEffect(
    () =>
      onValue(
        query(ref(db, 'users'), orderByChild('clicks')),
        (snap) => {
          const list = [];
          snap.forEach((child) => {
            const { name, clicks } = child.val();
            list.push({ uid: child.key, name: name || 'Anonymous', clicks: clicks ?? 0 });
          });
          // The query sorts lowest first, so flip it.
          setPlayers(rank(list.reverse()));
          setError('');
        },
        (e) => setError(e.message)
      ),
    []
  );

  // Shown when the list is empty: a spinner while loading, then an error or a "no players" hint.
  const messageStyle = [styles.message, { color: colors.muted }];
  let emptyState = <ActivityIndicator style={styles.message} />;
  if (error) {
    emptyState = <Text style={messageStyle}>Couldn't load the leaderboard. {error}</Text>;
  } else if (players) {
    emptyState = <Text style={messageStyle}>No players yet. Tap the cookie to get on the board.</Text>;
  }

  return (
    <FlatList
      data={players ?? []}
      keyExtractor={(player) => player.uid}
      renderItem={({ item }) => <Row player={item} isYou={item.uid === uid} colors={colors} />}
      ListEmptyComponent={emptyState}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={styles.list}
      style={{ backgroundColor: colors.background }}
    />
  );
}

// One line of the leaderboard: rank badge, name, and click count.
function Row({ player, isYou, colors }) {
  const medal = medals[player.rank - 1]; // undefined past 3rd place, so the badge stays plain
  return (
    <View style={[styles.row, isYou && { backgroundColor: colors.card }]}>
      <View style={[styles.badge, medal && { backgroundColor: medal }]}>
        <Text style={[styles.rank, { color: medal ? '#000' : colors.muted }]}>{player.rank}</Text>
      </View>
      <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
        {player.name}
        {isYou && <Text style={{ color: colors.muted }}> (you)</Text>}
      </Text>
      <Text style={[styles.clicks, { color: colors.text }]}>{player.clicks.toLocaleString()}</Text>
    </View>
  );
}

// Players with the same count share a rank: 1, 2, 2, 4.
function rank(players) {
  let current = 0;
  return players.map((player, i) => {
    if (i === 0 || player.clicks !== players[i - 1].clicks) current = i + 1;
    return { ...player, rank: current };
  });
}

const styles = StyleSheet.create({
  list: {
    paddingHorizontal: 16,
    paddingBottom: 32,
    gap: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderCurve: 'continuous',
  },
  badge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rank: {
    fontSize: 15,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  name: {
    flex: 1,
    fontSize: 17,
  },
  clicks: {
    fontSize: 17,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  message: {
    marginTop: 48,
    paddingHorizontal: 32,
    fontSize: 15,
    textAlign: 'center',
  },
});
