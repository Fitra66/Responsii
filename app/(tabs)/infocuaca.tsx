import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Image,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Animation Components
import Rainfall from '../../components/animations/Rainfall';
import Sunny from '../../components/animations/Sunny';

// 1. Import Data Master Poligon Kita
import { DATA_DIY } from '../../constants/jogjaData';

interface WeatherData {
  id: string;
  name: string;
  bmkgCode: string;
  coordinates: Array<{ latitude: number; longitude: number }>;
  center: { latitude: number; longitude: number };
  color: string;
  weatherDesc: string;
  temp: string;
  humidity: string;
  icon: string | null;
  localTime: string;
}

export default function WeatherListTab() {
  const router = useRouter();
  const [weatherList, setWeatherList] = useState<WeatherData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchWeatherMassal();
  }, []);

  const fetchWeatherMassal = async () => {
    try {
      // 2. Teknik Promise.all untuk mengambil 5 data sekaligus secara paralel
      const promises = DATA_DIY.map(async (region) => {
        try {
          // Gunakan bmkgCode untuk API BMKG
          const url = `https://api.bmkg.go.id/publik/prakiraan-cuaca?adm4=${region.bmkgCode}`;
          const response = await fetch(url);

          // Cek jika response BUKAN 200 OK (misal 404)
          if (!response.ok) {
            console.warn(`Gagal ambil data untuk ${region.name} (${response.status})`);
            return {
              ...region,
              weatherDesc: 'Data Error',
              temp: '-',
              humidity: '-',
              icon: null,
              localTime: new Date().toISOString(),
            };
          }

          const json = await response.json();

          // Cek apakah data tersedia di dalam JSON
          if (!json.data || !Array.isArray(json.data) || json.data.length === 0) {
            console.warn(`Tidak ada data untuk ${region.name}:`, json);
            return {
              ...region,
              weatherDesc: 'Tidak ada data',
              temp: '-',
              humidity: '-',
              icon: null,
              localTime: new Date().toISOString(),
            };
          }

          const locationData = json.data[0];
          if (!locationData.cuaca || !Array.isArray(locationData.cuaca) || locationData.cuaca.length === 0) {
            console.warn(`Tidak ada weather data untuk ${region.name}`);
            return {
              ...region,
              weatherDesc: 'Tidak ada prediksi',
              temp: '-',
              humidity: '-',
              icon: null,
              localTime: new Date().toISOString(),
            };
          }

          const dayData = locationData.cuaca[0];
          if (!Array.isArray(dayData) || dayData.length === 0) {
            console.warn(`Tidak ada jam data untuk ${region.name}`);
            return {
              ...region,
              weatherDesc: 'Data jam kosong',
              temp: '-',
              humidity: '-',
              icon: null,
              localTime: new Date().toISOString(),
            };
          }

          const current = dayData[0];

          // Fix URL Gambar (ganti spasi dengan %20)
          let iconUrl = current.image || 'https://via.placeholder.com/60';
          if (iconUrl && typeof iconUrl === 'string') {
            iconUrl = iconUrl.replace(/ /g, '%20');
          }

          return {
            ...region,
            weatherDesc: current.weather_desc || 'Tidak ada deskripsi',
            temp: current.t?.toString() || '-',
            humidity: current.hu?.toString() || '-',
            icon: iconUrl,
            localTime: current.local_datetime || new Date().toISOString(),
          };
        } catch (regionError) {
          console.error(`Error fetch ${region.name}:`, regionError);
          // Return fallback data jika error jaringan
          return {
            ...region,
            weatherDesc: 'Error Jaringan',
            temp: '-',
            humidity: '-',
            icon: null,
            localTime: new Date().toISOString(),
          };
        }
      });

      // Tunggu semua request selesai baru update state
      const results = await Promise.all(promises);
      setWeatherList(results.filter(Boolean) as WeatherData[]);
      setLoading(false);
    } catch (error) {
      console.error('Gagal ambil data:', error);
      // Set fallback data
      const fallbackData = DATA_DIY.map(region => ({
        ...region,
        weatherDesc: 'Tidak dapat terhubung',
        temp: '-',
        humidity: '-',
        icon: null,
        localTime: new Date().toISOString(),
      })) as WeatherData[];
      setWeatherList(fallbackData);
      setLoading(false);
    }
  };

  const handleLihatPeta = (item: WeatherData) => {
    // 3. Navigasi ke Tab 1 (index) sambil bawa oleh-oleh (params)
    // Kita kirim koordinat tengah (center), ID wilayahnya, dan flag untuk zoom otomatis
    router.push({
      pathname: '/(tabs)',
      params: {
        lat: item.center.latitude.toString(),
        long: item.center.longitude.toString(),
        highlightId: item.id,
        shouldZoom: 'true',
      },
    });
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchWeatherMassal();
    } catch (err) {
      console.error('Refresh error:', err);
    } finally {
      setRefreshing(false);
    }
  };

  const renderItem = ({ item }: { item: WeatherData }) => {
    const isRain = item.weatherDesc.toLowerCase().includes('hujan');

    return (
      <View style={styles.card}>
        {/* Render animations conditionally */}
        {isRain && <Rainfall />}
        {!isRain && <Sunny />}

        <View style={styles.cardContent}>
          {/* Kolom Kiri: Info Wilayah & Cuaca */}
          <View style={{ flex: 1 }}>
            <Text style={styles.regionName}>{item.name}</Text>
            <Text style={styles.weatherText}>{item.weatherDesc}</Text>
            <View style={styles.row}>
              <Text style={styles.tempText}>{item.temp}°C</Text>
              <Text style={styles.subText}> | Kelembapan: {item.humidity}%</Text>
            </View>
          </View>

          {/* Kolom Kanan: Icon Cuaca */}
          {item.icon && (
            <Image source={{ uri: item.icon }} style={styles.icon} />
          )}
        </View>

        {/* Tombol Aksi */}
        <TouchableOpacity
          style={[
            styles.button,
            { backgroundColor: item.color.replace('0.3', '1') },
          ]}
          onPress={() => handleLihatPeta(item)}>
          <Text style={styles.buttonText}>Lihat di Peta Radar</Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={{ marginTop: 10 }}>Menghubungi Satelit BMKG...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Pantauan Wilayah DIY</Text>
        <Text style={styles.headerSub}>Data Realtime BMKG</Text>
      </View>

      <FlatList
        data={weatherList}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 15 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#007AFF"
          />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header: {
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    elevation: 2,
  },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#333' },
  headerSub: { fontSize: 12, color: '#666', marginTop: 2 },

  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    overflow: 'hidden', // Contain the animation within the card
  },
  cardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  regionName: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  weatherText: {
    fontSize: 14,
    color: '#007AFF',
    marginVertical: 4,
    fontWeight: '600',
  },
  row: { flexDirection: 'row', alignItems: 'center' },
  tempText: { fontSize: 24, fontWeight: 'bold', color: '#ff9500' },
  subText: { fontSize: 12, color: '#888' },

  icon: { width: 60, height: 60 },

  button: {
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: { color: 'white', fontWeight: 'bold' },
});