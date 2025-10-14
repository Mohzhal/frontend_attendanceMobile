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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import axios from "axios";
import Constants from "expo-constants";

export default function SuperAdminDashboard({ navigation, route }) {
  const { token, user } = route.params;
  const [stats, setStats] = useState({
    totalCompanies: 0,
    totalHR: 0,
    totalKaryawan: 0,
    totalAttendanceToday: 0,
    totalCheckinToday: 0,
    totalCheckoutToday: 0,
    pendingVerification: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const BASE_URL =
    Constants.expoConfig?.extra?.API_URL ||
    process.env.EXPO_PUBLIC_API_URL ||
    "http://192.168.1.5:5000";

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      // Simulasi data sementara (ganti dengan API call yang sebenarnya)
      const res = await axios.get(`${BASE_URL}/api/admin/dashboard-stats`, {
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {
        // Jika API belum siap, gunakan data dummy
        return {
          data: {
            totalCompanies: 2,
            totalHR: 2,
            totalKaryawan: 4,
            totalAttendanceToday: 6,
            totalCheckinToday: 3,
            totalCheckoutToday: 3,
            pendingVerification: 1,
          }
        };
      });
      
      setStats(res.data);
    } catch (err) {
      console.error("Error fetching stats:", err);
      // Set data dummy jika error
      setStats({
        totalCompanies: 2,
        totalHR: 2,
        totalKaryawan: 4,
        totalAttendanceToday: 6,
        totalCheckinToday: 3,
        totalCheckoutToday: 3,
        pendingVerification: 1,
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardStats();
  };

  const handleLogout = () => {
    Alert.alert(
      "Konfirmasi Logout",
      "Apakah Anda yakin ingin keluar?",
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Logout",
          style: "destructive",
          onPress: () => navigation.replace("Login"),
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Memuat Dashboard...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#0f172a", "#1e293b"]}
        style={styles.backgroundGradient}
      />

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
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Selamat Datang 👋</Text>
            <Text style={styles.userName}>{user.name}</Text>
            <View style={styles.badge}>
              <Ionicons name="shield-checkmark" size={14} color="#3b82f6" />
              <Text style={styles.badgeText}>Super Admin</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={24} color="#ef4444" />
          </TouchableOpacity>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsContainer}>
          <View style={styles.statsRow}>
            <StatCard
              icon="business"
              label="Total Perusahaan"
              value={stats.totalCompanies}
              gradient={["#3b82f6", "#2563eb"]}
            />
            <StatCard
              icon="people"
              label="Total HR"
              value={stats.totalHR}
              gradient={["#8b5cf6", "#7c3aed"]}
            />
          </View>

          <View style={styles.statsRow}>
            <StatCard
              icon="person"
              label="Total Karyawan"
              value={stats.totalKaryawan}
              gradient={["#10b981", "#059669"]}
            />
            <StatCard
              icon="hourglass"
              label="Pending Verifikasi"
              value={stats.pendingVerification}
              gradient={["#f59e0b", "#d97706"]}
            />
          </View>

          {/* Today's Attendance */}
          <View style={styles.todaySection}>
            <LinearGradient
              colors={["#1e293b", "#334155"]}
              style={styles.todayCard}
            >
              <View style={styles.todayHeader}>
                <Ionicons name="calendar" size={24} color="#3b82f6" />
                <Text style={styles.todayTitle}>Absensi Hari Ini</Text>
              </View>
              <View style={styles.todayStats}>
                <View style={styles.todayItem}>
                  <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                  <Text style={styles.todayLabel}>Check In</Text>
                  <Text style={styles.todayValue}>{stats.totalCheckinToday}</Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.todayItem}>
                  <Ionicons name="exit" size={20} color="#ef4444" />
                  <Text style={styles.todayLabel}>Check Out</Text>
                  <Text style={styles.todayValue}>{stats.totalCheckoutToday}</Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.todayItem}>
                  <Ionicons name="analytics" size={20} color="#3b82f6" />
                  <Text style={styles.todayLabel}>Total</Text>
                  <Text style={styles.todayValue}>{stats.totalAttendanceToday}</Text>
                </View>
              </View>
            </LinearGradient>
          </View>
        </View>

        {/* Quick Info Cards */}
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Ringkasan Sistem</Text>
          <InfoCard
            icon="business-outline"
            title="Manajemen Perusahaan"
            description="Kelola data perusahaan, lokasi kantor, dan radius validasi absensi"
            color="#3b82f6"
          />
          <InfoCard
            icon="people-outline"
            title="Manajemen Pengguna"
            description="Verifikasi karyawan baru dan kelola akses HR"
            color="#8b5cf6"
          />
          <InfoCard
            icon="location-outline"
            title="Monitoring Absensi"
            description="Pantau absensi real-time dengan visualisasi peta"
            color="#10b981"
          />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>© 2025 Attendance System</Text>
          <Text style={styles.footerSubtext}>Super Admin Panel v1.0</Text>
        </View>
      </ScrollView>
    </View>
  );
}

function StatCard({ icon, label, value, gradient }) {
  return (
    <LinearGradient colors={gradient} style={styles.statCard}>
      <View style={styles.statIconWrapper}>
        <Ionicons name={icon} size={28} color="#fff" />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </LinearGradient>
  );
}

function InfoCard({ icon, title, description, color }) {
  return (
    <View style={styles.infoCard}>
      <View style={[styles.infoIconWrapper, { backgroundColor: color + "20" }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <View style={styles.infoContent}>
        <Text style={styles.infoTitle}>{title}</Text>
        <Text style={styles.infoDescription}>{description}</Text>
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
  scrollView: {
    flex: 1,
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
    alignItems: "flex-start",
    padding: 24,
    paddingTop: 60,
  },
  greeting: {
    fontSize: 16,
    color: "#94a3b8",
    marginBottom: 4,
  },
  userName: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#f1f5f9",
    marginBottom: 8,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(59, 130, 246, 0.1)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: "flex-start",
    gap: 6,
  },
  badgeText: {
    fontSize: 12,
    color: "#3b82f6",
    fontWeight: "600",
  },
  logoutButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.2)",
  },
  statsContainer: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    padding: 20,
    borderRadius: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  statIconWrapper: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  statValue: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.9)",
    textAlign: "center",
    fontWeight: "500",
  },
  todaySection: {
    marginTop: 12,
  },
  todayCard: {
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#334155",
  },
  todayHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 20,
  },
  todayTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#f1f5f9",
  },
  todayStats: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  todayItem: {
    alignItems: "center",
    gap: 8,
  },
  todayLabel: {
    fontSize: 12,
    color: "#94a3b8",
  },
  todayValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#f1f5f9",
  },
  divider: {
    width: 1,
    backgroundColor: "#334155",
  },
  infoSection: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#f1f5f9",
    marginBottom: 16,
  },
  infoCard: {
    flexDirection: "row",
    backgroundColor: "rgba(30, 41, 59, 0.5)",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#334155",
  },
  infoIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#f1f5f9",
    marginBottom: 4,
  },
  infoDescription: {
    fontSize: 13,
    color: "#94a3b8",
    lineHeight: 18,
  },
  footer: {
    alignItems: "center",
    paddingVertical: 32,
  },
  footerText: {
    fontSize: 13,
    color: "#64748b",
    marginBottom: 4,
  },
  footerSubtext: {
    fontSize: 11,
    color: "#475569",
    fontWeight: "500",
  },
});