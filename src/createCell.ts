import { Widget, WidgetProperties, WidgetFactory } from '@dojo/widget-core/interfaces';
import createWidgetBase from '@dojo/widget-core/createWidgetBase';
import { Column, ItemProperties } from './createGrid';
import { v } from '@dojo/widget-core/d';

export interface DgridCellProperties extends WidgetProperties {
	data: string;
	column: Column<any>;
	item: ItemProperties<any>;
}

export type DgridCell = Widget<DgridCellProperties>

export interface DgridCellFactory extends WidgetFactory<DgridCell, DgridCellProperties> { }

const createCell: DgridCellFactory = createWidgetBase
	.mixin({
		mixin: {
			render(this: DgridCell) {
				const {
					item,
					data = '',
					renderer
				} = this.properties;

				return v('td.dgrid-cell', {
					role: 'gridcell'
				}, [
					renderer ? renderer(item, data) : '' + data
				]);
			}
		}
	});

export default createCell;
