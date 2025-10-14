import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
  Switch,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function SettingScreen({ token, user, navigation }) {
  const [notificationEnabled, setNotificationEnabled] = useState(true);
  const [autoValidation, setAutoValidation] = useState(false);

  const handleLogout = () => {
    Alert.alert("Logout", "Apakah Anda yakin ingin keluar?", [
      { text: "Batal", style: "cancel" },
      {
        text: "Keluar",
        style: "destructive",
        onPress: () => {
          // Navigate to login or clear session
          navigation.reset({
            index: 0,
            routes: [{ name: "Login" }],
          });
        },
      },
    ]);
  };

  const SettingItem = ({ icon, title, subtitle, onPress, rightElement }) => (
    <TouchableOpacity
      style={styles.settingItem}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.iconContainer}>
        <Ionicons name={icon} size={22} color="#2563eb" />
      </View>
      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>{title}</Text>
        {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
      </View>
      {rightElement || (
        <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
      )}
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Pengaturan</Text>
      </View>

      <View style={styles.profileSection}>
        <Image
          source={{
            uri:
              user.profile_photo ||
              "https://cdn-icons-png.flaticon.com/512/149/149071.png",
          }}
          style={styles.profileImage}
        />
        <Text style={styles.profileName}>{user.name || "HR Manager"}</Text>
        <Text style={styles.profileEmail}>{user.email}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>HR Manager</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Akun</Text>
        <View style={styles.settingGroup}>
          <SettingItem
            icon="person-outline"
            title="Edit Profil"
            subtitle="Ubah informasi akun Anda"
            onPress={() => Alert.alert("Edit Profil", "Fitur dalam pengembangan")}
          />
          <SettingItem
            icon="lock-closed-outline"
            title="Ubah Password"
            subtitle="Perbarui kata sandi Anda"
            onPress={() => Alert.alert("Ubah Password", "Fitur dalam pengembangan")}
          />
          <SettingItem
            icon="business-outline"
            title="Informasi Perusahaan"
            subtitle="Detail perusahaan"
            onPress={() => Alert.alert("Info Perusahaan", "Fitur dalam pengembangan")}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notifikasi</Text>
        <View style={styles.settingGroup}>
          <SettingItem
            icon="notifications-outline"
            title="Notifikasi Push"
            subtitle="Terima pemberitahuan real-time"
            rightElement={
              <Switch
                value={notificationEnabled}
                onValueChange={setNotificationEnabled}
                trackColor={{ false: "#d1d5db", true: "#93c5fd" }}
                thumbColor={notificationEnabled ? "#2563eb" : "#f3f4f6"}
              />
            }
          />
          <SettingItem
            icon="mail-outline"
            title="Email Notification"
            subtitle="Terima notifikasi via email"
            onPress={() => Alert.alert("Email Notification", "Fitur dalam pengembangan")}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Pengaturan Absensi</Text>
        <View style={styles.settingGroup}>
          <SettingItem
            icon="time-outline"
            title="Jam Kerja"
            subtitle="Atur jam kerja karyawan"
            onPress={() => Alert.alert("Jam Kerja", "Fitur dalam pengembangan")}
          />
          <SettingItem
            icon="location-outline"
            title="Lokasi Kantor"
            subtitle="Atur radius check-in"
            onPress={() => Alert.alert("Lokasi Kantor", "Fitur dalam pengembangan")}
          />
          <SettingItem
            icon="checkmark-done-outline"
            title="Auto Validasi"
            subtitle="Validasi otomatis absensi dalam radius"
            rightElement={
              <Switch
                value={autoValidation}
                onValueChange={setAutoValidation}
                trackColor={{ false: "#d1d5db", true: "#93c5fd" }}
                thumbColor={autoValidation ? "#2563eb" : "#f3f4f6"}
              />
            }
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Lainnya</Text>
        <View style={styles.settingGroup}>
          <SettingItem
            icon="document-text-outline"
            title="Kebijakan Privasi"
            onPress={() => Alert.alert("Kebijakan Privasi", "Fitur dalam pengembangan")}
          />
          <SettingItem
            icon="help-circle-outline"
            title="Bantuan & Dukungan"
            onPress={() => Alert.alert("Bantuan", "Fitur dalam pengembangan")}
          />
          <SettingItem
            icon="information-circle-outline"
            title="Tentang Aplikasi"
            subtitle="Versi 1.0.0"
            onPress={() => Alert.alert("Tentang", "HR Attendance App v1.0.0")}
          />
        </View>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={22} color="#ef4444" />
        <Text style={styles.logoutText}>Keluar</Text>
      </TouchableOpacity>

      <View style={styles.footer}>
        <Text style={styles.footerText}>© 2025 HR Attendance System</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  header: {
    backgroundColor: "#fff",
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#111827",
  },
  profileSection: {
    backgroundColor: "#fff",
    alignItems: "center",
    paddingVertical: 30,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
    backgroundColor: "#f3f4f6",
  },
  profileName: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 12,
  },
  roleBadge: {
    backgroundColor: "#dbeafe",
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
  },
  roleText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#2563eb",
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 12,
    marginLeft: 4,
  },
  settingGroup: {
    backgroundColor: "#fff",
    borderRadius: 12,
    overflow: "hidden",
    elevation: 1,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#eff6ff",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 15,
    fontWeight: "500",
    color: "#111827",
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 12,
    color: "#6b7280",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#fecaca",
    gap: 8,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ef4444",
  },
  footer: {
    alignItems: "center",
    paddingVertical: 24,
    paddingBottom: 40,
  },
  footerText: {
    fontSize: 12,
    color: "#9ca3af",
  },
});