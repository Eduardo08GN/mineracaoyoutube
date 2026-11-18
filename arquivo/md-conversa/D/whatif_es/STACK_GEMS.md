# Repos/libraries para o canal What If ES (pesquisa de 20/10/2026)

Critério: resolve um item da ficha com pouco código e pouco custo de render (rota inteligente, sem overengineering).

| Item da ficha | Gem | Por que |
|---|---|---|
| Multidão (150+ pessoas andando) | [three-vat](https://github.com/MikeFernandez-Pro/three-vat) | Vertex animation texture: milhares de personagens instanciados em 1 draw call, zero CPU por quadro. Assa a animação direto do glTF. v0.1.0, testar antes. |
| Pessoas, palmeiras, carros, guarda-sóis, prédios | [Quaternius](https://quaternius.itch.io/150-lowpoly-nature-models) + Kenney (CC0, glTF) | Mesmo estilo low-poly do original, sem atribuição. Poly Pizza só filtrando licença (maioria CC-BY). |
| Mar estilizado com espuma e água rasa | [WaterThreeJS](https://github.com/achrefelouafi/WaterThreeJS) (faixa de espuma na praia, raso por profundidade) e [stylized-water](https://github.com/thaslle/stylized-water) (R3F, cartoon, leve) | Cobre a espuma na linha da praia, que falta no nosso mar. |
| Cáusticas na água rasa (0:29) | [r3f-drei-water-caustics-effect](https://github.com/diver-jay/r3f-drei-water-caustics-effect) | Cáusticas projetadas em qualquer malha. |
| Nuvens em tufo | [Técnica de sprites da Codrops](https://tympanus.net/codrops/2020/01/28/how-to-create-procedural-clouds-using-three-js-sprites/) com seed fixa | Barato e determinístico (as volumétricas da Takram custaram 11 min por 20 s). |
| Fonte, detritos, objetos voando | [three.quarks](https://github.com/Alchemist0823/three.quarks) | Partículas em billboard e em malha (detritos), instanciadas. |
| Cidade de drone (2:33) | [SkyscraperGenerator do three.js](https://threejs.org/docs/pages/SkyscraperGenerator.html) + janelas por textura de Canvas | Prédios instanciados, janelas acendendo à noite sem baixar textura. |
| Terra dia/noite com halo | [Lição Earth shaders (threejs-journey)](https://threejs-journey.com/lessons/earth-shaders) / [globe-threejs](https://npmjs.com/package/globe-threejs) | Terminador e luzes das cidades num shader só. |
