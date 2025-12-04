import * as Location from 'expo-location';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { ref, update } from 'firebase/database';
import React, { useState } from 'react';
import { Alert, Button, Platform, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { db } from '../firebase';

let MapView: any, Marker: any, Polygon: any;

// Only import maps on native platforms, not on web
if (Platform.OS !== 'web') {
  try {
    const maps = require('react-native-maps');
    MapView = maps.default;
    Marker = maps.Marker;
    Polygon = maps.Polygon;
  } catch (error) {
    console.warn('react-native-maps not available:', error);
  }
}

const createOneButtonAlert = (callback: () => void) =>
  Alert.alert(
    "Success",
    "Berhasil memperbarui data",
    [
      { text: "OK", onPress: callback }
    ]
  );

const App = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { id, name: initialName, coordinates: initialCoordinates, accuration: initialAccuration } = params;

  const [name, setName] = useState(initialName as string || '');
  const [location, setLocation] = useState(initialCoordinates as string || '');
  const [accuration, setAccuration] = useState(initialAccuration as string || '');

  // Parse initial coordinates for map marker
  const [markerPosition, setMarkerPosition] = useState(() => {
    if (initialCoordinates && typeof initialCoordinates === 'string') {
      const [lat, lng] = initialCoordinates.split(',').map(Number);
      return { latitude: lat, longitude: lng };
    }
    return { latitude: -7.7956, longitude: 110.3695 }; // Default to Yogyakarta
  });

  // Get buffer radius for circle display
  const bufferRadius = parseInt(accuration.replace(/[^0-9]/g, ''), 10) || 500;

  // Handle marker drag end
  const handleMarkerDragEnd = (e: any) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    const newCoords = `${latitude.toFixed(6)},${longitude.toFixed(6)}`;
    setLocation(newCoords);
    setMarkerPosition({ latitude, longitude });
  };

  // Get current location
  const getCoordinates = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission to access location was denied');
      return;
    }
    let currentLocation = await Location.getCurrentPositionAsync({});
    const coords = currentLocation.coords.latitude + ',' + currentLocation.coords.longitude;
    setLocation(coords);
    const accuracy = currentLocation.coords.accuracy;
    setAccuration(accuracy + ' m');
  };

  // Handle update
  const handleUpdate = () => {
    if (!id) {
      Alert.alert('Error', 'ID lokasi tidak ditemukan.');
      return;
    }

    // Ambil nilai radius dari state 'accuration', pastikan hanya angka yang diambil
    const bufferValue = parseInt(accuration.replace(/[^0-9]/g, ''), 10);

    if (isNaN(bufferValue) || bufferValue <= 0) {
      Alert.alert('Warning', 'Nilai buffer harus berupa angka positif!');
      return;
    }

    const pointRef = ref(db, `points/${id}`);
    update(pointRef, {
      name: name,
      coordinates: location,
      accuration: accuration, // Tetap simpan string asli jika diperlukan
      bufferRadius: bufferValue, // Simpan nilai numerik untuk buffer
    })
      .then(() => {
        createOneButtonAlert(() => {
          router.back();
        });
      })
      .catch((e) => {
        console.error('Error updating document: ', e);
        Alert.alert('Error', 'Gagal memperbarui data');
      });
  };

  if (Platform.OS === 'web') {
    return (
      <SafeAreaProvider style={{ backgroundColor: 'white' }}>
        <SafeAreaView>
          <Stack.Screen options={{ title: 'Form Edit Location' }} />
          <Text style={styles.webMessage}>Map editing is not available on web. Please use mobile app.</Text>
          <Text style={styles.inputTitle}>Nama</Text>
          <TextInput
            style={styles.input}
            placeholder='Isikan nama objek'
            value={name}
            onChangeText={setName}
          />
          <Text style={styles.inputTitle}>Koordinat</Text>
          <TextInput
            style={styles.input}
            placeholder="Isikan koordinat (contoh: -6.200000,106.816666)"
            value={location}
            onChangeText={setLocation}
          />
          <Text style={styles.inputTitle}>Accuration</Text>
          <TextInput
            style={styles.input}
            placeholder="Isikan accuration (contoh: 500 meter)"
            value={accuration}
            onChangeText={setAccuration}
            keyboardType="numeric"
          />
          <View style={styles.button}>
            <Button
              title="Get Current Location"
              onPress={getCoordinates}
            />
          </View>
          <View style={styles.button}>
            <Button
              title="Save"
              onPress={handleUpdate}
            />
          </View>
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider style={{ backgroundColor: 'white' }}>
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: 'Form Edit Location' }} />

        {/* Form Section */}
        <View style={styles.formContainer}>
          <Text style={styles.inputTitle}>Nama</Text>
          <TextInput
            style={styles.input}
            placeholder='Isikan nama objek'
            value={name}
            onChangeText={setName}
          />
          <Text style={styles.inputTitle}>Koordinat</Text>
          <TextInput
            style={styles.input}
            placeholder="Isikan koordinat (contoh: -6.200000,106.816666)"
            value={location}
            onChangeText={(text) => {
              setLocation(text);
              // Update marker position when coordinates change
              const [lat, lng] = text.split(',').map(Number);
              if (!isNaN(lat) && !isNaN(lng)) {
                setMarkerPosition({ latitude: lat, longitude: lng });
              }
            }}
          />
          <Text style={styles.inputTitle}>Accuration</Text>
          <TextInput
            style={styles.input}
            placeholder="Isikan accuration (contoh: 500 meter)"
            value={accuration}
            onChangeText={setAccuration}
            keyboardType="numeric"
          />
          <View style={styles.button}>
            <Button
              title="Get Current Location"
              onPress={getCoordinates}
            />
          </View>
        </View>

        {/* Map Section */}
        <View style={styles.mapContainer}>
          <Text style={styles.mapTitle}>Geser marker untuk mengubah lokasi:</Text>
          <MapView
            style={styles.map}
            initialRegion={{
              latitude: markerPosition.latitude,
              longitude: markerPosition.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
            region={{
              latitude: markerPosition.latitude,
              longitude: markerPosition.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
          >
            {/* Buffer Circle */}
            <Polygon
              coordinates={generateCircleCoordinates(markerPosition.latitude, markerPosition.longitude, bufferRadius)}
              fillColor="rgba(0, 150, 255, 0.3)"
              strokeColor="rgba(0, 150, 255, 0.8)"
              strokeWidth={2}
            />

            {/* Draggable Marker */}
            <Marker
              coordinate={markerPosition}
              title={name || "Lokasi"}
              description={`Koordinat: ${location}`}
              draggable
              onDragEnd={handleMarkerDragEnd}
              pinColor="orange"
            />
          </MapView>
        </View>

        {/* Save Button */}
        <View style={styles.saveButtonContainer}>
          <View style={styles.button}>
            <Button
              title="Save"
              onPress={handleUpdate}
            />
          </View>
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  formContainer: {
    backgroundColor: '#fff',
    paddingBottom: 10,
  },
  mapContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  mapTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  map: {
    flex: 1,
  },
  saveButtonContainer: {
    backgroundColor: '#fff',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  input: {
    height: 40,
    margin: 12,
    borderWidth: 1,
    padding: 10,
    borderRadius: 5,
  },
  inputTitle: {
    marginLeft: 12,
    marginTop: 12,
    fontSize: 16,
    fontWeight: '600',
  },
  button: {
    margin: 12,
  },
  webMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
    color: '#666',
  }
});

// Helper function untuk generate circle coordinates (radius dalam meter)
const generateCircleCoordinates = (centerLat: number, centerLng: number, radiusInMeters: number) => {
  const earthRadiusKm = 6371;
  const radiusInKm = radiusInMeters / 1000;
  const points = 30;
  const coords = [];

  for (let i = 0; i < points; i++) {
    const angle = (i / points) * (2 * Math.PI);
    const lat =
      centerLat +
      (radiusInKm / earthRadiusKm) * (180 / Math.PI) * Math.cos(angle);
    const lng =
      centerLng +
      ((radiusInKm / earthRadiusKm) * (180 / Math.PI) * Math.sin(angle)) /
        Math.cos((centerLat * Math.PI) / 180);

    coords.push({ latitude: lat, longitude: lng });
  }

  return coords;
};

export default App;
