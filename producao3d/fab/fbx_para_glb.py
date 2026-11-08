# FBX -> GLB pelo importador FBX do Blender (ferramenta pronta), sem tela:
#   blender -b --factory-startup -P fbx_para_glb.py -- lista.json
# lista.json: [{"fbx": ..., "glb": ..., "tex": opcional (PNG que vira baseColor de TODOS os materiais sem imagem),
#               "texturas": opcional {"nome_material_regex": {"base":..., "normal":..., "rough":...}}}]
# Aplica escala/rotacao (Y para cima no glTF), junta nada (mantem nos nomeados), exporta GLB com texturas embutidas.
import bpy, json, sys, os, re

args = sys.argv[sys.argv.index('--') + 1:]
itens = json.load(open(args[0], encoding='utf-8'))

def limpa():
    bpy.ops.wm.read_factory_settings(use_empty=True)

def img(caminho, nao_cor=False):
    i = bpy.data.images.load(caminho, check_existing=True)
    if nao_cor: i.colorspace_settings.name = 'Non-Color'
    return i

def liga_textura(mat, base=None, normal=None, rough=None):
    mat.use_nodes = True
    nt = mat.node_tree
    bsdf = next((n for n in nt.nodes if n.type == 'BSDF_PRINCIPLED'), None)
    if bsdf is None: return
    if base:
        t = nt.nodes.new('ShaderNodeTexImage'); t.image = img(base)
        nt.links.new(t.outputs['Color'], bsdf.inputs['Base Color'])
        bsdf.inputs['Base Color'].default_value = (1, 1, 1, 1)
    if rough:
        t = nt.nodes.new('ShaderNodeTexImage'); t.image = img(rough, True)
        nt.links.new(t.outputs['Color'], bsdf.inputs['Roughness'])
    if normal:
        t = nt.nodes.new('ShaderNodeTexImage'); t.image = img(normal, True)
        nm = nt.nodes.new('ShaderNodeNormalMap')
        nt.links.new(t.outputs['Color'], nm.inputs['Color'])
        nt.links.new(nm.outputs['Normal'], bsdf.inputs['Normal'])

for it in itens:
    limpa()
    try:
        bpy.ops.import_scene.fbx(filepath=it['fbx'], use_image_search=False, automatic_bone_orientation=True)
    except Exception as e:
        print('ERRO_IMPORT', it['fbx'], e); continue
    # FBX do 3ds Max preparado para a Unity: as malhas filhas trazem -90 graus em X que o importador do Blender ja corrige
    # pelo eixo do arquivo; somando os dois o carro ficava em pe sobre o nariz. Compensa com +90 graus na RAIZ (girar cada
    # filha no proprio pivo soltava as rodas, cujo pivo nao fica no centro da roda).
    if it.get('zera_rot_x'):
        import math
        filhas_tortas = [o for o in bpy.data.objects if o.type == 'MESH' and abs(o.rotation_euler.x + math.pi / 2) < 1e-3]
        if filhas_tortas:
            for o in bpy.data.objects:
                if o.parent is None:
                    if o.type == 'MESH' and o in filhas_tortas: o.rotation_euler.x = 0.0
                    else: o.rotation_euler.x += math.pi / 2
    for m in bpy.data.materials:
        tem_img = m.use_nodes and any(n.type == 'TEX_IMAGE' and n.image for n in m.node_tree.nodes)
        regras = it.get('texturas') or {}
        feito = False
        for rx, tx in regras.items():
            if re.search(rx, m.name, re.I):
                # remove imagens quebradas (caminhos da maquina do autor) antes de religar
                if m.use_nodes:
                    for n in [n for n in m.node_tree.nodes if n.type == 'TEX_IMAGE']: m.node_tree.nodes.remove(n)
                liga_textura(m, tx.get('base'), tx.get('normal'), tx.get('rough')); feito = True; break
        if not feito and it.get('tex'):
            if m.use_nodes:
                for n in [n for n in m.node_tree.nodes if n.type == 'TEX_IMAGE']: m.node_tree.nodes.remove(n)
            liga_textura(m, it['tex'])
        # o FBX do 3ds Max traz especular alto e metalico 0: deixa fosco
        if m.use_nodes:
            b = next((n for n in m.node_tree.nodes if n.type == 'BSDF_PRINCIPLED'), None)
            if b is not None and not b.inputs['Roughness'].is_linked: b.inputs['Roughness'].default_value = it.get('rough', 0.6)
    os.makedirs(os.path.dirname(it['glb']), exist_ok=True)
    bpy.ops.export_scene.gltf(filepath=it['glb'], export_format='GLB', export_yup=True, export_apply=True,
                              export_animations=bool(it.get('anim')), export_image_format='AUTO')
    print('OK_GLB', it['glb'])
