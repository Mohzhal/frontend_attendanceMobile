import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import axios from "axios";
import Constants from "expo-constants";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";

export default function HRHomeScreen({ route, navigation }) {
  const [user, setUser] = useState(route?.params?.user || null);
  const [token, setToken] = useState(route?.params?.token || "");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    present: 0,
    absent: 0,
    pending: 0,
  });

  const BASE_URL =
    Constants.expoConfig?.extra?.API_URL ||
    process.env.EXPO_PUBLIC_API_URL ||
    "http://192.168.1.7:5000";

  useEffect(() => {
    loadUserData();
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (user && token) {
        console.log("🔄 Screen focused, refreshing stats...");
        fetchStats(token, user);
      }
    }, [user, token])
  );

  const loadUserData = async () => {
    try {
      console.log("🔍 Loading user data...");
      
      let currentToken = token;
      let currentUser = user;

      if (!currentUser || !currentToken) {
        console.log("⚠️ No params found, loading from AsyncStorage...");
        
        const storedToken = await AsyncStorage.getItem("token");
        const storedUser = await AsyncStorage.getItem("user");

        if (storedToken && storedUser) {
          currentUser = JSON.parse(storedUser);
          currentToken = storedToken;
          
          setToken(currentToken);
          setUser(currentUser);
          
          console.log("✅ Loaded from storage:", {
            name: currentUser.name,
            role: currentUser.role,
            company_id: currentUser.company_id,
          });
        } else {
          throw new Error("No stored credentials found");
        }
      }

      if (!currentUser.company_id) {
        throw new Error("User tidak memiliki company_id");
      }

      await fetchStats(currentToken, currentUser);
      
    } catch (error) {
      console.error("❌ Load user data error:", error);
      
      Alert.alert(
        "Error",
        "Sesi login berakhir atau data tidak lengkap. Silakan login kembali.",
        [
          {
            text: "OK",
            onPress: () => {
              AsyncStorage.clear();
              navigation.replace("Login");
            },
          },
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async (authToken, userData) => {
    try {
      if (!userData?.company_id || !authToken) {
        console.warn("⚠️ Cannot fetch stats: missing credentials");
        return;
      }

      console.log("📊 Fetching stats for company:", userData.company_id);

      const config = {
        headers: { 
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
        timeout: 10000,
      };

      const employeesResponse = await axios.get(
        `${BASE_URL}/api/hr/verified-employees`,
        config
      );

      const totalEmployees = employeesResponse.data.length || 0;

      const attendanceResponse = await axios.get(
        `${BASE_URL}/api/attendance/company/${userData.company_id}?period=today`,
        config
      );

      const todayAttendance = attendanceResponse.data || [];

      const applicantsResponse = await axios.get(
        `${BASE_URL}/api/hr/applicants`,
        config
      );

      const pendingApplicants = applicantsResponse.data.length || 0;

      const uniqueCheckins = new Set();
      todayAttendance.forEach((record) => {
        if (record.type === "checkin" && record.user_id) {
          uniqueCheckins.add(record.user_id);
        }
      });

      const presentCount = uniqueCheckins.size;
      const absentCount = Math.max(0, totalEmployees - presentCount);

      const newStats = {
        total: totalEmployees,
        present: presentCount,
        absent: absentCount,
        pending: pendingApplicants,
      };

      console.log("✅ Stats calculated:", newStats);
      setStats(newStats);

    } catch (error) {
      console.error("❌ Fetch stats error:", error.message);
      setStats({ total: 0, present: 0, absent: 0, pending: 0 });
    } finally {
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(async () => {
    if (!user || !token) return;
    setRefreshing(true);
    console.log("🔄 Refreshing data...");
    await fetchStats(token, user);
  }, [user, token]);

  const handleViewDetail = () => {
    if (!user || !token) {
      Alert.alert("Error", "Data user tidak lengkap. Silakan login ulang.");
      return;
    }

    console.log("🔍 Navigating to HRDetail with params:", {
      hasToken: !!token,
      companyId: user.company_id,
      userName: user.name,
    });

    try {
      navigation.navigate("HRDetail", {
        token: token,
        companyId: user.company_id,
        user: user,
      });
      
      console.log("✅ Navigation successful");
      
    } catch (error) {
      console.error("❌ Navigation error:", error);
      
      Alert.alert(
        "Error Navigasi",
        "Screen 'HRDetail' belum terdaftar di navigator.\n\n" +
        "Pastikan sudah menambahkan:\n" +
        '<Stack.Screen name="HRDetail" component={HRDetailScreen} />',
        [{ text: "OK" }]
      );
    }
  };

  const handleViewApplicants = () => {
    if (!user || !token) {
      Alert.alert("Error", "Data user tidak lengkap.");
      return;
    }

    try {
      navigation.navigate("HRApplicants", {
        token: token,
        user: user,
      });
    } catch (error) {
      console.error("❌ Navigation error:", error);
      Alert.alert("Error", "Screen 'HRApplicants' belum tersedia.");
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      "Logout",
      "Apakah Anda yakin ingin keluar?",
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Ya, Keluar",
          style: "destructive",
          onPress: async () => {
            try {
              console.log("🚪 Logging out...");
              await AsyncStorage.clear();
              navigation.replace("Login");
            } catch (error) {
              console.error("❌ Logout error:", error);
              navigation.replace("Login");
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Memuat dashboard...</Text>
      </View>
    );
  }

  if (!user || !token) {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle" size={64} color="#ef4444" />
        <Text style={styles.errorText}>Data user tidak ditemukan</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => {
            AsyncStorage.clear();
            navigation.replace("Login");
          }}
        >
          <Text style={styles.retryText}>Kembali ke Login</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#2563eb", "#1d4ed8", "#1e40af"]}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <Text style={styles.greeting}>Selamat Datang, HR</Text>
            <Text style={styles.userName}>{user.name}</Text>
            <Text style={styles.companyText}>
              {user.company_name || "Perusahaan"}
            </Text>
          </View>
          
          <TouchableOpacity 
            style={styles.logoutBtn} 
            onPress={handleLogout}
            activeOpacity={0.7}
          >
            <Ionicons name="log-out-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#2563eb"]}
            tintColor="#2563eb"
          />
        }
      >
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: "#3b82f6" }]}>
            <Ionicons name="people" size={32} color="#fff" />
            <Text style={styles.statValue}>{stats.total}</Text>
            <Text style={styles.statLabel}>Total Karyawan</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: "#10b981" }]}>
            <Ionicons name="checkmark-circle" size={32} color="#fff" />
            <Text style={styles.statValue}>{stats.present}</Text>
            <Text style={styles.statLabel}>Hadir Hari Ini</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: "#ef4444" }]}>
            <Ionicons name="close-circle" size={32} color="#fff" />
            <Text style={styles.statValue}>{stats.absent}</Text>
            <Text style={styles.statLabel}>Tidak Hadir</Text>
          </View>

          <TouchableOpacity 
            style={[styles.statCard, { backgroundColor: "#f59e0b" }]}
            onPress={handleViewApplicants}
            activeOpacity={0.8}
          >
            <Ionicons name="time" size={32} color="#fff" />
            <Text style={styles.statValue}>{stats.pending}</Text>
            <Text style={styles.statLabel}>Perlu Verifikasi</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleViewDetail}
            activeOpacity={0.7}
          >
            <View style={styles.actionButtonContent}>
              <View style={styles.actionIconContainer}>
                <Ionicons name="list" size={24} color="#2563eb" />
              </View>
              <View style={styles.actionTextContainer}>
                <Text style={styles.actionTitle}>Data Absensi Lengkap</Text>
                <Text style={styles.actionSubtitle}>
                  Lihat dan kelola absensi karyawan
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color="#9ca3af" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleViewApplicants}
            activeOpacity={0.7}
          >
            <View style={styles.actionButtonContent}>
              <View style={styles.actionIconContainer}>
                <Ionicons name="person-add" size={24} color="#f59e0b" />
              </View>
              <View style={styles.actionTextContainer}>
                <Text style={styles.actionTitle}>Kelola Pelamar</Text>
                <Text style={styles.actionSubtitle}>
                  Verifikasi pendaftaran karyawan baru
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color="#9ca3af" />
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#f9fafb",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#6b7280",
  },
  errorText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: "600",
    color: "#ef4444",
    textAlign: "center",
  },
  retryButton: {
    marginTop: 24,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: "#2563eb",
    borderRadius: 12,
  },
  retryText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  header: {
    padding: 20,
    paddingTop: Platform.OS === "ios" ? 60 : 50,
    paddingBottom: 30,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  headerLeft: {
    flex: 1,
  },
  greeting: {
    fontSize: 14,
    color: "#dbeafe",
    opacity: 0.9,
  },
  userName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginTop: 4,
  },
  companyText: {
    fontSize: 14,
    color: "#dbeafe",
    marginTop: 4,
    opacity: 0.8,
  },
  logoutBtn: {
    padding: 10,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 12,
    marginLeft: 12,
  },
  content: {
    flex: 1,
    marginTop: -20,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 16,
    gap: 12,
  },
  statCard: {
    width: "48%",
    padding: 20,
    borderRadius: 16,
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  statValue: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#fff",
    marginTop: 8,
  },
  statLabel: {
    fontSize: 13,
    color: "rgba(255,255,255,0.95)",
    marginTop: 4,
    textAlign: "center",
    fontWeight: "500",
  },
  actionsContainer: {
    padding: 16,
    paddingTop: 8,
    gap: 12,
  },
  actionButton: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  actionButtonContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#f3f4f6",
    justifyContent: "center",
    alignItems: "center",
  },
  actionTextContainer: {
    flex: 1,
    marginLeft: 16,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  actionSubtitle: {
    fontSize: 13,
    color: "#6b7280",
    marginTop: 4,
  },
});