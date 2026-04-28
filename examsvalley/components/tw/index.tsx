import {
  useCssElement,
  useNativeVariable as useFunctionalVariable,
} from "react-native-css";
import Animated from "react-native-reanimated";
import React from "react";
import {
  View as RNView,
  Text as RNText,
  Pressable as RNPressable,
  ScrollView as RNScrollView,
  FlatList as RNFlatList,
  TouchableOpacity as RNTouchableOpacity,
  TouchableHighlight as RNTouchableHighlight,
  TextInput as RNTextInput,
} from "react-native";

export const useCSSVariable =
  process.env.EXPO_OS !== "web"
    ? useFunctionalVariable
    : (variable: string) => `var(${variable})`;

export type ViewProps = React.ComponentProps<typeof RNView> & {
  className?: string;
};
export const View = (props: ViewProps) => {
  return useCssElement(RNView, props, { className: "style" });
};
View.displayName = "CSS(View)";

export const Text = (
  props: React.ComponentProps<typeof RNText> & { className?: string }
) => {
  return useCssElement(RNText, props, { className: "style" });
};
Text.displayName = "CSS(Text)";

export const ScrollView = (
  props: React.ComponentProps<typeof RNScrollView> & {
    className?: string;
    contentContainerClassName?: string;
  }
) => {
  return useCssElement(RNScrollView, props, {
    className: "style",
    contentContainerClassName: "contentContainerStyle",
  });
};
ScrollView.displayName = "CSS(ScrollView)";

export const Pressable = (
  props: React.ComponentProps<typeof RNPressable> & { className?: string }
) => {
  return useCssElement(RNPressable, props, { className: "style" });
};
Pressable.displayName = "CSS(Pressable)";

export const TextInput = (
  props: React.ComponentProps<typeof RNTextInput> & { className?: string }
) => {
  return useCssElement(RNTextInput, props, { className: "style" });
};
TextInput.displayName = "CSS(TextInput)";

export const TouchableOpacity = (
  props: React.ComponentProps<typeof RNTouchableOpacity> & {
    className?: string;
  }
) => {
  return useCssElement(RNTouchableOpacity, props, { className: "style" });
};
TouchableOpacity.displayName = "CSS(TouchableOpacity)";

export const TouchableHighlight = (
  props: React.ComponentProps<typeof RNTouchableHighlight> & {
    className?: string;
  }
) => {
  return useCssElement(RNTouchableHighlight, props, { className: "style" });
};
TouchableHighlight.displayName = "CSS(TouchableHighlight)";

export const FlatList = RNFlatList;

export const AnimatedView = Animated.createAnimatedComponent(View);
export const AnimatedScrollView = (
  props: React.ComponentProps<typeof Animated.ScrollView> & {
    className?: string;
    contentContainerClassName?: string;
  }
) => {
  return useCssElement(Animated.ScrollView, props, {
    className: "style",
    contentContainerClassName: "contentContainerStyle",
  });
};
