import React, { useState, useEffect } from "react";
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
  ScrollView,
  Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import MapView, { Marker, Circle } from "react-native-maps";
import axios from "axios";
import Constants from "expo-constants";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system/legacy";

interface Employee {
  id: number;
  name: string;
  profile_photo_url?: string;
  checkin_time?: string;
  checkout_time?: string;
  checkin_distance?: number;
  checkout_distance?: number;
  is_valid: boolean;
  date: string;
  latitude?: number;
  longitude?: number;
  company_lat?: number;
  company_lon?: number;
}

export default function HRDetailScreen({ route, navigation }) {
  const [token, setToken] = useState<string>("");
  const [companyId, setCompanyId] = useState<number | null>(null);
  const [user, setUser] = useState<any>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPeriod, setFilterPeriod] = useState("today");
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [exportModalVisible, setExportModalVisible] = useState(false);

  const BASE_URL =
    Constants.expoConfig?.extra?.API_URL ||
    process.env.EXPO_PUBLIC_API_URL ||
    "http://192.168.1.7:5000";

  useEffect(() => {
    initializeData();
  }, []);

  useEffect(() => {
    if (token && companyId) {
      fetchEmployeeAttendance();
    }
  }, [filterPeriod, token, companyId]);

  useEffect(() => {
    filterData();
  }, [searchQuery, employees]);

  const initializeData = async () => {
    try {
      console.log("📍 Initializing HRDetailScreen...");
      
      let authToken = route?.params?.token;
      let userCompanyId = route?.params?.companyId;
      let userData = route?.params?.user;

      if (!authToken || !userCompanyId) {
        console.log("⚠️ Params incomplete, loading from AsyncStorage...");
        
        const storedToken = await AsyncStorage.getItem("token");
        const storedUser = await AsyncStorage.getItem("user");

        if (!storedToken || !storedUser) {
          throw new Error("No authentication data found");
        }

        authToken = storedToken;
        userData = JSON.parse(storedUser);
        userCompanyId = userData.company_id;

        console.log("✅ Loaded from AsyncStorage:", {
          hasToken: !!authToken,
          companyId: userCompanyId,
          userName: userData?.name
        });
      } else {
        console.log("✅ Using route params:", {
          hasToken: !!authToken,
          companyId: userCompanyId
        });
      }

      if (!authToken || !userCompanyId) {
        throw new Error("Authentication data incomplete");
      }

      setToken(authToken);
      setCompanyId(userCompanyId);
      setUser(userData);

    } catch (error) {
      console.error("❌ Initialize data error:", error);
      setLoading(false);
      
      Alert.alert(
        "Error",
        "Data autentikasi tidak lengkap. Silakan login kembali.",
        [
          {
            text: "OK",
            onPress: () => navigation.navigate("Login"),
          },
        ]
      );
    }
  };

  const fetchEmployeeAttendance = async () => {
    try {
      if (!token || !companyId) {
        console.error("❌ Cannot fetch: missing credentials");
        return;
      }

      setLoading(true);
      let endpoint = `${BASE_URL}/api/attendance/company/${companyId}`;

      if (filterPeriod === "today") {
        endpoint += "?period=today";
      } else if (filterPeriod === "week") {
        endpoint += "?period=week";
      } else if (filterPeriod === "month") {
        endpoint += "?period=month";
      }

      console.log("📡 Fetching attendance from:", endpoint);

      const response = await axios.get(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("✅ Response received:", response.data.length, "records");

      const transformedData = transformAttendanceData(response.data);
      setEmployees(transformedData);
      setFilteredEmployees(transformedData);
    } catch (err) {
      console.error("❌ Fetch error:", err.response?.data || err.message);
      Alert.alert("Error", "Gagal memuat data absensi karyawan");
    } finally {
      setLoading(false);
    }
  };

  const transformAttendanceData = (data: any[]) => {
    if (!Array.isArray(data) || data.length === 0) {
      return [];
    }

    const grouped = data.reduce((acc, item) => {
      const key = `${item.user_id}_${item.date}`;

      if (!acc[key]) {
        acc[key] = {
          id: item.user_id,
          name: item.user_name,
          profile_photo_url: item.profile_photo_url,
          date: item.date,
          checkin_time: null,
          checkout_time: null,
          checkin_distance: null,
          checkout_distance: null,
          is_valid: false,
          latitude: item.latitude,
          longitude: item.longitude,
          company_lat: item.company_lat,
          company_lon: item.company_lon,
        };
      }

      if (item.type === "checkin") {
        acc[key].checkin_time = item.created_at;
        acc[key].checkin_distance = item.distance;
      } else if (item.type === "checkout") {
        acc[key].checkout_time = item.created_at;
        acc[key].checkout_distance = item.distance;
      }

      acc[key].is_valid = item.is_valid || acc[key].is_valid;

      return acc;
    }, {});

    return Object.values(grouped);
  };

  const filterData = () => {
    let filtered = employees;

    if (searchQuery) {
      filtered = filtered.filter((emp) =>
        emp.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredEmployees(filtered);
  };

  const openDetail = (employee: Employee) => {
    setSelectedEmployee(employee);
    setModalVisible(true);
  };

  const formatTime = (dateString?: string) => {
    if (!dateString) return "-";
    try {
      return new Date(dateString).toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      return "-";
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString("id-ID", {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric",
      });
    } catch (error) {
      return dateString;
    }
  };

  // Share location via Google Maps
  const handleShareLocation = (employee: Employee) => {
    if (!employee.latitude || !employee.longitude) {
      Alert.alert("Error", "Lokasi tidak tersedia");
      return;
    }

    const googleMapsUrl = `https://www.google.com/maps?q=${employee.latitude},${employee.longitude}`;
    const message = `Lokasi Absensi ${employee.name}\n${formatDate(employee.date)}\n\n${googleMapsUrl}`;

    Alert.alert(
      "Bagikan Lokasi",
      "Pilih cara berbagi lokasi:",
      [
        {
          text: "Buka di Google Maps",
          onPress: () => {
            Linking.openURL(googleMapsUrl).catch(() => {
              Alert.alert("Error", "Tidak dapat membuka Google Maps");
            });
          },
        },
        {
          text: "Bagikan Link",
          onPress: async () => {
            try {
              if (await Sharing.isAvailableAsync()) {
                // Create a temporary text file with location info
                const fileUri = FileSystem.documentDirectory + `lokasi_${employee.name.replace(/\s/g, '_')}.txt`;
                await FileSystem.writeAsStringAsync(fileUri, message);
                await Sharing.shareAsync(fileUri, {
                  dialogTitle: "Bagikan Lokasi Absensi",
                });
              } else {
                Alert.alert("Info", message);
              }
            } catch (error) {
              console.error("Share error:", error);
              Alert.alert("Error", "Gagal membagikan lokasi");
            }
          },
        },
        {
          text: "Batal",
          style: "cancel",
        },
      ]
    );
  };

  const generatePrintHTML = () => {
    const rows = filteredEmployees
      .map(
        (emp, index) => `
        <tr>
          <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${index + 1}</td>
          <td style="border: 1px solid #ddd; padding: 8px;">${emp.name}</td>
          <td style="border: 1px solid #ddd; padding: 8px;">${formatDate(emp.date)}</td>
          <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${formatTime(emp.checkin_time)}</td>
          <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${formatTime(emp.checkout_time)}</td>
          <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${emp.checkin_distance || 0}m</td>
          <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">
            <span style="color: ${emp.is_valid ? "#10b981" : "#ef4444"}; font-weight: bold;">
              ${emp.is_valid ? "✓ Valid" : "✗ Tidak Valid"}
            </span>
          </td>
        </tr>
      `
      )
      .join("");

    const periodText =
      filterPeriod === "today"
        ? "Hari Ini"
        : filterPeriod === "week"
        ? "Minggu Ini"
        : "Bulan Ini";

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Laporan Absensi Karyawan</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { text-align: center; color: #2563eb; margin-bottom: 10px; }
            .period { text-align: center; color: #6b7280; margin-bottom: 20px; font-size: 14px; }
            .date-print { text-align: right; color: #9ca3af; font-size: 12px; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { background-color: #2563eb; color: white; padding: 12px; text-align: left; border: 1px solid #ddd; }
            td { border: 1px solid #ddd; padding: 8px; }
            tr:nth-child(even) { background-color: #f9fafb; }
            .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #9ca3af; }
          </style>
        </head>
        <body>
          <h1>📊 Laporan Absensi Karyawan</h1>
          <p class="period">Periode: ${periodText}</p>
          <p class="date-print">Dicetak pada: ${new Date().toLocaleString("id-ID")}</p>
          <table>
            <thead>
              <tr>
                <th style="width: 40px;">No</th>
                <th>Nama Karyawan</th>
                <th>Tanggal</th>
                <th style="width: 100px;">Check In</th>
                <th style="width: 100px;">Check Out</th>
                <th style="width: 80px;">Jarak</th>
                <th style="width: 100px;">Status</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
          <div class="footer">
            <p>Total Karyawan: ${filteredEmployees.length} | Sistem Absensi Digital</p>
          </div>
        </body>
      </html>
    `;
  };

  const handlePrintPDF = async () => {
    try {
      console.log("📄 Starting PDF generation...");
      
      const html = generatePrintHTML();
      const { uri } = await Print.printToFileAsync({ html });

      console.log("✅ PDF created at:", uri);

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: "application/pdf",
          dialogTitle: "Bagikan Laporan PDF",
          UTI: "com.adobe.pdf",
        });
        console.log("✅ PDF shared successfully");
      } else {
        Alert.alert("Sukses", "File PDF berhasil dibuat!");
      }
    } catch (error) {
      console.error("❌ Print PDF error:", error);
      Alert.alert("Error", "Gagal mencetak laporan PDF\n\n" + error.message);
    }
  };

  const handleExportExcel = async () => {
    try {
      console.log("📊 Starting Excel/CSV export...");
      console.log("📊 Total data to export:", filteredEmployees.length);

      if (filteredEmployees.length === 0) {
        Alert.alert("Peringatan", "Tidak ada data untuk diekspor");
        return;
      }

      const periodText =
        filterPeriod === "today"
          ? "Hari_Ini"
          : filterPeriod === "week"
          ? "Minggu_Ini"
          : "Bulan_Ini";

      // Generate CSV format (Excel compatible)
      let csvContent = "No,Nama Karyawan,Tanggal,Check In,Check Out,Jarak (meter),Status,Latitude,Longitude\n";
      
      filteredEmployees.forEach((emp, index) => {
        const row = [
          index + 1,
          `"${emp.name}"`,
          `"${formatDate(emp.date)}"`,
          `"${formatTime(emp.checkin_time)}"`,
          `"${formatTime(emp.checkout_time)}"`,
          emp.checkin_distance || 0,
          `"${emp.is_valid ? "Valid" : "Tidak Valid"}"`,
          emp.latitude || "-",
          emp.longitude || "-"
        ].join(",");
        
        csvContent += row + "\n";
      });

      console.log("✅ CSV content generated, length:", csvContent.length);

      // Add BOM for proper Excel UTF-8 encoding
      const BOM = "\uFEFF";
      csvContent = BOM + csvContent;

      // Save to file
      const timestamp = new Date().getTime();
      const fileName = `Laporan_Absensi_${periodText}_${timestamp}.csv`;
      const fileUri = FileSystem.documentDirectory + fileName;

      console.log("💾 Saving file to:", fileUri);

      await FileSystem.writeAsStringAsync(fileUri, csvContent, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      console.log("✅ File saved successfully");

      // Verify file exists
      const fileInfo = await FileSystem.getInfoAsync(fileUri);
      console.log("📁 File info:", fileInfo);

      if (!fileInfo.exists) {
        throw new Error("File tidak berhasil dibuat");
      }

      // Share file
      const isAvailable = await Sharing.isAvailableAsync();
      console.log("📤 Sharing available:", isAvailable);

      if (isAvailable) {
        await Sharing.shareAsync(fileUri, {
          mimeType: "text/csv",
          dialogTitle: "Bagikan Laporan Excel (CSV)",
          UTI: "public.comma-separated-values-text",
        });
        
        console.log("✅ File shared successfully");
        
        Alert.alert(
          "Sukses ✅", 
          `File CSV berhasil dibuat dan dibagikan!\n\nNama file: ${fileName}\n\nCatatan: File CSV dapat dibuka di Excel, Google Sheets, atau aplikasi spreadsheet lainnya.`
        );
      } else {
        Alert.alert("Sukses ✅", `File CSV berhasil dibuat!\n\nLokasi: ${fileUri}\n\nNama file: ${fileName}`);
      }

    } catch (error) {
      console.error("❌ Export Excel error:", error);
      console.error("❌ Error stack:", error.stack);
      
      Alert.alert(
        "Error ❌", 
        `Gagal export ke Excel/CSV\n\nDetail error:\n${error.message}\n\nSilakan coba lagi atau hubungi administrator.`
      );
    }
  };

  const showExportOptions = () => {
    setExportModalVisible(true);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Memuat data karyawan...</Text>
      </View>
    );
  }

  if (!token || !companyId) {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle" size={64} color="#ef4444" />
        <Text style={styles.errorText}>Data tidak lengkap</Text>
        <Text style={styles.errorSubtext}>
          Silakan login kembali untuk melanjutkan
        </Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => navigation.navigate("Login")}
        >
          <Text style={styles.retryText}>Kembali ke Login</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const renderEmployee = ({ item, index }: { item: Employee; index: number }) => (
    <TouchableOpacity 
      style={styles.card} 
      onPress={() => openDetail(item)}
    >
      <Image
        source={{
          uri:
            item.profile_photo_url ||
            "https://cdn-icons-png.flaticon.com/512/149/149071.png",
        }}
        style={styles.avatar}
      />
      <View style={styles.cardContent}>
        <View style={styles.nameRow}>
          <Text style={styles.name}>{item.name}</Text>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: item.is_valid ? "#dcfce7" : "#fee2e2" },
            ]}
          >
            <Ionicons
              name={item.is_valid ? "checkmark-circle" : "close-circle"}
              size={14}
              color={item.is_valid ? "#10b981" : "#ef4444"}
            />
            <Text
              style={[
                styles.statusText,
                { color: item.is_valid ? "#10b981" : "#ef4444" },
              ]}
            >
              {item.is_valid ? "Valid" : "Invalid"}
            </Text>
          </View>
        </View>

        <Text style={styles.dateText}>{formatDate(item.date)}</Text>

        <View style={styles.timeRow}>
          <View style={styles.timeItem}>
            <Ionicons name="log-in" size={16} color="#10b981" />
            <Text style={styles.timeLabel}>Check In:</Text>
            <Text style={[styles.timeValue, { color: "#10b981" }]}>
              {formatTime(item.checkin_time)}
            </Text>
          </View>

          <View style={styles.timeDivider} />

          <View style={styles.timeItem}>
            <Ionicons name="log-out" size={16} color="#ef4444" />
            <Text style={styles.timeLabel}>Check Out:</Text>
            <Text style={[styles.timeValue, { color: "#ef4444" }]}>
              {formatTime(item.checkout_time)}
            </Text>
          </View>
        </View>

        {item.checkin_distance !== null && item.checkin_distance !== undefined && (
          <View style={styles.distanceRow}>
            <Ionicons name="location" size={14} color="#6b7280" />
            <Text style={styles.distanceText}>
              Jarak dari kantor: {item.checkin_distance}m
            </Text>
          </View>
        )}
      </View>

      <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="people-outline" size={80} color="#d1d5db" />
      <Text style={styles.emptyText}>Tidak ada data absensi</Text>
      <Text style={styles.emptySubtext}>
        {searchQuery
          ? "Coba ubah kata kunci pencarian"
          : "Belum ada karyawan yang absen pada periode ini"}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Data Absensi HR</Text>
          <Text style={styles.headerSubtitle}>
            {filteredEmployees.length} karyawan
          </Text>
        </View>
        <TouchableOpacity 
          style={styles.printButton} 
          onPress={showExportOptions}
        >
          <Ionicons name="download" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchSection}>
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

      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[
            styles.filterBtn,
            filterPeriod === "today" && styles.filterBtnActive,
          ]}
          onPress={() => setFilterPeriod("today")}
        >
          <Ionicons
            name="today"
            size={18}
            color={filterPeriod === "today" ? "#fff" : "#6b7280"}
          />
          <Text
            style={[
              styles.filterText,
              filterPeriod === "today" && styles.filterTextActive,
            ]}
          >
            Hari Ini
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterBtn,
            filterPeriod === "week" && styles.filterBtnActive,
          ]}
          onPress={() => setFilterPeriod("week")}
        >
          <Ionicons
            name="calendar"
            size={18}
            color={filterPeriod === "week" ? "#fff" : "#6b7280"}
          />
          <Text
            style={[
              styles.filterText,
              filterPeriod === "week" && styles.filterTextActive,
            ]}
          >
            Minggu Ini
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterBtn,
            filterPeriod === "month" && styles.filterBtnActive,
          ]}
          onPress={() => setFilterPeriod("month")}
        >
          <Ionicons
            name="calendar-outline"
            size={18}
            color={filterPeriod === "month" ? "#fff" : "#6b7280"}
          />
          <Text
            style={[
              styles.filterText,
              filterPeriod === "month" && styles.filterTextActive,
            ]}
          >
            Bulan Ini
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredEmployees}
        keyExtractor={(item, index) => `${item.id}-${item.date}-${index}`}
        renderItem={renderEmployee}
        contentContainerStyle={
          filteredEmployees.length === 0
            ? styles.listContainerEmpty
            : styles.listContainer
        }
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmptyState}
      />

      {/* Export Options Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={exportModalVisible}
        onRequestClose={() => setExportModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.exportModalContent}>
            <Text style={styles.exportModalTitle}>Pilih Format Export</Text>
            
            <TouchableOpacity
              style={styles.exportOption}
              onPress={() => {
                setExportModalVisible(false);
                handlePrintPDF();
              }}
            >
              <Ionicons name="document-text" size={32} color="#ef4444" />
              <View style={styles.exportOptionText}>
                <Text style={styles.exportOptionTitle}>Export ke PDF</Text>
                <Text style={styles.exportOptionSubtitle}>
                  Cocok untuk laporan cetak
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color="#9ca3af" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.exportOption}
              onPress={() => {
                setExportModalVisible(false);
                handleExportExcel();
              }}
            >
              <Ionicons name="document" size={32} color="#10b981" />
              <View style={styles.exportOptionText}>
                <Text style={styles.exportOptionTitle}>Export ke Excel (CSV)</Text>
                <Text style={styles.exportOptionSubtitle}>
                  Format CSV untuk Excel & Google Sheets
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color="#9ca3af" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setExportModalVisible(false)}
            >
              <Text style={styles.cancelButtonText}>Batal</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Employee Detail Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedEmployee && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.modalHeader}>
                  <View style={styles.modalHeaderLeft}>
                    <Image
                      source={{
                        uri:
                          selectedEmployee.profile_photo_url ||
                          "https://cdn-icons-png.flaticon.com/512/149/149071.png",
                      }}
                      style={styles.modalAvatar}
                    />
                    <View>
                      <Text style={styles.modalName}>
                        {selectedEmployee.name}
                      </Text>
                      <Text style={styles.modalDate}>
                        {formatDate(selectedEmployee.date)}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.closeBtn}
                    onPress={() => setModalVisible(false)}
                  >
                    <Ionicons name="close" size={24} color="#6b7280" />
                  </TouchableOpacity>
                </View>

                <View style={styles.detailSection}>
                  <View style={styles.detailCard}>
                    <View style={styles.detailIconBox}>
                      <Ionicons name="log-in" size={24} color="#10b981" />
                    </View>
                    <View style={styles.detailInfo}>
                      <Text style={styles.detailLabel}>Check In</Text>
                      <Text style={[styles.detailValue, { color: "#10b981" }]}>
                        {formatTime(selectedEmployee.checkin_time)}
                      </Text>
                      {selectedEmployee.checkin_distance !== null && selectedEmployee.checkin_distance !== undefined && (
                        <Text style={styles.detailDistance}>
                          📍 {selectedEmployee.checkin_distance}m dari kantor
                        </Text>
                      )}
                    </View>
                  </View>

                  <View style={styles.detailCard}>
                    <View
                      style={[
                        styles.detailIconBox,
                        { backgroundColor: "#fee2e2" },
                      ]}
                    >
                      <Ionicons name="log-out" size={24} color="#ef4444" />
                    </View>
                    <View style={styles.detailInfo}>
                      <Text style={styles.detailLabel}>Check Out</Text>
                      <Text style={[styles.detailValue, { color: "#ef4444" }]}>
                        {formatTime(selectedEmployee.checkout_time)}
                      </Text>
                      {selectedEmployee.checkout_distance !== null && selectedEmployee.checkout_distance !== undefined && (
                        <Text style={styles.detailDistance}>
                          📍 {selectedEmployee.checkout_distance}m dari kantor
                        </Text>
                      )}
                    </View>
                  </View>

                  <View style={styles.detailCard}>
                    <View
                      style={[
                        styles.detailIconBox,
                        {
                          backgroundColor: selectedEmployee.is_valid
                            ? "#dcfce7"
                            : "#fee2e2",
                        },
                      ]}
                    >
                      <Ionicons
                        name={
                          selectedEmployee.is_valid
                            ? "checkmark-circle"
                            : "close-circle"
                        }
                        size={24}
                        color={
                          selectedEmployee.is_valid ? "#10b981" : "#ef4444"
                        }
                      />
                    </View>
                    <View style={styles.detailInfo}>
                      <Text style={styles.detailLabel}>Status Absensi</Text>
                      <Text
                        style={[
                          styles.detailValue,
                          {
                            color: selectedEmployee.is_valid
                              ? "#10b981"
                              : "#ef4444",
                          },
                        ]}
                      >
                        {selectedEmployee.is_valid
                          ? "✓ Absensi Valid"
                          : "✗ Absensi Tidak Valid"}
                      </Text>
                    </View>
                  </View>
                </View>

                {selectedEmployee.latitude && selectedEmployee.longitude && (
                  <View style={styles.mapSection}>
                    <Text style={styles.mapTitle}>📍 Lokasi Absensi</Text>
                    <View style={styles.mapContainer}>
                      <MapView
                        style={styles.map}
                        initialRegion={{
                          latitude: selectedEmployee.latitude,
                          longitude: selectedEmployee.longitude,
                          latitudeDelta: 0.01,
                          longitudeDelta: 0.01,
                        }}
                      >
                        <Marker
                          coordinate={{
                            latitude: selectedEmployee.latitude,
                            longitude: selectedEmployee.longitude,
                          }}
                          title={selectedEmployee.name}
                          description="Lokasi Karyawan"
                          pinColor="red"
                        />

                        {selectedEmployee.company_lat &&
                          selectedEmployee.company_lon && (
                            <>
                              <Marker
                                coordinate={{
                                  latitude: selectedEmployee.company_lat,
                                  longitude: selectedEmployee.company_lon,
                                }}
                                title="Kantor"
                                description="Lokasi Perusahaan"
                                pinColor="blue"
                              />
                              <Circle
                                center={{
                                  latitude: selectedEmployee.company_lat,
                                  longitude: selectedEmployee.company_lon,
                                }}
                                radius={100}
                                strokeColor="rgba(37, 99, 235, 0.5)"
                                fillColor="rgba(37, 99, 235, 0.1)"
                              />
                            </>
                          )}
                      </MapView>
                    </View>
                  </View>
                )}

                {/* Action Buttons */}
                <View style={styles.modalActions}>
                  <TouchableOpacity 
                    style={styles.actionBtn}
                    onPress={() => handleShareLocation(selectedEmployee)}
                  >
                    <Ionicons name="share-outline" size={20} color="#2563eb" />
                    <Text style={styles.actionBtnText}>Bagikan Lokasi</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.actionBtn}
                    onPress={() => {
                      const url = `https://www.google.com/maps?q=${selectedEmployee.latitude},${selectedEmployee.longitude}`;
                      Linking.openURL(url);
                    }}
                  >
                    <Ionicons name="map-outline" size={20} color="#2563eb" />
                    <Text style={styles.actionBtnText}>Buka Maps</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
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
    padding: 20,
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
  errorSubtext: {
    marginTop: 8,
    fontSize: 14,
    color: "#9ca3af",
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
    backgroundColor: "#2563eb",
    padding: 20,
    paddingTop: 50,
    flexDirection: "row",
    alignItems: "center",
    elevation: 4,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
  },
  headerSubtitle: {
    fontSize: 13,
    color: "#dbeafe",
    marginTop: 2,
  },
  printButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  searchSection: {
    backgroundColor: "#fff",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
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
    padding: 12,
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
    paddingHorizontal: 8,
    borderRadius: 10,
    backgroundColor: "#f3f4f6",
    gap: 6,
  },
  filterBtnActive: {
    backgroundColor: "#2563eb",
  },
  filterText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6b7280",
  },
  filterTextActive: {
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
    textAlign: "center",
    paddingHorizontal: 40,
  },
  card: {
    flexDirection: "row",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 12,
    backgroundColor: "#f3f4f6",
  },
  cardContent: {
    flex: 1,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  name: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#111827",
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "600",
  },
  dateText: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 8,
  },
  timeRow: {
    flexDirection: "row",
    backgroundColor: "#f9fafb",
    padding: 10,
    borderRadius: 10,
    marginBottom: 8,
  },
  timeItem: {
    flex: 1,
    alignItems: "center",
  },
  timeDivider: {
    width: 1,
    backgroundColor: "#e5e7eb",
    marginHorizontal: 8,
  },
  timeLabel: {
    fontSize: 10,
    color: "#9ca3af",
    marginTop: 4,
  },
  timeValue: {
    fontSize: 14,
    fontWeight: "bold",
    marginTop: 2,
  },
  distanceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  distanceText: {
    fontSize: 11,
    color: "#6b7280",
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
    marginBottom: 4,
  },
  modalDate: {
    fontSize: 13,
    color: "#6b7280",
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
  },
  detailSection: {
    padding: 20,
    gap: 12,
  },
  detailCard: {
    flexDirection: "row",
    backgroundColor: "#f9fafb",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  detailIconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#dcfce7",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  detailInfo: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: "bold",
  },
  detailDistance: {
    fontSize: 11,
    color: "#9ca3af",
    marginTop: 4,
  },
  mapSection: {
    padding: 20,
  },
  mapTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 12,
  },
  mapContainer: {
    height: 250,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  map: {
    flex: 1,
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
  exportModalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
  },
  exportModalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 20,
    textAlign: "center",
  },
  exportOption: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f9fafb",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  exportOptionText: {
    flex: 1,
    marginLeft: 16,
  },
  exportOptionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  exportOptionSubtitle: {
    fontSize: 13,
    color: "#6b7280",
    marginTop: 2,
  },
  cancelButton: {
    backgroundColor: "#f3f4f6",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6b7280",
  },
});