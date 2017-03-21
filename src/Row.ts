import { v, w } from '@dojo/widget-core/d';
import { WidgetProperties } from '@dojo/widget-core/interfaces';
import { RegistryMixin, RegistryMixinProperties } from '@dojo/widget-core/mixins/Registry';
import { theme, ThemeableMixin, ThemeableProperties } from '@dojo/widget-core/mixins/Themeable';
import WidgetBase from '@dojo/widget-core/WidgetBase';
import { DNode } from '@dojo/widget-core/interfaces';
import { CellProperties } from './Cell';
import { HasColumns, ItemProperties } from './interfaces';

import * as rowClasses from './styles/row.css';

export const RowBase = ThemeableMixin(RegistryMixin(WidgetBase));

export interface RowProperties extends WidgetProperties, HasColumns, RegistryMixinProperties, ThemeableProperties {
	item: ItemProperties<any>;
}

@theme(rowClasses)
class Row extends RowBase<RowProperties> {
	render(): DNode {
		const {
			registry,
			item,
			columns = []
		} = this.properties;

		return v('div', {
			role: 'row',
			classes: this.classes(rowClasses.row)
		}, [
			v('table', {
				role: 'presentation',
				classes: this.classes(rowClasses.rowTable)
			}, [
				v('tr', columns.map((column) => {
					const { field, id } = column;

					let value = '';
					if (column.get) {
						value = column.get(item, column);
					}
					else if (!column.render) {
						value = item.data[ field || id ];
					}

					let content: DNode = value;
					if (column.render) {
						content = column.render(item, column);
					}
					else if (column.renderValue) {
						content = column.renderValue(value, item, column);
					}

					return w<CellProperties>('cell', {
						content,
						column,
						key: id,
						item,
						registry,
						value
					});
				}))
			])
		]);
	}
}

export default Row;
