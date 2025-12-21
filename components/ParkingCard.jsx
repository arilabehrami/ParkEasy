import React, { useEffect, useState, useCallback } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import theme from "../app/hooks/theme";
import { colors } from "../app/hooks/theme";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { auth, db } from "../firebase/firebase";
import { collection, addDoc, Timestamp } from "firebase/firestore";
import OptimizedImage from "./OptimizedImage";
import AnimatedTouchable from "./animation/AnimatedTouchable";

function ParkingCard({ item, hideReserve, blur = false }) {
  const [isFavorite, setIsFavorite] = useState(item?.isFavorite);

  useEffect(() => {
    setIsFavorite(item?.isFavorite);
  }, [item?.isFavorite]);

  const toggleFavorite = useCallback(() => {
    setIsFavorite((prev) => !prev);
    if (item?.onFavoriteToggle) item.onFavoriteToggle();
  }, [item]);

  const handleReserve = useCallback(async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert("Error", "You must be logged in to reserve.");
        return;
      }
      await addDoc(collection(db, "bookings"), {
        userId: user.uid,
        userEmail: user.email,
        parkingId: item.id,
        parkingName: item.name,
        date: new Date().toISOString().slice(0, 10),
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        createdAt: Timestamp.now(),
      });
      router.push({
        pathname: "/(tabs)/BookParkingScreen",
        params: { id: item.id, name: item.name },
      });
    } catch (err) {
      Alert.alert("Error", "Failed to reserve parking.");
    }
  }, [item?.id, item?.name]);

  const showDetails = useCallback(() => {
    Alert.alert(
      "Parking Details",
      `Name: ${item.name}\nDistance: ${item.distance}\nPrice: ${item.price}\nAvailable Spots: ${item.spots || item.freeSpots}`
    );
  }, [item]);

  return (
    <View style={{ marginBottom: 15, marginHorizontal: 16 }}>
      <AnimatedTouchable onPress={showDetails} style={{ borderRadius: 14 }}>
        <LinearGradient
          colors={[theme.colors.secondary, theme.colors.secondary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.card}
        >
          <View>
            {/* Përdorimi i `OptimizedImage` për të shfaqur imazhet e parkingjeve */}
            <OptimizedImage source={item.photoUri || item.image} thumbnail={item.imageThumb || null} style={styles.image} />
            <LinearGradient
              colors={["rgba(0,0,0,0.5)", "rgba(0,0,0,0.0)"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.overlayTop}
            />
            {!blur && (
              <LinearGradient
                colors={["rgba(0,0,0,0.0)", "rgba(0,0,0,0.5)"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={styles.overlayBottom}
              />
            )}
            {blur && <View style={styles.blurBottomFallback} />}
          </View>

          <View style={styles.infoContainer}>
            <Text style={styles.bookingId}>ID: {item.id}</Text>
            <Text style={styles.name}>{item.name}</Text>

            <View style={styles.addressContainer}>
              <Ionicons name="location-outline" size={14} color={theme.colors.pickerDoneText} />
              <Text style={styles.address}>{item.address}</Text>
            </View>

            <View style={styles.detailsRow}>
              <Text style={styles.detail}>Distance: {item.distance}</Text>
              <Text style={styles.detail}>Price: {item.price}</Text>
            </View>

            <Text style={styles.detail}>Available: {item.spots || item.freeSpots} spots</Text>
          </View>

          <TouchableOpacity onPress={toggleFavorite} style={styles.bookmarkWrapper}>
            <Ionicons
              name={isFavorite ? "bookmark" : "bookmark-outline"}
              size={22}
              color={isFavorite ? "#e5d058ff" : theme.colors.pickerDoneText}
            />
          </TouchableOpacity>

          {!hideReserve && (
            <AnimatedTouchable style={styles.reserveBadge} onPress={handleReserve}>
              <Ionicons name="calendar-outline" size={16} color={theme.colors.pickerDoneText} style={{ marginRight: 4 }} />
              <Text style={styles.reserveBadgeText}>Reserve</Text>
            </AnimatedTouchable>
          )}
        </LinearGradient>
      </AnimatedTouchable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    borderRadius: 14,
    overflow: "hidden",
    elevation: 4,
    padding: 8,
    position: "relative",
  },

  image: {
    width: 120,
    height: 130,
    borderRadius: 12,
  },
  overlayTop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 60,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  overlayBottom: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 70,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  blurBottomFallback: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 70,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    backgroundColor: "rgba(0,0,0,0.25)",
  },

  infoContainer: {
    flex: 1,
    padding: 12,
    padding: theme.spacing.xs + 2,
  },

  bookingId: { fontSize: 12, color: theme.colors.pickerDoneText },
  name: { fontSize: 16, fontWeight: "bold", color: theme.colors.pickerDoneText, marginVertical: 4 },

  addressContainer: { flexDirection: "row", alignItems: "center" },
  address: { color: theme.colors.pickerDoneText, marginLeft: 4, fontSize: 12 },

  detailsRow: { flexDirection: "row", justifyContent: "space-between" },
  detail: { color: theme.colors.pickerDoneText, fontSize: 12, marginTop: 2 },

  bookmarkWrapper: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: theme.colors.backdrop,
    padding: 6,
    borderRadius: 20,
  },
  reserveBadge: {
    position: "absolute",
    bottom: 10,
    right: 10,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primary,
    paddingVertical: theme.spacing.xs + 2,
    paddingHorizontal: theme.spacing.md + 2,
    borderRadius: 25,
    elevation: 6,
  },

  reserveBadgeText: {
    color: theme.colors.pickerDoneText,
    fontWeight: "700",
    fontSize: 14,
  },
});

function areEqual(prevProps, nextProps) {
  const p = prevProps.item || {};
  const n = nextProps.item || {};

  if (p.id !== n.id) return false;

  if (p.isFavorite !== n.isFavorite) return false;

  if (p.distance !== n.distance) return false;
  if (p.price !== n.price) return false;
  if ((p.spots || p.freeSpots) !== (n.spots || n.freeSpots)) return false;

  const pImg = typeof (p.photoUri || p.image) === "string" ? (p.photoUri || p.image) : (p.photoUri || p.image)?.uri;
  const nImg = typeof (n.photoUri || n.image) === "string" ? (n.photoUri || n.image) : (n.photoUri || n.image)?.uri;
  if (pImg !== nImg) return false;

  if (p.photoUri !== n.photoUri) return false;

  if (prevProps.hideReserve !== nextProps.hideReserve) return false;

  return true;
}

export default React.memo(ParkingCard, areEqual);