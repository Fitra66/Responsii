import { FontAwesome } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { router, useLocalSearchParams } from 'expo-router';
import { onValue, push, ref } from 'firebase/database';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Rainfall from '../../components/animations/Rainfall';
import Sunny from '../../components/animations/Sunny';
import { DATA_DIY } from '../../constants/jogjaData';
import { db } from '../../firebase';

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

export default function MapScreen() {
  const mapRef = useRef<any>(null);
  const markerRefs = useRef<{ [key: string]: any }>({});
  const params = useLocalSearchParams();
  const [markers, setMarkers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeRegionId, setActiveRegionId] = useState<string | null>(null);
  const [isBlinking, setIsBlinking] = useState(false);
  const [weatherData, setWeatherData] = useState<any[]>([]);
  const [hasAnimated, setHasAnimated] = useState(false); // Track if animation already done
  const [highlightTimer, setHighlightTimer] = useState<NodeJS.Timeout | number | null>(null);
  const [allowAutoZoom, setAllowAutoZoom] = useState(true);

  // State for highlighting marker from Tab 2
  const [highlightedMarkerId, setHighlightedMarkerId] = useState<string | null>(null);
  const [isHighlightBlinking, setIsHighlightBlinking] = useState(false);
  const [markerBlinkStates, setMarkerBlinkStates] = useState<{ [key: string]: boolean }>({});

  // Form Input State
  const [formName, setFormName] = useState('');
  const [formCoordinates, setFormCoordinates] = useState('');
  const [formBufferRadius, setFormBufferRadius] = useState('');
  const [formAccuracy, setFormAccuracy] = useState('');
  const [radarCircles, setRadarCircles] = useState<any[]>([]);

  const [previewCircle, setPreviewCircle] = useState<any>(null);
  const [formWeather, setFormWeather] = useState('tidak hujan'); // State untuk cuaca


  // Modal State
  const [showFormModal, setShowFormModal] = useState(false);
  const [drawingMode, setDrawingMode] = useState(false);
  const [tapLocation, setTapLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch data dari Firebase untuk markers + radarCircles
  useEffect(() => {
    const pointsRef = ref(db, 'points/');

    const unsubscribe = onValue(
      pointsRef,
      (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const parsedMarkers: any[] = [];
          const circles: any[] = [];

          Object.keys(data).forEach((key) => {
            const point = data[key];

            // Ensure coordinates is a string and not empty
            if (typeof point.coordinates !== 'string' || point.coordinates.trim() === '') {
              return;
            }
            const [latitude, longitude] = point.coordinates.split(',').map(Number);

            // Validate that parsing was successful
            if (isNaN(latitude) || isNaN(longitude)) {
              console.warn(`Invalid coordinates for point ${key}:`, point.coordinates);
              return;
            }

            parsedMarkers.push({
              id: key,
              name: point.name,
              latitude,
              longitude,
              status: point.status || 'tidak hujan', // Add status, default to 'tidak hujan'
            });

            // Tentukan radius buffer dari data (prioritas: bufferRadius → accuration → default 500)
            let radius = 500;

            if (typeof point.bufferRadius === 'number') {
              radius = point.bufferRadius;
            } else if (typeof point.bufferRadius === 'string') {
              const parsed = parseInt(point.bufferRadius, 10);
              if (!isNaN(parsed)) {
                radius = parsed;
              }
            } else if (typeof point.accuration === 'string') {
              const parsed = parseInt(point.accuration, 10);
              if (!isNaN(parsed)) {
                radius = parsed;
              }
            }

            circles.push({
              id: key,
              latitude,
              longitude,
              radius,
              color: 'rgba(0, 150, 255, 0.3)',
            });
          });

          setMarkers(parsedMarkers);
          setRadarCircles(circles);

          // Sinkronisasi state blinking dengan daftar circle yang baru
          setMarkerBlinkStates((prev) => {
            const updated: { [key: string]: boolean } = {};
            circles.forEach((circle) => {
              updated[circle.id] = prev[circle.id] ?? true;
            });
            return updated;
          });
        } else {
          setMarkers([]);
          setRadarCircles([]);
        }
        setLoading(false);
      },
      (error) => {
        console.error(error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Fetch weather data dari BMKG untuk semua wilayah
  useEffect(() => {
    fetchAllWeatherData();
  }, []); // Empty dependency array ensures this runs only once on mount

  // Re-enable auto-zoom when a new navigation from info-cuaca occurs
  useEffect(() => {
    if (params.highlightId && params.shouldZoom === 'true') {
      setAllowAutoZoom(true);
    }
  }, [params?.highlightId, params?.shouldZoom]);

  // Handle params dari Tab 3 (Info Cuaca) untuk zoom & highlight
  useEffect(() => {
    if (!params.highlightId) {
      return;
    }

    const highlightId = params.highlightId as string;
    const shouldZoom = params.shouldZoom === 'true';

    // Bersihkan timer highlight sebelumnya
    if (highlightTimer) {
      clearTimeout(highlightTimer);
    }

    // Atur region aktif untuk efek blinking
    setActiveRegionId(highlightId);

    // Atur timer untuk mematikan highlight secara otomatis
    const newHighlightTimer = setTimeout(() => {
      setActiveRegionId(null);
    }, 15000);
    setHighlightTimer(newHighlightTimer);

    let zoomTimer: NodeJS.Timeout | null = null;

    // Animasi kamera ke lokasi (hanya jika shouldZoom dan allowAutoZoom true)
    if (mapRef.current && shouldZoom && allowAutoZoom) {
      const region = DATA_DIY.find((r) => r.id === highlightId);
      if (region) {
        const lats = region.coordinates.map((c) => c.latitude);
        const lngs = region.coordinates.map((c) => c.longitude);
        const minLat = Math.min(...lats);
        const maxLat = Math.max(...lats);
        const minLng = Math.min(...lngs);
        const maxLng = Math.max(...lngs);

        const latitudeDelta = (maxLat - minLat) * 1.2;
        const longitudeDelta = (maxLng - minLng) * 1.2;

        zoomTimer = setTimeout(() => {
          // Periksa lagi allowAutoZoom di dalam timer
          if (mapRef.current && allowAutoZoom) {
            mapRef.current.animateToRegion(
              {
                latitude: region.center.latitude,
                longitude: region.center.longitude,
                latitudeDelta,
                longitudeDelta,
              },
              1500 // Durasi animasi
            );
          }
        }, 1000); // Delay 1 detik
      }
    }

    // Cleanup terpadu untuk semua timer
    return () => {
      if (zoomTimer) clearTimeout(zoomTimer);
      if (newHighlightTimer) clearTimeout(newHighlightTimer);
    };
  }, [params?.highlightId, params?.shouldZoom, allowAutoZoom]);

  // Re-enable auto-zoom when a new navigation from the timeline occurs
  useEffect(() => {
    if (params.markerId && params.shouldZoom === 'true') {
      setAllowAutoZoom(true);
    }
  }, [params?.markerId, params?.shouldZoom]);

  // Handle params dari Tab 2 (Linimasa) untuk zoom & highlight marker
  useEffect(() => {
    // Cek apakah parameter ada, auto-zoom diizinkan, dan data sudah siap
    if (params.markerId && params.shouldZoom === 'true' && allowAutoZoom && radarCircles.length > 0) {
      const lat = parseFloat(params.lat as string);
      const long = parseFloat(params.long as string);
      const markerId = params.markerId as string;

      // Cari circle yang sesuai di state
      const targetCircle = radarCircles.find((c) => c.id === markerId);
      if (!targetCircle) return; // Jika tidak ditemukan, stop

      // Hitung delta untuk zoom berdasarkan radius buffer
      const latitudeDelta = (targetCircle.radius / 111000) * 3;
      const longitudeDelta = latitudeDelta; // Asumsi rasio aspek 1:1

      const zoomDelay = 1500; // 1500ms delay

      const zoomTimer = setTimeout(() => {
        if (mapRef.current) {
          mapRef.current.animateToRegion(
            {
              latitude: lat,
              longitude: long,
              latitudeDelta,
              longitudeDelta,
            },
            1500 // Durasi animasi zoom 1.5 detik
          );
        }
      }, zoomDelay);

      // Highlight marker yang dipilih
      setHighlightedMarkerId(markerId);

      // Hapus highlight setelah beberapa detik
      const highlightDuration = 7000; // Highlight selama 7 detik
      const highlightTimer = setTimeout(() => {
        setHighlightedMarkerId(null);
        // Hapus parameter dari URL setelah selesai agar tidak re-trigger
        router.setParams({ markerId: undefined, shouldZoom: undefined, lat: undefined, long: undefined });
      }, highlightDuration);

      // Cleanup timers
      return () => {
        clearTimeout(zoomTimer);
        clearTimeout(highlightTimer);
      };
    }
  }, [params?.markerId, params?.shouldZoom, radarCircles, allowAutoZoom]); // Dijalankan saat ada navigasi atau interaksi map

  // Effect for highlighted marker blinking
  useEffect(() => {
    if (highlightedMarkerId) {
      const interval = setInterval(() => {
        setIsHighlightBlinking((prev) => !prev);
      }, 300); // Blink lebih cepat untuk highlight
      return () => clearInterval(interval);
    }
  }, [highlightedMarkerId]);

  // Effect untuk blinking animation polygon highlight
  useEffect(() => {
    if (activeRegionId) {
      const interval = setInterval(() => {
        setIsBlinking((prev) => !prev);
      }, 500);
      return () => clearInterval(interval);
    }
  }, [activeRegionId]);



  // Effect untuk update preview circle saat buffer radius berubah
  useEffect(() => {
    if (drawingMode && tapLocation && formBufferRadius) {
      const radius = parseInt(formBufferRadius, 10);
      if (!isNaN(radius) && radius > 0) {
        setPreviewCircle({
          latitude: tapLocation.lat,
          longitude: tapLocation.lng,
          radius: radius,
        });
      } else {
        setPreviewCircle(null);
      }
    } else {
      setPreviewCircle(null);
    }
  }, [formBufferRadius, tapLocation, drawingMode]);

  // Fetch weather data dari BMKG
  const fetchAllWeatherData = async () => {
    try {
      const promises = DATA_DIY.map(async (region) => {
        try {
          const url = `https://api.bmkg.go.id/publik/prakiraan-cuaca?adm4=${region.bmkgCode}`;
          const response = await fetch(url);

          if (!response.ok) {
            console.warn(`Gagal ambil data untuk ${region.name} (${response.status})`);
            return { ...region, weatherDesc: 'Data Error', temp: '-' };
          }

          const json = await response.json();

          if (!json.data || !Array.isArray(json.data) || json.data.length === 0) {
            return { ...region, weatherDesc: 'Tidak ada data', temp: '-' };
          }

          const locationData = json.data[0];
          if (!locationData.cuaca || !Array.isArray(locationData.cuaca) || locationData.cuaca.length === 0) {
            return { ...region, weatherDesc: 'Tidak ada prediksi', temp: '-' };
          }

          const dayData = locationData.cuaca[0];
          if (!Array.isArray(dayData) || dayData.length === 0) {
            return { ...region, weatherDesc: 'Data jam kosong', temp: '-' };
          }

          const current = dayData[0];
          return {
            ...region,
            weatherDesc: current.weather_desc || 'N/A',
            temp: current.t?.toString() || '-',
            humidity: current.hu?.toString() || '-',
          };
        } catch (error) {
          console.error(`Error fetch ${region.name}:`, error);
          return { ...region, weatherDesc: 'Error', temp: '-' };
        }
      });

      const results = await Promise.all(promises);
      setWeatherData(results.filter(Boolean));
    } catch (error) {
      console.error('Gagal ambil data cuaca:', error);
    }
  };

  // Fungsi untuk mendapatkan warna poligon berdasarkan kondisi cuaca
  const getPolygonColor = (regionId: string, isHighlighted: boolean) => {
    // Jika region sedang di-highlight dari Tab 3
    if (isHighlighted) {
      return {
        fillColor: isBlinking ? 'rgba(255, 0, 0, 0.6)' : 'rgba(255, 0, 0, 0.2)',
        strokeColor: isBlinking ? 'rgba(255, 50, 50, 1)' : 'rgba(255, 0, 0, 1)',
        strokeWidth: isBlinking ? 4 : 3,
      };
    }

    // Normal state - ambil warna dari data
    const region = DATA_DIY.find((r) => r.id === regionId);
    const weather = weatherData.find((w) => w.id === regionId);

    if (!region || !weather) {
      return {
        fillColor: 'rgba(0, 0, 0, 0.05)',
        strokeColor: 'rgba(0, 0, 0, 0.2)',
        strokeWidth: 1,
      };
    }

    // Logika warna berdasarkan cuaca
    const desc = weather.weatherDesc?.toLowerCase() || '';
    let fillColor = region.color;

    // Jika hujan, gunakan warna biru
    if (desc.includes('hujan') || desc.includes('gerimis')) {
      fillColor = 'rgba(0, 100, 200, 0.4)';
    }
    // Jika cerah, gunakan warna kuning
    else if (desc.includes('cerah')) {
      fillColor = 'rgba(255, 200, 0, 0.3)';
    }
    // Jika berawan, gunakan warna abu-abu
    else if (desc.includes('berawan') || desc.includes('mendung')) {
      fillColor = 'rgba(150, 150, 150, 0.3)';
    }

    return {
      fillColor: fillColor,
      strokeColor: 'rgba(0, 0, 0, 0.2)',
      strokeWidth: 1,
    };
  };

  // Get current location
  const getCoordinates = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission', 'Location permission denied');
      return;
    }
    let currentLocation = await Location.getCurrentPositionAsync({});
    const coords = currentLocation.coords.latitude + ',' + currentLocation.coords.longitude;
    setFormCoordinates(coords);
    const accuracy = currentLocation.coords.accuracy;
    setFormAccuracy(accuracy?.toFixed(2) + ' m' || '0 m');
  };

  // Save new point dengan radar buffer
  const handleSavePoint = async () => {
    if (!formName || !formCoordinates) {
      Alert.alert('Warning', 'Nama dan koordinat harus diisi!');
      return;
    }

    try {
      const bufferValue = formBufferRadius ? parseInt(formBufferRadius, 10) : 500;

      // Validasi buffer value
      if (isNaN(bufferValue) || bufferValue <= 0) {
        Alert.alert('Warning', 'Buffer area harus berupa angka positif!');
        return;
      }

      const pointsRef = ref(db, 'points/');
      await push(pointsRef, {
        name: formName,
        coordinates: formCoordinates,
        accuration: bufferValue.toString() + ' m',
        bufferRadius: bufferValue, // simpan radius di Firebase agar efek buffer bisa dibaca lagi
        timestamp: new Date().toISOString(),
        status: formWeather, // Simpan status cuaca
      });

      Alert.alert('Sukses', 'Titik berhasil ditambahkan!');

      // Clear form dan tutup modal
      setFormName('');
      setFormCoordinates('');
      setFormBufferRadius('');
      setFormAccuracy('');
      setTapLocation(null);
      setDrawingMode(false);
      setShowFormModal(false);
      setFormWeather('tidak hujan'); // Reset status cuaca
    } catch (error) {
      Alert.alert('Error', 'Gagal menyimpan data: ' + error);
    }
  };

  // Handle map interaction untuk disable auto-zoom
  const handleMapRegionChange = (e: any) => {
    // Disable auto-zoom setelah user melakukan interaksi manual pada map
    if (allowAutoZoom) {
      setAllowAutoZoom(false);
    }
  };

  // Handle map press untuk drawing mode
  const handleMapPress = (e: any) => {
    // Disable auto-zoom saat user tap map
    if (allowAutoZoom) {
      setAllowAutoZoom(false);
    }

    if (!drawingMode) return;

    const { latitude, longitude } = e.nativeEvent.coordinate;
    setTapLocation({ lat: latitude, lng: longitude });

    // Auto-fill coordinates field
    const coords = latitude.toFixed(6) + ',' + longitude.toFixed(6);
    setFormCoordinates(coords);

    // Optional: Auto-set buffer ke default 500m saat user tap map
    setFormBufferRadius('500');
  };

  // Handle refresh untuk Tab 1
  const onRefresh = async () => {
    setRefreshing(true);
    // Clear highlight timer jika ada
    if (highlightTimer) {
      clearTimeout(highlightTimer);
      setHighlightTimer(null);
    }
    // Hilangkan highlight poligon
    setActiveRegionId(null);
    // Refresh weather data
    await fetchAllWeatherData();
    // Refresh akan trigger onValue listener juga untuk markers & radarCircles
    setTimeout(() => setRefreshing(false), 500);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" />
        <Text>Loading map data...</Text>
      </View>
    );
  }

  if (Platform.OS === 'web') {
    return (
      <View style={styles.container}>
        <Text style={styles.webMessage}>Map view is not available on web. Please use mobile app.</Text>
        <TouchableOpacity style={styles.fab} onPress={() => router.push('/forminputlocation')}>
          <FontAwesome name="plus" size={24} color="white" />
        </TouchableOpacity>
      </View>
    );
  }

  // Render the map on native platforms
  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        onPress={handleMapPress}
        onRegionChange={handleMapRegionChange}
        initialRegion={{
          latitude: -7.7956, // Initial center (Yogyakarta)
          longitude: 110.3695,
          latitudeDelta: 0.1,
          longitudeDelta: 0.1,
        }}
        zoomControlEnabled={true}
      >
        {/* Render semua poligon dari DATA_DIY */}
        {DATA_DIY.map((region) => {
          const isHighlighted = activeRegionId === region.id;
          const colors = getPolygonColor(region.id, isHighlighted);

          return (
            <Polygon
              key={region.id}
              coordinates={region.coordinates}
              fillColor={colors.fillColor}
              strokeColor={colors.strokeColor}
              strokeWidth={colors.strokeWidth}
            />
          );
        })}

        {/* Render Radar Circles (Titik User) dengan Gaya Modern */}
        {radarCircles.map((circle) => {
          // Cari data marker pasangannya untuk tahu status cuaca
          const marker = markers.find((m) => m.id === circle.id);
          const isRain = marker?.status === 'hujan';

          // Cek apakah sedang di-highlight dari Tab Linimasa
          const isHighlighted = highlightedMarkerId === circle.id;

          // --- LOGIKA STYLING MODERN ---
          // 1. Jika Hujan: Warna area kebiruan gelap transparan (seperti awan mendung)
          // 2. Jika Cerah: Warna area kuning cerah transparan (seperti bias cahaya)
          const weatherFillColor = isRain
            ? 'rgba(90, 100, 120, 0.25)' // Ambience Hujan
            : 'rgba(255, 200, 0, 0.2)';  // Ambience Cerah

          // Highlight logic (tetap dipertahankan fiturnya, tapi style disesuaikan)
          const finalFillColor = isHighlighted ? 'rgba(255, 165, 0, 0.3)' : weatherFillColor;

          // Hilangkan stroke (garis pinggir) agar tidak kaku, kecuali sedang di-highlight
          const strokeColor = isHighlighted ? 'rgba(255, 165, 0, 1)' : 'transparent';
          const strokeWidth = isHighlighted ? 2 : 0;

          return (
            <React.Fragment key={`radar-${circle.id}`}>
              {/* AREA ATMOSFER (Pengganti Buffer Kaku) */}
              <Polygon
                coordinates={generateCircleCoordinates(circle.latitude, circle.longitude, circle.radius)}
                fillColor={finalFillColor}
                strokeColor={strokeColor}
                strokeWidth={strokeWidth}
                tappable
                onPress={() => {
                  // Trigger callout pada marker referensi
                  const markerRef = markerRefs.current[circle.id];
                  if (markerRef) markerRef.showCallout();
                }}
              />

              {/* ANIMASI CUACA (Terapung di tengah area) */}
              <Marker
                coordinate={{ latitude: circle.latitude, longitude: circle.longitude }}
                anchor={{ x: 0.5, y: 0.5 }} // Pastikan tepat di tengah
                tracksViewChanges={true} // Agar animasi terus bergerak
                zIndex={2} // Pastikan di atas area polygon wilayah
              >
                {/* Perbesar sedikit animasi agar dominan */}
                <View style={{ width: 90, height: 90, justifyContent:'center', alignItems:'center' }}>
                  {isRain ? (
                    <Rainfall />
                  ) : (
                    <Sunny />
                  )}
                </View>
              </Marker>
            </React.Fragment>
          );
        })}

        {/* Render Preview Circle saat drawing mode */}
        {previewCircle && (
          <Polygon
            key="preview-circle"
            coordinates={generateCircleCoordinates(
              previewCircle.latitude,
              previewCircle.longitude,
              previewCircle.radius
            )}
            fillColor="rgba(255, 255, 0, 0.3)"
            strokeColor="rgba(255, 255, 0, 0.8)"
            strokeWidth={2}
          />
        )}

        {/* Render markers from Firebase with custom animation views */}
        {markers.map((marker) => (
          <Marker
            key={marker.id}
            ref={(el: any) => (markerRefs.current[marker.id] = el)} // Simpan ref
            coordinate={{ latitude: marker.latitude, longitude: marker.longitude }}
            title={marker.name}
            description={`Status: ${marker.status}`}
            tracksViewChanges={false} // Performance optimization for static custom views
          >
            <View style={{ width: 50, height: 50 }}>
              {marker.status === 'hujan' ? <Rainfall /> : <Sunny />}
            </View>
          </Marker>
        ))}

        {/* Marker untuk tap location saat drawing mode (biru, bukan default merah) */}
        {drawingMode && tapLocation && (
          <Marker
            coordinate={{ latitude: tapLocation.lat, longitude: tapLocation.lng }}
            title="Lokasi Baru"
            description="Titik yang akan ditambahkan"
            pinColor="blue"
          />
        )}
      </MapView>

      {/* Overlay Info Aktif */}
      {activeRegionId &&
        !showFormModal &&
        (() => {
          // Find the weather data for the active region
          const activeWeather = weatherData.find((w) => w.id === activeRegionId);
          const weatherDesc = activeWeather?.weatherDesc.toLowerCase() || '';
          const isRain = weatherDesc.includes('hujan');

          return (
            <View style={styles.infoOverlay}>
              {/* Add animations here */}
              {isRain && <Rainfall />}
              {!isRain && <Sunny />}

              <Text style={styles.infoTitle}>{DATA_DIY.find((r) => r.id === activeRegionId)?.name}</Text>
              <Text style={styles.infoText}>{activeWeather?.weatherDesc || 'Loading...'}</Text>
              <Text style={styles.infoTemp}>{activeWeather?.temp}°C</Text>
            </View>
          );
        })()}

      {/* FAB Button untuk tambah laporan / refresh */}
      {!showFormModal && (
        <View style={styles.fabContainer}>
          <TouchableOpacity style={styles.refreshFab} onPress={onRefresh} disabled={refreshing}>
            <FontAwesome name={refreshing ? 'spinner' : 'refresh'} size={24} color="white" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.fab}
            onPress={() => {
              setShowFormModal(true);
              setDrawingMode(true);
            }}
          >
            <FontAwesome name="plus" size={24} color="white" />
          </TouchableOpacity>
        </View>
      )}

      {/* Drawing Mode Indicator */}
      {drawingMode && (
        <View style={styles.drawingIndicator}>
          <FontAwesome name="crosshairs" size={20} color="white" />
          <Text style={styles.drawingText}>Tap on map to place point</Text>
        </View>
      )}

      {/* Modal Bottom Sheet untuk Form Input */}
      {showFormModal && (
        <View style={styles.modalContainer}>
          <ScrollView
            style={styles.formScroll}
            contentContainerStyle={{ paddingBottom: 100 }}
            showsVerticalScrollIndicator={false}
          >
              {/* Header */}
              <View style={styles.modalHeader}>
                <Text style={styles.formTitle}>Tambah Laporan Cuaca</Text>
                <TouchableOpacity
                  onPress={() => {
                    setShowFormModal(false);
                    setDrawingMode(false);
                    setTapLocation(null);
                  }}
                >
                  <FontAwesome name="times" size={24} color="#333" />
                </TouchableOpacity>
              </View>
              <Text style={styles.formLabel}>Nama/Deskripsi</Text>
              <TextInput
                style={styles.input}
                placeholder="Contoh: Hujan Deras di Sleman"
                value={formName}
                onChangeText={setFormName}
                placeholderTextColor="#999"
              />

              <Text style={styles.formLabel}>Koordinat</Text>
              <View style={styles.coordinateContainer}>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="Tap di map atau masuk manual"
                  value={formCoordinates}
                  onChangeText={setFormCoordinates}
                  placeholderTextColor="#999"
                />
                <TouchableOpacity style={styles.drawButton} onPress={() => setDrawingMode(!drawingMode)}>
                  <FontAwesome name={drawingMode ? 'check' : 'crosshairs'} size={18} color="white" />
                </TouchableOpacity>
              </View>
              {drawingMode && <Text style={styles.drawHint}>🗺️ Klik lokasi di map untuk menambahkan titik</Text>}

              <TouchableOpacity style={styles.btnLocation} onPress={getCoordinates}>
                <FontAwesome name="location-arrow" size={16} color="white" />
                <Text style={styles.btnLocationText}>Get Current Location</Text>
              </TouchableOpacity>

              <Text style={styles.formLabel}>Status Cuaca</Text>
              <View style={styles.statusContainer}>
                <TouchableOpacity
                  style={[styles.statusButton, formWeather === 'hujan' && styles.statusButtonActive]}
                  onPress={() => setFormWeather('hujan')}
                >
                  <Text style={styles.statusButtonText}>Hujan</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.statusButton, formWeather === 'tidak hujan' && styles.statusButtonActive]}
                  onPress={() => setFormWeather('tidak hujan')}
                >
                  <Text style={styles.statusButtonText}>Tidak Hujan</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.formLabel}>Luas Area Hujan (meter)</Text>
              <TextInput
                style={styles.input}
                placeholder="Contoh: 500 (untuk 500m radius)"
                value={formBufferRadius}
                onChangeText={setFormBufferRadius}
                keyboardType="numeric"
                placeholderTextColor="#999"
              />
              {formBufferRadius && (
                <Text style={styles.bufferHint}>Area buffer: {formBufferRadius}m radius</Text>
              )}

              <TouchableOpacity style={styles.btnSave} onPress={handleSavePoint}>
                <FontAwesome name="plus-circle" size={18} color="white" />
                <Text style={styles.btnSaveText}>Tambah Titik</Text>
              </TouchableOpacity>

              <View style={{ height: 20 }} />
            </ScrollView>
        </View>
      )}
    </View>
  );
}

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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  webMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  fab: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0275d8',
    borderRadius: 30,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    marginTop: 10,
  },
  fabContainer: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    alignItems: 'center',
  },
  refreshFab: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#5cb85c',
    borderRadius: 30,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },

  infoOverlay: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 12,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    overflow: 'hidden',
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  infoText: {
    fontSize: 14,
    color: '#007AFF',
    marginBottom: 5,
    fontWeight: '500',
  },
  infoTemp: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ff9500',
  },

  // Split Layout Form Layer
  modalContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '40%',
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  modalContent: {
    flex: 1,
  },
  coordinateContainer: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-end',
  },
  drawButton: {
    width: 45,
    height: 40,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  drawHint: {
    fontSize: 12,
    color: '#007AFF',
    fontStyle: 'italic',
    marginTop: 6,
    marginBottom: 8,
  },
  drawingIndicator: {
    position: 'absolute',
    top: 60,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  drawingText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },

  // Form styles
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingTop: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  formScroll: {
    flex: 1,
    padding: 15,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginTop: 12,
    marginBottom: 6,
  },
  input: {
    height: 40,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f9f9f9',
    color: '#333',
    fontSize: 14,
    marginBottom: 5,
  },
  btnLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#17A2B8',
    paddingVertical: 11,
    borderRadius: 8,
    marginTop: 8,
    marginBottom: 10,
  },
  btnLocationText: {
    color: 'white',
    fontWeight: '600',
    marginLeft: 8,
    fontSize: 14,
  },
  btnSave: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#28A745',
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 12,
    marginBottom: 10,
  },
  btnSaveText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 8,
    fontSize: 16,
  },
  bufferHint: {
    fontSize: 12,
    color: '#17A2B8',
    fontStyle: 'italic',
    marginTop: 4,
    marginBottom: 8,
  },
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 10,
  },
  statusButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  statusButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  statusButtonText: {
    color: '#333',
    fontWeight: '600',
  },
});
