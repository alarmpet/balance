module.exports = function babelConfig(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // react-native-reanimated/plugin은 반드시 plugins 배열의 마지막에 위치해야 한다.
    plugins: ['react-native-reanimated/plugin']
  };
};
