import WidgetBase from '@dojo/widget-core/WidgetBase';
import { RegistryMixin } from '@dojo/widget-core/mixins/Registry';
import { v } from '@dojo/widget-core/d';
import { WidgetProperties } from '@dojo/widget-core/interfaces';
import { HasColumn, HasSortDetail, HasSortEvent } from './interfaces';
import { ThemeableMixin, theme } from '@dojo/widget-core/mixins/Themeable';

import * as headerCellClasses from './styles/headerCell.css';

export interface HeaderCellProperties extends WidgetProperties, HasColumn, HasSortDetail, HasSortEvent { }

@theme(headerCellClasses)
class HeaderCell extends ThemeableMixin(RegistryMixin(WidgetBase))<HeaderCellProperties> {
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

		const classes = [ headerCellClasses.cell ];
		if (column.sortable !== false) {
			classes.push(headerCellClasses.sortable);
		}

		const sortClasses: string[] = [];
		if (sortDetail) {
			sortClasses.push(headerCellClasses.sortArrow);
			if (sortDetail.descending) {
				sortClasses.push(headerCellClasses.sortArrowDown);
			}
			else {
				sortClasses.push(headerCellClasses.sortArrowUp);
			}
		}

		return v('th', {
			role: 'columnheader',
			onclick: this.onSortRequest,
			classes: this.classes(...classes).get()
		}, [
			v('span', [ column.label || column.id ]),
			sortDetail && sortDetail.columnId === key ? v('div.dgrid-sort-arrow.ui-icon', {
				role: 'presentation',
				classes: this.classes(...sortClasses).get()
			}) : null
		]);
	}
}

export default HeaderCell;
