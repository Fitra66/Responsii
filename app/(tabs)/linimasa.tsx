import { FontAwesome5 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { onValue, ref, remove } from 'firebase/database';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { db } from '../../firebase';

export default function LinimasaScreen() {
  const router = useRouter();
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // 1. READ DATA (Membaca dari Firebase Realtime) - Modul 10
  useEffect(() => {
    const pointsRef = ref(db, 'points/');

    // Listener Realtime
    const unsubscribe = onValue(
      pointsRef,
      (snapshot) => {
        const data = snapshot.val();
        if (data) {
          // Ubah Object Firebase menjadi Array
          const loadedReports = Object.keys(data).map((key) => ({
            id: key,
            ...data[key],
          }));

          // Balik urutan biar yang terbaru ada di atas (reverse)
          setReports(loadedReports.reverse());
        } else {
          setReports([]);
        }
        setLoading(false);
      },
      (error) => {
        console.error('Error reading reports:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // 2. DELETE DATA (Hapus Laporan) - Modul 11
  const handleDelete = (id: string, name: string) => {
    Alert.alert(
      '🗑️ Hapus Laporan',
      `Apakah kamu yakin ingin menghapus laporan "${name}"?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: () => {
            const itemRef = ref(db, `points/${id}`);
            remove(itemRef)
              .then(() => {
                Alert.alert('✅ Sukses', 'Laporan berhasil dihapus');
              })
              .catch((err) => {
                Alert.alert('❌ Error', 'Gagal menghapus: ' + err.message);
              });
          },
        },
      ]
    );
  };

  // 3. UPDATE DATA (Navigasi ke Form Edit) - Modul 12
  const handleEdit = (item: any) => {
    router.push({
      pathname: '/formeditlocation',
      params: {
        id: item.id,
        name: item.name,
        coordinates: item.coordinates,
        accuration: item.accuration,
      },
    });
  };

  // 4. VIEW DETAIL (Navigasi ke Peta dengan Zoom & Highlight)
  const handleViewOnMap = (item: any) => {
    const [lat, lng] = item.coordinates?.split(',').map(Number) || [0, 0];
    router.push({
      pathname: '/(tabs)',
      params: {
        lat: lat.toString(),
        long: lng.toString(),
        markerId: item.id, // ID marker untuk di-highlight
        shouldZoom: 'true', // Flag untuk memicu zoom
      },
    });
  };

  // Render per Item (Tampilan Kartu Laporan)
  const renderItem = ({ item }: { item: any }) => {
    // Ekstrak koordinat
    const [lat, lng] = item.coordinates?.split(',') || ['N/A', 'N/A'];

    // Format timestamp
    const timestamp = item.timestamp
      ? new Date(item.timestamp).toLocaleDateString('id-ID', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      : 'Waktu Tidak Diketahui';

    return (
      <View style={styles.card}>
        {/* Header Kartu */}
        <View style={styles.cardHeader}>
          <View style={styles.userInfo}>
            <View style={styles.avatar}>
              <FontAwesome5 name="user-circle" size={28} color="#007AFF" />
            </View>
            <View style={styles.userDetails}>
              <Text style={styles.userName}>👤 Pelapor</Text>
              <Text style={styles.timestamp}>📅 {timestamp}</Text>
            </View>
          </View>

          {/* Weather Icon */}
          <FontAwesome5 name="cloud-rain" size={24} color="#FF6B35" />
        </View>

        {/* Isi Laporan */}
        <View style={styles.reportBody}>
          <Text style={styles.reportTitle}>📍 Laporan:</Text>
          <Text style={styles.reportContent}>{item.name}</Text>

          <Text style={[styles.reportTitle, { marginTop: 10 }]}>📌 Lokasi:</Text>
          <Text style={styles.coordinates}>
            {lat}, {lng}
          </Text>

          <Text style={[styles.reportTitle, { marginTop: 10 }]}>📏 Akurasi:</Text>
          <Text style={styles.accuracy}>{item.accuration || 'N/A'}</Text>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.actionButton, styles.btnMap]}
            onPress={() => handleViewOnMap(item)}
          >
            <FontAwesome5 name="map-marker-alt" size={14} color="#FFF" />
            <Text style={styles.btnMapText}>Peta</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.btnEdit]}
            onPress={() => handleEdit(item)}
          >
            <FontAwesome5 name="edit" size={14} color="#FFF" />
            <Text style={styles.btnEditText}>Edit</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.btnDelete]}
            onPress={() => handleDelete(item.id, item.name)}
          >
            <FontAwesome5 name="trash" size={14} color="#FFF" />
            <Text style={styles.btnDeleteText}>Hapus</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // Firebase sudah realtime, jadi hanya simulate refresh
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  if (Platform.OS === 'web') {
    return (
      <View style={styles.container}>
        <Text style={styles.webMessage}>
          Linimasa view is not available on web. Please use mobile app.
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>☀️ Cerah atau ☁️ Mendung nih?</Text>
        <Text style={styles.headerSubtitle}>Data Laporan Warga DIY Realtime</Text>
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Memuat laporan...</Text>
        </View>
      ) : (
        <FlatList
          data={reports}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <FontAwesome5 name="inbox" size={48} color="#CCC" />
              <Text style={styles.emptyText}>Belum ada laporan cuaca</Text>
              <Text style={styles.emptySubtext}>
                Mulai dengan menambah laporan di peta
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
    fontSize: 14,
  },
  webMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
  },

  // Header
  header: {
    backgroundColor: '#FFF',
    paddingVertical: 15,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
    elevation: 2,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1C1C1E',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },

  // List
  listContent: {
    padding: 12,
  },

  // Card
  card: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    marginBottom: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#F9F9F9',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    marginRight: 12,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontWeight: '700',
    fontSize: 14,
    color: '#1C1C1E',
  },
  timestamp: {
    fontSize: 11,
    color: '#8E8E93',
    marginTop: 2,
  },

  // Report Body
  reportBody: {
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  reportTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#555',
  },
  reportContent: {
    fontSize: 15,
    color: '#1C1C1E',
    lineHeight: 20,
    fontWeight: '500',
    marginTop: 4,
    backgroundColor: '#F0F8FF',
    padding: 8,
    borderRadius: 6,
  },
  coordinates: {
    fontSize: 12,
    color: '#007AFF',
    fontFamily: 'monospace',
    marginTop: 4,
    backgroundColor: '#F0F0F0',
    padding: 6,
    borderRadius: 4,
  },
  accuracy: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },

  // Divider
  divider: {
    height: 1,
    backgroundColor: '#E8E8E8',
  },

  // Actions
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#FAFAFA',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    gap: 6,
  },
  btnMap: {
    backgroundColor: '#007AFF',
  },
  btnMapText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 12,
  },
  btnEdit: {
    backgroundColor: '#FF9500',
  },
  btnEditText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 12,
  },
  btnDelete: {
    backgroundColor: '#FF3B30',
  },
  btnDeleteText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 12,
  },

  // Empty
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#999',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 13,
    color: '#BBB',
    marginTop: 6,
    textAlign: 'center',
  },
});