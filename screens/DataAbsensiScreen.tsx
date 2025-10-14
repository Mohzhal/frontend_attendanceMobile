import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
  TextInput,
  Modal,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import MapView, { Marker } from "react-native-maps";
import axios from "axios";
import Constants from "expo-constants";

const { width } = Dimensions.get("window");

interface DataAbsensiScreenProps {
  token: string;
  user: any;
  navigation: any;
}

interface AttendanceItem {
  id: number;
  user_name: string;
  profile_photo_url?: string;
  type: "checkin" | "checkout";
  created_at: string;
  location?: string;
  latitude?: string;
  longitude?: string;
  is_valid: boolean;
  notes?: string;
}

export default function DataAbsensiScreen({
  token,
  user,
  navigation,
}: DataAbsensiScreenProps) {
  const [attendanceList, setAttendanceList] = useState<AttendanceItem[]>([]);
  const [filteredList, setFilteredList] = useState<AttendanceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItem, setSelectedItem] = useState<AttendanceItem | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const BASE_URL =
    Constants.expoConfig?.extra?.API_URL ||
    process.env.EXPO_PUBLIC_API_URL ||
    "http://192.168.1.6:5000";

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterData();
  }, [filter, searchQuery, attendanceList]);

  const fetchData = async () => {
    try {
      const res = await axios.get(
        `${BASE_URL}/api/attendance/company/${user.company_id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setAttendanceList(res.data);
    } catch (err) {
      console.error("❌ Fetch attendance error:", err);
      Alert.alert("Gagal memuat data absensi");
    } finally {
      setLoading(false);
    }
  };

  const filterData = () => {
    let filtered = attendanceList;

    // Filter by type
    if (filter !== "all") {
      filtered = filtered.filter((item) => item.type === filter);
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter((item) =>
        item.user_name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredList(filtered);
  };

  const openDetail = (item: AttendanceItem) => {
    setSelectedItem(item);
    setModalVisible(true);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Memuat data absensi...</Text>
      </View>
    );
  }

  const renderItem = ({ item }: { item: AttendanceItem }) => (
    <TouchableOpacity style={styles.card} onPress={() => openDetail(item)}>
      <Image
        source={{
          uri:
            item.profile_photo_url ||
            "https://cdn-icons-png.flaticon.com/512/149/149071.png",
        }}
        style={styles.avatar}
      />
      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Text style={styles.name}>{item.user_name}</Text>
          <View
            style={[
              styles.typeBadge,
              {
                backgroundColor:
                  item.type === "checkin" ? "#dbeafe" : "#fef3c7",
              },
            ]}
          >
            <Ionicons
              name={item.type === "checkin" ? "log-in" : "log-out"}
              size={12}
              color={item.type === "checkin" ? "#2563eb" : "#f59e0b"}
            />
            <Text
              style={[
                styles.typeText,
                {
                  color: item.type === "checkin" ? "#2563eb" : "#f59e0b",
                },
              ]}
            >
              {item.type === "checkin" ? "Check In" : "Check Out"}
            </Text>
          </View>
        </View>

        <View style={styles.detailRow}>
          <Ionicons name="time-outline" size={14} color="#6b7280" />
          <Text style={styles.detailText}>
            {new Date(item.created_at).toLocaleString("id-ID", {
              day: "2-digit",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <Ionicons name="location-outline" size={14} color="#6b7280" />
          <Text style={styles.detailText} numberOfLines={1}>
            {item.location || "Lokasi tidak tersedia"}
          </Text>
        </View>

        <View style={styles.statusRow}>
          <Ionicons
            name={item.is_valid ? "checkmark-circle" : "close-circle"}
            size={16}
            color={item.is_valid ? "#10b981" : "#ef4444"}
          />
          <Text
            style={[
              styles.statusText,
              { color: item.is_valid ? "#10b981" : "#ef4444" },
            ]}
          >
            {item.is_valid ? "Valid" : "Tidak Valid"}
          </Text>
        </View>
      </View>

      <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="calendar-outline" size={80} color="#d1d5db" />
      <Text style={styles.emptyText}>Tidak ada data absensi</Text>
      <Text style={styles.emptySubtext}>
        {searchQuery
          ? "Coba ubah kata kunci pencarian"
          : "Belum ada karyawan yang absen"}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Data Absensi Karyawan</Text>
        <Text style={styles.subtitle}>Total: {filteredList.length} data</Text>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#9ca3af" />
          <TextInput
            style={styles.searchInput}
            placeholder="Cari nama karyawan..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9ca3af"
          />
          {searchQuery !== "" && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={20} color="#9ca3af" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterBtn, filter === "all" && styles.filterBtnActive]}
          onPress={() => setFilter("all")}
        >
          <Text
            style={[
              styles.filterText,
              filter === "all" && styles.filterTextActive,
            ]}
          >
            Semua
          </Text>
          <View
            style={[
              styles.filterCount,
              filter === "all" && styles.filterCountActive,
            ]}
          >
            <Text
              style={[
                styles.filterCountText,
                filter === "all" && styles.filterCountTextActive,
              ]}
            >
              {attendanceList.length}
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterBtn,
            filter === "checkin" && styles.filterBtnActive,
          ]}
          onPress={() => setFilter("checkin")}
        >
          <Text
            style={[
              styles.filterText,
              filter === "checkin" && styles.filterTextActive,
            ]}
          >
            Check In
          </Text>
          <View
            style={[
              styles.filterCount,
              filter === "checkin" && styles.filterCountActive,
            ]}
          >
            <Text
              style={[
                styles.filterCountText,
                filter === "checkin" && styles.filterCountTextActive,
              ]}
            >
              {attendanceList.filter((i) => i.type === "checkin").length}
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterBtn,
            filter === "checkout" && styles.filterBtnActive,
          ]}
          onPress={() => setFilter("checkout")}
        >
          <Text
            style={[
              styles.filterText,
              filter === "checkout" && styles.filterTextActive,
            ]}
          >
            Check Out
          </Text>
          <View
            style={[
              styles.filterCount,
              filter === "checkout" && styles.filterCountActive,
            ]}
          >
            <Text
              style={[
                styles.filterCountText,
                filter === "checkout" && styles.filterCountTextActive,
              ]}
            >
              {attendanceList.filter((i) => i.type === "checkout").length}
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* List */}
      <FlatList
        data={filteredList}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={
          filteredList.length === 0
            ? styles.listContainerEmpty
            : styles.listContainer
        }
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmptyState}
      />

      {/* Detail Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedItem && (
              <>
                {/* Modal Header */}
                <View style={styles.modalHeader}>
                  <View style={styles.modalHeaderLeft}>
                    <Image
                      source={{
                        uri:
                          selectedItem.profile_photo_url ||
                          "https://cdn-icons-png.flaticon.com/512/149/149071.png",
                      }}
                      style={styles.modalAvatar}
                    />
                    <View>
                      <Text style={styles.modalName}>
                        {selectedItem.user_name}
                      </Text>
                      <View
                        style={[
                          styles.modalTypeBadge,
                          {
                            backgroundColor:
                              selectedItem.type === "checkin"
                                ? "#dbeafe"
                                : "#fef3c7",
                          },
                        ]}
                      >
                        <Ionicons
                          name={
                            selectedItem.type === "checkin"
                              ? "log-in"
                              : "log-out"
                          }
                          size={14}
                          color={
                            selectedItem.type === "checkin"
                              ? "#2563eb"
                              : "#f59e0b"
                          }
                        />
                        <Text
                          style={[
                            styles.modalTypeText,
                            {
                              color:
                                selectedItem.type === "checkin"
                                  ? "#2563eb"
                                  : "#f59e0b",
                            },
                          ]}
                        >
                          {selectedItem.type === "checkin"
                            ? "Check In"
                            : "Check Out"}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.closeModalBtn}
                    onPress={() => setModalVisible(false)}
                  >
                    <Ionicons name="close" size={24} color="#6b7280" />
                  </TouchableOpacity>
                </View>

                {/* Detail Info */}
                <View style={styles.detailContainer}>
                  <View style={styles.detailItem}>
                    <View style={styles.detailIconBox}>
                      <Ionicons name="calendar" size={20} color="#2563eb" />
                    </View>
                    <View style={styles.detailContent}>
                      <Text style={styles.detailLabel}>Tanggal & Waktu</Text>
                      <Text style={styles.detailValue}>
                        {new Date(selectedItem.created_at).toLocaleString(
                          "id-ID",
                          {
                            weekday: "long",
                            day: "2-digit",
                            month: "long",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.detailItem}>
                    <View style={styles.detailIconBox}>
                      <Ionicons name="location" size={20} color="#2563eb" />
                    </View>
                    <View style={styles.detailContent}>
                      <Text style={styles.detailLabel}>Lokasi</Text>
                      <Text style={styles.detailValue}>
                        {selectedItem.location || "Tidak tersedia"}
                      </Text>
                      {selectedItem.latitude && selectedItem.longitude && (
                        <Text style={styles.detailCoords}>
                          {selectedItem.latitude}, {selectedItem.longitude}
                        </Text>
                      )}
                    </View>
                  </View>

                  <View style={styles.detailItem}>
                    <View style={styles.detailIconBox}>
                      <Ionicons
                        name={
                          selectedItem.is_valid
                            ? "checkmark-circle"
                            : "close-circle"
                        }
                        size={20}
                        color={selectedItem.is_valid ? "#10b981" : "#ef4444"}
                      />
                    </View>
                    <View style={styles.detailContent}>
                      <Text style={styles.detailLabel}>Status</Text>
                      <Text
                        style={[
                          styles.detailValue,
                          {
                            color: selectedItem.is_valid
                              ? "#10b981"
                              : "#ef4444",
                          },
                        ]}
                      >
                        {selectedItem.is_valid
                          ? "Absensi Valid"
                          : "Absensi Tidak Valid"}
                      </Text>
                    </View>
                  </View>

                  {selectedItem.notes && (
                    <View style={styles.detailItem}>
                      <View style={styles.detailIconBox}>
                        <Ionicons
                          name="document-text"
                          size={20}
                          color="#2563eb"
                        />
                      </View>
                      <View style={styles.detailContent}>
                        <Text style={styles.detailLabel}>Catatan</Text>
                        <Text style={styles.detailValue}>
                          {selectedItem.notes}
                        </Text>
                      </View>
                    </View>
                  )}
                </View>

                {/* Map */}
                {selectedItem.latitude && selectedItem.longitude && (
                  <View style={styles.mapSection}>
                    <Text style={styles.mapTitle}>Lokasi Absensi</Text>
                    <View style={styles.mapContainer}>
                      <MapView
                        style={styles.map}
                        initialRegion={{
                          latitude: parseFloat(selectedItem.latitude),
                          longitude: parseFloat(selectedItem.longitude),
                          latitudeDelta: 0.005,
                          longitudeDelta: 0.005,
                        }}
                      >
                        <Marker
                          coordinate={{
                            latitude: parseFloat(selectedItem.latitude),
                            longitude: parseFloat(selectedItem.longitude),
                          }}
                          title={selectedItem.user_name}
                          description={
                            selectedItem.type === "checkin"
                              ? "Lokasi Check In"
                              : "Lokasi Check Out"
                          }
                        >
                          <View style={styles.markerContainer}>
                            <View
                              style={[
                                styles.markerInner,
                                {
                                  backgroundColor:
                                    selectedItem.type === "checkin"
                                      ? "#2563eb"
                                      : "#f59e0b",
                                },
                              ]}
                            >
                              <Ionicons
                                name="location"
                                size={20}
                                color="#fff"
                              />
                            </View>
                          </View>
                        </Marker>
                      </MapView>
                    </View>
                  </View>
                )}

                {/* Action Buttons */}
                <View style={styles.modalActions}>
                  <TouchableOpacity style={styles.actionBtn}>
                    <Ionicons name="share-outline" size={20} color="#2563eb" />
                    <Text style={styles.actionBtnText}>Bagikan</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionBtn}>
                    <Ionicons
                      name="download-outline"
                      size={20}
                      color="#2563eb"
                    />
                    <Text style={styles.actionBtnText}>Unduh</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
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
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f3f4f6",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#111827",
    marginLeft: 8,
  },
  filterContainer: {
    flexDirection: "row",
    padding: 16,
    gap: 8,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  filterBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: "#f3f4f6",
    gap: 6,
  },
  filterBtnActive: {
    backgroundColor: "#2563eb",
  },
  filterText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6b7280",
  },
  filterTextActive: {
    color: "#fff",
  },
  filterCount: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#e5e7eb",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  filterCountActive: {
    backgroundColor: "rgba(255, 255, 255, 0.3)",
  },
  filterCountText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#6b7280",
  },
  filterCountTextActive: {
    color: "#fff",
  },
  listContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  listContainerEmpty: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#9ca3af",
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 13,
    color: "#d1d5db",
    marginTop: 4,
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
    shadowRadius: 2,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 12,
    backgroundColor: "#f3f4f6",
  },
  info: {
    flex: 1,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  name: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#111827",
    flex: 1,
    marginRight: 8,
  },
  typeBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  typeText: {
    fontSize: 11,
    fontWeight: "600",
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  detailText: {
    fontSize: 13,
    color: "#6b7280",
    marginLeft: 6,
    flex: 1,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  statusText: {
    fontSize: 13,
    fontWeight: "600",
    marginLeft: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  modalHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  modalAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
    backgroundColor: "#f3f4f6",
  },
  modalName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 6,
  },
  modalTypeBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
    alignSelf: "flex-start",
  },
  modalTypeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  closeModalBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
  },
  detailContainer: {
    padding: 20,
  },
  detailItem: {
    flexDirection: "row",
    marginBottom: 20,
  },
  detailIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#eff6ff",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  detailContent: {
    flex: 1,
    justifyContent: "center",
  },
  detailLabel: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    color: "#111827",
    fontWeight: "500",
  },
  detailCoords: {
    fontSize: 11,
    color: "#9ca3af",
    marginTop: 2,
  },
  mapSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  mapTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 12,
  },
  mapContainer: {
    height: 200,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  map: {
    flex: 1,
  },
  markerContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  markerInner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#fff",
    elevation: 3,
  },
  modalActions: {
    flexDirection: "row",
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: "#eff6ff",
    gap: 8,
  },
  actionBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2563eb",
  },
});