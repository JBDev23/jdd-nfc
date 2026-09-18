import { Text, type TextProps } from 'react-native';

import { ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type ThemedTextProps = TextProps & {
  type?: 'default' | 'title' | 'small' | 'smallBold' | 'subtitle' | 'link' | 'linkPrimary' | 'code';
  themeColor?: ThemeColor;
  className?: string;
};

const typeClassNames = {
  default: 'text-base leading-6 font-medium',
  title: 'text-5xl font-semibold leading-[52px]',
  small: 'text-sm leading-5 font-medium',
  smallBold: 'text-sm leading-5 font-bold',
  subtitle: 'text-[32px] leading-[44px] font-semibold',
  link: 'text-sm leading-[30px]',
  linkPrimary: 'text-sm leading-[30px] text-[#3c87f7]',
  code: 'text-xs font-mono font-medium android:font-bold',
} as const;

export function ThemedText({
  className,
  style,
  type = 'default',
  themeColor,
  ...rest
}: ThemedTextProps) {
  const theme = useTheme();
  const color = themeColor
    ? theme[themeColor]
    : type === 'linkPrimary'
      ? '#3c87f7'
      : theme.text;

  return (
    <Text
      className={[typeClassNames[type], className].filter(Boolean).join(' ')}
      style={[{ color }, style]}
      {...rest}
    />
  );
}
