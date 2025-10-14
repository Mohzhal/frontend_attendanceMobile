import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  Alert,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from "react-native";
import axios from "axios";
import Constants from "expo-constants";
import { LinearGradient } from "expo-linear-gradient";

export default function HistoryScreen({ route }) {
  const { token, user } = route.params;
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all, today, week, month

  const BASE_URL =
    Constants.expoConfig?.extra?.API_URL ||
    process.env.EXPO_PUBLIC_API_URL ||
    "http://192.168.1.5:5000";

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        console.log("📡 Fetching:", `${BASE_URL}/api/attendance/history/${user.id}`);
        const res = await axios.get(
          `${BASE_URL}/api/attendance/history/${user.id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        console.log("✅ History data received:", res.data);
        setData(res.data);
      } catch (err) {
        console.error("❌ Fetch history error:", err.response?.data || err.message);
        Alert.alert("Gagal", "Tidak dapat memuat riwayat absensi pengguna");
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  // Animated Card Component
  const HistoryCard = ({ item, index }) => {
    const fadeAnim = new Animated.Value(0);
    const slideAnim = new Animated.Value(50);

    React.useEffect(() => {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          delay: index * 100,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 400,
          delay: index * 100,
          useNativeDriver: true,
        }),
      ]).start();
    }, []);

    const hasCheckout = item.checkout && item.checkout !== "Belum Check-out";
    const statusColor = hasCheckout ? "#10B981" : "#F59E0B";
    const statusText = hasCheckout ? "Lengkap" : "Belum Checkout";

    return (
      <Animated.View
        style={[
          styles.card,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        {/* Status Badge */}
        <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
          <Text style={styles.statusText}>{statusText}</Text>
        </View>

        {/* Company Name with Icon */}
        <View style={styles.companyRow}>
          <View style={styles.iconCircle}>
            <Text style={styles.iconText}>🏢</Text>
          </View>
          <View style={styles.companyInfo}>
            <Text style={styles.company}>{item.company_name}</Text>
            <Text style={styles.date}>📅 {item.date}</Text>
          </View>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Time Info */}
        <View style={styles.timeContainer}>
          {/* Check In */}
          <View style={styles.timeBox}>
            <View style={styles.timeIconWrapper}>
              <Text style={styles.timeIcon}>🌅</Text>
            </View>
            <Text style={styles.timeLabel}>Masuk</Text>
            <Text style={[styles.timeValue, !item.checkin && styles.noCheck]}>
              {item.checkin || "Belum Check-in"}
            </Text>
          </View>

          {/* Separator */}
          <View style={styles.timeSeparator}>
            <Text style={styles.arrowIcon}>→</Text>
          </View>

          {/* Check Out */}
          <View style={styles.timeBox}>
            <View style={styles.timeIconWrapper}>
              <Text style={styles.timeIcon}>🌆</Text>
            </View>
            <Text style={styles.timeLabel}>Pulang</Text>
            <Text style={[styles.timeValue, !hasCheckout && styles.noCheck]}>
              {item.checkout || "Belum Check-out"}
            </Text>
          </View>
        </View>

        {/* Working Hours (if both times exist) */}
        {item.checkin && hasCheckout && (
          <View style={styles.durationBadge}>
            <Text style={styles.durationText}>⏱️ Durasi Kerja</Text>
          </View>
        )}
      </Animated.View>
    );
  };

  if (loading) {
    return (
      <LinearGradient colors={["#667eea", "#764ba2"]} style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.loadingText}>Memuat data...</Text>
        </View>
      </LinearGradient>
    );
  }

  if (!data || data.length === 0) {
    return (
      <LinearGradient colors={["#667eea", "#764ba2"]} style={styles.container}>
        <View style={styles.center}>
          <Text style={styles.emptyIcon}>📭</Text>
          <Text style={styles.emptyText}>Belum ada riwayat absensi</Text>
          <Text style={styles.emptySubtext}>
            Mulai absensi untuk melihat riwayat Anda
          </Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header with Gradient */}
      <LinearGradient colors={["#667eea", "#764ba2"]} style={styles.headerGradient}>
        <Text style={styles.headerTitle}>📋 Riwayat Absensi</Text>
        <Text style={styles.headerSubtitle}>
          Total: {data.length} riwayat
        </Text>
      </LinearGradient>

      {/* Content */}
      <FlatList
        data={data}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item, index }) => <HistoryCard item={item} index={index} />}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F4F6",
  },
  headerGradient: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#E0E7FF",
  },
  listContent: {
    padding: 20,
    paddingTop: 25,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    position: "relative",
  },
  statusBadge: {
    position: "absolute",
    top: 15,
    right: 15,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "bold",
  },
  companyRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  iconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#EEF2FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  iconText: {
    fontSize: 24,
  },
  companyInfo: {
    flex: 1,
  },
  company: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 3,
  },
  date: {
    fontSize: 13,
    color: "#6B7280",
  },
  divider: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginVertical: 15,
  },
  timeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  timeBox: {
    flex: 1,
    alignItems: "center",
  },
  timeIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FEF3C7",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  timeIcon: {
    fontSize: 20,
  },
  timeLabel: {
    fontSize: 12,
    color: "#9CA3AF",
    marginBottom: 4,
    fontWeight: "500",
  },
  timeValue: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#10B981",
  },
  noCheck: {
    color: "#EF4444",
    fontSize: 13,
  },
  timeSeparator: {
    marginHorizontal: 10,
  },
  arrowIcon: {
    fontSize: 24,
    color: "#D1D5DB",
  },
  durationBadge: {
    marginTop: 15,
    backgroundColor: "#F0FDF4",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  durationText: {
    fontSize: 12,
    color: "#059669",
    fontWeight: "600",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: "#FFFFFF",
  },
  emptyIcon: {
    fontSize: 80,
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#E0E7FF",
    textAlign: "center",
  },
});