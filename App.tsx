import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";

// 🧩 Screens
import LoginScreen from "./screens/LoginScreen";
import RegisterScreen from "./screens/RegisterScreen";
import HomeScreen from "./screens/HomeScreen";
import ProfileScreen from "./screens/ProfileScreen";
import AttendanceScreen from "./screens/AttendanceScreen";
import HistoryScreen from "./screens/HistoryScreen";
import HRDashboardScreen from "./screens/HRDashboardScreen";

// 🔧 Super Admin Screens
import SuperAdminDashboard from "./screens/SuperAdminDashboard";
import CompaniesScreen from "./screens/CompaniesScreen";
import UsersManagementScreen from "./screens/UsersManagementScreen";
import AttendanceMapScreen from "./screens/AttendanceMapScreen";
import AdminSettingsScreen from "./screens/AdminSettingsScreen";

// 🔧 Navigators
const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

/* ===========================================================
   📱 Bottom Tabs untuk Karyawan
=========================================================== */
function MainTabs({ route }) {
  const { token, user } = route.params;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = "home-outline";

          if (route.name === "Home") {
            iconName = focused ? "home" : "home-outline";
          } else if (route.name === "History") {
            iconName = focused ? "time" : "time-outline";
          } else if (route.name === "Attendance") {
            iconName = focused ? "calendar" : "calendar-outline";
          } else if (route.name === "Profile") {
            iconName = focused ? "person" : "person-outline";
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: "#3b82f6",
        tabBarInactiveTintColor: "#9ca3af",
        tabBarStyle: {
          backgroundColor: "#111827",
          borderTopColor: "#1f2937",
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        headerStyle: {
          backgroundColor: "#111827",
        },
        headerTintColor: "#fff",
        headerTitleStyle: {
          fontWeight: "bold",
        },
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        initialParams={{ token, user }}
        options={{ title: "Beranda", headerShown: false }}
      />
      <Tab.Screen
        name="History"
        component={HistoryScreen}
        initialParams={{ token, user }}
        options={{ title: "Riwayat", headerShown: false }}
      />
      <Tab.Screen
        name="Attendance"
        component={AttendanceScreen}
        initialParams={{ token, user }}
        options={{ title: "Absensi", headerShown: false }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        initialParams={{ token, user }}
        options={{ title: "Akun", headerShown: false }}
      />
    </Tab.Navigator>
  );
}

/* ===========================================================
   🏢 Bottom Tabs untuk Super Admin
=========================================================== */
function SuperAdminTabs({ route }) {
  const { token, user } = route.params;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = "home-outline";

          if (route.name === "Dashboard") {
            iconName = focused ? "home" : "home-outline";
          } else if (route.name === "Companies") {
            iconName = focused ? "business" : "business-outline";
          } else if (route.name === "Users") {
            iconName = focused ? "people" : "people-outline";
          } else if (route.name === "AttendanceMap") {
            iconName = focused ? "map" : "map-outline";
          } else if (route.name === "Settings") {
            iconName = focused ? "settings" : "settings-outline";
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: "#3b82f6",
        tabBarInactiveTintColor: "#9ca3af",
        tabBarStyle: {
          backgroundColor: "#111827",
          borderTopColor: "#1f2937",
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        headerStyle: {
          backgroundColor: "#111827",
        },
        headerTintColor: "#fff",
        headerTitleStyle: {
          fontWeight: "bold",
        },
      })}
    >
      <Tab.Screen
        name="Dashboard"
        component={SuperAdminDashboard}
        initialParams={{ token, user }}
        options={{ title: "Dashboard", headerShown: false }}
      />
      <Tab.Screen
        name="Companies"
        component={CompaniesScreen}
        initialParams={{ token, user }}
        options={{ title: "Perusahaan", headerShown: false }}
      />
      <Tab.Screen
        name="Users"
        component={UsersManagementScreen}
        initialParams={{ token, user }}
        options={{ title: "Pengguna", headerShown: false }}
      />
      <Tab.Screen
        name="AttendanceMap"
        component={AttendanceMapScreen}
        initialParams={{ token, user }}
        options={{ title: "Absensi", headerShown: false }}
      />
      <Tab.Screen
        name="Settings"
        component={AdminSettingsScreen}
        initialParams={{ token, user }}
        options={{ title: "Pengaturan", headerShown: false }}
      />
    </Tab.Navigator>
  );
}

/* ===========================================================
   🏢 Stack Navigasi Utama
=========================================================== */
export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        {/* 🔐 Login */}
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ headerShown: false }}
        />

        {/* 🧾 Register */}
        <Stack.Screen
          name="Register"
          component={RegisterScreen}
          options={{ headerShown: false }}
        />

        {/* 👤 Karyawan (Main Tabs) */}
        <Stack.Screen
          name="MainTabs"
          component={MainTabs}
          options={{ headerShown: false }}
        />

        {/* 🏢 Super Admin Tabs */}
        <Stack.Screen
          name="SuperAdminTabs"
          component={SuperAdminTabs}
          options={{ headerShown: false }}
        />

        {/* 🏢 HR Dashboard */}
        <Stack.Screen
          name="HRDashboardScreen"
          component={HRDashboardScreen}
          options={{
            title: "Dashboard HR",
            headerShown: true,
            headerStyle: {
              backgroundColor: "#111827",
            },
            headerTintColor: "#fff",
            headerTitleStyle: {
              fontWeight: "bold",
            },
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}