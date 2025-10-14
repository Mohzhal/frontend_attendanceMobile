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
  TextInput,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import axios from "axios";
import Constants from "expo-constants";

export default function CompaniesScreen({ route }) {
  const { token, user } = route.params;
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    latitude: "",
    longitude: "",
    validRadiusM: "100",
  });

  const BASE_URL =
    Constants.expoConfig?.extra?.API_URL ||
    process.env.EXPO_PUBLIC_API_URL ||
    "http://192.168.1.5:5000";

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/companies`, {
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {
        // Data dummy jika API belum siap
        return {
          data: [
            {
              id: 3,
              name: "PT Pindah berenang",
              address: "Sumur bor",
              latitude: -6.4174877,
              longitude: 107.4009516,
              valid_radius_m: 100,
              created_at: "2025-10-10T21:47:34.000Z",
            },
            {
              id: 6,
              name: "PT Agra mesa",
              address: "Sukamaneh",
              latitude: -6.3183517,
              longitude: 107.3796436,
              valid_radius_m: 100,
              created_at: "2025-10-11T02:03:34.000Z",
            },
          ]
        };
      });
      
      setCompanies(res.data);
    } catch (err) {
      console.error("Error fetching companies:", err);
      Alert.alert("Error", "Gagal memuat data perusahaan");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchCompanies();
  };

  const handleAddCompany = () => {
    setEditMode(false);
    setSelectedCompany(null);
    setFormData({
      name: "",
      address: "",
      latitude: "",
      longitude: "",
      validRadiusM: "100",
    });
    setModalVisible(true);
  };

  const handleEditCompany = (company) => {
    setEditMode(true);
    setSelectedCompany(company);
    setFormData({
      name: company.name,
      address: company.address,
      latitude: company.latitude?.toString() || "",
      longitude: company.longitude?.toString() || "",
      validRadiusM: company.valid_radius_m?.toString() || "100",
    });
    setModalVisible(true);
  };

  const handleDeleteCompany = (company) => {
    Alert.alert(
      "Konfirmasi Hapus",
      `Apakah Anda yakin ingin menghapus ${company.name}?`,
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Hapus",
          style: "destructive",
          onPress: async () => {
            try {
              await axios.delete(`${BASE_URL}/api/companies/${company.id}`, {
                headers: { Authorization: `Bearer ${token}` },
              });
              Alert.alert("Berhasil", "Perusahaan berhasil dihapus");
              fetchCompanies();
            } catch (err) {
              Alert.alert("Error", "Gagal menghapus perusahaan");
            }
          },
        },
      ]
    );
  };

  const handleSaveCompany = async () => {
    if (!formData.name || !formData.address) {
      return Alert.alert("Error", "Nama dan alamat wajib diisi");
    }

    try {
      if (editMode && selectedCompany) {
        await axios.put(
          `${BASE_URL}/api/companies/${selectedCompany.id}`,
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        Alert.alert("Berhasil", "Perusahaan berhasil diperbarui");
      } else {
        await axios.post(`${BASE_URL}/api/companies`, formData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        Alert.alert("Berhasil", "Perusahaan berhasil ditambahkan");
      }
      setModalVisible(false);
      fetchCompanies();
    } catch (err) {
      Alert.alert("Error", "Gagal menyimpan data perusahaan");
    }
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
          <Text style={styles.headerTitle}>Manajemen Perusahaan</Text>
          <Text style={styles.headerSubtitle}>
            {companies.length} Perusahaan Terdaftar
          </Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={handleAddCompany}>
          <Ionicons name="add-circle" size={28} color="#3b82f6" />
        </TouchableOpacity>
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
          {companies.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="business-outline" size={64} color="#475569" />
              <Text style={styles.emptyText}>Belum ada perusahaan</Text>
              <Text style={styles.emptySubtext}>
                Tambahkan perusahaan pertama Anda
              </Text>
            </View>
          ) : (
            companies.map((company) => (
              <CompanyCard
                key={company.id}
                company={company}
                onEdit={() => handleEditCompany(company)}
                onDelete={() => handleDeleteCompany(company)}
              />
            ))
          )}
        </View>
      </ScrollView>

      {/* Modal Form */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editMode ? "Edit Perusahaan" : "Tambah Perusahaan"}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close-circle" size={28} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Nama Perusahaan *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.name}
                  onChangeText={(text) =>
                    setFormData({ ...formData, name: text })
                  }
                  placeholder="Masukkan nama perusahaan"
                  placeholderTextColor="#64748b"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Alamat *</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={formData.address}
                  onChangeText={(text) =>
                    setFormData({ ...formData, address: text })
                  }
                  placeholder="Masukkan alamat lengkap"
                  placeholderTextColor="#64748b"
                  multiline
                  numberOfLines={3}
                />
              </View>

              <View style={styles.formRow}>
                <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.label}>Latitude</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.latitude}
                    onChangeText={(text) =>
                      setFormData({ ...formData, latitude: text })
                    }
                    placeholder="-6.4174877"
                    placeholderTextColor="#64748b"
                    keyboardType="numeric"
                  />
                </View>

                <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
                  <Text style={styles.label}>Longitude</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.longitude}
                    onChangeText={(text) =>
                      setFormData({ ...formData, longitude: text })
                    }
                    placeholder="107.4009516"
                    placeholderTextColor="#64748b"
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Radius Validasi (meter)</Text>
                <TextInput
                  style={styles.input}
                  value={formData.validRadiusM}
                  onChangeText={(text) =>
                    setFormData({ ...formData, validRadiusM: text })
                  }
                  placeholder="100"
                  placeholderTextColor="#64748b"
                  keyboardType="numeric"
                />
              </View>

              <TouchableOpacity
                style={styles.saveButtonWrapper}
                onPress={handleSaveCompany}
              >
                <LinearGradient
                  colors={["#3b82f6", "#2563eb"]}
                  style={styles.saveButton}
                >
                  <Ionicons name="checkmark-circle" size={24} color="#fff" />
                  <Text style={styles.saveButtonText}>Simpan</Text>
                </LinearGradient>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function CompanyCard({ company, onEdit, onDelete }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardIconWrapper}>
          <Ionicons name="business" size={24} color="#3b82f6" />
        </View>
        <View style={styles.cardHeaderText}>
          <Text style={styles.cardTitle}>{company.name}</Text>
          <Text style={styles.cardSubtitle}>ID: {company.id}</Text>
        </View>
      </View>

      <View style={styles.cardBody}>
        <View style={styles.cardRow}>
          <Ionicons name="location-outline" size={16} color="#94a3b8" />
          <Text style={styles.cardText}>{company.address}</Text>
        </View>
        <View style={styles.cardRow}>
          <Ionicons name="navigate-outline" size={16} color="#94a3b8" />
          <Text style={styles.cardText}>
            {company.latitude}, {company.longitude}
          </Text>
        </View>
        <View style={styles.cardRow}>
          <Ionicons name="radio-outline" size={16} color="#94a3b8" />
          <Text style={styles.cardText}>
            Radius: {company.valid_radius_m}m
          </Text>
        </View>
      </View>

      <View style={styles.cardActions}>
        <TouchableOpacity style={styles.actionButton} onPress={onEdit}>
          <Ionicons name="create-outline" size={20} color="#3b82f6" />
          <Text style={styles.actionButtonText}>Edit</Text>
        </TouchableOpacity>
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
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(59, 130, 246, 0.1)",
    justifyContent: "center",
    alignItems: "center",
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
  cardIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(59, 130, 246, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
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
  cardBody: {
    marginBottom: 16,
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
    backgroundColor: "rgba(59, 130, 246, 0.1)",
    gap: 8,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#3b82f6",
  },
  deleteButton: {
    backgroundColor: "rgba(239, 68, 68, 0.1)",
  },
  deleteButtonText: {
    color: "#ef4444",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#1e293b",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#f1f5f9",
  },
  formGroup: {
    marginBottom: 20,
  },
  formRow: {
    flexDirection: "row",
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#cbd5e1",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#0f172a",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: "#f1f5f9",
    borderWidth: 1,
    borderColor: "#334155",
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
  },
  saveButtonWrapper: {
    marginTop: 8,
    marginBottom: 16,
    borderRadius: 16,
    overflow: "hidden",
  },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    gap: 10,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});