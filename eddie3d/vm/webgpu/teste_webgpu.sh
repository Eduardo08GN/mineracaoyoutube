#!/bin/bash
# Teste WebGPU headless na G4: Vulkan NVIDIA (receita unreal3d/boot.sh) + Chromium (playwright) + three WebGPURenderer/TSL.
set -u; export DEBIAN_FRONTEND=noninteractive
W=/content/wgpu; mkdir -p $W && cd $W
apt-get -qq update >/dev/null 2>&1; apt-get -qq install -y libvulkan1 vulkan-tools >/dev/null 2>&1
DRV=$(nvidia-smi --query-gpu=driver_version --format=csv,noheader | head -1 | tr -d ' '); echo "T|driver|$DRV"
mkdir -p /opt/wgpu/nv && cd /opt/wgpu; RUN=NVIDIA-Linux-x86_64-$DRV.run
[ -s /opt/unreal3d/$RUN ] && cp /opt/unreal3d/$RUN . ; [ -s $RUN ] || curl -fsSL --max-time 900 -o $RUN "https://us.download.nvidia.com/tesla/$DRV/$RUN" || curl -fsSL --max-time 900 -o $RUN "https://download.nvidia.com/XFree86/Linux-x86_64/$DRV/$RUN"
[ -d x ] || sh $RUN --extract-only --target x >/dev/null 2>&1
cp -f x/*.so.$DRV nv/ 2>/dev/null; cd nv && for f in *.so.$DRV; do b=${f%.$DRV}; ln -sf $f $b.0; ln -sf $f $b.1; ln -sf $f $b; done; cd ..
printf '{"file_format_version":"1.0.1","ICD":{"library_path":"/opt/wgpu/nv/libGLX_nvidia.so.0","api_version":"1.4"}}\n' > nvidia_icd.json
export VK_ICD_FILENAMES=/opt/wgpu/nvidia_icd.json; export LD_LIBRARY_PATH=/opt/wgpu/nv:${LD_LIBRARY_PATH:-}
vulkaninfo --summary 2>/dev/null | grep -m1 -i "deviceName" | sed 's/^/T|vulkan|/' || true
cd $W; [ -d node_modules/three ] || (npm init -y >/dev/null && npm i -s three@0.180.0 playwright@1.48.2 > npm.log 2>&1); npx playwright install --with-deps chromium > pw.log 2>&1; tail -3 pw.log | sed "s/^/T|pw|/"
echo "T|three|$(node -p "require('./node_modules/three/package.json').version" 2>&1 | tail -1)"
cp node_modules/three/build/three.webgpu.js node_modules/three/build/three.tsl.js node_modules/three/build/three.core.js . 2>/dev/null; ls three.webgpu.js three.tsl.js >/dev/null && echo "T|build|ok"
cat > index.html <<'H'
<!doctype html><html><body style="margin:0;background:#000"><canvas id="c" width="1280" height="720"></canvas>
<script type="importmap">{"imports":{"three":"./three.webgpu.js","three/webgpu":"./three.webgpu.js","three/tsl":"./three.tsl.js"}}</script>
<script type="module">
const out = {}; window.__out = out;
try {
  out.gpu = !!navigator.gpu;
  const ad = navigator.gpu && await navigator.gpu.requestAdapter({powerPreference: 'high-performance'});
  out.adapter = ad ? {vendor: ad.info?.vendor, arch: ad.info?.architecture, desc: ad.info?.description, fallback: ad.info?.isFallbackAdapter ?? ad.isFallbackAdapter} : null;
  const THREE = await import('three/webgpu'); const T = await import('three/tsl');
  const r = new THREE.WebGPURenderer({canvas: document.getElementById('c'), antialias: true, forceWebGL: false});
  await r.init(); out.backend = r.backend?.isWebGPUBackend ? 'WebGPU' : 'WebGL2-fallback';
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0x87b8e8);
  const cam = new THREE.PerspectiveCamera(50, 16/9, 0.1, 100); cam.position.set(0, 2.2, 6); cam.lookAt(0, 0.6, 0);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x335577, 1.2)); const sun = new THREE.DirectionalLight(0xfff0d0, 3); sun.position.set(4, 6, 3); scene.add(sun);
  const m = new THREE.MeshStandardNodeMaterial(); const t = T.time;
  m.colorNode = T.mix(T.color(0x1d6fa5), T.color(0x7ee0e8), T.sin(T.positionLocal.x.mul(3).add(t)).mul(0.5).add(0.5));
  m.positionNode = T.positionLocal.add(T.vec3(0, T.sin(T.positionLocal.x.mul(2).add(T.positionLocal.z.mul(1.5)).add(t.mul(2))).mul(0.25), 0));
  const mar = new THREE.Mesh(new THREE.PlaneGeometry(14, 14, 256, 256).rotateX(-Math.PI/2), m); scene.add(mar);
  const bola = new THREE.Mesh(new THREE.SphereGeometry(0.6, 64, 32), new THREE.MeshStandardNodeMaterial({color: 0xff6644, roughness: 0.3})); bola.position.y = 1; scene.add(bola);
  const t0 = performance.now(); for (let i = 0; i < 120; i++) { bola.position.x = Math.sin(i / 20); await r.renderAsync(scene, cam); }
  out.ms_por_quadro = +((performance.now() - t0) / 120).toFixed(2);
} catch (e) { out.erro = String(e && e.message || e); }
out.pronto = true;
</script></body></html>
H
cat > teste.mjs <<'J'
import {chromium} from 'playwright'; import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
const srv = http.createServer((q, s) => { const f = path.join(process.cwd(), decodeURIComponent(q.url.split('?')[0]) === '/' ? 'index.html' : decodeURIComponent(q.url.split('?')[0]));
  fs.readFile(f, (e, d) => { if (e) { s.writeHead(404); s.end(); return; } s.writeHead(200, {'Content-Type': f.endsWith('.js') ? 'text/javascript' : 'text/html'}); s.end(d); }); }).listen(8099);
const V = {
  V1_vulkan: ['--enable-unsafe-webgpu', '--enable-features=Vulkan,VulkanFromANGLE,DefaultANGLEVulkan', '--use-vulkan', '--use-angle=vulkan', '--ignore-gpu-blocklist', '--enable-gpu-rasterization'],
};
for (const [nome, args] of Object.entries(V)) for (const headless of ['new', 'shell']) {
  let b; const tag = nome + '_' + headless;
  try {
    b = await chromium.launch({headless: true, channel: headless === 'new' ? 'chromium' : undefined, args});
    const pg = await b.newPage({viewport: {width: 1280, height: 720}});
    await pg.goto('http://localhost:8099/', {waitUntil: 'load'}); await pg.waitForFunction(() => window.__out && window.__out.pronto, null, {timeout: 90000});
    const o = await pg.evaluate(() => window.__out); await pg.screenshot({path: `shot_${tag}.png`});
    console.log('R|' + tag + '|' + JSON.stringify(o));
  } catch (e) { console.log('R|' + tag + '|ERRO ' + String(e.message).replace(/s+/g, ' ').slice(0, 600)); }
  if (b) await b.close();
}
srv.close(); console.log('FIM_TESTE');
J
node teste.mjs 2>&1 | grep -E "^R\||FIM_TESTE"
tar -cf /content/wgpu_res.tar shot_*.png 2>/dev/null; echo WGPU_OK
