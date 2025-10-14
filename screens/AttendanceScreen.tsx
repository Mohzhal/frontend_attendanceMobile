import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Modal,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import MapView, { Marker, Polyline, Circle } from "react-native-maps";
import * as Location from "expo-location";
import { CameraView } from "expo-camera";
import axios from "axios";
import Constants from "expo-constants";

type AttendanceScreenProps = {
  route: {
    params: {
      token: string;
      user: {
        id: number;
        name: string;
        role: string;
        company_id: number;
        profile_photo_url?: string | null;
      };
    };
  };
};

interface CompanyData {
  name: string;
  latitude: number;
  longitude: number;
  valid_radius_m: number;
}

interface AttendanceRecord {
  id: number;
  type: string;
  created_at: string;
  distance_m?: number;
  is_valid?: boolean;
  latitude?: number;
  longitude?: number;
}

interface AttendanceResult {
  distance_m: number;
  is_valid: boolean;
  location: { latitude: number; longitude: number };
  company_location: { latitude: number; longitude: number };
}

export default function AttendanceScreen({ route }: AttendanceScreenProps) {
  const { token, user } = route.params;
  
  const [company, setCompany] = useState<CompanyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [capturedImage, setCapturedImage] = useState<{ uri: string } | null>(null);
  const [attendanceType, setAttendanceType] = useState<'checkin' | 'checkout' | null>(null);
  
  const [todayAttendance, setTodayAttendance] = useState<{
    checkin?: AttendanceRecord;
    checkout?: AttendanceRecord;
  }>({});

  const [attendanceResult, setAttendanceResult] = useState<AttendanceResult | null>(null);

  const cameraRef = useRef<CameraView | null>(null);
  const mapRef = useRef<MapView | null>(null);

  const BASE_URL =
    Constants.expoConfig?.extra?.API_URL ||
    process.env.EXPO_PUBLIC_API_URL ||
    "http://192.168.1.5:5000";

  // Fetch company data
  useEffect(() => {
    const fetchCompany = async () => {
      try {
        console.log('📡 Fetching company data for company_id:', user.company_id);
        const res = await axios.get(`${BASE_URL}/api/companies/${user.company_id}`);
        console.log('✅ Company data received:', res.data);
        
        // ✅ VALIDASI: Pastikan koordinat valid
        if (!res.data.latitude || !res.data.longitude || 
            res.data.latitude === 0 || res.data.longitude === 0) {
          console.error('❌ Invalid company coordinates:', res.data);
          Alert.alert(
            "Error Koordinat", 
            "Koordinat perusahaan tidak valid. Hubungi admin untuk memperbaiki data lokasi kantor."
          );
          setLoading(false);
          return;
        }
        
        setCompany(res.data);
        setLoading(false);
      } catch (err) {
        console.error('❌ Error fetching company:', err);
        Alert.alert("Gagal memuat data perusahaan");
        setLoading(false);
      }
    };
    fetchCompany();
  }, [user.company_id, BASE_URL]);

  // Check today's attendance
  useEffect(() => {
    const checkTodayAttendance = async () => {
      try {
        console.log('📡 Checking today attendance...');
        
        const res = await axios.get(`${BASE_URL}/api/attendance`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        console.log('✅ Attendance data received:', res.data);

        const today = new Date().toISOString().split('T')[0];
        
        const todayCheckin = res.data.find((record: AttendanceRecord) => {
          const recordDate = new Date(record.created_at).toISOString().split('T')[0];
          return recordDate === today && record.type === 'checkin';
        });

        const todayCheckout = res.data.find((record: AttendanceRecord) => {
          const recordDate = new Date(record.created_at).toISOString().split('T')[0];
          return recordDate === today && record.type === 'checkout';
        });

        console.log('📊 Today check-in:', todayCheckin);
        console.log('📊 Today check-out:', todayCheckout);

        setTodayAttendance({
          checkin: todayCheckin || undefined,
          checkout: todayCheckout || undefined,
        });
      } catch (err) {
        console.error('❌ Error checking attendance:', err);
        setTodayAttendance({});
      }
    };
    
    if (token) {
      checkTodayAttendance();
    }
  }, [token, user.id, BASE_URL]);

  const handleAttendanceClick = async () => {
    if (!todayAttendance.checkin) {
      setAttendanceType('checkin');
    } else if (!todayAttendance.checkout) {
      setAttendanceType('checkout');
    } else {
      Alert.alert("Info", "Anda sudah melakukan check-in dan check-out hari ini");
      return;
    }

    const { Camera } = await import("expo-camera");
    const { status } = await Camera.requestCameraPermissionsAsync();
    setHasPermission(status === "granted");
    
    if (status === "granted") {
      setShowCamera(true);
    } else {
      Alert.alert("Izin kamera dibutuhkan untuk foto absensi!");
    }
  };

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        console.log('📸 Taking picture...');
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          exif: true,
        });
        console.log('✅ Picture taken:', photo?.uri);
        setCapturedImage(photo);
        setShowCamera(false);
      } catch (err) {
        const error = err as Error;
        console.error('❌ Error taking picture:', error);
        Alert.alert("Gagal mengambil foto", error.message);
      }
    }
  };

  const handleSubmitAttendance = async () => {
    if (!capturedImage) {
      Alert.alert("Error", "Foto tidak ditemukan");
      return;
    }

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Izin lokasi dibutuhkan!");
        return;
      }

      console.log('📍 Getting current location...');
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      console.log('✅ Current location:', location.coords);

      const formData = new FormData();
      
      formData.append('photo', {
        uri: capturedImage.uri,
        type: 'image/jpeg',
        name: `absensi-${attendanceType}-${Date.now()}.jpg`,
      } as any);

      formData.append('type', attendanceType || '');
      formData.append('lat_backup', location.coords.latitude.toString());
      formData.append('lon_backup', location.coords.longitude.toString());

      console.log('📤 Submitting attendance...');
      console.log('Type:', attendanceType);
      console.log('Location:', location.coords.latitude, location.coords.longitude);

      const res = await axios.post(
        `${BASE_URL}/api/attendance`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      console.log('✅ Attendance response:', res.data);

      // ✅ VALIDASI: Pastikan response memiliki koordinat valid
      if (!res.data.location || !res.data.company_location ||
          res.data.location.latitude === 0 || res.data.location.longitude === 0 ||
          res.data.company_location.latitude === 0 || res.data.company_location.longitude === 0) {
        console.error('❌ Invalid coordinates in response:', res.data);
        Alert.alert(
          "Perhatian", 
          "Koordinat lokasi tidak valid. Data absensi tersimpan tetapi peta tidak dapat ditampilkan."
        );
      } else {
        setAttendanceResult(res.data);

        // Auto-zoom peta
        if (mapRef.current && res.data.location && res.data.company_location) {
          setTimeout(() => {
            mapRef.current?.fitToCoordinates(
              [
                { latitude: res.data.location.latitude, longitude: res.data.location.longitude },
                { latitude: res.data.company_location.latitude, longitude: res.data.company_location.longitude },
              ],
              {
                edgePadding: { top: 80, right: 80, bottom: 80, left: 80 },
                animated: true,
              }
            );
          }, 500);
        }
      }

      Alert.alert(
        res.data.is_valid ? "Absensi Berhasil ✅" : "Absensi Tercatat ⚠️", 
        res.data.msg
      );
      
      setCapturedImage(null);
      setAttendanceType(null);
      
      // Refresh attendance list
      console.log('🔄 Refreshing attendance list...');
      const listRes = await axios.get(
        `${BASE_URL}/api/attendance`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const today = new Date().toISOString().split('T')[0];
      
      const todayCheckin = listRes.data.find((record: AttendanceRecord) => {
        const recordDate = new Date(record.created_at).toISOString().split('T')[0];
        return recordDate === today && record.type === 'checkin';
      });

      const todayCheckout = listRes.data.find((record: AttendanceRecord) => {
        const recordDate = new Date(record.created_at).toISOString().split('T')[0];
        return recordDate === today && record.type === 'checkout';
      });

      setTodayAttendance({
        checkin: todayCheckin || undefined,
        checkout: todayCheckout || undefined,
      });
      
    } catch (err) {
      console.error("=== ATTENDANCE ERROR ===");
      console.error("Full error:", err);
      const error = err as any;
      
      if (error.response) {
        console.error('Error response data:', error.response.data);
        console.error('Error status:', error.response.status);
        Alert.alert(
          "Gagal Absensi", 
          error.response?.data?.msg || error.response?.data?.error || `Error ${error.response.status}`
        );
      } else if (error.request) {
        console.error('Error request:', error.request);
        Alert.alert("Gagal", "Tidak dapat terhubung ke server. Pastikan server berjalan di " + BASE_URL);
      } else {
        console.error('Error message:', error.message);
        Alert.alert("Gagal", error.message || "Terjadi kesalahan");
      }
      console.error("======================");
      
      setCapturedImage(null);
    }
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    setShowCamera(true);
  };

  const cancelAttendance = () => {
    setCapturedImage(null);
    setAttendanceType(null);
    setShowCamera(false);
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek };
  };

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentDate);

  const monthNames = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember",
  ];
  const dayNames = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

  const isToday = (day: number) => {
    const today = new Date();
    return (
      day === today.getDate() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear()
    );
  };

  const previousMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1)
    );
  };

  const nextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1)
    );
  };

  const getAttendanceButtonText = () => {
    if (!todayAttendance.checkin) {
      return "Check-in Sekarang";
    } else if (!todayAttendance.checkout) {
      return "Check-out Sekarang";
    } else {
      return "Sudah Absen Hari Ini";
    }
  };

  const isAttendanceComplete = () => {
    return !!(todayAttendance.checkin && todayAttendance.checkout);
  };

  if (loading || !company) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Memuat data...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#030712" />
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Kalender Absensi</Text>
        </View>

        {/* Calendar */}
        <View style={styles.calendarCard}>
          <View style={styles.calendarHeader}>
            <TouchableOpacity onPress={previousMonth} style={styles.navButton}>
              <Ionicons name="chevron-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.monthYear}>
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </Text>
            <TouchableOpacity onPress={nextMonth} style={styles.navButton}>
              <Ionicons name="chevron-forward" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          <View style={styles.dayNamesRow}>
            {dayNames.map((day) => (
              <View key={day} style={styles.dayNameCell}>
                <Text style={styles.dayName}>{day}</Text>
              </View>
            ))}
          </View>

          <View style={styles.daysGrid}>
            {[...Array(startingDayOfWeek)].map((_, i) => (
              <View key={`empty-${i}`} style={styles.dayCell} />
            ))}
            {[...Array(daysInMonth)].map((_, i) => {
              const day = i + 1;
              const today = isToday(day);
              return (
                <TouchableOpacity
                  key={day}
                  style={[styles.dayCell, today && styles.todayCell]}
                >
                  <Text style={[styles.dayText, today && styles.todayText]}>
                    {day}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Map Section */}
        {attendanceResult && (
          <View style={styles.mapCard}>
            <View style={styles.mapHeader}>
              <Ionicons name="map" size={20} color="#60a5fa" />
              <Text style={styles.mapHeaderText}>Lokasi Absensi Anda</Text>
            </View>
            
            {/* ✅ VALIDASI: Cek koordinat valid sebelum render map */}
            {attendanceResult.location.latitude !== 0 && 
             attendanceResult.location.longitude !== 0 &&
             attendanceResult.company_location.latitude !== 0 &&
             attendanceResult.company_location.longitude !== 0 ? (
              <MapView
                ref={mapRef}
                style={styles.map}
                initialRegion={{
                  latitude: (attendanceResult.location.latitude + attendanceResult.company_location.latitude) / 2,
                  longitude: (attendanceResult.location.longitude + attendanceResult.company_location.longitude) / 2,
                  latitudeDelta: Math.max(
                    Math.abs(attendanceResult.location.latitude - attendanceResult.company_location.latitude) * 3,
                    0.005
                  ),
                  longitudeDelta: Math.max(
                    Math.abs(attendanceResult.location.longitude - attendanceResult.company_location.longitude) * 3,
                    0.005
                  ),
                }}
              >
                {/* Circle Radius Kantor */}
                <Circle
                  center={{
                    latitude: attendanceResult.company_location.latitude,
                    longitude: attendanceResult.company_location.longitude,
                  }}
                  radius={company.valid_radius_m || 100}
                  strokeColor="rgba(37, 99, 235, 0.5)"
                  strokeWidth={2}
                  fillColor="rgba(37, 99, 235, 0.1)"
                />

                {/* Marker Perusahaan */}
                <Marker
                  coordinate={{
                    latitude: attendanceResult.company_location.latitude,
                    longitude: attendanceResult.company_location.longitude,
                  }}
                  title="Lokasi Perusahaan"
                  description={company.name}
                >
                  <View style={styles.companyMarker}>
                    <Ionicons name="business" size={28} color="#fff" />
                  </View>
                </Marker>

                {/* Marker Karyawan */}
                <Marker
                  coordinate={{
                    latitude: attendanceResult.location.latitude,
                    longitude: attendanceResult.location.longitude,
                  }}
                  title="Lokasi Anda"
                  description={`Jarak: ${attendanceResult.distance_m}m dari kantor`}
                >
                  <View style={styles.userMarker}>
                    <Ionicons name="person" size={28} color="#fff" />
                  </View>
                </Marker>

                {/* Garis Penghubung */}
                <Polyline
                  coordinates={[
                    {
                      latitude: attendanceResult.company_location.latitude,
                      longitude: attendanceResult.company_location.longitude,
                    },
                    {
                      latitude: attendanceResult.location.latitude,
                      longitude: attendanceResult.location.longitude,
                    },
                  ]}
                  strokeColor={attendanceResult.is_valid ? "#22c55e" : "#ef4444"}
                  strokeWidth={3}
                  lineDashPattern={[10, 5]}
                />
              </MapView>
            ) : (
              <View style={styles.mapErrorContainer}>
                <Ionicons name="alert-circle" size={48} color="#ef4444" />
                <Text style={styles.mapErrorText}>
                  Koordinat tidak valid. Periksa data lokasi perusahaan.
                </Text>
                <Text style={styles.mapDebugText}>
                  Perusahaan: ({attendanceResult.company_location.latitude.toFixed(6)}, {attendanceResult.company_location.longitude.toFixed(6)})
                </Text>
                <Text style={styles.mapDebugText}>
                  Anda: ({attendanceResult.location.latitude.toFixed(6)}, {attendanceResult.location.longitude.toFixed(6)})
                </Text>
              </View>
            )}
            
            {/* Distance Info */}
            <View style={[
              styles.distanceCard,
              attendanceResult.is_valid ? styles.distanceCardValid : styles.distanceCardInvalid
            ]}>
              <Ionicons 
                name={attendanceResult.is_valid ? "checkmark-circle" : "alert-circle"} 
                size={24} 
                color={attendanceResult.is_valid ? "#22c55e" : "#ef4444"} 
              />
              <View style={styles.distanceInfo}>
                <Text style={styles.distanceLabel}>Jarak dari Kantor</Text>
                <Text style={styles.distanceValue}>{attendanceResult.distance_m} meter</Text>
                <Text style={[
                  styles.distanceStatus,
                  attendanceResult.is_valid ? styles.distanceStatusValid : styles.distanceStatusInvalid
                ]}>
                  {attendanceResult.is_valid ? "✓ Dalam Jangkauan" : "⚠ Terlalu Jauh"}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Location Info */}
        <View style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <Ionicons name="location" size={24} color="#60a5fa" />
            <Text style={styles.infoTitle}>Informasi Absensi</Text>
          </View>
          <Text style={styles.infoCompany}>
            Perusahaan: {company.name}
          </Text>
          
          {/* Status Absensi */}
          {(todayAttendance.checkin || todayAttendance.checkout) && (
            <View style={styles.attendanceStatus}>
              <Text style={styles.statusTitle}>Status Hari Ini:</Text>
              {todayAttendance.checkin && (
                <View style={styles.statusRow}>
                  <Ionicons name="log-in" size={16} color="#22c55e" />
                  <Text style={styles.statusText}>
                    Check-in: {new Date(todayAttendance.checkin.created_at).toLocaleTimeString('id-ID')}
                  </Text>
                  {todayAttendance.checkin.distance_m !== undefined && (
                    <Text style={styles.statusDistance}>
                      ({todayAttendance.checkin.distance_m}m)
                    </Text>
                  )}
                </View>
              )}
              {todayAttendance.checkout ? (
                <View style={styles.statusRow}>
                  <Ionicons name="log-out" size={16} color="#ef4444" />
                  <Text style={styles.statusText}>
                    Check-out: {new Date(todayAttendance.checkout.created_at).toLocaleTimeString('id-ID')}
                  </Text>
                  {todayAttendance.checkout.distance_m !== undefined && (
                    <Text style={styles.statusDistance}>
                      ({todayAttendance.checkout.distance_m}m)
                    </Text>
                  )}
                </View>
              ) : todayAttendance.checkin ? (
                <View style={styles.statusRow}>
                  <Ionicons name="log-out-outline" size={16} color="#9ca3af" />
                  <Text style={[styles.statusText, styles.statusPending]}>
                    Check-out: Belum check-out
                  </Text>
                </View>
              ) : null}
            </View>
          )}
          
          <Text style={styles.infoDescription}>
            📸 Ambil foto untuk melakukan absensi. Pastikan GPS aktif agar lokasi terekam dengan akurat.
          </Text>
          
          <TouchableOpacity 
            style={[
              styles.attendButton,
              isAttendanceComplete() && styles.attendButtonDisabled
            ]} 
            onPress={handleAttendanceClick}
            disabled={isAttendanceComplete()}
          >
            <Ionicons 
              name={!todayAttendance.checkin ? "camera" : !todayAttendance.checkout ? "camera" : "checkmark-circle"} 
              size={20} 
              color="#fff" 
            />
            <Text style={styles.attendButtonText}>
              {getAttendanceButtonText()}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Camera Modal */}
      <Modal visible={showCamera} animationType="slide">
        <View style={styles.cameraContainer}>
          <CameraView 
            style={StyleSheet.absoluteFillObject}
            facing="front"
            ref={cameraRef}
          />
          
          <View style={styles.cameraHeader}>
            <View style={styles.cameraHeaderContent}>
              <Ionicons name="camera" size={24} color="#fff" />
              <Text style={styles.cameraTitle}>
                {attendanceType === 'checkin' ? 'Check-in' : 'Check-out'} - Ambil Foto
              </Text>
            </View>
            <TouchableOpacity onPress={cancelAttendance} style={styles.closeButton}>
              <Ionicons name="close" size={32} color="#fff" />
            </TouchableOpacity>
          </View>

          <View style={styles.cameraInfo}>
            <Text style={styles.cameraInfoText}>
              📍 Pastikan GPS aktif untuk merekam lokasi Anda
            </Text>
          </View>

          <View style={styles.cameraControls}>
            <TouchableOpacity style={styles.captureButton} onPress={takePicture}>
              <View style={styles.captureButtonInner} />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Preview Modal */}
      <Modal visible={!!capturedImage} animationType="slide">
        <View style={styles.previewContainer}>
          <View style={styles.previewHeader}>
            <Text style={styles.previewTitle}>Preview Foto Absensi</Text>
            <TouchableOpacity onPress={cancelAttendance}>
              <Ionicons name="close" size={28} color="#fff" />
            </TouchableOpacity>
          </View>
          
          {capturedImage && (
            <Image 
              source={{ uri: capturedImage.uri }} 
              style={styles.previewImage}
            />
          )}
          
          <View style={styles.previewInfo}>
            <Ionicons name="information-circle" size={20} color="#60a5fa" />
            <Text style={styles.previewInfoText}>
              Foto akan dikirim bersama data lokasi GPS Anda
            </Text>
          </View>
          
          <View style={styles.previewActions}>
            <TouchableOpacity style={styles.retakeButton} onPress={retakePhoto}>
              <Ionicons name="camera-reverse" size={24} color="#fff" />
              <Text style={styles.retakeButtonText}>Ambil Ulang</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.submitButton} onPress={handleSubmitAttendance}>
              <Ionicons name="checkmark" size={24} color="#fff" />
              <Text style={styles.submitButtonText}>
                Kirim {attendanceType === 'checkin' ? 'Check-in' : 'Check-out'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#030712",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#030712",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#9ca3af",
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 24,
    paddingBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
  },
  calendarCard: {
    backgroundColor: "#111827",
    borderRadius: 24,
    padding: 24,
    marginHorizontal: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#1f2937",
  },
  calendarHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  navButton: {
    padding: 8,
    backgroundColor: "#1f2937",
    borderRadius: 12,
  },
  monthYear: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
  },
  dayNamesRow: {
    flexDirection: "row",
    marginBottom: 8,
  },
  dayNameCell: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
  },
  dayName: {
    fontSize: 12,
    fontWeight: "600",
    color: "#9ca3af",
  },
  daysGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  dayCell: {
    width: "14.28%",
    aspectRatio: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 4,
  },
  todayCell: {
    backgroundColor: "#2563eb",
    borderRadius: 12,
  },
  dayText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#d1d5db",
  },
  todayText: {
    color: "#fff",
  },
  mapCard: {
    marginHorizontal: 24,
    marginBottom: 24,
    borderRadius: 24,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#1f2937",
    backgroundColor: "#111827",
  },
  mapHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#1f2937",
    gap: 8,
  },
  mapHeaderText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  map: {
    height: 350,
  },
  mapErrorContainer: {
    height: 350,
    backgroundColor: "#1f2937",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  mapErrorText: {
    fontSize: 14,
    color: "#d1d5db",
    textAlign: "center",
    marginTop: 16,
    lineHeight: 20,
  },
  mapDebugText: {
    fontSize: 11,
    color: "#9ca3af",
    marginTop: 4,
    fontFamily: "monospace",
  },
  companyMarker: {
    width: 50,
    height: 50,
    backgroundColor: "#2563eb",
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 4,
    borderColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 5,
    elevation: 8,
  },
  userMarker: {
    width: 50,
    height: 50,
    backgroundColor: "#ef4444",
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 4,
    borderColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 5,
    elevation: 8,
  },
  distanceCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: "#1f2937",
  },
  distanceCardValid: {
    backgroundColor: "rgba(34, 197, 94, 0.1)",
  },
  distanceCardInvalid: {
    backgroundColor: "rgba(239, 68, 68, 0.1)",
  },
  distanceInfo: {
    flex: 1,
  },
  distanceLabel: {
    fontSize: 12,
    color: "#9ca3af",
    marginBottom: 4,
  },
  distanceValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 4,
  },
  distanceStatus: {
    fontSize: 14,
    fontWeight: "600",
  },
  distanceStatusValid: {
    color: "#22c55e",
  },
  distanceStatusInvalid: {
    color: "#ef4444",
  },
  infoCard: {
    backgroundColor: "#111827",
    borderRadius: 24,
    padding: 24,
    marginHorizontal: 24,
    borderWidth: 1,
    borderColor: "#1f2937",
  },
  infoHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    marginLeft: 12,
  },
  infoCompany: {
    fontSize: 14,
    color: "#d1d5db",
    marginBottom: 16,
  },
  attendanceStatus: {
    backgroundColor: "#1f2937",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  statusTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 12,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 8,
  },
  statusText: {
    fontSize: 13,
    color: "#d1d5db",
    flex: 1,
  },
  statusPending: {
    color: "#9ca3af",
  },
  statusDistance: {
    fontSize: 12,
    color: "#60a5fa",
  },
  infoDescription: {
    fontSize: 13,
    color: "#9ca3af",
    marginBottom: 20,
    lineHeight: 20,
  },
  attendButton: {
    flexDirection: "row",
    backgroundColor: "#2563eb",
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  attendButtonDisabled: {
    backgroundColor: "#374151",
  },
  attendButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  cameraContainer: {
    flex: 1,
    backgroundColor: "#000",
  },
  cameraHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    paddingTop: 50,
    backgroundColor: "rgba(0,0,0,0.7)",
  },
  cameraHeaderContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  cameraTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
  },
  closeButton: {
    padding: 8,
  },
  cameraInfo: {
    position: "absolute",
    top: 120,
    left: 20,
    right: 20,
    backgroundColor: "rgba(37, 99, 235, 0.9)",
    padding: 16,
    borderRadius: 12,
  },
  cameraInfoText: {
    fontSize: 14,
    color: "#fff",
    textAlign: "center",
  },
  cameraControls: {
    position: "absolute",
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255,255,255,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  captureButtonInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#fff",
  },
  previewContainer: {
    flex: 1,
    backgroundColor: "#030712",
  },
  previewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    paddingTop: 50,
    backgroundColor: "#111827",
  },
  previewTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
  },
  previewImage: {
    flex: 1,
    resizeMode: "contain",
  },
  previewInfo: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#1f2937",
    gap: 8,
  },
  previewInfoText: {
    fontSize: 13,
    color: "#d1d5db",
    flex: 1,
  },
  previewActions: {
    flexDirection: "row",
    padding: 20,
    gap: 12,
    backgroundColor: "#111827",
  },
  retakeButton: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#374151",
    borderRadius: 16,
    paddingVertical: 16,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  retakeButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  submitButton: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#2563eb",
    borderRadius: 16,
    paddingVertical: 16,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
});