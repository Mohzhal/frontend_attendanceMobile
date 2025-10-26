import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Location from "expo-location";
import axios from "axios";
import Constants from "expo-constants";

export default function HomeScreen({ route, navigation }) {
  const { user, token } = route.params;
  const [currentTime, setCurrentTime] = useState(new Date());
  const [company, setCompany] = useState(null);
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [loading, setLoading] = useState(true);

  const BASE_URL =
    Constants.expoConfig?.extra?.API_URL ||
    process.env.EXPO_PUBLIC_API_URL ||
    "https://backendattendancemobile-production.up.railway.app";

  // ✅ Default avatar URL online
  const DEFAULT_AVATAR = "https://cdn-icons-png.flaticon.com/512/149/149071.png";

  useEffect(() => {
    fetchData();
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchData = async () => {
    try {
      const companyRes = await axios.get(`${BASE_URL}/api/companies/${user.company_id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCompany(companyRes.data);

      const attendanceRes = await axios.get(
        `${BASE_URL}/attendance/history/today/${user.id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setTodayAttendance(attendanceRes.data);
    } catch (err) {
      console.log("⚠ Tidak ada absensi hari ini:", err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAttendance = async (type) => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Akses Ditolak", "Izin lokasi diperlukan untuk absensi.");
        return;
      }

      navigation.navigate("Attendance", {
        type: type,
        token: token,
        user: user,
        company: company,
      });

    } catch (error) {
      console.error("❌ Error:", error);
      Alert.alert("Gagal", "Terjadi kesalahan. Silakan coba lagi.");
    }
  };

  // ✅ FIX 3: Fungsi untuk mendapatkan URL foto yang benar
  const getPhotoUrl = (photoUrl?: string | null) => {
    // Jika tidak ada foto atau null string
    if (!photoUrl || photoUrl === "" || photoUrl === "null" || photoUrl === "undefined") {
      return DEFAULT_AVATAR;
    }
    
    // Jika sudah full URL (http/https), return as is
    if (photoUrl.startsWith("http://") || photoUrl.startsWith("https://")) {
      return photoUrl;
    }
    
    // Jika relative path, gabungkan dengan BASE_URL
    // Pastikan tidak ada double slash
    const cleanPath = photoUrl.startsWith("/") ? photoUrl : `/${photoUrl}`;
    return `${BASE_URL}${cleanPath}`;
  };

  const formatTime = (date) =>
    date.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });

  const formatDate = (date) => {
    const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
    const months = [
      "Januari", "Februari", "Maret", "April", "Mei", "Juni",
      "Juli", "Agustus", "September", "Oktober", "November", "Desember",
    ];
    return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return "Selamat Pagi";
    if (hour < 15) return "Selamat Siang";
    if (hour < 18) return "Selamat Sore";
    return "Selamat Malam";
  };

  const getGreetingIcon = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return "sunny";
    if (hour < 18) return "partly-sunny";
    return "moon";
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Memuat data...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />
      
      <LinearGradient
        colors={["#0f172a", "#1e293b", "#0f172a"]}
        style={styles.backgroundGradient}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.greetingContainer}>
            <View style={styles.greetingIconWrapper}>
              <LinearGradient
                colors={["#fbbf24", "#f59e0b"]}
                style={styles.greetingIcon}
              >
                <Ionicons name={getGreetingIcon()} size={24} color="#fff" />
              </LinearGradient>
            </View>
            <View>
              <Text style={styles.greeting}>{getGreeting()}</Text>
              <Text style={styles.dateText}>{formatDate(currentTime)}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.notificationButton}>
            <Ionicons name="notifications-outline" size={24} color="#cbd5e1" />
            <View style={styles.notificationBadge} />
          </TouchableOpacity>
        </View>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <LinearGradient
            colors={["#3b82f6", "#2563eb", "#1d4ed8"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.profileGradient}
          >
            <View style={styles.profileContent}>
              <View style={styles.avatarContainer}>
                <Image
                  source={{ uri: getPhotoUrl(user.profile_photo_url) }}
                  style={styles.avatar}
                  onError={(e) => {
                    console.log("❌ Avatar load error, using default");
                  }}
                />
                <View style={styles.avatarBorder} />
              </View>
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{user.name}</Text>
                <View style={styles.roleContainer}>
                  <View style={styles.roleBadge}>
                    <Text style={styles.roleText}>
                      {user.role === "karyawan" ? "Karyawan" : user.role}
                    </Text>
                  </View>
                  <Text style={styles.companyText}>{company?.name || "Perusahaan"}</Text>
                </View>
              </View>
            </View>
            
            <View style={styles.decorCircle1} />
            <View style={styles.decorCircle2} />
          </LinearGradient>
        </View>

        {/* Live Clock */}
        <View style={styles.clockCard}>
          <View style={styles.clockInner}>
            <View style={styles.clockHeader}>
              <View style={styles.clockIconWrapper}>
                <Ionicons name="time-outline" size={24} color="#3b82f6" />
              </View>
              <Text style={styles.clockLabel}>Waktu Real-Time</Text>
            </View>
            <Text style={styles.timeLarge}>{formatTime(currentTime)}</Text>
            <View style={styles.clockDivider} />
            <Text style={styles.clockSubtext}>Sistem akan mencatat waktu otomatis</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Absensi</Text>
            <Text style={styles.sectionSubtitle}>Tap untuk melakukan check-in atau check-out</Text>
          </View>
          
          <View style={styles.actionsGrid}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleAttendance("checkin")}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={["#10b981", "#059669"]}
                style={styles.actionGradient}
              >
                <View style={styles.actionIconWrapper}>
                  <Ionicons name="log-in-outline" size={32} color="#fff" />
                </View>
                <Text style={styles.actionTitle}>Check In</Text>
                <Text style={styles.actionSubtitle}>Masuk kerja</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleAttendance("checkout")}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={["#ef4444", "#dc2626"]}
                style={styles.actionGradient}
              >
                <View style={styles.actionIconWrapper}>
                  <Ionicons name="log-out-outline" size={32} color="#fff" />
                </View>
                <Text style={styles.actionTitle}>Check Out</Text>
                <Text style={styles.actionSubtitle}>Pulang kerja</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        {/* Attendance Summary */}
        <View style={styles.summarySection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Ringkasan Hari Ini</Text>
            <TouchableOpacity>
              <Text style={styles.viewAllText}>Lihat Detail</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <View style={styles.summaryIconWrapper}>
                  <Ionicons name="business-outline" size={20} color="#3b82f6" />
                </View>
                <View style={styles.summaryContent}>
                  <Text style={styles.summaryLabel}>Perusahaan</Text>
                  <Text style={styles.summaryValue}>
                    {todayAttendance?.company_name || company?.name || "-"}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.summaryDivider} />

            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <View style={[styles.summaryIconWrapper, { backgroundColor: "#dcfce7" }]}>
                  <Ionicons name="enter-outline" size={20} color="#10b981" />
                </View>
                <View style={styles.summaryContent}>
                  <Text style={styles.summaryLabel}>Check In</Text>
                  <Text style={[styles.summaryValue, { color: "#10b981" }]}>
                    {todayAttendance?.checkin || "Belum absen"}
                  </Text>
                </View>
              </View>

              <View style={styles.summaryItem}>
                <View style={[styles.summaryIconWrapper, { backgroundColor: "#fee2e2" }]}>
                  <Ionicons name="exit-outline" size={20} color="#ef4444" />
                </View>
                <View style={styles.summaryContent}>
                  <Text style={styles.summaryLabel}>Check Out</Text>
                  <Text style={[styles.summaryValue, { color: "#ef4444" }]}>
                    {todayAttendance?.checkout || "Belum absen"}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.summaryDivider} />

            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <View style={[styles.summaryIconWrapper, { backgroundColor: "#e0e7ff" }]}>
                  <Ionicons name="location-outline" size={20} color="#6366f1" />
                </View>
                <View style={styles.summaryContent}>
                  <Text style={styles.summaryLabel}>Jarak dari Kantor</Text>
                  <Text style={styles.summaryValue}>
                    {todayAttendance?.checkin_distance || 0} meter
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.summaryDivider} />

            <View style={styles.statusBanner}>
              <Ionicons
                name={todayAttendance?.checkin_valid ? "checkmark-circle" : "alert-circle"}
                size={20}
                color={todayAttendance?.checkin_valid ? "#10b981" : "#f59e0b"}
              />
              <Text style={[
                styles.statusText,
                { color: todayAttendance?.checkin_valid ? "#10b981" : "#f59e0b" }
              ]}>
                {todayAttendance?.checkin_valid
                  ? "Absensi dalam radius kantor"
                  : "Absensi di luar radius kantor"}
              </Text>
            </View>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
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
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 60,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0f172a",
  },
  loadingText: {
    color: "#94a3b8",
    marginTop: 12,
    fontSize: 14,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  greetingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  greetingIconWrapper: {
    marginRight: 12,
  },
  greetingIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#fbbf24",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  greeting: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#f1f5f9",
    letterSpacing: 0.3,
  },
  dateText: {
    color: "#94a3b8",
    fontSize: 13,
    marginTop: 2,
  },
  notificationButton: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#1e293b",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#334155",
  },
  notificationBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#ef4444",
  },
  profileCard: {
    marginBottom: 20,
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
  },
  profileGradient: {
    padding: 24,
    position: "relative",
    overflow: "hidden",
  },
  profileContent: {
    flexDirection: "row",
    alignItems: "center",
    zIndex: 1,
  },
  avatarContainer: {
    position: "relative",
    marginRight: 16,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 3,
    borderColor: "#fff",
    backgroundColor: "#e5e7eb",
  },
  avatarBorder: {
    position: "absolute",
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.3)",
    top: -4,
    left: -4,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  roleContainer: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
  },
  roleBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  roleText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  companyText: {
    color: "rgba(255, 255, 255, 0.9)",
    fontSize: 13,
  },
  decorCircle1: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    top: -30,
    right: -30,
  },
  decorCircle2: {
    position: "absolute",
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    bottom: -20,
    left: -20,
  },
  clockCard: {
    marginBottom: 24,
    borderRadius: 20,
    backgroundColor: "#1e293b",
    borderWidth: 1,
    borderColor: "#334155",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  clockInner: {
    padding: 24,
    alignItems: "center",
  },
  clockHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  clockIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#dbeafe",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  clockLabel: {
    color: "#cbd5e1",
    fontSize: 15,
    fontWeight: "600",
  },
  timeLarge: {
    fontSize: 52,
    color: "#f1f5f9",
    fontWeight: "bold",
    letterSpacing: 2,
    marginVertical: 8,
  },
  clockDivider: {
    width: 60,
    height: 2,
    backgroundColor: "#334155",
    borderRadius: 1,
    marginVertical: 12,
  },
  clockSubtext: {
    color: "#64748b",
    fontSize: 12,
    textAlign: "center",
  },
  quickActionsSection: {
    marginBottom: 24,
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    color: "#f1f5f9",
    fontSize: 20,
    fontWeight: "bold",
    letterSpacing: 0.3,
  },
  sectionSubtitle: {
    color: "#94a3b8",
    fontSize: 13,
    marginTop: 4,
  },
  actionsGrid: {
    flexDirection: "row",
    gap: 16,
  },
  actionButton: {
    flex: 1,
    borderRadius: 18,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
  },
  actionGradient: {
    padding: 20,
    alignItems: "center",
    minHeight: 140,
    justifyContent: "center",
  },
  actionIconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  actionTitle: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
    marginBottom: 4,
  },
  actionSubtitle: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 12,
  },
  summarySection: {
    marginBottom: 24,
  },
  viewAllText: {
    color: "#3b82f6",
    fontSize: 13,
    fontWeight: "600",
  },
  summaryCard: {
    backgroundColor: "#1e293b",
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: "#334155",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  summaryRow: {
    flexDirection: "row",
    gap: 12,
  },
  summaryItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  summaryIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#dbeafe",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  summaryContent: {
    flex: 1,
  },
  summaryLabel: {
    color: "#94a3b8",
    fontSize: 12,
    marginBottom: 4,
  },
  summaryValue: {
    color: "#f1f5f9",
    fontSize: 15,
    fontWeight: "600",
  },
  summaryDivider: {
    height: 1,
    backgroundColor: "#334155",
    marginVertical: 16,
  },
  statusBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0f172a",
    padding: 14,
    borderRadius: 12,
    gap: 10,
  },
  statusText: {
    fontSize: 13,
    fontWeight: "600",
    flex: 1,
  },
});