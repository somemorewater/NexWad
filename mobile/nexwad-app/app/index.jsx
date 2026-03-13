import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Animated,
  Dimensions,
} from "react-native";
import { router } from "expo-router";

const { width, height } = Dimensions.get("window");

const slides = [
  {
    tag: "COMMUNITY",
    title: "Campus,\nConnected.",
    description:
      "Join conversations and stay in sync with your AFIT community — all in one place.",
    accent: "#F97316",
    bg: "#0F172A",
    shape: "circle",
  },
  {
    tag: "MARKETPLACE",
    title: "Buy & Sell\nEasily.",
    description:
      "Books, gadgets, services — a marketplace built by students, for students.",
    accent: "#22D3EE",
    bg: "#0C1A2E",
    shape: "triangle",
  },
  {
    tag: "YOUR CAMPUS",
    title: "Built for\nStudents.",
    description:
      "Simple. Fast. Secure. Your entire digital campus in your pocket.",
    accent: "#A3E635",
    bg: "#111827",
    shape: "square",
  },
];

function GeometricShape({ shape, color, style }) {
  const pulse = useRef(new Animated.Value(1)).current;
  const rotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.08, duration: 2200, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 2200, useNativeDriver: true }),
      ])
    ).start();
    Animated.loop(
      Animated.timing(rotate, { toValue: 1, duration: 12000, useNativeDriver: true })
    ).start();
  }, []);

  const spin = rotate.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });

  if (shape === "circle") {
    return (
      <Animated.View
        style={[
          styles.shapeBase,
          style,
          {
            width: 280,
            height: 280,
            borderRadius: 140,
            borderWidth: 1.5,
            borderColor: color + "30",
            transform: [{ scale: pulse }],
          },
        ]}
      >
        <View style={[styles.innerCircle, { borderColor: color + "20" }]} />
      </Animated.View>
    );
  }
  if (shape === "triangle") {
    return (
      <Animated.View style={[style, { transform: [{ rotate: spin }] }]}>
        <View
          style={{
            width: 0,
            height: 0,
            borderLeftWidth: 130,
            borderRightWidth: 130,
            borderBottomWidth: 220,
            borderLeftColor: "transparent",
            borderRightColor: "transparent",
            borderBottomColor: color + "18",
          }}
        />
      </Animated.View>
    );
  }
  return (
    <Animated.View
      style={[
        style,
        {
          width: 200,
          height: 200,
          borderWidth: 1.5,
          borderColor: color + "25",
          transform: [{ rotate: spin }, { scale: pulse }],
        },
      ]}
    />
  );
}

export default function Onboarding() {
  const [current, setCurrent] = useState(0);

  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleY = useRef(new Animated.Value(24)).current;
  const descOpacity = useRef(new Animated.Value(0)).current;
  const descY = useRef(new Animated.Value(16)).current;
  const tagOpacity = useRef(new Animated.Value(0)).current;
  const bgOpacity = useRef(new Animated.Value(1)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;

  const slide = slides[current];

  useEffect(() => {
    titleOpacity.setValue(0);
    titleY.setValue(28);
    descOpacity.setValue(0);
    descY.setValue(16);
    tagOpacity.setValue(0);

    Animated.stagger(80, [
      Animated.parallel([
        Animated.timing(tagOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(titleOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.spring(titleY, { toValue: 0, tension: 80, friction: 10, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(descOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.spring(descY, { toValue: 0, tension: 80, friction: 10, useNativeDriver: true }),
      ]),
    ]).start();
  }, [current]);

  const handleNext = () => {
    Animated.sequence([
      Animated.timing(buttonScale, { toValue: 0.94, duration: 80, useNativeDriver: true }),
      Animated.timing(buttonScale, { toValue: 1, duration: 120, useNativeDriver: true }),
    ]).start();

    Animated.parallel([
      Animated.timing(titleOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(descOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => {
      if (current < slides.length - 1) {
        setCurrent(current + 1);
      } else {
        router.replace("/signup");
      }
    });
  };

  const isLast = current === slides.length - 1;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: slide.bg }]}>
      <StatusBar barStyle="light-content" backgroundColor={slide.bg} />

      {/* Background geometric shape */}
      <GeometricShape
        shape={slide.shape}
        color={slide.accent}
        style={styles.bgShape}
      />

      {/* Dot grid overlay */}
      <View style={styles.dotGrid} pointerEvents="none">
        {Array.from({ length: 80 }).map((_, i) => (
          <View
            key={i}
            style={[styles.gridDot, { opacity: 0.06 + (i % 3) * 0.02 }]}
          />
        ))}
      </View>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.logo}>
          NEX<Text style={[styles.logoAccent, { color: slide.accent }]}>WAD</Text>
        </Text>
        <TouchableOpacity onPress={() => router.replace("/signup")}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Animated.Text style={[styles.tag, { color: slide.accent, opacity: tagOpacity }]}>
          {slide.tag}
        </Animated.Text>

        <Animated.Text
          style={[
            styles.title,
            { opacity: titleOpacity, transform: [{ translateY: titleY }] },
          ]}
        >
          {slide.title}
        </Animated.Text>

        <Animated.Text
          style={[
            styles.description,
            { opacity: descOpacity, transform: [{ translateY: descY }] },
          ]}
        >
          {slide.description}
        </Animated.Text>
      </View>

      {/* Bottom */}
      <View style={styles.bottom}>
        {/* Progress bar dots */}
        <View style={styles.dotsRow}>
          {slides.map((s, i) => (
            <View key={i} style={styles.dotTrack}>
              <View
                style={[
                  styles.dotFill,
                  {
                    backgroundColor: i === current ? s.accent : "#FFFFFF15",
                    width: i === current ? 28 : 8,
                  },
                ]}
              />
            </View>
          ))}
        </View>

        {/* Main button */}
        <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: slide.accent }]}
            onPress={handleNext}
            activeOpacity={0.88}
          >
            <Text style={[styles.buttonText, { color: slide.bg }]}>
              {isLast ? "Get Started →" : "Continue →"}
            </Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Sign in link */}
        {isLast && (
          <TouchableOpacity
            style={styles.signinRow}
            onPress={() => router.push("/login")}
          >
            <Text style={styles.signinText}>
              Already have an account?{" "}
              <Text style={[styles.signinLink, { color: slide.accent }]}>Sign in</Text>
            </Text>
          </TouchableOpacity>
        )}

        {!isLast && <View style={styles.signinSpacer} />}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 28,
  },
  bgShape: {
    position: "absolute",
    top: -60,
    right: -60,
    zIndex: 0,
  },
  dotGrid: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 20,
    gap: 22,
    zIndex: 0,
  },
  gridDot: {
    width: 2,
    height: 2,
    borderRadius: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 20,
    zIndex: 10,
  },
  logo: {
    fontSize: 30,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 2,
  },
  logoAccent: {
    fontWeight: "800",
  },
  skipText: {
    color: "#FFFFFF50",
    fontSize: 14,
    fontWeight: "500",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    zIndex: 10,
    paddingTop: 20,
  },
  tag: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 3,
    marginBottom: 18,
  },
  title: {
    fontSize: 46,
    fontWeight: "800",
    color: "#FFFFFF",
    lineHeight: 52,
    marginBottom: 24,
    letterSpacing: -1,
  },
  description: {
    fontSize: 16,
    color: "#94A3B8",
    lineHeight: 26,
    fontWeight: "400",
    maxWidth: "85%",
  },
  bottom: {
    marginBottom: 36,
    zIndex: 10,
  },
  dotsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 28,
  },
  dotTrack: {
    height: 8,
    justifyContent: "center",
  },
  dotFill: {
    height: 8,
    borderRadius: 4,
  },
  button: {
    height: 58,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.4,
  },
  signinRow: {
    marginTop: 20,
    alignItems: "center",
  },
  signinText: {
    color: "#64748B",
    fontSize: 14,
  },
  signinLink: {
    fontWeight: "700",
  },
  signinSpacer: {
    height: 54,
  },
  shapeBase: {
    alignItems: "center",
    justifyContent: "center",
  },
  innerCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 1,
    position: "absolute",
  },
});
