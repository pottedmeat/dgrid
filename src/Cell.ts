import { v } from '@dojo/widget-core/d';
import { DNode } from '@dojo/widget-core/interfaces';
import { RegistryMixin, RegistryMixinProperties }  from '@dojo/widget-core/mixins/Registry';
import { theme, ThemeableMixin, ThemeableProperties } from '@dojo/widget-core/mixins/Themeable';
import WidgetBase from '@dojo/widget-core/WidgetBase';
import { HasValue, HasColumn, HasItem } from './interfaces';

import * as cellClasses from './styles/cell.css';

export const CellBase = ThemeableMixin(RegistryMixin(WidgetBase));

export interface CellProperties extends ThemeableProperties, HasValue, HasColumn, HasItem, RegistryMixinProperties { }

@theme(cellClasses)
class Cell extends CellBase<CellProperties> {
	render(): DNode {
		const {
			value = ''
		} = this.properties;

		return v('td', {
			role: 'gridcell',
			classes: this.classes(cellClasses.cell)
		}, [
			String(value)
		]);
	}
}

export default Cell;
