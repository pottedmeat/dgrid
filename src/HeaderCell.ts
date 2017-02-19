import WidgetBase from '@dojo/widget-core/WidgetBase';
import { RegistryMixin } from '@dojo/widget-core/mixins/Registry';
import { v } from '@dojo/widget-core/d';
import { WidgetProperties } from '@dojo/widget-core/interfaces';
import { HasColumn, HasSortDetail, HasSortEvent } from './interfaces';

export interface HeaderCellProperties extends WidgetProperties, HasColumn, HasSortDetail, HasSortEvent { }

class HeaderCell extends RegistryMixin(WidgetBase)<HeaderCellProperties> {
	onSortRequest(): void {
		const {
			key = '',
			column,
			sortDetail,
			onSortRequest
		} = this.properties;

		if (onSortRequest && (column.sortable || !column.hasOwnProperty('sortable'))) {
			onSortRequest({
				columnId: key,
				descending: Boolean(sortDetail && sortDetail.columnId === key && !sortDetail.descending)
			});
		}
	}

	render() {
		const {
			key,
			column,
			sortDetail
		} = this.properties;

		return v('th.dgrid-cell', {
			role: 'columnheader',
			onclick: this.onSortRequest,
			classes: {
				'dgrid-sort-up': Boolean(sortDetail && !sortDetail.descending),
				'dgrid-sort-down': Boolean(sortDetail && sortDetail.descending)
			}
		}, [
			v('span', [ column.label || column.id ]),
			sortDetail && sortDetail.columnId === key ? v('div.dgrid-sort-arrow.ui-icon', { role: 'presentation' }) : null
		]);
	}
}

export default HeaderCell;
