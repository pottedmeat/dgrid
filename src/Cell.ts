import { v } from '@dojo/widget-core/d';
import { DNode } from '@dojo/widget-core/interfaces';
import { RegistryMixin, RegistryMixinProperties }  from '@dojo/widget-core/mixins/Registry';
import { theme, ThemeableMixin, ThemeableProperties } from '@dojo/widget-core/mixins/Themeable';
import WidgetBase from '@dojo/widget-core/WidgetBase';
import { HasValue, HasColumn, HasItem, HasToggleExpandedEvent } from './interfaces';

import * as cellClasses from './styles/cell.m.css';

export const CellBase = ThemeableMixin(RegistryMixin(WidgetBase));

export interface CellProperties extends ThemeableProperties, HasValue, HasColumn, HasItem, HasToggleExpandedEvent, RegistryMixinProperties { }

@theme(cellClasses)
class Cell extends CellBase<CellProperties> {
	onToggleExpandedRequest(): void {
		const {
			item,
			onToggleExpandedRequest
		} = this.properties;

		onToggleExpandedRequest(item);
	}

	render(): DNode {
		const {
			column: {
				renderExpando
			},
			item: {
				expandedLevel = 0,
				isExpanded,
				canExpand
			},
			value = ''
		} = this.properties;

		const onclick = canExpand ? { onclick: this.onToggleExpandedRequest } : {};

		return v('td', {
			role: 'gridcell',
			classes: this.classes(cellClasses.cell)
		}, [
			renderExpando ? v('div', {
				key: 'expandable',
				classes: this.classes(cellClasses.cellExpandable),
				...onclick,
				styles: {
					'margin-left': (expandedLevel * 9) + 'px'
				}
			}, [
				canExpand ? v('div', {
					key: 'expando',
					classes: this.classes(cellClasses.cellExpando, isExpanded ? cellClasses.cellExpandoExpanded : cellClasses.cellExpandoCollapsed)
				}) : null
			]) : null,
			String(value)
		]);
	}
}

export default Cell;
