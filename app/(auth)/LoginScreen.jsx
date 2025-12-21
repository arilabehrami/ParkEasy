import React, { useState, useRef } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Alert,
  Platform,
  ScrollView,
  Animated
} from "react-native";
import AnimatedTouchable from "../../components/animation/AnimatedTouchable";
import { colors, spacing, radii } from "../hooks/theme";
import { useRouter } from "expo-router";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "../../firebase/firebase";
import GoogleAuthButton from "../../components/GoogleAuthButton";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function LoginScreen() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  const showAlert = (title, message) => {
    if (Platform.OS === "web") alert(`${title}\n\n${message}`);
    else Alert.alert(title, message);
  };

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validatePassword = (password) =>
    /^(?=.*[A-Z])(?=.*\d).{8,}$/.test(password);

  const handleLogin = async () => {
    setModalVisible(true);
    if (!email || !password)
      return showAlert("Error", "Please fill in all fields.");

    if (!validateEmail(email))
      return showAlert("Error", "Invalid email format.");

    if (!validatePassword(password))
      return showAlert(
        "Error",
        "Password must be at least 8 characters, include one uppercase letter and one number."
      );

    setLoading(true);

    try {
      const userCred = await signInWithEmailAndPassword(auth, email, password);
      const uid = userCred.user.uid;

      const normalizedEmail = email.trim().toLowerCase();
      const ref = doc(db, "users", uid);
      const snap = await getDoc(ref);

      let role = "user";
      let status = "active";
      let userData = null;

    
      if (snap.exists()) {
        const data = snap.data();
        role = data.role || "user";
        status = data.ownerStatus || "none";
        userData = data; 

        if (data.status === "inactive") {
          showAlert(
            "Account Disabled",
            "This account has been deactivated by an admin."
          );
          await auth.signOut();
          setLoading(false);
          return;
        }
      }

    
      if (normalizedEmail === "admin12@gmail.com") {
        role = "admin";
        await setDoc(
          ref,
          {
            id: uid,
            email: normalizedEmail,
            role: "admin",
            status: "active",
            createdAt: new Date(),
          },
          { merge: true }
        );
      }

      const existingDataRaw = await AsyncStorage.getItem("currentUser");
      let existingData = null;
      if (existingDataRaw) {
        try {
          existingData = JSON.parse(existingDataRaw);
        } catch {}
      }

      
      const mergeUserData = (role, defaultName) => ({
        id: uid,
        email: normalizedEmail,
        name: userData?.name || existingData?.name || defaultName,
        phone: userData?.phone || existingData?.phone || "",
        password: password,
        role: role,
        avatarUri: userData?.avatarUri || userData?.image || existingData?.avatarUri || "",
      });

  
      if (role === "admin") {
        await AsyncStorage.setItem(
          "currentUser",
          JSON.stringify(mergeUserData("admin", "Admin"))
        );
        router.replace("/admin");
        setLoading(false);
        return;
      }

    
      if (role === "owner") {
        await AsyncStorage.setItem(
          "currentUser",
          JSON.stringify(mergeUserData("owner", "Owner"))
        );
      
        router.replace("/owner/home");
        setLoading(false);
        return;
      }


      const userDataToSave = mergeUserData("user", "User");
      
      
      if (!userData?.name || !userData?.phone) {
        await setDoc(
          ref,
          {
            name: userDataToSave.name,
            phone: userDataToSave.phone,
            avatarUri: userDataToSave.avatarUri,
          },
          { merge: true }
        );
      }
      
      await AsyncStorage.setItem("currentUser", JSON.stringify(userDataToSave));
      
      setModalVisible(false);
      router.replace("/(tabs)/nearby");
      setLoading(false);
      return;
    } catch (err) {
      setModalVisible(false);
      showAlert("Login Error", err.message);
    }

    setLoading(false);
  };


  const shadowAnim = useRef(new Animated.Value(8)).current;
  const handleCardPressIn = () => {
    Animated.spring(shadowAnim, { toValue: 20, useNativeDriver: false, friction: 6, tension: 60 }).start();
  };
  const handleCardPressOut = () => {
    Animated.spring(shadowAnim, { toValue: 8, useNativeDriver: false, friction: 6, tension: 60 }).start();
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#E9F8F6' }} contentContainerStyle={styles.outerContainer}>
      <Animated.View
        style={[
          styles.card,
          { shadowRadius: shadowAnim, elevation: shadowAnim }
        ]}
        onTouchStart={handleCardPressIn}
        onTouchEnd={handleCardPressOut}
        onTouchCancel={handleCardPressOut}
      >
        <Text style={styles.cardTitle}>Login</Text>
        <Text style={styles.subtitle}>Access your Parking App account</Text>

        <TextInput
          placeholder="Email"
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <TextInput
          placeholder="Password"
          secureTextEntry
          style={styles.input}
          value={password}
          onChangeText={setPassword}
        />

        <View style={styles.buttonGroup}>
          <AnimatedTouchable style={styles.button} onPress={handleLogin} disabled={loading}>
            <Text style={styles.buttonText}>{loading ? "Loading..." : "Login"}</Text>
          </AnimatedTouchable>
          <View style={styles.googleButtonWrapper}>
            <GoogleAuthButton mode="login" style={{ width: '100%' }} />
          </View>
        </View>

        <AnimatedTouchable onPress={() => router.push("/RegisterScreen")}> 
          <Text style={styles.switchText}>
            Don’t have an account? <Text style={styles.link}>Sign up</Text>
          </Text>
        </AnimatedTouchable>

      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100%',
    paddingVertical: 40,
  },
  card: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '90%',
    backgroundColor: '#FFFFFFDD',
    borderRadius: 20,
    paddingVertical: 44,
    paddingHorizontal: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
    maxWidth: 400,
  },
  cardTitle: {
    fontSize: 38,
    fontWeight: '900',
    color: colors.primary,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.15)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    marginBottom: 16,
  },
  subtitle: {
    textAlign: 'center',
    color: colors.textMuted,
    marginBottom: 20,
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    backgroundColor: '#FFF',
  },
  buttonGroup: {
    width: '100%',
    gap: 12,
  },
  googleButtonWrapper: {
    width: '100%',
    marginTop: 12,
  },
  button: {
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: radii.md,
    width: "100%",
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: {
    color: colors.textOnPrimary,
    fontWeight: "bold",
    fontSize: 16,
  },
  switchText: {
    marginTop: 15,
    color: colors.textMuted,
    textAlign: 'center',
  },
  link: {
    color: colors.primary,
    fontWeight: 'bold',
  },
});