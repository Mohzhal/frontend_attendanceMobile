import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import axios from "axios";
import Constants from "expo-constants";

export default function AttendanceMapScreen({ route }) {
  const { token, user } = route.params;
  const [attendances, setAttendances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState("today"); // today, week, month, all

  const BASE_URL =
    Constants.expoConfig?.extra?.API_URL ||
    process.env.EXPO_PUBLIC_API_URL ||
    "http://192.168.1.5:5000";

  useEffect(() => {
    fetchAttendances();
  }, [filter]);

  const fetchAttendances = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/attendance?filter=${filter}`, {
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {
        // Data dummy jika API belum siap
        return {
          data: [
            {
              id: 7,
              user_id: 9,
              company_id: 3,
              type: "checkin",
              photo_url: "/uploads/absensi/1760272163038-186549955.jpg",
              latitude: -6.4174872,
              longitude: 107.4009542,
              distance_m: 1,
              is_valid: 1,
              created_at: "2025-10-12T12:29:23.000Z",
              user: {
                name: "Muhammad Rizal",
                nik: "12345678910",
              },
              company: {
                name: "PT Pindah berenang",
                address: "Sumur bor",
              },
            },
            {
              id: 8,
              user_id: 9,
              company_id: 3,
              type: "checkout",
              photo_url: "/uploads/absensi/1760272350067-369331842.jpg",
              latitude: -6.4174876,
              longitude: 107.4009564,
              distance_m: 0,
              is_valid: 1,
              created_at: "2025-10-12T12:32:33.000Z",
              user: {
                name: "Muhammad Rizal",
                nik: "12345678910",
              },
              company: {
                name: "PT Pindah berenang",
                address: "Sumur bor",
              },
            },
          ]
        };
      });
      
      setAttendances(res.data);
    } catch (err) {
      console.error("Error fetching attendances:", err);
      Alert.alert("Error", "Gagal memuat data absensi");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchAttendances();
  };

  const stats = {
    total: attendances.length,
    checkin: attendances.filter((a) => a.type === "checkin").length,
    checkout: attendances.filter((a) => a.type === "checkout").length,
    valid: attendances.filter((a) => a.is_valid === 1).length,
    invalid: attendances.filter((a) => a.is_valid === 0).length,
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Memuat Data...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#0f172a", "#1e293b"]}
        style={styles.backgroundGradient}
      />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Data Absensi</Text>
          <Text style={styles.headerSubtitle}>
            {stats.total} Total Absensi
          </Text>
        </View>
      </View>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <StatMini
          icon="checkmark-circle"
          label="Check In"
          value={stats.checkin}
          color="#10b981"
        />
        <StatMini
          icon="exit"
          label="Check Out"
          value={stats.checkout}
          color="#ef4444"
        />
        <StatMini
          icon="checkmark-done"
          label="Valid"
          value={stats.valid}
          color="#3b82f6"
        />
        <StatMini
          icon="close-circle"
          label="Invalid"
          value={stats.invalid}
          color="#f59e0b"
        />
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <FilterButton
            label="Hari Ini"
            active={filter === "today"}
            onPress={() => setFilter("today")}
          />
          <FilterButton
            label="Minggu Ini"
            active={filter === "week"}
            onPress={() => setFilter("week")}
          />
          <FilterButton
            label="Bulan Ini"
            active={filter === "month"}
            onPress={() => setFilter("month")}
          />
          <FilterButton
            label="Semua"
            active={filter === "all"}
            onPress={() => setFilter("all")}
          />
        </ScrollView>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#3b82f6"
          />
        }
      >
        <View style={styles.listContainer}>
          {attendances.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="map-outline" size={64} color="#475569" />
              <Text style={styles.emptyText}>Tidak ada data absensi</Text>
              <Text style={styles.emptySubtext}>
                Belum ada absensi dalam periode ini
              </Text>
            </View>
          ) : (
            attendances.map((attendance) => (
              <AttendanceCard key={attendance.id} attendance={attendance} />
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function StatMini({ icon, label, value, color }) {
  return (
    <View style={[styles.statMini, { borderColor: color + "40" }]}>
      <Ionicons name={icon} size={20} color={color} />
      <Text style={styles.statMiniValue}>{value}</Text>
      <Text style={styles.statMiniLabel}>{label}</Text>
    </View>
  );
}

function FilterButton({ label, active, onPress }) {
  return (
    <TouchableOpacity
      style={[
        styles.filterButton,
        active && styles.filterButtonActive,
      ]}
      onPress={onPress}
    >
      <Text
        style={[
          styles.filterButtonText,
          active && styles.filterButtonTextActive,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function AttendanceCard({ attendance }) {
  const typeColor = attendance.type === "checkin" ? "#10b981" : "#ef4444";
  const validColor = attendance.is_valid === 1 ? "#10b981" : "#f59e0b";

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={[styles.typeIndicator, { backgroundColor: typeColor + "20" }]}>
          <Ionicons
            name={attendance.type === "checkin" ? "log-in" : "log-out"}
            size={24}
            color={typeColor}
          />
        </View>
        <View style={styles.cardHeaderText}>
          <Text style={styles.cardTitle}>{attendance.user?.name}</Text>
          <Text style={styles.cardSubtitle}>NIK: {attendance.user?.nik}</Text>
        </View>
        <View style={[styles.validBadge, { backgroundColor: validColor + "20" }]}>
          <Ionicons
            name={attendance.is_valid === 1 ? "checkmark" : "close"}
            size={16}
            color={validColor}
          />
        </View>
      </View>

      {/* Photo */}
      {attendance.photo_url && (
        <Image
          source={{ uri: `${Constants.expoConfig?.extra?.API_URL || "http://192.168.1.5:5000"}${attendance.photo_url}` }}
          style={styles.attendancePhoto}
        />
      )}

      <View style={styles.cardBody}>
        <View style={styles.infoRow}>
          <Ionicons name="business-outline" size={16} color="#94a3b8" />
          <Text style={styles.infoText}>{attendance.company?.name}</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="location-outline" size={16} color="#94a3b8" />
          <Text style={styles.infoText}>
            {attendance.latitude?.toFixed(6)}, {attendance.longitude?.toFixed(6)}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="navigate-outline" size={16} color="#94a3b8" />
          <Text style={styles.infoText}>Jarak: {attendance.distance_m}m</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="time-outline" size={16} color="#94a3b8" />
          <Text style={styles.infoText}>
            {new Date(attendance.created_at).toLocaleString('id-ID', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>
      </View>

      <View style={styles.typeTag}>
        <Text style={[styles.typeTagText, { color: typeColor }]}>
          {attendance.type === "checkin" ? "CHECK IN" : "CHECK OUT"}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f172a",
  },
  backgroundGradient: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0f172a",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#94a3b8",
  },
  header: {
    padding: 24,
    paddingTop: 60,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#f1f5f9",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#94a3b8",
  },
  statsRow: {
    flexDirection: "row",
    paddingHorizontal: 24,
    gap: 8,
    marginBottom: 16,
  },
  statMini: {
    flex: 1,
    backgroundColor: "rgba(30, 41, 59, 0.5)",
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    borderWidth: 1,
  },
  statMiniValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#f1f5f9",
    marginTop: 4,
  },
  statMiniLabel: {
    fontSize: 11,
    color: "#94a3b8",
    marginTop: 2,
  },
  filterContainer: {
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  filterButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "rgba(30, 41, 59, 0.5)",
    borderWidth: 1,
    borderColor: "#334155",
    marginRight: 8,
  },
  filterButtonActive: {
    backgroundColor: "#3b82f6",
    borderColor: "#3b82f6",
  },
  filterButtonText: {
    fontSize: 14,
    color: "#94a3b8",
    fontWeight: "500",
  },
  filterButtonTextActive: {
    color: "#fff",
  },
  scrollView: {
    flex: 1,
  },
  listContainer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#f1f5f9",
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#64748b",
    marginTop: 8,
  },
  card: {
    backgroundColor: "rgba(30, 41, 59, 0.5)",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#334155",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  typeIndicator: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  cardHeaderText: {
    flex: 1,
    marginLeft: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#f1f5f9",
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: 13,
    color: "#64748b",
  },
  validBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  attendancePhoto: {
    width: "100%",
    height: 200,
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: "#1e293b",
  },
  cardBody: {
    gap: 8,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  infoText: {
    fontSize: 13,
    color: "#cbd5e1",
    marginLeft: 8,
    flex: 1,
  },
  typeTag: {
    marginTop: 12,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: "rgba(30, 41, 59, 0.8)",
    alignSelf: "flex-start",
  },
  typeTagText: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
});