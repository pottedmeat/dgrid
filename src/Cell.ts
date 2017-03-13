import { v, w } from '@dojo/widget-core/d';
import { RegistryMixin, RegistryMixinProperties }  from '@dojo/widget-core/mixins/Registry';
import { theme, ThemeableMixin, ThemeableProperties } from '@dojo/widget-core/mixins/Themeable';
import WidgetBase from '@dojo/widget-core/WidgetBase';
import { HasValue, HasColumn, HasItem, HasCellRenderer, CellRendererProperties } from './interfaces';

import * as cellClasses from './styles/cell.css';

export const CellBase = ThemeableMixin(RegistryMixin(WidgetBase));

export interface CellProperties extends ThemeableProperties, HasValue, HasColumn, HasItem, HasCellRenderer<any>, RegistryMixinProperties { }

@theme(cellClasses)
class Cell extends CellBase<CellProperties> {
	render() {
		const {
			value = '',
			column,
			item,
			cellRenderer,
			registry,
			theme
		} = this.properties;

		return v('td', {
			role: 'gridcell',
			classes: this.classes(cellClasses.cell)
		}, [
			cellRenderer ? w<CellRendererProperties>(cellRenderer(item), {
				value,
				column,
				item,
				registry,
				theme
			}) : String(value)
		]);
	}
}

export default Cell;
