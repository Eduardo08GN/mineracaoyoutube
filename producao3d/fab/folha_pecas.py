# Folha de pecas: renderiza cada GLB bruto (antes do meshopt) com o Workbench do Blender e monta uma grade com o nome.
#   blender -b --factory-startup -P folha_pecas.py -- <pasta_glb> <saida_png_dir>
import bpy, sys, os, glob, math, mathutils
pasta, saida = sys.argv[sys.argv.index('--') + 1:][:2]
os.makedirs(saida, exist_ok=True)
for f in sorted(glob.glob(os.path.join(pasta, '*.glb'))):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=f)
    objs = [o for o in bpy.data.objects if o.type == 'MESH']
    if not objs: continue
    pts = [o.matrix_world @ mathutils.Vector(c) for o in objs for c in o.bound_box]
    mn = mathutils.Vector([min(p[i] for p in pts) for i in range(3)]); mx = mathutils.Vector([max(p[i] for p in pts) for i in range(3)])
    c = (mn + mx) / 2; r = max((mx - mn).length / 2, 1e-3)
    cam = bpy.data.objects.new('cam', bpy.data.cameras.new('cam')); bpy.context.scene.collection.objects.link(cam)
    d = mathutils.Vector((1.0, -1.3, 0.8)).normalized()
    cam.location = c + d * r * 3.2
    cam.rotation_euler = (c - cam.location).to_track_quat('-Z', 'Y').to_euler()
    cam.data.lens = 50
    sc = bpy.context.scene; sc.camera = cam
    sc.render.engine = 'BLENDER_WORKBENCH'; sc.display.shading.light = 'STUDIO'; sc.display.shading.color_type = 'TEXTURE'
    sc.display.shading.show_shadows = True
    sc.render.resolution_x = sc.render.resolution_y = 256; sc.render.film_transparent = False
    sc.world = bpy.data.worlds.new('w'); sc.display.shading.background_type = 'VIEWPORT'
    sc.render.filepath = os.path.join(saida, os.path.splitext(os.path.basename(f))[0] + '.png')
    bpy.ops.render.render(write_still=True)
