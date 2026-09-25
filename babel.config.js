module.exports = function (api) {
  api.cache(true);

  return {
    // `babel-preset-expo` ajoute DEJA tout seul `react-native-worklets/plugin`
    // (celui de Reanimated 4) des qu'il detecte le paquet installe.
    // Ne pas le rajouter ici : le doublon transformerait les animations deux fois.
    presets: ['babel-preset-expo'],
    plugins: [
      // Unistyles reecrit nos StyleSheet.create() a la compilation pour savoir
      // exactement quels styles dependent du theme. Il ne traite que `root` :
      // comme TOUT le code applicatif (routes comprises) vit sous src/, rien n'echappe.
      ['react-native-unistyles/plugin', { root: 'src' }],
    ],
  };
};
