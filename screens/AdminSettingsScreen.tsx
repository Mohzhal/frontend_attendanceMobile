import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function AdminSettingsScreen({ navigation, route }) {
  const { token, user } = route.params;
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const [autoBackup, setAutoBackup] = useState(false);

  const handleLogout = async () => {
    Alert.alert(
      "Konfirmasi Logout",
      "Apakah Anda yakin ingin keluar?",
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Logout",
          style: "destructive",
          onPress: async () => {
            try {
              await AsyncStorage.removeItem("token");
              await AsyncStorage.removeItem("user");
              navigation.replace("Login");
            } catch (err) {
              console.error("Error logging out:", err);
            }
          },
        },
      ]
    );
  };

  const handleExportData = () => {
    Alert.alert(
      "Export Data",
      "Pilih format export data",
      [
        {
          text: "Excel (.xlsx)",
          onPress: () => Alert.alert("Info", "Fitur export Excel dalam pengembangan"),
        },
        {
          text: "PDF",
          onPress: () => Alert.alert("Info", "Fitur export PDF dalam pengembangan"),
        },
        {
          text: "CSV",
          onPress: () => Alert.alert("Info", "Fitur export CSV dalam pengembangan"),
        },
        { text: "Batal", style: "cancel" },
      ]
    );
  };

  const handleBackup = () => {
    Alert.alert(
      "Backup Database",
      "Apakah Anda yakin ingin membuat backup database?",
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Backup",
          onPress: () => Alert.alert("Berhasil", "Database berhasil di-backup"),
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#0f172a", "#1e293b"]}
        style={styles.backgroundGradient}
      />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Pengaturan</Text>
            <Text style={styles.headerSubtitle}>
              Kelola sistem dan preferensi
            </Text>
          </View>
        </View>

        {/* Profile Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profil Admin</Text>
          <View style={styles.profileCard}>
            <View style={styles.profileIcon}>
              <Ionicons name="shield-checkmark" size={32} color="#3b82f6" />
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{user.name}</Text>
              <Text style={styles.profileRole}>Super Admin</Text>
              <Text style={styles.profileNik}>NIK: {user.nik}</Text>
            </View>
          </View>
        </View>

        {/* System Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pengaturan Sistem</Text>
          
          <SettingItem
            icon="notifications"
            label="Notifikasi"
            description="Terima notifikasi sistem"
            rightComponent={
              <Switch
                value={notifications}
                onValueChange={setNotifications}
                trackColor={{ false: "#334155", true: "#3b82f6" }}
                thumbColor="#fff"
              />
            }
          />
          
          <SettingItem
            icon="moon"
            label="Mode Gelap"
            description="Tampilan mode gelap"
            rightComponent={
              <Switch
                value={darkMode}
                onValueChange={setDarkMode}
                trackColor={{ false: "#334155", true: "#3b82f6" }}
                thumbColor="#fff"
              />
            }
          />
          
          <SettingItem
            icon="cloud-upload"
            label="Auto Backup"
            description="Backup otomatis harian"
            rightComponent={
              <Switch
                value={autoBackup}
                onValueChange={setAutoBackup}
                trackColor={{ false: "#334155", true: "#3b82f6" }}
                thumbColor="#fff"
              />
            }
          />
        </View>

        {/* Data Management */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Manajemen Data</Text>
          
          <TouchableOpacity
            style={styles.actionCard}
            onPress={handleExportData}
          >
            <View style={styles.actionIcon}>
              <Ionicons name="download" size={24} color="#10b981" />
            </View>
            <View style={styles.actionInfo}>
              <Text style={styles.actionTitle}>Export Data</Text>
              <Text style={styles.actionDescription}>
                Export data ke Excel, PDF, atau CSV
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#64748b" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={handleBackup}
          >
            <View style={styles.actionIcon}>
              <Ionicons name="save" size={24} color="#3b82f6" />
            </View>
            <View style={styles.actionInfo}>
              <Text style={styles.actionTitle}>Backup Database</Text>
              <Text style={styles.actionDescription}>
                Buat backup database lengkap
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#64748b" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => Alert.alert("Info", "Fitur dalam pengembangan")}
          >
            <View style={styles.actionIcon}>
              <Ionicons name="refresh" size={24} color="#f59e0b" />
            </View>
            <View style={styles.actionInfo}>
              <Text style={styles.actionTitle}>Restore Database</Text>
              <Text style={styles.actionDescription}>
                Kembalikan data dari backup
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#64748b" />
          </TouchableOpacity>
        </View>

        {/* App Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informasi Aplikasi</Text>
          
          <View style={styles.infoCard}>
            <InfoRow label="Versi Aplikasi" value="1.0.0" />
            <InfoRow label="Build Number" value="100" />
            <InfoRow label="Database Version" value="2.5.1" />
            <InfoRow label="Last Update" value="14 Oktober 2025" />
          </View>
        </View>

        {/* About */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tentang</Text>
          
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => Alert.alert("Info", "Fitur dalam pengembangan")}
          >
            <View style={styles.actionIcon}>
              <Ionicons name="information-circle" size={24} color="#3b82f6" />
            </View>
            <View style={styles.actionInfo}>
              <Text style={styles.actionTitle}>Panduan Penggunaan</Text>
              <Text style={styles.actionDescription}>
                Pelajari cara menggunakan sistem
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#64748b" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => Alert.alert("Info", "Fitur dalam pengembangan")}
          >
            <View style={styles.actionIcon}>
              <Ionicons name="document-text" size={24} color="#8b5cf6" />
            </View>
            <View style={styles.actionInfo}>
              <Text style={styles.actionTitle}>Terms & Conditions</Text>
              <Text style={styles.actionDescription}>
                Syarat dan ketentuan penggunaan
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#64748b" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => Alert.alert("Info", "Fitur dalam pengembangan")}
          >
            <View style={styles.actionIcon}>
              <Ionicons name="shield-checkmark" size={24} color="#10b981" />
            </View>
            <View style={styles.actionInfo}>
              <Text style={styles.actionTitle}>Privacy Policy</Text>
              <Text style={styles.actionDescription}>
                Kebijakan privasi data
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#64748b" />
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.logoutButtonWrapper}
            onPress={handleLogout}
          >
            <LinearGradient
              colors={["#ef4444", "#dc2626"]}
              style={styles.logoutButton}
            >
              <Ionicons name="log-out-outline" size={24} color="#fff" />
              <Text style={styles.logoutButtonText}>Logout</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>© 2025 Attendance System</Text>
          <Text style={styles.footerSubtext}>
            Developed with ❤️ by Your Team
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

function SettingItem({ icon, label, description, rightComponent }) {
  return (
    <View style={styles.settingItem}>
      <View style={styles.settingIcon}>
        <Ionicons name={icon} size={24} color="#3b82f6" />
      </View>
      <View style={styles.settingInfo}>
        <Text style={styles.settingLabel}>{label}</Text>
        <Text style={styles.settingDescription}>{description}</Text>
      </View>
      {rightComponent}
    </View>
  );
}

function InfoRow({ label, value }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
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
  header: {
    padding: 24,
    paddingTop: 60,
    paddingBottom: 16,
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
  section: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#f1f5f9",
    marginBottom: 12,
  },
  profileCard: {
    flexDirection: "row",
    backgroundColor: "rgba(30, 41, 59, 0.5)",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#334155",
  },
  profileIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(59, 130, 246, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
    justifyContent: "center",
  },
  profileName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#f1f5f9",
    marginBottom: 4,
  },
  profileRole: {
    fontSize: 14,
    color: "#3b82f6",
    marginBottom: 4,
  },
  profileNik: {
    fontSize: 12,
    color: "#64748b",
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(30, 41, 59, 0.5)",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#334155",
  },
  settingIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(59, 130, 246, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  settingInfo: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#f1f5f9",
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 13,
    color: "#94a3b8",
  },
  actionCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(30, 41, 59, 0.5)",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#334155",
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(59, 130, 246, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  actionInfo: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#f1f5f9",
    marginBottom: 4,
  },
  actionDescription: {
    fontSize: 13,
    color: "#94a3b8",
  },
  infoCard: {
    backgroundColor: "rgba(30, 41, 59, 0.5)",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#334155",
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#334155",
  },
  infoLabel: {
    fontSize: 14,
    color: "#94a3b8",
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#f1f5f9",
  },
  logoutButtonWrapper: {
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#ef4444",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    gap: 12,
  },
  logoutButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
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
  },
});