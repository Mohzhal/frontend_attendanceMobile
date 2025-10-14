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

export default function UsersManagementScreen({ route }) {
  const { token, user } = route.params;
  const [users, setUsers] = useState([]);
  const [filter, setFilter] = useState("all"); // all, hr, karyawan, pending
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const BASE_URL =
    Constants.expoConfig?.extra?.API_URL ||
    process.env.EXPO_PUBLIC_API_URL ||
    "http://192.168.1.5:5000";

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/users`, {
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {
        // Data dummy jika API belum siap
        return {
          data: [
            {
              id: 8,
              name: "Ade Ramli",
              nik: "12345678",
              role: "hr",
              company_id: 3,
              is_verified: 1,
              profile_photo_url: null,
              created_at: "2025-10-10T21:47:35.000Z",
            },
            {
              id: 9,
              name: "Muhammad Rizal",
              nik: "12345678910",
              role: "karyawan",
              company_id: 3,
              is_verified: 1,
              birth_place: "Karawang",
              birth_date: "2004-02-18",
              gender: "L",
              profile_photo_url: "http://192.168.1.4:5000/uploads/image/1760132905715-800685225-4b66c384-3d54-4b1c-b007-a3f28aa60bef.jpeg",
              created_at: "2025-10-10T21:48:26.000Z",
            },
            {
              id: 10,
              name: "Balung",
              nik: "11111111",
              role: "karyawan",
              company_id: 3,
              is_verified: 1,
              birth_place: "Karawang",
              birth_date: "1999-12-01",
              gender: "L",
              profile_photo_url: "http://10.91.216.156:5000/uploads/image/1760147681693-834094681-b523a4e3-225b-40e7-bbda-3276acdbd4d0.jpeg",
              created_at: "2025-10-11T01:54:41.000Z",
            },
            {
              id: 13,
              name: "Agra",
              nik: "33333333",
              role: "karyawan",
              company_id: null,
              is_verified: 0,
              birth_place: "Karawang",
              birth_date: "1999-12-15",
              gender: "L",
              profile_photo_url: "http://10.91.216.156:5000/uploads/image/1760148074265-84342947-29f28673-5f69-4106-beb2-7a82de3fdb4f.jpeg",
              created_at: "2025-10-11T02:01:14.000Z",
            },
          ]
        };
      });
      
      setUsers(res.data);
    } catch (err) {
      console.error("Error fetching users:", err);
      Alert.alert("Error", "Gagal memuat data pengguna");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchUsers();
  };

  const handleVerifyUser = async (userId, userName) => {
    Alert.alert(
      "Konfirmasi Verifikasi",
      `Apakah Anda yakin ingin memverifikasi ${userName}?`,
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Verifikasi",
          onPress: async () => {
            try {
              await axios.put(
                `${BASE_URL}/api/users/${userId}/verify`,
                { is_verified: 1 },
                { headers: { Authorization: `Bearer ${token}` } }
              );
              Alert.alert("Berhasil", "Pengguna berhasil diverifikasi");
              fetchUsers();
            } catch (err) {
              Alert.alert("Error", "Gagal memverifikasi pengguna");
            }
          },
        },
      ]
    );
  };

  const handleDeleteUser = async (userId, userName) => {
    Alert.alert(
      "Konfirmasi Hapus",
      `Apakah Anda yakin ingin menghapus ${userName}?`,
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Hapus",
          style: "destructive",
          onPress: async () => {
            try {
              await axios.delete(`${BASE_URL}/api/users/${userId}`, {
                headers: { Authorization: `Bearer ${token}` },
              });
              Alert.alert("Berhasil", "Pengguna berhasil dihapus");
              fetchUsers();
            } catch (err) {
              Alert.alert("Error", "Gagal menghapus pengguna");
            }
          },
        },
      ]
    );
  };

  const filteredUsers = users.filter((u) => {
    if (filter === "all") return true;
    if (filter === "hr") return u.role === "hr";
    if (filter === "karyawan") return u.role === "karyawan" && u.is_verified === 1;
    if (filter === "pending") return u.role === "karyawan" && u.is_verified === 0;
    return true;
  });

  const stats = {
    total: users.length,
    hr: users.filter((u) => u.role === "hr").length,
    karyawan: users.filter((u) => u.role === "karyawan" && u.is_verified === 1).length,
    pending: users.filter((u) => u.is_verified === 0).length,
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
          <Text style={styles.headerTitle}>Manajemen Pengguna</Text>
          <Text style={styles.headerSubtitle}>
            {filteredUsers.length} dari {stats.total} Pengguna
          </Text>
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <FilterTab
            label="Semua"
            count={stats.total}
            active={filter === "all"}
            onPress={() => setFilter("all")}
          />
          <FilterTab
            label="HR"
            count={stats.hr}
            active={filter === "hr"}
            onPress={() => setFilter("hr")}
            color="#8b5cf6"
          />
          <FilterTab
            label="Karyawan"
            count={stats.karyawan}
            active={filter === "karyawan"}
            onPress={() => setFilter("karyawan")}
            color="#10b981"
          />
          <FilterTab
            label="Pending"
            count={stats.pending}
            active={filter === "pending"}
            onPress={() => setFilter("pending")}
            color="#f59e0b"
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
          {filteredUsers.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={64} color="#475569" />
              <Text style={styles.emptyText}>Tidak ada pengguna</Text>
              <Text style={styles.emptySubtext}>
                Belum ada pengguna dalam kategori ini
              </Text>
            </View>
          ) : (
            filteredUsers.map((u) => (
              <UserCard
                key={u.id}
                user={u}
                onVerify={() => handleVerifyUser(u.id, u.name)}
                onDelete={() => handleDeleteUser(u.id, u.name)}
              />
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function FilterTab({ label, count, active, onPress, color = "#3b82f6" }) {
  return (
    <TouchableOpacity
      style={[
        styles.filterTab,
        active && { backgroundColor: color + "20", borderColor: color },
      ]}
      onPress={onPress}
    >
      <Text
        style={[
          styles.filterTabText,
          active && { color: color, fontWeight: "bold" },
        ]}
      >
        {label}
      </Text>
      <View
        style={[
          styles.filterBadge,
          active && { backgroundColor: color },
        ]}
      >
        <Text
          style={[
            styles.filterBadgeText,
            active && { color: "#fff" },
          ]}
        >
          {count}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

function UserCard({ user, onVerify, onDelete }) {
  const getRoleColor = (role) => {
    if (role === "hr") return "#8b5cf6";
    if (role === "karyawan") return "#10b981";
    return "#64748b";
  };

  const getRoleLabel = (role) => {
    if (role === "hr") return "HR";
    if (role === "karyawan") return "Karyawan";
    return role;
  };

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.avatarWrapper}>
          {user.profile_photo_url ? (
            <Image
              source={{ uri: user.profile_photo_url }}
              style={styles.avatar}
            />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: getRoleColor(user.role) + "20" }]}>
              <Ionicons name="person" size={28} color={getRoleColor(user.role)} />
            </View>
          )}
        </View>
        <View style={styles.cardHeaderText}>
          <Text style={styles.cardTitle}>{user.name}</Text>
          <Text style={styles.cardSubtitle}>NIK: {user.nik}</Text>
        </View>
        <View style={[styles.roleBadge, { backgroundColor: getRoleColor(user.role) + "20" }]}>
          <Text style={[styles.roleBadgeText, { color: getRoleColor(user.role) }]}>
            {getRoleLabel(user.role)}
          </Text>
        </View>
      </View>

      <View style={styles.cardBody}>
        {user.birth_place && (
          <View style={styles.cardRow}>
            <Ionicons name="location-outline" size={16} color="#94a3b8" />
            <Text style={styles.cardText}>
              {user.birth_place}, {user.birth_date ? new Date(user.birth_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
            </Text>
          </View>
        )}
        {user.gender && (
          <View style={styles.cardRow}>
            <Ionicons name={user.gender === "L" ? "male" : "female"} size={16} color="#94a3b8" />
            <Text style={styles.cardText}>
              {user.gender === "L" ? "Laki-laki" : "Perempuan"}
            </Text>
          </View>
        )}
        <View style={styles.cardRow}>
          <Ionicons name="business-outline" size={16} color="#94a3b8" />
          <Text style={styles.cardText}>
            Company ID: {user.company_id || "Belum ditentukan"}
          </Text>
        </View>
        <View style={styles.cardRow}>
          <Ionicons name="calendar-outline" size={16} color="#94a3b8" />
          <Text style={styles.cardText}>
            Terdaftar: {new Date(user.created_at).toLocaleDateString('id-ID')}
          </Text>
        </View>
      </View>

      {/* Status */}
      {user.is_verified === 0 && (
        <View style={styles.statusBanner}>
          <Ionicons name="warning" size={16} color="#f59e0b" />
          <Text style={styles.statusText}>Menunggu Verifikasi</Text>
        </View>
      )}

      <View style={styles.cardActions}>
        {user.is_verified === 0 && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={onVerify}
          >
            <Ionicons name="checkmark-circle" size={20} color="#10b981" />
            <Text style={[styles.actionButtonText, { color: "#10b981" }]}>
              Verifikasi
            </Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={onDelete}
        >
          <Ionicons name="trash-outline" size={20} color="#ef4444" />
          <Text style={[styles.actionButtonText, styles.deleteButtonText]}>
            Hapus
          </Text>
        </TouchableOpacity>
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
  filterContainer: {
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  filterTab: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginRight: 12,
    borderRadius: 12,
    backgroundColor: "rgba(30, 41, 59, 0.5)",
    borderWidth: 2,
    borderColor: "#334155",
    gap: 8,
  },
  filterTabText: {
    fontSize: 14,
    color: "#94a3b8",
  },
  filterBadge: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#334155",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 8,
  },
  filterBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748b",
  },
  scrollView: {
    flex: 1,
  },
  listContainer: {
    padding: 24,
    paddingTop: 0,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#94a3b8",
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
    marginBottom: 16,
  },
  avatarWrapper: {
    marginRight: 12,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  avatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  cardHeaderText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#f1f5f9",
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 12,
    color: "#64748b",
  },
  roleBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  roleBadgeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  cardBody: {
    marginBottom: 12,
  },
  cardRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  cardText: {
    fontSize: 14,
    color: "#94a3b8",
    marginLeft: 8,
    flex: 1,
  },
  statusBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(245, 158, 11, 0.1)",
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    gap: 8,
  },
  statusText: {
    fontSize: 14,
    color: "#f59e0b",
    fontWeight: "600",
  },
  cardActions: {
    flexDirection: "row",
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    gap: 8,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#10b981",
  },
  deleteButton: {
    backgroundColor: "rgba(239, 68, 68, 0.1)",
  },
  deleteButtonText: {
    color: "#ef4444",
  },
});