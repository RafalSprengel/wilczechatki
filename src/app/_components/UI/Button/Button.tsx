import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

import styles from "./Button.module.css";

type ButtonVariant =
  | "primary"
  | "secondary"
  | "tertiary"
  | "outlineLight"
  | "danger";
type ButtonSize = "small" | "medium" | "large";

interface BaseButtonProps {
  children: ReactNode;
  className?: string;
  fullWidth?: boolean;
  size?: ButtonSize;
  variant?: ButtonVariant;
}

interface LinkButtonProps extends BaseButtonProps {
  href: string;
  prefetch?: boolean | null;
  replace?: boolean;
  scroll?: boolean;
  target?: string;
}

type NativeButtonProps = BaseButtonProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children" | "className"> & {
  href?: undefined;
};

type ButtonProps = LinkButtonProps | NativeButtonProps;

function joinClassNames(
  ...classNames: Array<string | false | null | undefined>
) {
  return classNames.filter(Boolean).join(" ");
}

export default function Button(props: ButtonProps) {
  const {
    children,
    className,
    fullWidth = false,
    size = "medium",
    variant = "primary",
    ...restProps
  } = props;

  const classes = joinClassNames(
    styles.button,
    styles[variant],
    size === "small" ? styles.small : null,
    size === "large" ? styles.large : null,
    fullWidth ? styles.fullWidth : null,
    className,
  );

  if ("href" in props && props.href !== undefined) {
    const { href, prefetch, replace, scroll, target } = props;

    return (
      <Link
        href={href}
        prefetch={prefetch}
        replace={replace}
        scroll={scroll}
        target={target}
        className={classes}
      >
        {children}
      </Link>
    );
  }

  return (
    <button {...restProps} className={classes}>
      {children}
    </button>
  );
}
