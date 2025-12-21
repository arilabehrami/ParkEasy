import React, { useEffect, useState, useMemo, useRef } from "react";
import { View, Image, StyleSheet, Animated, ActivityIndicator, Platform } from "react-native";
import theme from "../app/hooks/theme";
import { resolveImage } from "./images";
import { optimizeImagePath } from "./imageOptimizer";

const DEFAULT_BG = theme.colors.chipBg || "#e6f0ec";

export default function OptimizedImage({ source, thumbnail, style = {}, resizeMode = "cover" }) {
  const [isLoaded, setIsLoaded] = useState(false); // Kontroll për ngarkimin e imazhit
  const [isPrefetched, setIsPrefetched] = useState(false); // Kontroll për imazhin që duhet të paraprefetchohet
  const opacity = useMemo(() => new Animated.Value(0), []); // Ndikon në animacion gjatë shfaqjes
  const skeletonOpacity = useRef(new Animated.Value(0.6)).current; // Opacity për skeleton placeholder

  // Marr rrugën e optimizuar duke përdorur funksionin `optimizeImagePath`
  const optimizedSource = optimizeImagePath(source);

  // Gjen burimet e imazheve sipas rezolucionit (lowRes dhe highRes)
  const resolved = (() => {
    if (!source) return null; 
    if (typeof source === "string") {
      const looked = resolveImage(source);
      if (looked) return looked;
      return { uri: source };
    }
    return source;
  })();

  const thumbResolved = (() => {
    if (!thumbnail) return null;
    if (typeof thumbnail === "string") {
      const looked = resolveImage(thumbnail);
      if (looked) return looked;
      return { uri: thumbnail };
    }
    return thumbnail;
  })();

  // Prefetch i imazheve
  useEffect(() => {
    let cancelled = false;
    const uriToPrefetch = resolved && resolved.uri ? resolved.uri : null;
    if (!uriToPrefetch) {
      setIsPrefetched(false);
      return;
    }
    Image.prefetch(uriToPrefetch)
      .then(() => {
        if (!cancelled) setIsPrefetched(true);
      })
      .catch(() => {
        if (!cancelled) setIsPrefetched(false);
      });
    return () => {
      cancelled = true;
    };
  }, [resolved]);

  // Kur `isLoaded` bëhet true, aktivizo animacionin për shfaqjen
  useEffect(() => {
    if (isLoaded) {
      Animated.timing(opacity, {
        toValue: 1,
        duration: 260,
        useNativeDriver: Platform.OS !== "web",
      }).start();
    }
  }, [isLoaded, opacity]);

  // Skeleton animacion për loading placeholder
  useEffect(() => {
    let anim;
    if (!isLoaded) {
      anim = Animated.loop(
        Animated.sequence([
          Animated.timing(skeletonOpacity, { toValue: 0.4, duration: 500, useNativeDriver: true }),
          Animated.timing(skeletonOpacity, { toValue: 0.7, duration: 500, useNativeDriver: true }),
        ])
      );
      anim.start();
    }
    return () => {
      try {
        anim && anim.stop();
      } catch {}
    };
  }, [isLoaded, skeletonOpacity]);

  // Gjerësia dhe lartësia e përgjegjshme për stilizimin e imazheve
  const explicitWidth = style?.width || null;
  const explicitHeight = style?.height || null;

  const imageStyle = [
    explicitWidth ? { width: explicitWidth } : StyleSheet.absoluteFill,
    explicitHeight ? { height: explicitHeight } : StyleSheet.absoluteFill,
    { borderRadius: style?.borderRadius || 0 },
  ];

  const lowResSource = thumbResolved || null;
  const highResSource = resolved || null;

  return (
    <View style={[styles.wrapper, style, !lowResSource && { backgroundColor: DEFAULT_BG }]}>
      {/* Skeleton Placeholder */}
      {!isLoaded && (
        <Animated.View style={[StyleSheet.absoluteFill, styles.skeleton, { opacity: skeletonOpacity }]} />
      )}
      {/* Imazhi me rezolucion të ulët */}
      {lowResSource ? (
        <Image source={lowResSource} resizeMode={resizeMode} style={imageStyle} />
      ) : null}

      {/* Placeholder për aktivitetin e ngarkimit */}
      {!lowResSource && highResSource && highResSource.uri && !isLoaded && !isPrefetched && (
        <View style={[StyleSheet.absoluteFill, styles.center]}>
          <ActivityIndicator size="small" color="#2E7D6A" />
        </View>
      )}

      {/* Imazhi final me rezolucion të lartë */}
      {highResSource && (isPrefetched || !highResSource.uri) ? (
        <Animated.Image
          source={optimizedSource || highResSource}
          resizeMode={resizeMode}
          onLoad={() => setIsLoaded(true)}
          style={[imageStyle, { opacity }]}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    overflow: "hidden",
  },
  center: {
    justifyContent: "center",
    alignItems: "center",
  },
  skeleton: {
    backgroundColor: theme.colors.divider,
  },
});