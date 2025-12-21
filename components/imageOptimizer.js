export function optimizeImagePath(source) {
  if (!source) return null;

  if (typeof source === "string" && (source.startsWith("http://") || source.startsWith("https://"))) {
    return { uri: source };
  }

  try {
    const trimmedSource = source.uri || source;
    const optimizedPath = trimmedSource.replace(
      /^assets\/images\//,
      "assets/optimized-images/"
    ); 
    return optimizedPath.includes("optimized-images") ? require(`./${optimizedPath}`) : source;
  } catch (e) {
    console.error("Error resolving optimized image path:", e);
    return source;
  }
}