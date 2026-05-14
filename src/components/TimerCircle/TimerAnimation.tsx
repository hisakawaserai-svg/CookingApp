/* 針の動きをスムーズにするアニメーション */
import Animated, { useAnimatedStyle } from 'react-native-reanimated';

export const TimerAnimation = ({ progress, lap, children }: any) => {

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${(lap + progress.value) * 360}deg` }],
  }));

  return (
    <Animated.View style={[{    
        position: 'absolute',
        justifyContent: 'center',
        alignItems: 'center'}, animatedStyle]}>
      {children}
    </Animated.View>
  );
};
