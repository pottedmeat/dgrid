import createWidgetBase from '@dojo/widget-core/createWidgetBase';
import registryMixin, { RegistryMixinProperties }  from '@dojo/widget-core/mixins/registryMixin';
import { v, w } from '@dojo/widget-core/d';
import { SortDetail, Column } from './createGrid';
import { WidgetProperties, Widget, WidgetFactory } from '@dojo/widget-core/interfaces';

export interface DgridHeaderProperties extends WidgetProperties, RegistryMixinProperties {
	columns: Column<any>[];
	sortDetails?: SortDetail[];
	onSortRequest(sortDetail: SortDetail): void;
}

export type DgridHeader = Widget<DgridHeaderProperties>

export interface DgridHeaderFactory extends WidgetFactory<DgridHeader, DgridHeaderProperties> { }

const createHeader: DgridHeaderFactory = createWidgetBase
	.mixin(registryMixin)
	.mixin({
		mixin: {
			render(this: DgridHeader) {
				const {
					onSortRequest,
					columns,
					sortDetails = []
				} = <DgridHeaderProperties> this.properties;

				return v('div.dgrid-header.dgrid-header-row', {
					role: 'row'
				}, [
					v('table.dgrid-row-table', {
						role: 'presentation'
					}, [
						v('tr', columns.map((column) => {
							let sortDetail: SortDetail | undefined = undefined;
							for (const detail of sortDetails) {
								if (detail.columnId === column.id) {
									sortDetail = detail;
									break;
								}
							}

							return w('header-cell', {
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
	});

export default createHeader;
