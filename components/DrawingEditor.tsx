import {
	DefaultMainMenu,
	DefaultMainMenuContent,
	DefaultQuickActions,
	DefaultQuickActionsContent,
	TLComponents,
	Tldraw,
	TldrawUiMenuGroup,
	TldrawUiMenuItem,
} from 'tldraw'
import 'tldraw/tldraw.css'

/*function CustomMainMenu() {
	return (
		<DefaultMainMenu>
			<div style={{ backgroundColor: 'thistle' }}>
				<TldrawUiMenuGroup id="example">
					<TldrawUiMenuItem
						id="like"
						label="Like my posts"
						icon="external-link"
						readonlyOk
						onSelect={() => {
							window.open('https://x.com/tldraw', '_blank')
						}}
					/>
				</TldrawUiMenuGroup>
			</div>
			<DefaultMainMenuContent />
		</DefaultMainMenu>
	)
}*/

function CustomQuickActions() {
	return (
		<DefaultQuickActions>
			<DefaultQuickActionsContent />
			<div>
				<TldrawUiMenuItem id="save" icon="bring-to-front" onSelect={() => window.alert('Salva')} label="Salva"/>
			</div>
		</DefaultQuickActions>
	)
}

const components: TLComponents = {
	//MainMenu: CustomMainMenu,
	QuickActions: CustomQuickActions,
}

export function DrawingEditor() {
	return (
		<div className="w-full h-full border rounded-lg bg-card overflow-hidden">
			<Tldraw components={components} />
		</div>
	)
}