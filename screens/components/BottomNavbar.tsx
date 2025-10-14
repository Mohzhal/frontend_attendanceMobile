import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface BottomNavBarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function BottomNavBar({ activeTab, onTabChange }: BottomNavBarProps) {
  const tabs = [
    { 
      id: "home", 
      label: "Home", 
      icon: "home-outline", 
      iconActive: "home" 
    },
    { 
      id: "verifikasi", 
      label: "Verifikasi", 
      icon: "person-add-outline", 
      iconActive: "person-add" 
    },
    { 
      id: "absensi", 
      label: "Absensi", 
      icon: "calendar-outline", 
      iconActive: "calendar" 
    },
    { 
      id: "validasi", 
      label: "Validasi", 
      icon: "checkmark-circle-outline", 
      iconActive: "checkmark-circle" 
    },
    { 
      id: "setting", 
      label: "Setting", 
      icon: "settings-outline", 
      iconActive: "settings" 
    },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.navBar}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              style={styles.tab}
              onPress={() => onTabChange(tab.id)}
              activeOpacity={0.7}
            >
              <View style={[
                styles.iconContainer, 
                isActive && styles.iconContainerActive
              ]}>
                <Ionicons
                  name={isActive ? tab.iconActive : tab.icon}
                  size={24}
                  color={isActive ? "#2563eb" : "#6b7280"}
                />
              </View>
              <Text style={[styles.label, isActive && styles.labelActive]}>
                {tab.label}
              </Text>
              {isActive && <View style={styles.indicator} />}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#ffffff",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  navBar: {
    flexDirection: "row",
    paddingBottom: 8,
    paddingTop: 8,
    paddingHorizontal: 8,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 4,
    position: "relative",
  },
  iconContainer: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    marginBottom: 2,
  },
  iconContainerActive: {
    backgroundColor: "#dbeafe",
  },
  label: {
    fontSize: 11,
    color: "#6b7280",
    fontWeight: "500",
    textAlign: "center",
  },
  labelActive: {
    color: "#2563eb",
    fontWeight: "600",
  },
  indicator: {
    position: "absolute",
    bottom: 0,
    width: 32,
    height: 3,
    backgroundColor: "#2563eb",
    borderRadius: 2,
  },
});