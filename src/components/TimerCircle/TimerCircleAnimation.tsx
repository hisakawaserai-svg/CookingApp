import React from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedProps } from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';

// 1. Circleをアニメーション対応にアップグレード
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// 引数で「アニメーションする値(SharedValue)」を受け取るようにする
export const TimerProgress = ({ CircleSize, progress, color = '#ef4444', children }: any) => {
    const drowingRadius = (CircleSize / 2) - 5;
    // 表示する円周
    const circumference = 2 * Math.PI * drowingRadius;

    // 2. アニメーション専用の「指示書」を作る
    const animatedProps = useAnimatedProps(() => {
        // ここで計算を行う
        return {
            strokeDashoffset: progress.value * circumference,
        };
    });

  return (
    <View style={{
        position: 'relative',
        justifyContent: 'center',
        alignItems: 'center',}}>
        <Svg 
        width={CircleSize} height={CircleSize}
        viewBox={`0 0 ${CircleSize} ${CircleSize}`}
        style={{ transform: [{rotate: "-90deg"},{scaleY: -1}]}}>
            {/* 3. AnimatedCircleに animatedProps を渡す */}
            <AnimatedCircle
                cx={CircleSize / 2}
                cy={CircleSize / 2}
                r={drowingRadius}
                stroke={color}
                strokeWidth="5"
                strokeDasharray={circumference}
                animatedProps={animatedProps} // これで連動！
            />
        </Svg>
        {children}
    </View>
  );
};
