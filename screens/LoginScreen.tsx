import React, { useState } from "react";
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

  const BASE_URL =
    Constants.expoConfig?.extra?.API_URL ||
    process.env.EXPO_PUBLIC_API_URL ||
    "http://192.168.1.5:5000";

  const handleLogin = async () => {
    if (!nik || !password) {
      return Alert.alert("Data Belum Lengkap", "Harap isi NIK dan Password");
    }

    setIsLoading(true);

    try {
      const res = await axios.post(`${BASE_URL}/api/auth/login`, {
        nik,
        password,
      });

      const { token, user } = res.data;
      const role = (user.role || "").toLowerCase();

      console.log("✅ Login sukses:", user);
      console.log("🔑 Token received:", token ? "YES" : "NO");
      console.log("👤 Role:", role);

      // ✅ Simpan ke AsyncStorage
      await AsyncStorage.setItem("token", token);
      await AsyncStorage.setItem("user", JSON.stringify(user));

      setIsLoading(false);

      // ✅ Navigasi berdasarkan role
      if (role === "super_admin") {
        console.log("🔱 Navigating to SuperAdminTabs");
        return Alert.alert(
          "Login Berhasil ✅",
          `Selamat datang, ${user.name}!`,
          [
            {
              text: "Lanjutkan",
              onPress: () =>
                navigation.replace("SuperAdminTabs", { 
                  token, 
                  user 
                }),
            },
          ]
        );
      }

      if (role === "hr") {
        console.log("🏢 Navigating to HRDashboardScreen");
        return Alert.alert(
          "Login Berhasil ✅",
          `Selamat datang, ${user.name}!`,
          [
            {
              text: "Lanjutkan",
              onPress: () =>
                navigation.replace("HRDashboardScreen", { 
                  token, 
                  user,
                  companyId: user.company_id 
                }),
            },
          ]
        );
      }

      if (role === "karyawan" && user.is_verified === 0) {
        return Alert.alert(
          "Menunggu Verifikasi ⏳",
          "Akun Anda belum diverifikasi oleh HR/Admin. Silakan hubungi HR untuk konfirmasi.",
          [{ text: "OK" }]
        );
      }

      if (role === "karyawan" && user.is_verified === 1) {
        console.log("👤 Navigating to MainTabs");
        return Alert.alert("Login Berhasil 🎉", `Selamat datang, ${user.name}!`, [
          {
            text: "Masuk",
            onPress: () => navigation.replace("MainTabs", { 
              token, 
              user 
            }),
          },
        ]);
      }

      Alert.alert("Gagal Login ❌", "Peran pengguna tidak dikenali di sistem.");
    } catch (err) {
      setIsLoading(false);
      console.error("❌ Login error:", err.response?.data || err.message);

      const error = err;
      const msg =
        error.response?.data?.msg ||
        "Terjadi kesalahan pada server, coba lagi nanti.";

      if (msg.toLowerCase().includes("user tidak ditemukan")) {
        Alert.alert("NIK Tidak Terdaftar", "Silakan lakukan registrasi terlebih dahulu.");
      } else if (msg.toLowerCase().includes("password salah")) {
        Alert.alert("Password Salah", "Periksa kembali password Anda.");
      } else {
        Alert.alert("Gagal Login", msg);
      }
    }
  };

  return (
    <View style={styles.container}>
      {/* Animated Background */}
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
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeButton}
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
    marginBottom: 20,
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
  infoBox: {
    flexDirection: "row",
    backgroundColor: "rgba(59, 130, 246, 0.1)",
    borderRadius: 16,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: "#3b82f6",
    marginBottom: 24,
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