import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
  Button,
} from "react-native";
import { BleManager, Characteristic } from "react-native-ble-plx";
import Base64 from "Base64";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

const Stack = createNativeStackNavigator();

const bleManager = new BleManager();

const deviceList = [];

const serviceCharacteristic = [];

function scanAndConnect() {
  console.log("Scanning started");
  bleManager.startDeviceScan(null, null, (error, device) => {
    if (error) {
      console.log("Error in scanning: ", error);
      return;
    }
    // console.log(device.id, device.name);
    if (device.id === "18DC7B4A-B7E3-DAA5-A7E2-0410AA7AFD58") {
      console.log("connecting to device");
      bleManager.stopDeviceScan();
      console.log("connected!");
    }

    device
      .connect()
      .then((d) => d.discoverAllServicesAndCharacteristics())
      .then((d) => d.services())
      .then((services) => {
        console.log(`${device.id} ${device.name}`);
        console.log(JSON.stringify(services.map((s) => s.uuid)));
        const serviceIndex = services.findIndex(
          (s) => s.uuid.toUpperCase() === "205C9B28-FB91-46B3-9148-63DECF6FB2B9"
        );
        if (serviceIndex >= 0) {
          deviceList.push(device.id);
          console.log(`Add device id (${device.id}) to list`);
          console.log("device list: ", deviceList);
          return device
            .readCharacteristicForService(
              "205C9B28-FB91-46B3-9148-63DECF6FB2B9".toLowerCase(),
              "AD51109D-ABCE-4927-9E2C-9ABBA5483FBD".toLowerCase()
            )
            .then((c) => {
              console.log("Characteristic: ", c);
              console.log("Value: ", Base64.atob(c.value));
              serviceCharacteristic.push(
                c.serviceUUID,
                c.uuid,
                Base64.atob(c.value)
              );
              device.monitorCharacteristicForService(
                "205C9B28-FB91-46B3-9148-63DECF6FB2B9".toLowerCase(),
                "AD51109D-ABCE-4927-9E2C-9ABBA5483FBD".toLowerCase(),
                (error, c) => {
                  if (error) {
                    console.log("monitor error: ", error);
                  } else {
                    console.log(`value changed to ${Base64.atob(c.value)}!`);
                  }
                }
              );
              const x = Base64.btoa("Alpha beta");
              console.log("Writing...");
              device.writeCharacteristicWithResponseForService(
                "205C9B28-FB91-46B3-9148-63DECF6FB2B9".toLowerCase(),
                "AD51109D-ABCE-4927-9E2C-9ABBA5483FBD".toLowerCase(),
                Base64.btoa("Time to build Toku Talk")
              );
              console.log("writing: ", c.value);
            });
        } else {
          return Promise.resolve();
        }
      })
      // .then(() => device.cancelConnection())
      // .then(() => console.log("cancelling..."))
      .catch((err) => console.error("Error: ", err));
  });
  setTimeout(() => {
    console.log("Stop scanning...");
    bleManager.stopDeviceScan();
  }, 5000);
}

function HomeScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <Button
        title="Scan"
        onPress={() => {
          scanAndConnect();
          setTimeout(() => {
            navigation.push("DeviceList");
          }, 5000);
        }}
      ></Button>
      <Button
        title="DeviceList"
        onPress={() => navigation.navigate("DeviceList")}
      ></Button>
      <StatusBar style="auto" />
    </View>
  );
}

function listDevices({ navigation }) {
  return (
    <TouchableOpacity
      onPress={() => {
        setTimeout(() => {
          navigation.push("CharacteristicsList");
        });
      }}
    >
      <Text>{deviceList}</Text>
    </TouchableOpacity>
  );
}

function listCharacteristics({ navigation }) {
  return <Text>{JSON.stringify(serviceCharacteristic)}</Text>;
}

export default function App() {
  React.useEffect(() => {
    bleManager.onStateChange((state) => {
      const subscription = bleManager.onStateChange((state) => {
        if (state === "PoweredOn") {
          subscription.remove();
        } else if (state === "PoweredOff") {
          Alert.alert("Please turn on Bluetooth and try again");
        }
      }, true);
      return () => subscription.remove();
    });
  }, [bleManager]);

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="DeviceList" component={listDevices} />
        <Stack.Screen
          name="CharacteristicsList"
          component={listCharacteristics}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
});
