import { v } from '@dojo/widget-core/d';
import { DNode } from '@dojo/widget-core/interfaces';
import { RegistryMixin, RegistryMixinProperties }  from '@dojo/widget-core/mixins/Registry';
import { theme, ThemeableMixin, ThemeableProperties } from '@dojo/widget-core/mixins/Themeable';
import WidgetBase from '@dojo/widget-core/WidgetBase';
import { HasContent, HasColumn, HasItem, HasValue } from './interfaces';

import * as cellClasses from './styles/cell.css';

export const CellBase = ThemeableMixin(RegistryMixin(WidgetBase));

export interface CellProperties extends ThemeableProperties, HasValue, HasContent, HasColumn, HasItem, RegistryMixinProperties { }

@theme(cellClasses)
class Cell extends CellBase<CellProperties> {
	render(): DNode {
		const {
			content
		} = this.properties;

		return v('td', {
			role: 'gridcell',
			classes: this.classes(cellClasses.cell)
		}, [
			content
		]);
	}
}

export default Cell;
