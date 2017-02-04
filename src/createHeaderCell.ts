import createWidgetBase from '@dojo/widget-core/createWidgetBase';
import registryMixin  from '@dojo/widget-core/mixins/registryMixin';
import { v } from '@dojo/widget-core/d';
import { SortDetail, Column } from './createGrid';
import { WidgetProperties, Widget, WidgetFactory } from '@dojo/widget-core/interfaces';

export interface DgridHeaderCellProperties extends WidgetProperties {
	key: string;
	column: Column<any>;
	sortDetail: SortDetail;
	onSortRequest(sortDetail: SortDetail): void;
}

export type DgridHeaderCell = Widget<DgridHeaderCellProperties> & {
	onSortRequest(event: any): void;
}

export interface DgridHeaderFactory extends WidgetFactory<DgridHeaderCell, DgridHeaderCellProperties> { }

const createHeaderCell: DgridHeaderFactory = createWidgetBase
	.mixin(registryMixin)
	.mixin({
		mixin: {
			onSortRequest(this: DgridHeaderCell): void {
				const {
					key,
					column,
					sortDetail,
					onSortRequest
				} = <DgridHeaderCellProperties> this.properties;
				if (onSortRequest && (column.sortable || !column.hasOwnProperty('sortable'))) {
					onSortRequest({
						columnId: key,
						descending: !!(sortDetail && sortDetail.columnId === key && !sortDetail.descending)
					});
				}
			},
			render(this: DgridHeaderCell) {
				const {
					key,
					column,
					sortDetail
				} = <DgridHeaderCellProperties> this.properties;

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
	});

export default createHeaderCell;
