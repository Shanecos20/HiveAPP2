import React, { useState, useEffect } from 'react';
import { Text, View, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Camera, CameraView } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import theme from '../utils/theme';

const QRCodeScanner = ({ onScan, onClose }) => {
  const [hasPermission, setHasPermission] = useState(null);
  const [scanned, setScanned] = useState(false);
  const [cameraError, setCameraError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Camera.requestCameraPermissionsAsync();
        setHasPermission(status === 'granted');

        if (status !== 'granted') {
          Alert.alert(
            'Camera Permission Required',
            'We need camera permission to scan QR codes. Please allow camera access in your settings.',
            [{ text: 'OK', onPress: onClose }]
          );
        }
      } catch (err) {
        console.error('Camera permission error:', err);
        setCameraError('Error initializing camera');
        Alert.alert(
          'Camera Error',
          'There was an error accessing the camera. Please try again later.',
          [{ text: 'OK', onPress: onClose }]
        );
      }
    })();
  }, []);

  const handleBarcodeScanned = ({ data }) => {
    setScanned(true);
    onScan(data);
  };

  if (cameraError) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>{cameraError}</Text>
        <TouchableOpacity style={styles.closeButtonTop} onPress={onClose}>
          <Ionicons name="close" size={28} color="white" />
        </TouchableOpacity>
      </View>
    );
  }

  if (hasPermission === null) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>Requesting camera permission...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>No access to camera</Text>
        <TouchableOpacity style={styles.closeButtonTop} onPress={onClose}>
          <Ionicons name="close" size={28} color="white" />
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {hasPermission && !cameraError ? (
        <CameraView
          style={styles.scanner}
          facing="back" 
          onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
          barcodeScannerSettings={{
            barcodeTypes: ['qr', 'aztec', 'pdf417', 'datamatrix'],
          }}
        />
      ) : (
        <View
          style={[
            styles.scanner,
            { backgroundColor: 'black', justifyContent: 'center', alignItems: 'center' },
          ]}
        >
          <Text style={{ color: 'white' }}>
            {cameraError || 'Camera not available'}
          </Text>
        </View>
      )}

      {!cameraError && hasPermission && (
        <View style={styles.overlay}>
          <View style={styles.upperRow}>
            <TouchableOpacity style={styles.closeButtonTop} onPress={onClose}>
              <Ionicons name="close" size={28} color="white" />
            </TouchableOpacity>
          </View>

          <View style={styles.scanArea}>
            <View style={styles.cornerTopLeft} />
            <View style={styles.cornerTopRight} />
            <View style={styles.cornerBottomLeft} />
            <View style={styles.cornerBottomRight} />
          </View>

          <View style={styles.lowerRow}>
            <Text style={styles.scanText}>Scan QR code on hive</Text>

            {scanned && (
              <TouchableOpacity
                style={styles.scanAgainButton}
                onPress={() => setScanned(false)}
              >
                <Text style={styles.scanAgainText}>Tap to Scan Again</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  permissionContainer: {
    flex: 1,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  permissionText: {
    fontSize: theme.typography.bodyLarge,
    color: 'white',
    textAlign: 'center',
    marginBottom: theme.spacing.medium,
  },
  closeButtonTop: {
    position: 'absolute',
    top: 50,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1001,
  },
  container: {
    flex: 1,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  scanner: {
    ...StyleSheet.absoluteFillObject,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  upperRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingTop: theme.spacing.large + 20,
    paddingRight: theme.spacing.medium,
  },
  scanArea: {
    width: 250,
    height: 250,
    position: 'relative',
  },
  cornerTopLeft: {
    position: 'absolute',
    top: -2,
    left: -2,
    width: 40,
    height: 40,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderColor: theme.colors.primary,
  },
  cornerTopRight: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 40,
    height: 40,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderColor: theme.colors.primary,
  },
  cornerBottomLeft: {
    position: 'absolute',
    bottom: -2,
    left: -2,
    width: 40,
    height: 40,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderColor: theme.colors.primary,
  },
  cornerBottomRight: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 40,
    height: 40,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderColor: theme.colors.primary,
  },
  lowerRow: {
    width: '100%',
    alignItems: 'center',
    paddingBottom: theme.spacing.large * 2,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingTop: theme.spacing.medium,
  },
  scanText: {
    color: 'white',
    fontSize: theme.typography.bodyLarge,
    fontWeight: 'bold',
    marginBottom: theme.spacing.medium,
  },
  scanAgainButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.medium,
    paddingVertical: theme.spacing.small,
    borderRadius: theme.layout.borderRadiusSmall,
    marginTop: theme.spacing.small,
  },
  scanAgainText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default QRCodeScanner;
