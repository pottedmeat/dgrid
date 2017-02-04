import { Widget, WidgetMixin, WidgetProperties, WidgetFactory } from '@dojo/widget-core/interfaces';
import createWidgetBase from '@dojo/widget-core/createWidgetBase';
import registryMixin, { RegistryMixin, RegistryMixinProperties } from '@dojo/widget-core/mixins/registryMixin';
import { v, w } from '@dojo/widget-core/d';
import { Column } from './createGrid';

export interface DgridRowProperties extends WidgetProperties, RegistryMixinProperties {
	item: any;
	columns: Column<any>[];
}

export interface DgridRowMixin extends WidgetMixin<DgridRowProperties>, RegistryMixin { }

export type DgridRow = Widget<DgridRowProperties>

export interface DgridRowFactory extends WidgetFactory<DgridRowMixin, DgridRowProperties> { }

const createRow: DgridRowFactory = createWidgetBase
	.mixin(registryMixin)
	.mixin({
		mixin: {
			render(this: DgridRow) {
				const {
					registry,
					item,
					columns = []
				} = <DgridRowProperties> this.properties;

				return v('div.dgrid-row', {
					role: 'row'
				}, [
					v('table.dgrid-row-table', {
						role: 'presentation'
					}, [
						v('tr', columns.map(({ id, field, renderer }) => {
							return w('cell', {
								registry,
								key: id,
								item: item,
								data: item.data[ field || id ],
								renderer
							});
						}))
					])
				]);
			}
		}
	});

export default createRow;
