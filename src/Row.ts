import { v, w } from '@dojo/widget-core/d';
import { WidgetProperties } from '@dojo/widget-core/interfaces';
import { RegistryMixin, RegistryMixinProperties } from '@dojo/widget-core/mixins/Registry';
import { theme, ThemeableMixin, ThemeableProperties } from '@dojo/widget-core/mixins/Themeable';
import WidgetBase from '@dojo/widget-core/WidgetBase';
import { DNode } from '@dojo/widget-core/interfaces';
import { CellProperties } from './Cell';
import { HasColumns, ItemProperties } from './interfaces';

import * as css from './styles/row.m.css';
import * as tableCss from './styles/shared/table.m.css';

export const RowBase = ThemeableMixin(RegistryMixin(WidgetBase));

export interface RowProperties extends WidgetProperties, HasColumns, RegistryMixinProperties, ThemeableProperties {
	item: ItemProperties<any>;
}

@theme(tableCss)
@theme(css)
class Row extends RowBase<RowProperties> {
	render(): DNode {
		const {
			registry,
			item,
			columns = []
		} = this.properties;

		return v('div', {
			role: 'row',
			classes: this.classes(css.row)
		}, [
			v('table', {
				role: 'presentation',
				classes: this.classes(tableCss.table, css.rowTable)
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
