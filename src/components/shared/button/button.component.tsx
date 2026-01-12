import React from "react";
import type {
  IconButtonProps,
  TextBtnProps,
  IconTextBtnProps,
} from "./button.types";
import { ButtonType } from "./button.types";
import TextBtn from "./components/text-btn.component";
import IconBtn from "./components/icon-btn.component";
import IconTextBtn from "./components/icon-text-btn.component";
import * as styles from "./button.module.scss";

type ButtonProps<T extends ButtonType> = React.DetailedHTMLProps<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  HTMLButtonElement
> & {
  loading?: boolean;
  variant?: "primary" | "secondary";
  additionalProps: T extends ButtonType.TEXT
    ? TextBtnProps<T>
    : T extends ButtonType.ICON
    ? IconButtonProps<T>
    : T extends ButtonType.ICON_TEXT
    ? IconTextBtnProps<T>
    : never;
};

const Button = React.forwardRef<HTMLButtonElement, ButtonProps<ButtonType>>(
  ({ loading, variant = "primary", additionalProps, ...buttonAttributes }, ref) => {
    const isLoading = Boolean(loading);
    const isDisabled = isLoading || Boolean(buttonAttributes.disabled);
    const variantClass =
      variant === "secondary" ? styles.secondary : styles.primary;

    const baseProps = {
      isDisabled,
      isLoading,
      ...buttonAttributes,
      ref,
      className: [styles.btn, variantClass].filter(Boolean).join(" "),
    };

    switch (additionalProps.btnType) {
      case ButtonType.TEXT:
        return <TextBtn {...baseProps} {...additionalProps}></TextBtn>;
      case ButtonType.ICON:
        return <IconBtn {...baseProps} {...additionalProps}></IconBtn>;
      case ButtonType.ICON_TEXT:
        return <IconTextBtn {...baseProps} {...additionalProps}></IconTextBtn>;
      default:
        throw new Error("Unsupported button type");
    }
  }
);

export default Button;
