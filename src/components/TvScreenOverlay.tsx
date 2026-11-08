export function TvScreenOverlay() {
  return (
    <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden crt-flicker rounded-lg">
      {/* 1. Fine CRT Scanlines covering both 2D grid and 3D falling cube */}
      <div className="absolute inset-0 crt-scanlines" />

      {/* 2. Micro RGB Phosphor Aperture Grille Mask */}
      <div className="absolute inset-0 crt-phosphor-mask opacity-85" />

      {/* 3. Rolling CRT Refresh Scan Beam drifting smoothly downward */}
      <div className="absolute inset-x-0 -top-28 h-28 crt-roll-bar" />

      {/* 4. Specular Curved Glass Glare across upper-left */}
      <div className="absolute inset-0 crt-glass-glare" />

      {/* 5. Deep CRT Vignette & Convex Tube Inner Shadows */}
      <div className="absolute inset-0 crt-vignette" />
    </div>
  );
}

