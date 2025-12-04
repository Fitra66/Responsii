import * as Location from 'expo-location';
import { Stack, router } from 'expo-router';
import { push, ref } from 'firebase/database';
import React, { useState } from 'react';
import { Alert, Button, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { db } from '../firebase'; // Import db terpusat

const createOneButtonAlert = () =>
  Alert.alert(
    "Sukses",
    "Data berhasil disimpan",
    [
      { text: "OK", onPress: () => console.log("OK Pressed") }
    ],
    {
      onDismiss: () => router.back(),
    }
  );

const App = () => {
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [accuration, setAccuration] = useState('');
  const [status, setStatus] = useState('tidak hujan'); // Default status

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

  return (
    <SafeAreaProvider style={{ backgroundColor: 'white' }}>
      <SafeAreaView>
        <Stack.Screen options={{ title: 'Form Input Location' }} />
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
          placeholder="Isikan accuration (contoh: 5 meter)"
          value={accuration}
          onChangeText={setAccuration}
        />
        <Text style={styles.inputTitle}>Status Cuaca</Text>
        <View style={styles.statusContainer}>
          <Button
            title="Hujan"
            onPress={() => setStatus('hujan')}
            color={status === 'hujan' ? '#3498db' : '#bdc3c7'}
          />
          <Button
            title="Tidak Hujan"
            onPress={() => setStatus('tidak hujan')}
            color={status === 'tidak hujan' ? '#2ecc71' : '#bdc3c7'}
          />
        </View>
        <View style={styles.button}>
          <Button
            title="Get Current Location"
            onPress={getCoordinates}
          />
        </View>
        <View style={styles.button}>
          <Button
            title="Save"
            onPress={() => {
              if (!name || !location || !accuration) {
                Alert.alert("Warning", "Semua field harus diisi");
                return;
              }

              const locationsRef = ref(db, 'points/');
              push(locationsRef, {
                name: name,
                coordinates: location,
                accuration: accuration,
                status: status, // Add status to the object
              })
                .then((res) => {
                  console.log("Berhasil menyimpan data, key baru:", res.key);
                  createOneButtonAlert();
                  // Kosongkan form setelah berhasil
                  setName('');
                  setLocation('');
                  setAccuration('');
                  setStatus('tidak hujan'); // Reset status
                })
                .catch((e) => {
                  console.error("Error adding document: ", e);
                  Alert.alert("Error", "Gagal menyimpan data: " + e.message);
                });
            }}
          />
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
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
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    margin: 12,
  }
});

export default App;
