import type * as React from 'react'

export enum ButtonType {
  TEXT = 'text',
  ICON = 'icon',
  ICON_TEXT = 'icon_text',
}

export type PossibleBtnProps<T extends ButtonType> =
    T extends ButtonType.TEXT ? TextBtnProps<T> :
    T extends ButtonType.ICON ? IconButtonProps<T> :
    T extends ButtonType.ICON_TEXT ? IconTextBtnProps<T> :
    never

export type BtnBase = React.DetailedHTMLProps<React.ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement> & {
	isDisabled: boolean
	isLoading: boolean
}

export type TextBtnProps<T extends ButtonType.TEXT> = {
	text?: string
    btnType: T
    textClassName?: string
}

export type IconButtonProps<T extends ButtonType.ICON> = {
	icon: React.ReactNode
    btnType: T
}

export type IconTextBtnProps<T extends ButtonType.ICON_TEXT> = {
  icon: React.ReactNode;
  text?: string;
  btnType: T;
  textClassName?: string
}
