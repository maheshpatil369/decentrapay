import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator }  from "@react-navigation/stack";
import { SafeAreaProvider }       from "react-native-safe-area-context";
import { WalletProvider }         from "./src/context/WalletContext";

import HomeScreen      from "./src/screens/HomeScreen";
import DashboardScreen from "./src/screens/DashboardScreen";
import SendScreen      from "./src/screens/SendScreen";
import HistoryScreen   from "./src/screens/HistoryScreen";
import QRScreen        from "./src/screens/QRScreen";

const Stack = createStackNavigator();

export default function App() {
  return (
    <SafeAreaProvider>
      <WalletProvider>
        <NavigationContainer>
          <Stack.Navigator
            initialRouteName="Home"
            screenOptions={{
              headerStyle:      { backgroundColor: "#4f46e5" },
              headerTintColor:  "#fff",
              headerTitleStyle: { fontWeight: "700" },
            }}
          >
            <Stack.Screen name="Home"      component={HomeScreen}      options={{ title: "⬡ DecentraPay" }} />
            <Stack.Screen name="Dashboard" component={DashboardScreen} options={{ title: "Dashboard" }} />
            <Stack.Screen name="Send"      component={SendScreen}      options={{ title: "Send ETH" }} />
            <Stack.Screen name="History"   component={HistoryScreen}   options={{ title: "History" }} />
            <Stack.Screen name="QR"        component={QRScreen}        options={{ title: "QR Pay" }} />
          </Stack.Navigator>
        </NavigationContainer>
      </WalletProvider>
    </SafeAreaProvider>
  );
}
