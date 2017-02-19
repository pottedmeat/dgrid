import { WidgetProperties } from '@dojo/widget-core/interfaces';
import WidgetBase from '@dojo/widget-core/WidgetBase';
import { RegistryMixin, RegistryMixinProperties } from '@dojo/widget-core/mixins/Registry';
import { v, w } from '@dojo/widget-core/d';
import { HasColumns } from './interfaces';
import { CellProperties } from './Cell';

export interface RowProperties extends WidgetProperties, HasColumns, RegistryMixinProperties {
	item: any;
}

class Row  extends RegistryMixin(WidgetBase)<RowProperties> {
	render() {
		const {
			registry,
			item,
			columns = []
		} = this.properties;

		return v('div.dgrid-row', {
			role: 'row'
		}, [
			v('table.dgrid-row-table', {
				role: 'presentation'
			}, [
				v('tr', columns.map(({ id, field, cellRenderer }) => {
					return w('cell', <CellProperties> {
						registry,
						key: id,
						item: item,
						value: item.data[ field || id ],
						cellRenderer
					});
				}))
			])
		]);
	}
}

export default Row;
