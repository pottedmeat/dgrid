import { WidgetProperties } from '@dojo/widget-core/interfaces';
import WidgetBase from '@dojo/widget-core/WidgetBase';
import { RegistryMixin, RegistryMixinProperties }  from '@dojo/widget-core/mixins/Registry';
import { v, w } from '@dojo/widget-core/d';
import { HasValue, HasColumn, HasItem, HasCellRenderer, CellRendererProperties } from './interfaces';
import { theme, ThemeableMixin } from '@dojo/widget-core/mixins/Themeable';

import * as cellClasses from './styles/cell.css';

export interface CellProperties extends WidgetProperties, HasValue, HasColumn, HasItem, HasCellRenderer<any>, RegistryMixinProperties { }

@theme(cellClasses)
class Cell extends ThemeableMixin(RegistryMixin(WidgetBase))<CellProperties> {
	render() {
		const {
			value = '',
			column,
			item,
			cellRenderer,
			registry
		} = this.properties;

		return v('td', {
			role: 'gridcell',
			classes: this.classes(cellClasses.cell).get()
		}, [
			cellRenderer ? w(cellRenderer(item), <CellRendererProperties> {
				value,
				column,
				item,
				registry
			}) : String(value)
		]);
	}
}

export default Cell;
