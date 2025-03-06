import React from "react";

import type { BtnBase, ButtonType, IconButtonProps } from "../button.types";

const IconBtn = React.forwardRef<
  HTMLButtonElement,
  BtnBase & IconButtonProps<ButtonType.ICON>
>(({ icon, btnType, isDisabled, isLoading, ...buttonAttributes }, ref) => {
  return (
    <button
      ref={ref}
      disabled={isDisabled}
      {...buttonAttributes}
      className={buttonAttributes.className}
    >
      {icon}
    </button>
  );
});

export default IconBtn;
