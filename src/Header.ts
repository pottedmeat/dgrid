import WidgetBase from '@dojo/widget-core/WidgetBase';
import { RegistryMixin, RegistryMixinProperties }  from '@dojo/widget-core/mixins/Registry';
import { v, w } from '@dojo/widget-core/d';
import { WidgetProperties } from '@dojo/widget-core/interfaces';
import { HasColumns, HasSortDetails, HasSortEvent } from './interfaces';
import { HeaderCellProperties } from './HeaderCell';

export interface HeaderProperties extends WidgetProperties, HasColumns, HasSortDetails, HasSortEvent, RegistryMixinProperties { }

class Header extends RegistryMixin(WidgetBase)<HeaderProperties> {
	render() {
		const {
			onSortRequest,
			columns,
			sortDetails = []
		} = this.properties;

		return v('div.dgrid-header.dgrid-header-row', {
			role: 'row'
		}, [
			v('table.dgrid-row-table', {
				role: 'presentation'
			}, [
				v('tr', columns.map((column) => {
					let sortDetail;
					for (const detail of sortDetails) {
						if (detail.columnId === column.id) {
							sortDetail = detail;
							break;
						}
					}

					return w('header-cell', <HeaderCellProperties> {
						key: column.id,
						column,
						sortDetail,
						onSortRequest
					});
				}))
			])
		]);
	}
}

export default Header;
