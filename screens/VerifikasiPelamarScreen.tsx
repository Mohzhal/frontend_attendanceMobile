import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
  Modal,
  RefreshControl,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import Constants from "expo-constants";

interface Applicant {
  id: number;
  name: string;
  nik: string;
  birth_place?: string;
  birth_date?: string;
  gender?: "L" | "P";
  profile_photo_url?: string;
  company_id: number;
  company_name?: string;
  is_verified: number;
  role: string;
}

interface VerifikasiPelamarScreenProps {
  token: string;
  user: {
    id: number;
    name: string;
    role: string;
    company_id?: number;
  };
}

export default function VerifikasiPelamarScreen({ 
  token, 
  user 
}: VerifikasiPelamarScreenProps) {
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [selectedApplicant, setSelectedApplicant] = useState<Applicant | null>(null);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [processing, setProcessing] = useState<boolean>(false);

  const BASE_URL =
    Constants.expoConfig?.extra?.API_URL ||
    process.env.EXPO_PUBLIC_API_URL ||
    "http://192.168.1.6:5000";

  // ========================================
  // FETCH APPLICANTS
  // ========================================
  const fetchApplicants = useCallback(async () => {
    try {
      console.log("🔍 Fetching applicants...");
      console.log("📍 API URL:", `${BASE_URL}/api/hr/applicants`);
      console.log("👤 User:", user);

      const response = await axios.get(`${BASE_URL}/api/hr/applicants`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        timeout: 10000, // 10 seconds timeout
      });

      console.log("✅ Response status:", response.status);
      console.log("✅ Applicants data:", response.data);

      setApplicants(response.data);

    } catch (error: any) {
      console.error("❌ Fetch applicants error:", error);

      if (axios.isAxiosError(error)) {
        if (error.response) {
          // Server responded with error
          console.error("Error response:", {
            status: error.response.status,
            data: error.response.data,
          });

          const errorMsg = error.response.data?.msg || "Gagal memuat data pelamar";
          Alert.alert("Error", errorMsg);

          if (error.response.status === 403) {
            Alert.alert(
              "Akses Ditolak",
              "Anda tidak memiliki akses ke halaman ini. Pastikan Anda login sebagai HR."
            );
          }
        } else if (error.request) {
          // Request sent but no response
          console.error("No response received:", error.request);
          Alert.alert(
            "Koneksi Gagal",
            "Tidak dapat terhubung ke server. Periksa koneksi internet Anda."
          );
        } else {
          // Error in request setup
          console.error("Request error:", error.message);
          Alert.alert("Error", error.message);
        }
      } else {
        Alert.alert("Error", "Terjadi kesalahan yang tidak diketahui");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [BASE_URL, token, user]);

  // ========================================
  // HANDLE VERIFICATION
  // ========================================
  const handleVerification = async (applicantId: number, status: "approved" | "rejected") => {
    try {
      setProcessing(true);

      console.log("🔄 Verifying applicant:", { applicantId, status });

      const response = await axios.put(
        `${BASE_URL}/api/hr/verify-applicant/${applicantId}`,
        { status },
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          timeout: 10000,
        }
      );

      console.log("✅ Verification response:", response.data);

      Alert.alert(
        "Berhasil",
        `Pelamar ${status === "approved" ? "diterima" : "ditolak"}`,
        [
          {
            text: "OK",
            onPress: () => {
              setModalVisible(false);
              setSelectedApplicant(null);
              fetchApplicants();
            },
          },
        ]
      );

    } catch (error: any) {
      console.error("❌ Verification error:", error);

      let errorMsg = "Gagal memproses verifikasi";

      if (axios.isAxiosError(error) && error.response) {
        errorMsg = error.response.data?.msg || errorMsg;
        console.error("Error details:", error.response.data);
      }

      Alert.alert("Error", errorMsg);
    } finally {
      setProcessing(false);
    }
  };

  // ========================================
  // HANDLE REFRESH
  // ========================================
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchApplicants();
  }, [fetchApplicants]);

  // ========================================
  // INITIAL LOAD
  // ========================================
  useEffect(() => {
    fetchApplicants();
  }, [fetchApplicants]);

  // ========================================
  // FORMAT DATE
  // ========================================
  const formatDate = (dateString?: string): string => {
    if (!dateString) return "-";
    
    try {
      const date = new Date(dateString);
      const options: Intl.DateTimeFormatOptions = { 
        day: "numeric", 
        month: "long", 
        year: "numeric" 
      };
      return date.toLocaleDateString("id-ID", options);
    } catch {
      return dateString;
    }
  };

  // ========================================
  // RENDER ITEM
  // ========================================
  const renderItem = ({ item }: { item: Applicant }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => {
        setSelectedApplicant(item);
        setModalVisible(true);
      }}
      activeOpacity={0.7}
    >
      <Image
        source={{
          uri:
            item.profile_photo_url ||
            "https://cdn-icons-png.flaticon.com/512/149/149071.png",
        }}
        style={styles.avatar}
      />
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.detailText} numberOfLines={1}>
          NIK: {item.nik}
        </Text>
        {item.birth_place && (
          <Text style={styles.detailText} numberOfLines={1}>
            📍 {item.birth_place}
          </Text>
        )}
        <View style={styles.statusBadge}>
          <View style={styles.statusDot} />
          <Text style={styles.statusText}>Menunggu Verifikasi</Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
    </TouchableOpacity>
  );

  // ========================================
  // LOADING STATE
  // ========================================
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Memuat data...</Text>
      </View>
    );
  }

  // ========================================
  // MAIN RENDER
  // ========================================
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Verifikasi Pelamar</Text>
          <Text style={styles.subtitle}>
            {applicants.length} pelamar menunggu verifikasi
          </Text>
        </View>
        <TouchableOpacity 
          style={styles.refreshButton}
          onPress={onRefresh}
          disabled={refreshing}
        >
          <Ionicons 
            name="refresh" 
            size={24} 
            color="#2563eb" 
          />
        </TouchableOpacity>
      </View>

      {/* Empty State */}
      {applicants.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIconContainer}>
            <Ionicons name="checkmark-done-circle" size={80} color="#d1d5db" />
          </View>
          <Text style={styles.emptyText}>Tidak ada pelamar baru</Text>
          <Text style={styles.emptySubtext}>
            Semua karyawan sudah diverifikasi
          </Text>
          <TouchableOpacity 
            style={styles.emptyRefreshButton}
            onPress={onRefresh}
          >
            <Ionicons name="refresh" size={20} color="#fff" />
            <Text style={styles.emptyRefreshText}>Refresh</Text>
          </TouchableOpacity>
        </View>
      ) : (
        // List
        <FlatList
          data={applicants}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#2563eb"]}
              tintColor="#2563eb"
            />
          }
        />
      )}

      {/* Modal Detail */}
      <Modal
        animationType="slide"
        transparent
        visible={modalVisible}
        onRequestClose={() => {
          if (!processing) {
            setModalVisible(false);
            setSelectedApplicant(null);
          }
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedApplicant && (
              <>
                {/* Avatar */}
                <Image
                  source={{
                    uri:
                      selectedApplicant.profile_photo_url ||
                      "https://cdn-icons-png.flaticon.com/512/149/149071.png",
                  }}
                  style={styles.modalAvatar}
                />

                {/* Name */}
                <Text style={styles.modalName}>{selectedApplicant.name}</Text>

                {/* Details */}
                <View style={styles.detailsContainer}>
                  <View style={styles.detailRow}>
                    <Ionicons name="card" size={18} color="#6b7280" />
                    <Text style={styles.detailLabel}>NIK:</Text>
                    <Text style={styles.detailValue}>{selectedApplicant.nik}</Text>
                  </View>

                  {selectedApplicant.birth_place && (
                    <View style={styles.detailRow}>
                      <Ionicons name="location" size={18} color="#6b7280" />
                      <Text style={styles.detailLabel}>Tempat Lahir:</Text>
                      <Text style={styles.detailValue}>
                        {selectedApplicant.birth_place}
                      </Text>
                    </View>
                  )}

                  {selectedApplicant.birth_date && (
                    <View style={styles.detailRow}>
                      <Ionicons name="calendar" size={18} color="#6b7280" />
                      <Text style={styles.detailLabel}>Tanggal Lahir:</Text>
                      <Text style={styles.detailValue}>
                        {formatDate(selectedApplicant.birth_date)}
                      </Text>
                    </View>
                  )}

                  {selectedApplicant.gender && (
                    <View style={styles.detailRow}>
                      <Ionicons 
                        name={selectedApplicant.gender === "L" ? "male" : "female"} 
                        size={18} 
                        color="#6b7280" 
                      />
                      <Text style={styles.detailLabel}>Jenis Kelamin:</Text>
                      <Text style={styles.detailValue}>
                        {selectedApplicant.gender === "L" ? "Laki-laki" : "Perempuan"}
                      </Text>
                    </View>
                  )}

                  {selectedApplicant.company_name && (
                    <View style={styles.detailRow}>
                      <Ionicons name="business" size={18} color="#6b7280" />
                      <Text style={styles.detailLabel}>Perusahaan:</Text>
                      <Text style={styles.detailValue}>
                        {selectedApplicant.company_name}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Action Buttons */}
                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={[styles.modalBtn, styles.rejectBtn]}
                    onPress={() =>
                      handleVerification(selectedApplicant.id, "rejected")
                    }
                    disabled={processing}
                  >
                    {processing ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <>
                        <Ionicons name="close-circle" size={20} color="#fff" />
                        <Text style={styles.modalBtnText}>Tolak</Text>
                      </>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.modalBtn, styles.approveBtn]}
                    onPress={() =>
                      handleVerification(selectedApplicant.id, "approved")
                    }
                    disabled={processing}
                  >
                    {processing ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <>
                        <Ionicons name="checkmark-circle" size={20} color="#fff" />
                        <Text style={styles.modalBtnText}>Terima</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>

                {/* Close Button */}
                <TouchableOpacity
                  style={styles.closeBtn}
                  onPress={() => {
                    if (!processing) {
                      setModalVisible(false);
                      setSelectedApplicant(null);
                    }
                  }}
                  disabled={processing}
                >
                  <Text style={[
                    styles.closeBtnText,
                    processing && styles.closeBtnTextDisabled
                  ]}>
                    Tutup
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ========================================
// STYLES
// ========================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f9fafb",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#6b7280",
  },
  header: {
    backgroundColor: "#fff",
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#111827",
  },
  subtitle: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 4,
  },
  refreshButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#eff6ff",
    justifyContent: "center",
    alignItems: "center",
  },
  listContainer: {
    padding: 16,
    paddingBottom: 24,
  },
  card: {
    flexDirection: "row",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 14,
    backgroundColor: "#f3f4f6",
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 4,
  },
  detailText: {
    fontSize: 13,
    color: "#6b7280",
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#f59e0b",
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    color: "#f59e0b",
    fontWeight: "600",
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  emptyIconContainer: {
    marginBottom: 20,
  },
  emptyText: {
    color: "#111827",
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
  },
  emptySubtext: {
    color: "#9ca3af",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 24,
  },
  emptyRefreshButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2563eb",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  emptyRefreshText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    alignItems: "center",
    maxHeight: "85%",
  },
  modalAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
    borderWidth: 4,
    borderColor: "#e5e7eb",
    backgroundColor: "#f3f4f6",
  },
  modalName: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 8,
  },
  detailsContainer: {
    width: "100%",
    backgroundColor: "#f9fafb",
    borderRadius: 12,
    padding: 16,
    marginVertical: 16,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    color: "#6b7280",
    marginLeft: 8,
    marginRight: 8,
    fontWeight: "500",
  },
  detailValue: {
    fontSize: 14,
    color: "#111827",
    flex: 1,
    fontWeight: "600",
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
    width: "100%",
  },
  modalBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  rejectBtn: {
    backgroundColor: "#ef4444",
  },
  approveBtn: {
    backgroundColor: "#10b981",
  },
  modalBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },
  closeBtn: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  closeBtnText: {
    color: "#6b7280",
    fontSize: 15,
    fontWeight: "600",
  },
  closeBtnTextDisabled: {
    opacity: 0.5,
  },
});