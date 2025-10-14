import React, { useState } from "react";
import { View, StyleSheet } from "react-native";
import BottomNavBar from "./components/BottomNavbar";
import HomeScreen from "./HomeScreenHR";
import VerifikasiPelamarScreen from "./VerifikasiPelamarScreen";
import DataAbsensiScreen from "./DataAbsensiScreen";
import ValidasiAbsenScreen from "./HRDetailScreen";
import SettingScreen from "./SettingScreen";

export default function HRDashboardScreen({ navigation, route }) {
  const { token, user } = route.params;
  const [activeTab, setActiveTab] = useState("home");

  const renderScreen = () => {
    switch (activeTab) {
      case "home":
        return <HomeScreen token={token} user={user} navigation={navigation} />;
      case "verifikasi":
        return <VerifikasiPelamarScreen token={token} user={user} />;
      case "absensi":
        return <DataAbsensiScreen token={token} user={user} navigation={navigation} />;
      case "validasi":
        return <ValidasiAbsenScreen token={token} user={user} />;
      case "setting":
        return <SettingScreen token={token} user={user} navigation={navigation} />;
      default:
        return <HomeScreen token={token} user={user} navigation={navigation} />;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>{renderScreen()}</View>
      <BottomNavBar activeTab={activeTab} onTabChange={setActiveTab} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  content: {
    flex: 1,
  },
});