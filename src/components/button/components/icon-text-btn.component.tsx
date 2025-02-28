import * as React from 'react'

import Loader from '../../loader/loader.component'
import type {
	BtnBase, ButtonType, IconTextBtnProps,
} from '../button.types'

const IconTextBtn: React.FunctionComponent<BtnBase & IconTextBtnProps<ButtonType.ICON_TEXT>> = ({
	icon, text, btnType, isDisabled, isLoading, textClassName, ...buttonAttributes
},) => {
	return (
		<button disabled={isDisabled} {...buttonAttributes}>
			{isLoading ?
				<Loader /> :
				(
					<>
						{icon}
						<span className={textClassName}>{text}</span>
					</>
				)}
		</button>
	)
}

export default IconTextBtn
