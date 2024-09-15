import { useEffect, useRef, useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import {
  GestureDetector,
  Gesture,
  GestureHandlerRootView,
} from 'react-native-gesture-handler'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  runOnJS,
  type SharedValue,
  useDerivedValue,
  withTiming,
  useAnimatedRef,
  type DerivedValue,
  withSpring,
} from 'react-native-reanimated'
const letters = ['a', 'b']

const Letters = ({
  letter,
  i,
  target,
  idx,
}: {
  letter: string
  i: (l: string) => void
  target: { x: number; y: number }
  idx: number
}) => {
  // const [isActive, setIsActive] = useState(false)
  const xy = useSharedValue({ x: 0, y: 0 })
  const lastXY = useSharedValue({ x: 0, y: 0 })
  const isActive = useSharedValue(false)
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: xy.value.x }, { translateY: xy.value.y }],
      backgroundColor: isActive.value ? 'blue' : 'red',
      borderColor: isActive.value ? 'blue' : 'red',
    }
  })

  const t = useDerivedValue(() => target)

  const SIZE = 50
  const isOverTarget = (x: number, y: number) => {
    'worklet'
    return (
      x > t.value?.x &&
      x < t.value?.x + SIZE &&
      y > t.value?.y &&
      y < t.value?.y + SIZE
    )
  }

  const pan = Gesture.Pan()
    .onBegin(e => {
      isActive.value = true
      i(letter)
    })
    .onStart(e => {})
    .onUpdate(e => {
      const { absoluteX, absoluteY } = e
      const x = e.translationX + lastXY.value.x
      const y = e.translationY + lastXY.value.y
      xy.modify(val => {
        val.x = x
        val.y = y
        return val
      })

      if (isOverTarget(absoluteX, absoluteY)) {
        console.log('over target')
      }
    })
    .onFinalize(e => {
      isActive.value = false

      let x = 0,
        y = 0
      if (isOverTarget(e.absoluteX, e.absoluteY)) {
        x = t.value.x
        y = t.value.y
      }
      xy.modify(val => {
        val.x = withSpring(x)
        val.y = withSpring(y)
        return val
      })

      lastXY.modify(val => {
        val.x = x + lastXY.value.x
        val.y = y + lastXY.value.y
        return val
      })
    })

  // we can get the absolute position of the tile on the screen
  // we know the position of the target tile on the screen
  // we need to know if the tile/pointer is over the target tile
  // we can get the absolute xy of the gesture.

  return (
    <GestureDetector gesture={pan}>
      <Animated.View
        style={[
          {
            height: SIZE,
            width: SIZE,
            justifyContent: 'center',
            alignItems: 'center',
            borderWidth: 1,
          },
          animatedStyle,
        ]}
      >
        <Text>{letter}</Text>
      </Animated.View>
    </GestureDetector>
  )
}

export default function App() {
  const z = useSharedValue(letters[0])
  const ts = useRef([]).current
  const i = (l: string) => {
    'worklet'
    z.value = l
  }

  return (
    <GestureHandlerRootView>
      <View style={styles.container}>
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 50 }}>
          {letters.map((letter, index) => (
            <View
              ref={r => {
                r &&
                  r.measure((x, y, width, height, pageX, pageY) => {
                    ts[index] = { x: pageX, y: pageY }
                  })
              }}
              key={letter}
              style={{
                height: 50,
                width: 50,
                justifyContent: 'center',
                alignItems: 'center',
                borderWidth: 1,
                borderStyle: 'dashed',
              }}
            >
              <Text>{letter}</Text>
            </View>
          ))}
        </View>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          {letters.map((letter, idx) => (
            <Z s={z} letter={letter} key={idx}>
              <Letters
                target={ts[idx]}
                idx={idx}
                key={letter}
                letter={letter}
                i={i}
              />
            </Z>
          ))}
        </View>
      </View>
    </GestureHandlerRootView>
  )
}
const Z = ({
  s,
  children,
  letter,
}: {
  s: SharedValue<string>
  children: React.ReactNode
  letter: string
}) => {
  const a = useAnimatedStyle(() => {
    return { zIndex: s.value === letter ? 1 : 0 }
  })

  return <Animated.View style={a}>{children}</Animated.View>
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
})
