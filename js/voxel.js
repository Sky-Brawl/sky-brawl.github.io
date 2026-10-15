// Sky Brawl · voxel look: makes every model blocky. Loads before the game files.
/* ---------- Voxel look (Sky Brawl) ----------
   Runs before any model is built: round geometry becomes blocky, so every character, prop and stage
   piece comes out made of cubes without touching the model code. The original round classes stay
   available as THREE.RoundSphere / THREE.RoundCylinder for things that must stay round (hitbox view,
   shield bubble). Toon materials also get a pixel "texture" (see VOXEL_GRAIN below). */
(() => {
  const T = THREE, PI = Math.PI;
  const Sphere = T.SphereGeometry, Cyl = T.CylinderGeometry, Torus = T.TorusGeometry, Lathe = T.LatheGeometry;
  const Ring = T.RingGeometry, Circle = T.CircleGeometry;
  T.RoundSphere = Sphere; T.RoundCylinder = Cyl;
  const _b = new T.Box3();
  // A cube that fills the same part of space as the round shape: its bounding box pulled in a little
  // toward the shape's centre, so a sphere of radius r becomes a cube of side about 1.64r
  const boxFrom = (round, k, cx = 0, cy = 0, cz = 0) => {
    round.computeBoundingBox(); _b.copy(round.boundingBox); round.dispose();
    const lo = _b.min, hi = _b.max;
    const sx = Math.max((hi.x - lo.x)*k, .01), sy = Math.max((hi.y - lo.y)*k, .01), sz = Math.max((hi.z - lo.z)*k, .01);
    const g = new T.BoxGeometry(sx, sy, sz);
    g.translate(cx + ((lo.x + hi.x)/2 - cx)*k, cy + ((lo.y + hi.y)/2 - cy)*k, cz + ((lo.z + hi.z)/2 - cz)*k);
    return g;
  };
  T.SphereGeometry = function(r = 1, w, h, ps = 0, pl = PI*2, ts = 0, tl = PI){
    return boxFrom(new Sphere(r, 16, 12, ps, pl, ts, tl), .82);
  };
  T.CylinderGeometry = function(rt = 1, rb = 1, h = 1, rs, hs = 1, open = false, ts = 0, tl = PI*2){
    if (tl < PI*2 - 1e-3) return new Cyl(rt, rb, h, Math.max(4, Math.min(rs || 8, 6)), hs, open, ts, tl);
    // Four sides turned 45 degrees = a square post; radius scaled so the square is about as wide as the circle was
    const g = new Cyl(rt*1.25, rb*1.25, h, 4, 1, open); g.rotateY(PI/4); return g;
  };
  T.ConeGeometry = function(r = 1, h = 1, rs, hs, open = false, ts = 0, tl = PI*2){ return T.CylinderGeometry(0, r, h, 4, 1, open, ts, tl); };
  T.TorusGeometry = function(R = 1, t = .4, rs, ts, arc = PI*2){
    const n = arc < PI*2 - 1e-3 ? Math.max(3, Math.round(arc/(PI/4))) : (R < 1.2 ? 4 : 8);
    const g = new Torus(R*(n === 4 ? 1.2 : 1.05), t*1.1, 4, n, arc);
    if (n === 4) g.rotateZ(PI/4);
    return g;
  };
  T.LatheGeometry = function(pts, seg, ps = 0, pl = PI*2){
    if (pl < PI*2 - 1e-3) return new Lathe(pts, Math.min(seg || 12, 6), ps, pl);
    const g = new Lathe(pts, 4); g.rotateY(PI/4); g.scale(1.25, 1, 1.25); return g;
  };
  T.RingGeometry = function(ri = .5, ro = 1, seg, ps, ts = 0, tl = PI*2){
    if (tl < PI*2 - 1e-3) return new Ring(ri, ro, Math.min(seg || 8, 8), 1, ts, tl);
    const g = new Ring(ri*1.15, ro*1.15, 4, 1); g.rotateZ(PI/4); return g;
  };
  T.CircleGeometry = function(r = 1, seg, ts = 0, tl = PI*2){
    if (tl < PI*2 - 1e-3) return new Circle(r, Math.min(seg || 8, 8), ts, tl);
    const g = new Circle(r*1.15, 4); g.rotateZ(PI/4); return g;
  };
  T.IcosahedronGeometry = T.DodecahedronGeometry = function(r = 1){ const s = r*1.5; return new T.BoxGeometry(s, s, s); };

  // Pixel grain: each block face is split into little squares (VOX per unit) with slightly different
  // brightness, worked out from the model-space position so it sticks to the model as it moves.
  // Works on merged meshes too, which have no UVs.
  const VOX = '7.0';
  T.MeshToonMaterial.prototype.onBeforeCompile = function(sh, r){
    // WebGL2: fade the grain where a little square gets smaller than a screen pixel (far away / huge
    // planes like the sea), otherwise it shimmers. WebGL1 phones just keep the grain everywhere.
    const fade = r && r.capabilities && r.capabilities.isWebGL2 ? '1. - smoothstep(.3, .8, max(max(fwidth(vVox.x), fwidth(vVox.y)), fwidth(vVox.z)))' : '1.';
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vVox;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvVox = position*' + VOX + ' - objectNormal*.5;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vVox;\nfloat voxH(vec3 p){ return fract(sin(dot(p, vec3(12.9898, 78.233, 37.719)))*43758.5453); }')
      .replace('#include <color_fragment>', '#include <color_fragment>\n{ vec3 c = floor(vVox); float n = voxH(c); float e = voxH(c + 17.0); diffuseColor.rgb *= 1. + (' + fade + ')*(.2*n - .16 + (e > .93 ? .1 : 0.)); }');
  };
  T.MeshToonMaterial.prototype.customProgramCacheKey = function(){ return 'vox1'; };
})();
