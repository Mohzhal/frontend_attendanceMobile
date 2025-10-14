import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

export default function LoginScreen({ navigation }) {
  const [nik, setNik] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [nikFocused, setNikFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [backendStatus, setBackendStatus] = useState("checking");
  const [availableEndpoints, setAvailableEndpoints] = useState([]);

  // ✅ BASE_URL tanpa trailing slash
  const BASE_URL =
    Constants.expoConfig?.extra?.API_URL ||
    process.env.EXPO_PUBLIC_API_URL ||
    "https://backendattendancemobile-production.up.railway.app";

  // ✅ Cek endpoint yang tersedia
  useEffect(() => {
    checkBackendHealth();
    fetchAvailableEndpoints();
  }, []);

  // ✅ Ambil daftar endpoint dari root API
  const fetchAvailableEndpoints = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/`, {
        timeout: 10000,
      });
      
      console.log("📋 Available endpoints:", response.data);
      
      if (response.data.endpoints) {
        setAvailableEndpoints(Object.values(response.data.endpoints));
      }
    } catch (error) {
      console.error("❌ Failed to fetch endpoints:", error.message);
    }
  };

  // ✅ Test koneksi backend
  const checkBackendHealth = async () => {
    try {
      console.log("🔍 Checking backend health...");
      console.log("🌐 BASE_URL:", BASE_URL);

      const response = await axios.get(`${BASE_URL}/`, {
        timeout: 10000,
      });

      console.log("✅ Backend response:", response.data);
      setBackendStatus("online");
      return true;
    } catch (error) {
      console.error("❌ Backend health check failed:", error.message);
      setBackendStatus("offline");
      return false;
    }
  };

  // ✅ Fungsi login dengan berbagai kemungkinan endpoint
  const handleLogin = async () => {
    if (!nik || !password) {
      return Alert.alert("Data Belum Lengkap", "Harap isi NIK dan Password");
    }

    if (nik.length < 6) {
      return Alert.alert("NIK Tidak Valid", "NIK minimal 6 digit");
    }

    if (password.length < 6) {
      return Alert.alert("Password Tidak Valid", "Password minimal 6 karakter");
    }

    setIsLoading(true);

    // ✅ Daftar kemungkinan endpoint login yang berbeda
    const possibleEndpoints = [
      "/api/auth/login",      // Standard
      "/auth/login",          // Without /api prefix
      "/api/login",           // Simplified
      "/login",               // Direct
      "/api/users/login",     // Alternative
    ];

    // ✅ Coba setiap endpoint sampai berhasil
    for (const endpoint of possibleEndpoints) {
      try {
        const loginUrl = `${BASE_URL}${endpoint}`;
        console.log(`🚀 Trying endpoint: ${loginUrl}`);

        const res = await axios.post(
          loginUrl,
          {
            nik: nik.trim(),
            password: password,
          },
          {
            timeout: 30000,
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
          }
        );

        // ✅ Jika berhasil, proses response
        console.log("✅ Login successful with endpoint:", endpoint);
        console.log("📦 Response:", res.data);

        const { token, user } = res.data;

        if (!token || !user) {
          throw new Error("Token atau data user tidak ditemukan");
        }

        const role = (user.role || "").toLowerCase().trim();

        console.log("✅ Login sukses:", {
          name: user.name,
          nik: user.nik,
          role: role,
          isVerified: user.is_verified
        });

        // Simpan ke AsyncStorage
        await AsyncStorage.setItem("token", token);
        await AsyncStorage.setItem("user", JSON.stringify(user));

        setIsLoading(false);

        // Navigasi berdasarkan role
        if (role === "super_admin") {
          return Alert.alert(
            "Login Berhasil ✅",
            `Selamat datang, ${user.name}!\n\nRole: Super Admin`,
            [
              {
                text: "Lanjutkan",
                onPress: () => {
                  navigation.replace("SuperAdminTabs", { token, user });
                },
              },
            ]
          );
        }

        if (role === "hr") {
          return Alert.alert(
            "Login Berhasil ✅",
            `Selamat datang, ${user.name}!\n\nRole: HR`,
            [
              {
                text: "Lanjutkan",
                onPress: () => {
                  navigation.replace("HRDashboardScreen", { 
                    token, 
                    user,
                    companyId: user.company_id 
                  });
                },
              },
            ]
          );
        }

        if (role === "karyawan") {
          if (user.is_verified === 0 || user.is_verified === false) {
            return Alert.alert(
              "Menunggu Verifikasi ⏳",
              "Akun Anda belum diverifikasi oleh HR/Admin.\n\nSilakan hubungi HR untuk konfirmasi.",
              [{ text: "OK" }]
            );
          }

          return Alert.alert(
            "Login Berhasil 🎉", 
            `Selamat datang, ${user.name}!\n\nRole: Karyawan`, 
            [
              {
                text: "Masuk",
                onPress: () => {
                  navigation.replace("MainTabs", { token, user });
                },
              },
            ]
          );
        }

        setIsLoading(false);
        return Alert.alert(
          "Role Tidak Dikenali",
          `Peran "${role}" tidak dikenali di sistem.`
        );

      } catch (err) {
        // Jika error bukan 404, throw untuk ditangani di luar loop
        if (err.response && err.response.status !== 404 && !err.response.data?.msg?.includes("not found")) {
          console.error(`❌ Error on ${endpoint}:`, err.response?.data || err.message);
          
          // Jika dapat response error selain 404, stop dan tampilkan error
          setIsLoading(false);
          
          const msg = err.response?.data?.msg || err.response?.data?.message || "Terjadi kesalahan";
          
          if (msg.toLowerCase().includes("user tidak ditemukan") || 
              msg.toLowerCase().includes("not found") ||
              msg.toLowerCase().includes("tidak ditemukan")) {
            return Alert.alert(
              "NIK Tidak Terdaftar 🔍",
              "NIK tidak ditemukan dalam sistem.\n\nSilakan periksa kembali atau lakukan registrasi."
            );
          }
          
          if (msg.toLowerCase().includes("password salah") || 
              msg.toLowerCase().includes("password incorrect") ||
              msg.toLowerCase().includes("wrong password")) {
            return Alert.alert(
              "Password Salah 🔐",
              "Password yang Anda masukkan salah."
            );
          }

          return Alert.alert("Gagal Login", msg);
        }

        // Continue ke endpoint berikutnya
        console.log(`⚠️ Endpoint ${endpoint} not found, trying next...`);
        continue;
      }
    }

    // ✅ Jika semua endpoint gagal
    setIsLoading(false);
    
    return Alert.alert(
      "Endpoint Login Tidak Ditemukan ❌",
      "Tidak dapat menemukan endpoint login yang valid di backend.\n\n" +
      "Endpoint yang dicoba:\n" +
      possibleEndpoints.map(ep => `• ${ep}`).join('\n') + "\n\n" +
      "Pastikan:\n" +
      "1. Backend sudah deploy dengan benar\n" +
      "2. Route /api/auth/login terdaftar\n" +
      "3. Cek struktur backend Anda\n\n" +
      "Endpoint tersedia dari backend:\n" +
      (availableEndpoints.length > 0 
        ? availableEndpoints.map(ep => `• ${ep}`).join('\n')
        : "Tidak ada data"),
      [
        { text: "Cek Backend", onPress: () => checkBackendHealth() },
        { text: "Tutup", style: "cancel" }
      ]
    );
  };

  // ✅ Test koneksi manual
  const handleTestConnection = async () => {
    Alert.alert("Test Koneksi", "Mengecek koneksi ke backend...");
    const isOnline = await checkBackendHealth();
    
    if (isOnline) {
      Alert.alert(
        "Backend Online ✅",
        `Backend berhasil dihubungi!\n\n` +
        `URL: ${BASE_URL}\n\n` +
        `Endpoint tersedia:\n` +
        (availableEndpoints.length > 0 
          ? availableEndpoints.map(ep => `• ${ep}`).join('\n')
          : "Tidak ada data")
      );
    } else {
      Alert.alert(
        "Backend Offline ❌",
        `Tidak dapat menghubungi backend.\n\nURL: ${BASE_URL}`
      );
    }
  };

  // ✅ Debug endpoint button
  const handleDebugEndpoints = () => {
    const endpointList = availableEndpoints.length > 0 
      ? availableEndpoints.map(ep => `• ${ep}`).join('\n')
      : "Tidak ada endpoint yang tersedia";

    Alert.alert(
      "Debug: Available Endpoints",
      `Backend URL:\n${BASE_URL}\n\n` +
      `Endpoints from backend:\n${endpointList}\n\n` +
      `Status: ${backendStatus}`
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#0f172a", "#1e293b", "#0f172a"]}
        style={styles.backgroundGradient}
      >
        <View style={styles.decorCircle1} />
        <View style={styles.decorCircle2} />
        <View style={styles.decorCircle3} />
      </LinearGradient>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo & Title */}
          <View style={styles.logoSection}>
            <View style={styles.logoWrapper}>
              <LinearGradient
                colors={["#3b82f6", "#2563eb", "#1d4ed8"]}
                style={styles.logoGradient}
              >
                <Ionicons name="shield-checkmark" size={48} color="#fff" />
              </LinearGradient>
            </View>
            <Text style={styles.appName}>Attendance System</Text>
            <Text style={styles.welcomeText}>Selamat Datang Kembali</Text>
            <Text style={styles.subtitleText}>Masuk ke akun Anda untuk melanjutkan</Text>
            
            {/* Backend Status */}
            <View style={[
              styles.statusBadge, 
              backendStatus === 'online' && styles.statusOnline,
              backendStatus === 'offline' && styles.statusOffline
            ]}>
              <View style={[
                styles.statusDot,
                backendStatus === 'online' && styles.dotOnline,
                backendStatus === 'offline' && styles.dotOffline
              ]} />
              <Text style={styles.statusText}>
                {backendStatus === 'checking' && 'Checking...'}
                {backendStatus === 'online' && 'Backend Online'}
                {backendStatus === 'offline' && 'Backend Offline'}
              </Text>
            </View>
          </View>

          {/* Login Form */}
          <View style={styles.formContainer}>
            {/* NIK Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>NIK</Text>
              <View style={[
                styles.inputWrapper,
                nikFocused && styles.inputWrapperFocused
              ]}>
                <View style={styles.inputIconWrapper}>
                  <Ionicons 
                    name="person-outline" 
                    size={20} 
                    color={nikFocused ? "#3b82f6" : "#64748b"} 
                  />
                </View>
                <TextInput
                  placeholder="Masukkan NIK Anda"
                  value={nik}
                  onChangeText={setNik}
                  onFocus={() => setNikFocused(true)}
                  onBlur={() => setNikFocused(false)}
                  style={styles.input}
                  placeholderTextColor="#64748b"
                  keyboardType="numeric"
                  autoCapitalize="none"
                  editable={!isLoading}
                />
              </View>
            </View>

            {/* Password Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Password</Text>
              <View style={[
                styles.inputWrapper,
                passwordFocused && styles.inputWrapperFocused
              ]}>
                <View style={styles.inputIconWrapper}>
                  <Ionicons 
                    name="lock-closed-outline" 
                    size={20} 
                    color={passwordFocused ? "#3b82f6" : "#64748b"} 
                  />
                </View>
                <TextInput
                  placeholder="Masukkan Password"
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => setPasswordFocused(false)}
                  style={styles.input}
                  placeholderTextColor="#64748b"
                  autoCapitalize="none"
                  editable={!isLoading}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeButton}
                  disabled={isLoading}
                >
                  <Ionicons
                    name={showPassword ? "eye-outline" : "eye-off-outline"}
                    size={20}
                    color="#64748b"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Login Button */}
            <TouchableOpacity
              style={styles.loginButtonWrapper}
              onPress={handleLogin}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={isLoading ? ["#64748b", "#475569"] : ["#3b82f6", "#2563eb"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.loginButton}
              >
                {isLoading ? (
                  <>
                    <ActivityIndicator size="small" color="#FFFFFF" />
                    <Text style={styles.loginButtonText}>Memproses...</Text>
                  </>
                ) : (
                  <>
                    <Ionicons name="log-in-outline" size={24} color="#fff" />
                    <Text style={styles.loginButtonText}>Masuk</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Debug Buttons */}
            <View style={styles.debugButtons}>
              <TouchableOpacity
                style={styles.debugButton}
                onPress={handleTestConnection}
                disabled={isLoading}
              >
                <Ionicons name="wifi-outline" size={16} color="#64748b" />
                <Text style={styles.debugButtonText}>Test Koneksi</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.debugButton}
                onPress={handleDebugEndpoints}
                disabled={isLoading}
              >
                <Ionicons name="bug-outline" size={16} color="#64748b" />
                <Text style={styles.debugButtonText}>Debug API</Text>
              </TouchableOpacity>
            </View>

            {/* Info Box */}
            <View style={styles.infoBox}>
              <View style={styles.infoIconWrapper}>
                <Ionicons name="information-circle" size={20} color="#3b82f6" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoTitle}>Informasi Login</Text>
                <Text style={styles.infoText}>
                  Super Admin & HR dapat langsung login. Karyawan harus diverifikasi oleh HR terlebih dahulu.
                </Text>
              </View>
            </View>

            {/* Backend URL */}
            <View style={styles.urlBox}>
              <Ionicons name="server-outline" size={14} color="#64748b" />
              <Text style={styles.urlText} numberOfLines={2}>
                {BASE_URL}
              </Text>
            </View>

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>atau</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Register Button */}
            <TouchableOpacity
              style={styles.registerButton}
              onPress={() => navigation.navigate("Register")}
              activeOpacity={0.7}
              disabled={isLoading}
            >
              <View style={styles.registerContent}>
                <Text style={styles.registerText}>Belum punya akun?</Text>
                <View style={styles.registerLinkWrapper}>
                  <Text style={styles.registerLink}>Daftar Sekarang</Text>
                  <Ionicons name="arrow-forward" size={16} color="#3b82f6" />
                </View>
              </View>
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>© 2025 Attendance System</Text>
            <Text style={styles.footerSubtext}>Secure & Reliable</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
  decorCircle1: {
    position: "absolute",
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: "rgba(59, 130, 246, 0.1)",
    top: -100,
    right: -100,
  },
  decorCircle2: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "rgba(139, 92, 246, 0.08)",
    bottom: -50,
    left: -50,
  },
  decorCircle3: {
    position: "absolute",
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: "rgba(59, 130, 246, 0.06)",
    top: "50%",
    right: -30,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 24,
    paddingTop: 60,
  },
  logoSection: {
    alignItems: "center",
    marginBottom: 40,
  },
  logoWrapper: {
    marginBottom: 24,
    shadowColor: "#3b82f6",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  logoGradient: {
    width: 96,
    height: 96,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  appName: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#f1f5f9",
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  welcomeText: {
    fontSize: 20,
    fontWeight: "600",
    color: "#cbd5e1",
    marginBottom: 4,
  },
  subtitleText: {
    fontSize: 14,
    color: "#64748b",
    textAlign: "center",
    marginBottom: 16,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "rgba(51, 65, 85, 0.5)",
    marginTop: 12,
    gap: 8,
  },
  statusOnline: {
    backgroundColor: "rgba(34, 197, 94, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(34, 197, 94, 0.3)",
  },
  statusOffline: {
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.3)",
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#64748b",
  },
  dotOnline: {
    backgroundColor: "#22c55e",
  },
  dotOffline: {
    backgroundColor: "#ef4444",
  },
  statusText: {
    fontSize: 12,
    color: "#94a3b8",
    fontWeight: "600",
  },
  formContainer: {
    backgroundColor: "rgba(30, 41, 59, 0.5)",
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: "rgba(51, 65, 85, 0.6)",
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#cbd5e1",
    marginBottom: 10,
    marginLeft: 4,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1e293b",
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#334155",
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  inputWrapperFocused: {
    borderColor: "#3b82f6",
    backgroundColor: "#1e293b",
  },
  inputIconWrapper: {
    width: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: "#f1f5f9",
  },
  eyeButton: {
    padding: 8,
  },
  loginButtonWrapper: {
    marginTop: 8,
    marginBottom: 16,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#3b82f6",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  loginButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    gap: 10,
  },
  loginButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
  debugButtons: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  debugButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    backgroundColor: "rgba(51, 65, 85, 0.3)",
    borderRadius: 12,
    gap: 6,
    borderWidth: 1,
    borderColor: "#334155",
  },
  debugButtonText: {
    color: "#94a3b8",
    fontSize: 12,
    fontWeight: "600",
  },
  infoBox: {
    flexDirection: "row",
    backgroundColor: "rgba(59, 130, 246, 0.1)",
    borderRadius: 16,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: "#3b82f6",
    marginBottom: 16,
  },
  infoIconWrapper: {
    marginRight: 12,
    marginTop: 2,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 14,
    color: "#93c5fd",
    fontWeight: "600",
    marginBottom: 4,
  },
  infoText: {
    fontSize: 13,
    color: "#cbd5e1",
    lineHeight: 18,
  },
  urlBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(51, 65, 85, 0.3)",
    borderRadius: 12,
    padding: 12,
    gap: 8,
    marginBottom: 24,
  },
  urlText: {
    flex: 1,
    fontSize: 11,
    color: "#64748b",
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#334155",
  },
  dividerText: {
    marginHorizontal: 16,
    color: "#64748b",
    fontSize: 14,
    fontWeight: "500",
  },
  registerButton: {
    backgroundColor: "rgba(51, 65, 85, 0.5)",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#334155",
  },
  registerContent: {
    alignItems: "center",
  },
  registerText: {
    fontSize: 14,
    color: "#94a3b8",
    marginBottom: 6,
  },
  registerLinkWrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  registerLink: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#3b82f6",
  },
  footer: {
    marginTop: 40,
    alignItems: "center",
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