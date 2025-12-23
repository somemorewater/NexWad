import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  SafeAreaView,
  TouchableOpacity,
} from "react-native";
import { router } from "expo-router";

const slides = [
  {
    title: "Buy & Sell on Campus",
    text: "Discover textbooks, gadgets, services and more from students around you.",
    illustration: "🛍️",
  },
  {
    title: "Advertise Your Products",
    text: "Sellers promote products directly on the feed where students scroll daily.",
    illustration: "📢",
  },
  {
    title: "Safe & Verified",
    text: "Students and sellers are verified to keep the marketplace trusted.",
    illustration: "🔐",
  },
];

export default function Intro() {
  const [index, setIndex] = useState(0);
  const isLast = index === slides.length - 1;

  return (
    <SafeAreaView style={styles.container}>
      {/* LOGO */}
      <Image
        source={require("../assets/icon.png")}
        style={styles.logo}
      />

      {/* CONTENT */}
      <View style={styles.content}>
        <Text style={styles.illustration}>
          {slides[index].illustration}
        </Text>

        <Text style={styles.title}>
          {slides[index].title}
        </Text>

        <Text style={styles.text}>
          {slides[index].text}
        </Text>
      </View>

      {/* INDICATORS */}
      <View style={styles.dots}>
        {slides.map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              i === index && styles.activeDot,
            ]}
          />
        ))}
      </View>

      {/* BUTTONS */}
      <View style={styles.footer}>
        {!isLast ? (
          <TouchableOpacity
            style={styles.nextBtn}
            onPress={() => setIndex(index + 1)}
          >
            <Text style={styles.nextText}>Next</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.startBtn}
            onPress={() => router.replace("/setup")}
          >
            <Text style={styles.startText}>Get Started</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity onPress={() => router.replace("/login")}>
          <Text style={styles.loginText}>
            I already have an account
          </Text>
        </TouchableOpacity>

        {!isLast && (
          <TouchableOpacity onPress={() => router.replace("/setup")}>
            <Text style={styles.skip}>Skip</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    justifyContent: "space-between",
    padding: 24,
  },

  logo: {
    width: 100,
    height: 100,
    alignSelf: "center",
    marginTop: 20,
  },

  content: {
    marginTop: 40,
    alignItems: "center",
  },

  illustration: {
    fontSize: 64,
    marginBottom: 20,
  },

  title: {
    fontSize: 28,
    fontWeight: "800",
    marginBottom: 12,
    textAlign: "center",
  },

  text: {
    fontSize: 15,
    color: "#555",
    lineHeight: 22,
    textAlign: "center",
  },

  dots: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 30,
  },

  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#ccc",
    marginHorizontal: 5,
  },

  activeDot: {
    backgroundColor: "#1D9BF0",
    width: 16,
  },

  footer: {
    alignItems: "center",
  },

  nextBtn: {
    backgroundColor: "#1D9BF0",
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 12,
    marginBottom: 12,
  },

  nextText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },

  startBtn: {
    backgroundColor: "#1D9BF0",
    paddingVertical: 14,
    paddingHorizontal: 50,
    borderRadius: 12,
    marginBottom: 12,
  },

  startText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 16,
  },

  loginText: {
    color: "#1D9BF0",
    marginTop: 10,
    fontWeight: "600",
  },

  skip: {
    color: "#888",
    marginTop: 6,
  },
});
