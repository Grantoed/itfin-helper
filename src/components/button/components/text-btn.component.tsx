import React from "react";
import Loader from "../../loader/loader.component";
import type { BtnBase, ButtonType, TextBtnProps } from "../button.types";

const TextBtn: React.FunctionComponent<
  BtnBase & TextBtnProps<ButtonType.TEXT>
> = ({
  text,
  btnType,
  isDisabled,
  isLoading,
  textClassName,
  ...buttonAttributes
}) => {
  return (
    <button
      disabled={isDisabled}
      {...buttonAttributes}
      className={buttonAttributes.className}
    >
      {isLoading ? <Loader /> : <span className={textClassName}>{text}</span>}
    </button>
  );
};

export default TextBtn;
