import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Image,
  Alert,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import axios from "axios";
import Constants from "expo-constants";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function ProfileScreen({ route, navigation }) {
  const { token, user } = route.params;
  const [name, setName] = useState(user.name || "");
  const [birth_place, setBirthPlace] = useState(user.birth_place || "");
  const [birth_date, setBirthDate] = useState(user.birth_date || "");
  const [gender, setGender] = useState(user.gender || "");
  const [photo, setPhoto] = useState(null);
  const [loading, setLoading] = useState(false);

  const BASE_URL =
    Constants.expoConfig?.extra?.API_URL ||
    process.env.EXPO_PUBLIC_API_URL ||
    "http://192.168.1.6:5000";

  // ========================================
  // PICK IMAGE - FIXED VERSION
  // ========================================
  const pickImage = async () => {
    try {
      console.log("📸 Starting image picker...");

      // Request permission
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      console.log("📸 Permission status:", status);

      if (status !== "granted") {
        Alert.alert(
          "Permission Required", 
          "Please allow access to your photo library to change profile picture.",
          [{ text: "OK" }]
        );
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      console.log("📸 Image picker result:", {
        canceled: result.canceled,
        hasAssets: result.assets?.length > 0,
      });

      // Check if user canceled
      if (result.canceled) {
        console.log("📸 User canceled image picker");
        return;
      }

      // Check if image was selected
      if (result.assets && result.assets.length > 0) {
        const selectedImage = result.assets[0].uri;
        console.log("✅ Image selected:", selectedImage);
        setPhoto(selectedImage);
      } else {
        console.log("⚠️ No image in result");
      }

    } catch (error) {
      console.error("❌ Image picker error:", error);
      Alert.alert(
        "Error", 
        `Failed to select image: ${error.message}`,
        [{ text: "OK" }]
      );
    }
  };

  // ========================================
  // ALTERNATIVE: Take Photo with Camera
  // ========================================
  const takePhoto = async () => {
    try {
      console.log("📷 Starting camera...");

      // Request camera permission
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      console.log("📷 Camera permission:", status);

      if (status !== "granted") {
        Alert.alert(
          "Permission Required", 
          "Please allow camera access to take a photo.",
          [{ text: "OK" }]
        );
        return;
      }

      // Launch camera
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      console.log("📷 Camera result:", {
        canceled: result.canceled,
        hasAssets: result.assets?.length > 0,
      });

      if (result.canceled) {
        console.log("📷 User canceled camera");
        return;
      }

      if (result.assets && result.assets.length > 0) {
        const takenPhoto = result.assets[0].uri;
        console.log("✅ Photo taken:", takenPhoto);
        setPhoto(takenPhoto);
      }

    } catch (error) {
      console.error("❌ Camera error:", error);
      Alert.alert(
        "Error", 
        `Failed to take photo: ${error.message}`,
        [{ text: "OK" }]
      );
    }
  };

  // ========================================
  // PHOTO OPTIONS PICKER
  // ========================================
  const handlePhotoOptions = () => {
    Alert.alert(
      "Change Profile Photo",
      "Choose an option",
      [
        {
          text: "Take Photo",
          onPress: takePhoto,
        },
        {
          text: "Choose from Library",
          onPress: pickImage,
        },
        {
          text: "Cancel",
          style: "cancel",
        },
      ],
      { cancelable: true }
    );
  };

  // ========================================
  // SUBMIT PROFILE UPDATE
  // ========================================
  const handleSubmit = async () => {
    if (!name.trim() || !birth_place.trim() || !birth_date.trim()) {
      Alert.alert("Validation Error", "Please fill in all required fields");
      return;
    }

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(birth_date)) {
      Alert.alert("Invalid Date", "Please use format: YYYY-MM-DD (e.g., 2000-01-15)");
      return;
    }

    // Validate gender
    if (!gender || (gender.toUpperCase() !== 'L' && gender.toUpperCase() !== 'P')) {
      Alert.alert("Validation Error", "Please select your gender");
      return;
    }

    setLoading(true);
    console.log("📤 Submitting profile update...");

    try {
      const formData = new FormData();
      formData.append("name", name.trim());
      formData.append("birth_place", birth_place.trim());
      formData.append("birth_date", birth_date.trim());
      formData.append("gender", gender.toUpperCase());
      
      if (user.company_id) {
        formData.append("company_id", user.company_id);
      }

      // Add photo if selected
      if (photo) {
        const filename = photo.split('/').pop();
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';

        formData.append("profile_photo", {
          uri: photo,
          type: type,
          name: `profile-${Date.now()}.${match ? match[1] : 'jpg'}`,
        });

        console.log("📸 Uploading photo:", {
          uri: photo,
          type: type,
          name: `profile-${Date.now()}.${match ? match[1] : 'jpg'}`,
        });
      }

      console.log("📤 Sending to:", `${BASE_URL}/api/users/profile`);

      const response = await axios.post(
        `${BASE_URL}/api/users/profile`, 
        formData, 
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
          timeout: 30000,
        }
      );

      console.log("✅ Profile updated:", response.data);

      Alert.alert(
        "Success", 
        "Profile updated successfully!",
        [
          {
            text: "OK",
            onPress: () => {
              // Navigate back with updated user data
              navigation.navigate("Home", { 
                user: {
                  ...user,
                  ...response.data.user,
                  profile_photo_url: response.data.user.profile_photo_url || user.profile_photo_url
                }
              });
            }
          }
        ]
      );

    } catch (error) {
      console.error("❌ Update error:", error);
      
      let errorMessage = "Failed to update profile";
      
      if (error.response) {
        console.error("Error response:", error.response.data);
        errorMessage = error.response.data?.msg || errorMessage;
      } else if (error.request) {
        console.error("No response:", error.request);
        errorMessage = "Cannot connect to server. Please check your connection.";
      } else {
        console.error("Error:", error.message);
        errorMessage = error.message;
      }

      Alert.alert("Error", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // ========================================
  // LOGOUT HANDLER
  // ========================================
  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Logout",
          style: "destructive",
          onPress: async () => {
            try {
              // Clear stored token
              await AsyncStorage.removeItem("token");
              await AsyncStorage.removeItem("user");
              
              console.log("✅ Logged out successfully");
              
              // Navigate to Login screen
              navigation.reset({
                index: 0,
                routes: [{ name: "Login" }],
              });
            } catch (error) {
              console.error("❌ Logout error:", error);
              Alert.alert("Error", "Failed to logout. Please try again.");
            }
          }
        }
      ]
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>Edit Profile</Text>
            <Text style={styles.headerSubtitle}>Update your personal information</Text>
          </View>
        </View>

        {/* Photo Section */}
        <View style={styles.photoSection}>
          <TouchableOpacity 
            onPress={handlePhotoOptions} 
            style={styles.photoContainer}
            activeOpacity={0.8}
          >
            {photo ? (
              <Image source={{ uri: photo }} style={styles.profileImage} />
            ) : user.profile_photo_url ? (
              <Image source={{ uri: user.profile_photo_url }} style={styles.profileImage} />
            ) : (
              <View style={styles.placeholder}>
                <Ionicons name="person" size={60} color="#6b7280" />
              </View>
            )}
            <View style={styles.cameraButton}>
              <Ionicons name="camera" size={20} color="#fff" />
            </View>
          </TouchableOpacity>
          <Text style={styles.photoHint}>Tap to change photo</Text>
        </View>

        {/* Form Section */}
        <View style={styles.formSection}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full Name *</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="person-outline" size={20} color="#6b7280" style={styles.inputIcon} />
              <TextInput
                placeholder="Enter your full name"
                placeholderTextColor="#9ca3af"
                value={name}
                onChangeText={setName}
                style={styles.input}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Birth Place *</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="location-outline" size={20} color="#6b7280" style={styles.inputIcon} />
              <TextInput
                placeholder="Enter your birth place"
                placeholderTextColor="#9ca3af"
                value={birth_place}
                onChangeText={setBirthPlace}
                style={styles.input}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Birth Date * (YYYY-MM-DD)</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="calendar-outline" size={20} color="#6b7280" style={styles.inputIcon} />
              <TextInput
                placeholder="2000-01-15"
                placeholderTextColor="#9ca3af"
                value={birth_date}
                onChangeText={setBirthDate}
                style={styles.input}
                maxLength={10}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Gender *</Text>
            <View style={styles.genderContainer}>
              <TouchableOpacity
                style={[
                  styles.genderButton,
                  gender.toUpperCase() === 'L' && styles.genderButtonActive
                ]}
                onPress={() => setGender('L')}
                activeOpacity={0.7}
              >
                <Ionicons 
                  name="male" 
                  size={24} 
                  color={gender.toUpperCase() === 'L' ? '#fff' : '#6b7280'} 
                />
                <Text style={[
                  styles.genderText,
                  gender.toUpperCase() === 'L' && styles.genderTextActive
                ]}>Male</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.genderButton,
                  gender.toUpperCase() === 'P' && styles.genderButtonActive
                ]}
                onPress={() => setGender('P')}
                activeOpacity={0.7}
              >
                <Ionicons 
                  name="female" 
                  size={24} 
                  color={gender.toUpperCase() === 'P' ? '#fff' : '#6b7280'} 
                />
                <Text style={[
                  styles.genderText,
                  gender.toUpperCase() === 'P' && styles.genderTextActive
                ]}>Female</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* User Info Card */}
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Ionicons name="briefcase-outline" size={20} color="#6b7280" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Role</Text>
                <Text style={styles.infoValue}>
                  {user.role === 'hr' ? 'HR Manager' : user.role === 'karyawan' ? 'Employee' : 'Admin'}
                </Text>
              </View>
            </View>
            <View style={styles.infoDivider} />
            <View style={styles.infoRow}>
              <Ionicons name="business-outline" size={20} color="#6b7280" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Company</Text>
                <Text style={styles.infoValue}>{user.company_name || "Not Assigned"}</Text>
              </View>
            </View>
          </View>

          {/* Save Button */}
          <TouchableOpacity
            style={[styles.saveButton, loading && styles.saveButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <>
                <ActivityIndicator color="#fff" size="small" />
                <Text style={styles.saveButtonText}>Updating...</Text>
              </>
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={24} color="#fff" />
                <Text style={styles.saveButtonText}>Save Changes</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Logout Button */}
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
            activeOpacity={0.8}
          >
            <Ionicons name="log-out-outline" size={24} color="#ef4444" />
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#030712",
  },
  header: {
    backgroundColor: "#111827",
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#9ca3af",
  },
  photoSection: {
    alignItems: "center",
    marginTop: -40,
    marginBottom: 24,
  },
  photoContainer: {
    position: "relative",
  },
  profileImage: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 6,
    borderColor: "#030712",
  },
  placeholder: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "#1f2937",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 6,
    borderColor: "#030712",
  },
  cameraButton: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#2563eb",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 4,
    borderColor: "#030712",
  },
  photoHint: {
    marginTop: 12,
    fontSize: 14,
    color: "#6b7280",
  },
  formSection: {
    paddingHorizontal: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#d1d5db",
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#111827",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#1f2937",
    paddingHorizontal: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    color: "#fff",
  },
  genderContainer: {
    flexDirection: "row",
    gap: 12,
  },
  genderButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#111827",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#1f2937",
    paddingVertical: 16,
    gap: 8,
  },
  genderButtonActive: {
    backgroundColor: "#2563eb",
    borderColor: "#2563eb",
  },
  genderText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6b7280",
  },
  genderTextActive: {
    color: "#fff",
  },
  infoCard: {
    backgroundColor: "#111827",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#1f2937",
    padding: 20,
    marginTop: 8,
    marginBottom: 24,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  infoContent: {
    marginLeft: 12,
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  infoDivider: {
    height: 1,
    backgroundColor: "#1f2937",
    marginVertical: 16,
  },
  saveButton: {
    backgroundColor: "#2563eb",
    borderRadius: 16,
    paddingVertical: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: "#2563eb",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
    marginBottom: 12,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  logoutButton: {
    backgroundColor: "#1f2937",
    borderRadius: 16,
    paddingVertical: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "#374151",
  },
  logoutButtonText: {
    color: "#ef4444",
    fontSize: 18,
    fontWeight: "bold",
  },
});