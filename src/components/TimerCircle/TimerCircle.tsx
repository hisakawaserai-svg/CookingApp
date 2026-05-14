/* トレーニング中のアナログタイマー */
import React, { useCallback, useEffect, useRef } from 'react';
import { useWindowDimensions, StyleSheet, View } from 'react-native';
import { useSharedValue, withTiming, Easing, cancelAnimation } from 'react-native-reanimated';
import { TimerAnimation } from './TimerAnimation';
import { TimerProgress } from './TimerCircleAnimation';

interface TimerCircleProps{
    time: number,
    isFinish: boolean,
    isPaused: boolean,
    lap: number,
    direction?: 'forward' | 'reverse',
    resetKey?: number,
    color?: string,
}

export const TimerCircle = ({
    time,   // 秒数
    isFinish,   // 終了フラグ
    isPaused,   // 一時停止
    lap,        // 経過周回数
    direction = 'forward',  // カウントダウン
    resetKey = 0,   // ステップが変わるとリセット
    color = '#ef4444',
}: TimerCircleProps) => {
    // 時計の大きさデバイスのサイズによって変更
    const { width } = useWindowDimensions();
    const CIRCLE_SIZE = width * 0.8;
    const initializedKeyRef = useRef<string | null>(null);

    const progress = useSharedValue(0);

    const startFromCurrentProgress = useCallback(() => {
        const remainingRatio = direction === 'reverse' ? progress.value : (1 - progress.value);
        const remainingDuration = Math.max(remainingRatio * time * 1000, 0);
        const target = direction === 'reverse' ? 0 : 1;

        if (remainingDuration <= 0) {
            progress.value = target;
            return;
        }

        progress.value = withTiming(target, {
            duration: remainingDuration,
            easing: Easing.linear,
        }, (finished) => {
            if (finished) {
                progress.value = target;
            }
        });
    }, [time, progress, direction]);

    useEffect(() => {
        if (isFinish) {
            cancelAnimation(progress);
            return;
        }

        const cycleKey = `${lap}-${time}-${direction}-${resetKey}`;
        const isNewCycle = initializedKeyRef.current !== cycleKey;
        initializedKeyRef.current = cycleKey;
        cancelAnimation(progress);

        if (isNewCycle) {
            progress.value = direction === 'reverse' ? 1 : 0;
        }

        if (!isPaused) {
            startFromCurrentProgress();
        }
    }, [lap, time, direction, resetKey, isFinish, isPaused, progress, startFromCurrentProgress]);
    

    return(
        <TimerProgress CircleSize={CIRCLE_SIZE} progress={progress} color={color}>
                <TimerAnimation progress={progress} lap={lap}>
                    <View style={[styles.needleContainer, {height: CIRCLE_SIZE}]}>
                        <View style={[styles.needleVisible, {height: CIRCLE_SIZE / 2, backgroundColor: color}]}/>
                    </View>
                </TimerAnimation>
        </TimerProgress>
    );
} 

const styles = StyleSheet.create({
    needleContainer: {width: 2, height: 200, justifyContent: 'flex-start', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0)'},
    needleVisible: {width: 4, height: 100, backgroundColor: 'red'},
})
