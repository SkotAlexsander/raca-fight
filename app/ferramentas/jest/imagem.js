/**
 * No Jest, as imagens viram um número (como o Metro faz no app). O Metro acha
 * o arquivo com @1x/@2x pelo nome sem o sufixo; o Jest não acha, então toda
 * imagem cai aqui (moduleNameMapper do package.json).
 */
module.exports = 1;
