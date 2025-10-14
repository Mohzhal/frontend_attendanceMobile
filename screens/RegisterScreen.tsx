import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  Image,
  ActivityIndicator,
  StyleSheet,
  Platform,
} from "react-native";
import axios from "axios";
import RNPickerSelect from "react-native-picker-select";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import MapView, { Marker } from "react-native-maps";
import Constants from "expo-constants";

export default function RegisterScreen({ navigation }) {
  // 🧠 State Management
  const [name, setName] = useState("");
  const [birth_place, setBirthPlace] = useState("");
  const [birth_date, setBirthDate] = useState("");
  const [nik, setNik] = useState("");
  const [gender, setGender] = useState("");
  const [password, setPassword] = useState("");
  const [company_id, setCompanyId] = useState(null);
  const [company_name, setCompanyName] = useState("");
  const [address, setAddress] = useState("");
  const [lat, setLat] = useState<number | null>(null);
  const [lon, setLon] = useState<number | null>(null);
  const [role, setRole] = useState("karyawan");
  const [companies, setCompanies] = useState([]);
  const [photo, setPhoto] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  // 🌐 Base URL Configuration
  const BASE_URL =
    Constants.expoConfig?.extra?.API_URL ||
    process.env.EXPO_PUBLIC_API_URL ||
    "http://192.168.1.5:5000";

  // 🔄 Fetch Companies on Mount
  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/api/companies`);
      setCompanies(response.data);
      console.log("✅ Companies loaded:", response.data.length);
    } catch (error) {
      console.error("❌ Error fetching companies:", error);
      Alert.alert("Error", "Gagal memuat daftar perusahaan");
    }
  };

  // 📸 Pick Profile Photo
  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== "granted") {
        return Alert.alert(
          "Izin Diperlukan",
          "Aplikasi membutuhkan izin akses galeri untuk memilih foto"
        );
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setPhoto(result.assets[0].uri);
        console.log("✅ Photo selected:", result.assets[0].uri);
      }
    } catch (error) {
      console.error("❌ Error picking image:", error);
      Alert.alert("Error", "Gagal memilih foto");
    }
  };

  // 📤 Upload Photo to Server
  const uploadPhoto = async () => {
    if (!photo) {
      console.log("ℹ️ No photo to upload");
      return null;
    }

    try {
      const formData = new FormData();
      const filename = photo.split("/").pop() || "profile.jpg";
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : "image/jpeg";

      // @ts-ignore - FormData accepts this format
      formData.append("image", {
        uri: Platform.OS === "ios" ? photo.replace("file://", "") : photo,
        name: filename,
        type: type,
      });

      console.log("📤 Uploading photo...");
      const response = await axios.post(`${BASE_URL}/api/uploads/image`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      console.log("✅ Photo uploaded:", response.data.url);
      return response.data.url;
    } catch (error) {
      console.error("❌ Photo upload failed:", error);
      Alert.alert("Upload Gagal", "Gagal mengunggah foto profil. Lanjutkan tanpa foto?");
      return null;
    }
  };

  // 📍 Get Current Location for Company
  const getCurrentLocation = async () => {
    try {
      setIsGettingLocation(true);

      // Request permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== "granted") {
        Alert.alert(
          "Izin Lokasi Ditolak",
          "Aplikasi membutuhkan izin lokasi untuk mendapatkan koordinat perusahaan. Aktifkan di pengaturan."
        );
        setIsGettingLocation(false);
        return;
      }

      console.log("📍 Getting current location...");

      // Get location with high accuracy
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        maximumAge: 10000,
        timeout: 15000,
      });

      const latitude = location.coords.latitude;
      const longitude = location.coords.longitude;

      // Update state
      setLat(latitude);
      setLon(longitude);

      console.log("✅ Location obtained:", {
        latitude: latitude.toFixed(6),
        longitude: longitude.toFixed(6),
      });

      // Show success alert
      Alert.alert(
        "Lokasi Ditemukan ✅",
        `Koordinat Perusahaan:\nLatitude: ${latitude.toFixed(6)}\nLongitude: ${longitude.toFixed(6)}`,
        [{ text: "OK" }]
      );

      setIsGettingLocation(false);
    } catch (error) {
      console.error("❌ Error getting location:", error);
      Alert.alert(
        "Error",
        "Gagal mendapatkan lokasi. Pastikan GPS aktif dan coba lagi."
      );
      setIsGettingLocation(false);
    }
  };

  // 🧾 Handle Registration Submission
  const handleRegister = async () => {
    console.log("🚀 Starting registration process...");
    console.log("📋 Role:", role);

    // Basic validation
    if (!name || !nik || !password) {
      return Alert.alert("Data Belum Lengkap", "Nama, NIK, dan Password wajib diisi!");
    }

    // Karyawan validation
    if (role === "karyawan") {
      if (!company_id || !birth_place || !birth_date || !gender) {
        return Alert.alert(
          "Data Belum Lengkap",
          "Untuk karyawan, wajib mengisi: Tempat Lahir, Tanggal Lahir, Gender, dan Perusahaan"
        );
      }
    }

    // HR validation
    if (role === "hr") {
      if (!company_name) {
        return Alert.alert("Data Belum Lengkap", "Nama Perusahaan wajib diisi!");
      }

      if (lat === null || lon === null) {
        return Alert.alert(
          "Lokasi Belum Diambil",
          "Klik tombol 'Ambil Lokasi Perusahaan' terlebih dahulu untuk mendapatkan koordinat"
        );
      }
    }

    setIsLoading(true);

    try {
      // Upload photo first (if exists)
      let uploadedUrl = null;
      if (photo) {
        uploadedUrl = await uploadPhoto();
      }

      // Build payload based on role
      const payload: any = {
        name,
        nik,
        password,
        role,
        profile_photo_url: uploadedUrl,
      };

      // Add karyawan specific fields
      if (role === "karyawan") {
        payload.birth_place = birth_place;
        payload.birth_date = birth_date;
        payload.gender = gender;
        payload.company_id = company_id;
      }

      // Add HR specific fields
      if (role === "hr") {
        payload.company_name = company_name;
        payload.address = address || "";
        payload.lon = lon;
        payload.lat = lat;
        payload.valid_radius_m = 100;
      }

      console.log("📤 Sending registration payload:", {
        ...payload,
        password: "***hidden***", // Don't log password
      });

      // Send registration request
      const response = await axios.post(`${BASE_URL}/api/auth/register`, payload);

      console.log("✅ Registration successful:", response.data);

      setIsLoading(false);

      // Show success message
      Alert.alert(
        "Registrasi Berhasil 🎉",
        role === "hr"
          ? `Akun HR dan perusahaan "${company_name}" berhasil dibuat!`
          : "Akun karyawan berhasil dibuat! Tunggu verifikasi dari HR.",
        [
          {
            text: "OK",
            onPress: () => navigation.navigate("Login"),
          },
        ]
      );
    } catch (error: any) {
      console.error("❌ Registration error:", error.response?.data || error.message);
      setIsLoading(false);

      const errorMessage =
        error.response?.data?.msg ||
        error.message ||
        "Terjadi kesalahan pada server. Coba lagi.";

      Alert.alert("Gagal Registrasi", errorMessage);
    }
  };

  // 🧩 Render Form Based on Role
  const renderForm = () => {
    if (role === "hr") {
      return (
        <View>
          {/* Nama Lengkap */}
          <TextInput
            placeholder="Nama Lengkap *"
            value={name}
            onChangeText={setName}
            style={styles.input}
            autoCapitalize="words"
          />

          {/* NIK */}
          <TextInput
            placeholder="NIK *"
            value={nik}
            onChangeText={setNik}
            keyboardType="numeric"
            style={styles.input}
            maxLength={16}
          />

          {/* Nama Perusahaan */}
          <TextInput
            placeholder="Nama Perusahaan *"
            value={company_name}
            onChangeText={setCompanyName}
            style={styles.input}
          />

          {/* Alamat Perusahaan */}
          <TextInput
            placeholder="Alamat Perusahaan (Opsional)"
            value={address}
            onChangeText={setAddress}
            style={[styles.input, styles.textArea]}
            multiline
            numberOfLines={3}
          />

          {/* Upload Photo Button */}
          <TouchableOpacity style={styles.photoPickButton} onPress={pickImage}>
            <Text style={styles.photoPickButtonText}>
              {photo ? "📷 Ganti Foto Profil" : "📷 Upload Foto Profil (Opsional)"}
            </Text>
          </TouchableOpacity>

          {/* Show selected photo */}
          {photo && (
            <View style={styles.photoPreviewContainer}>
              <Image source={{ uri: photo }} style={styles.photoPreview} />
            </View>
          )}

          {/* Get Location Button */}
          <TouchableOpacity
            style={[
              styles.locationButton,
              isGettingLocation && styles.locationButtonDisabled,
            ]}
            onPress={getCurrentLocation}
            disabled={isGettingLocation}
          >
            {isGettingLocation ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.locationButtonText}>
                📍 {lat !== null && lon !== null ? "Update Lokasi" : "Ambil Lokasi Perusahaan"}
              </Text>
            )}
          </TouchableOpacity>

          {/* Display Coordinates */}
          {lat !== null && lon !== null && (
            <View style={styles.coordsContainer}>
              <Text style={styles.coordsLabel}>Koordinat Perusahaan:</Text>
              <Text style={styles.coordsText}>Latitude: {lat.toFixed(6)}</Text>
              <Text style={styles.coordsText}>Longitude: {lon.toFixed(6)}</Text>
            </View>
          )}

          {/* Map Preview */}
          {lat !== null && lon !== null && (
            <MapView
              style={styles.map}
              initialRegion={{
                latitude: lat,
                longitude: lon,
                latitudeDelta: 0.005,
                longitudeDelta: 0.005,
              }}
            >
              <Marker
                coordinate={{ latitude: lat, longitude: lon }}
                title={company_name || "Lokasi Perusahaan"}
                description="Lokasi kantor"
              />
            </MapView>
          )}

          {/* Password */}
          <TextInput
            placeholder="Password *"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            style={styles.input}
          />
        </View>
      );
    }

    // 🧍 Karyawan Form
    return (
      <View>
        {/* Nama Lengkap */}
        <TextInput
          placeholder="Nama Lengkap *"
          value={name}
          onChangeText={setName}
          style={styles.input}
          autoCapitalize="words"
        />

        {/* Tempat Lahir */}
        <TextInput
          placeholder="Tempat Lahir *"
          value={birth_place}
          onChangeText={setBirthPlace}
          style={styles.input}
        />

        {/* Tanggal Lahir */}
        <TextInput
          placeholder="Tanggal Lahir (YYYY-MM-DD) *"
          value={birth_date}
          onChangeText={setBirthDate}
          style={styles.input}
          keyboardType="numeric"
        />

        {/* NIK */}
        <TextInput
          placeholder="NIK (16 Digit) *"
          value={nik}
          onChangeText={setNik}
          keyboardType="numeric"
          style={styles.input}
          maxLength={16}
        />

        {/* Gender Picker */}
        <View style={styles.pickerContainer}>
          <Text style={styles.pickerLabel}>Jenis Kelamin *</Text>
          <RNPickerSelect
            onValueChange={setGender}
            placeholder={{ label: "Pilih jenis kelamin...", value: "" }}
            items={[
              { label: "Laki-laki", value: "L" },
              { label: "Perempuan", value: "P" },
            ]}
            style={pickerSelectStyles}
            value={gender}
          />
        </View>

        {/* Company Picker */}
        <View style={styles.pickerContainer}>
          <Text style={styles.pickerLabel}>Pilih Perusahaan *</Text>
          <RNPickerSelect
            onValueChange={setCompanyId}
            placeholder={{ label: "Pilih perusahaan...", value: null }}
            items={companies.map((c: any) => ({
              label: c.name,
              value: c.id,
            }))}
            style={pickerSelectStyles}
            value={company_id}
          />
        </View>

        {/* Upload Photo Button */}
        <TouchableOpacity style={styles.photoPickButton} onPress={pickImage}>
          <Text style={styles.photoPickButtonText}>
            {photo ? "📷 Ganti Foto Profil" : "📷 Upload Foto Profil (Opsional)"}
          </Text>
        </TouchableOpacity>

        {/* Show selected photo */}
        {photo && (
          <View style={styles.photoPreviewContainer}>
            <Image source={{ uri: photo }} style={styles.photoPreview} />
          </View>
        )}

        {/* Password */}
        <TextInput
          placeholder="Password *"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          style={styles.input}
        />
      </View>
    );
  };

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      {/* Title */}
      <Text style={styles.title}>Registrasi Akun</Text>
      <Text style={styles.subtitle}>Silakan lengkapi data di bawah ini</Text>

      {/* Role Toggle */}
      <View style={styles.roleToggle}>
        <TouchableOpacity
          style={[styles.roleButton, role === "karyawan" && styles.roleButtonActive]}
          onPress={() => {
            setRole("karyawan");
            // Reset HR fields
            setCompanyName("");
            setAddress("");
            setLat(null);
            setLon(null);
          }}
        >
          <Text style={[styles.roleText, role === "karyawan" && styles.roleTextActive]}>
            👤 Karyawan
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.roleButton, role === "hr" && styles.roleButtonActive]}
          onPress={() => {
            setRole("hr");
            // Reset karyawan fields
            setBirthPlace("");
            setBirthDate("");
            setGender("");
            setCompanyId(null);
          }}
        >
          <Text style={[styles.roleText, role === "hr" && styles.roleTextActive]}>
            💼 HR / Admin
          </Text>
        </TouchableOpacity>
      </View>

      {/* Form Container */}
      <View style={styles.formContainer}>
        {renderForm()}

        {/* Register Button */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4A90E2" />
            <Text style={styles.loadingText}>Mendaftar...</Text>
          </View>
        ) : (
          <TouchableOpacity style={styles.registerButton} onPress={handleRegister}>
            <Text style={styles.registerButtonText}>✨ Daftar Sekarang</Text>
          </TouchableOpacity>
        )}

        {/* Login Link */}
        <TouchableOpacity
          onPress={() => navigation.navigate("Login")}
          style={styles.loginLink}
        >
          <Text style={styles.loginLinkText}>
            Sudah punya akun? <Text style={styles.loginLinkBold}>Login</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

// 🎨 Styles
const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#F5F7FA",
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 8,
    color: "#2C3E50",
  },
  subtitle: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 20,
    color: "#7F8C8D",
  },
  roleToggle: {
    flexDirection: "row",
    marginBottom: 20,
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: "#E9ECEF",
  },
  roleButton: {
    flex: 1,
    padding: 14,
    alignItems: "center",
  },
  roleButtonActive: {
    backgroundColor: "#4A90E2",
  },
  roleText: {
    color: "#555",
    fontWeight: "600",
    fontSize: 15,
  },
  roleTextActive: {
    color: "#fff",
  },
  formContainer: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    backgroundColor: "#f9f9f9",
    fontSize: 15,
    color: "#333",
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
  },
  pickerContainer: {
    marginBottom: 12,
  },
  pickerLabel: {
    marginBottom: 6,
    color: "#333",
    fontWeight: "600",
    fontSize: 14,
  },
  photoPickButton: {
    borderWidth: 1.5,
    borderColor: "#4A90E2",
    borderStyle: "dashed",
    borderRadius: 10,
    padding: 14,
    alignItems: "center",
    marginBottom: 12,
    backgroundColor: "#F0F8FF",
  },
  photoPickButtonText: {
    color: "#4A90E2",
    fontWeight: "600",
    fontSize: 14,
  },
  photoPreviewContainer: {
    alignItems: "center",
    marginBottom: 12,
  },
  photoPreview: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: "#4A90E2",
  },
  locationButton: {
    backgroundColor: "#28A745",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "center",
  },
  locationButtonDisabled: {
    backgroundColor: "#95D5AC",
  },
  locationButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 15,
  },
  coordsContainer: {
    backgroundColor: "#E8F5E9",
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  coordsLabel: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#2E7D32",
    marginBottom: 4,
  },
  coordsText: {
    fontSize: 13,
    color: "#2E7D32",
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
  },
  map: {
    height: 220,
    borderRadius: 10,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  registerButton: {
    backgroundColor: "#4A90E2",
    padding: 16,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },
  registerButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 17,
  },
  loadingContainer: {
    padding: 20,
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    color: "#4A90E2",
    fontSize: 15,
  },
  loginLink: {
    marginTop: 20,
    alignItems: "center",
  },
  loginLinkText: {
    color: "#666",
    fontSize: 14,
  },
  loginLinkBold: {
    color: "#4A90E2",
    fontWeight: "bold",
  },
});

// 🎨 Picker Styles
const pickerSelectStyles = StyleSheet.create({
  inputAndroid: {
    color: "#333",
    padding: 12,
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    fontSize: 15,
  },
  inputIOS: {
    color: "#333",
    padding: 12,
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    fontSize: 15,
  },
  placeholder: {
    color: "#999",
  },
});