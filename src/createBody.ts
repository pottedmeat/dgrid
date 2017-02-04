import { Widget, WidgetMixin, WidgetProperties, WidgetFactory } from '@dojo/widget-core/interfaces';
import createWidgetBase from '@dojo/widget-core/createWidgetBase';
import registryMixin, { RegistryMixin, RegistryMixinProperties } from '@dojo/widget-core/mixins/registryMixin';
import { v, w } from '@dojo/widget-core/d';
import { Column, ItemProperties } from './createGrid';

export interface DgridBodyProperties extends WidgetProperties, RegistryMixinProperties {
	columns: Column<any>[];
	items: ItemProperties<any>[];
}

export interface DgridBodyMixin extends WidgetMixin<DgridBodyProperties>, RegistryMixin { }

export type DgridBody = Widget<DgridBodyProperties> & DgridBodyMixin

export interface DgridBodyFactory extends WidgetFactory<DgridBodyMixin, DgridBodyProperties> { }

const createBody: DgridBodyFactory = createWidgetBase
	.mixin(registryMixin)
	.mixin({
		mixin: {
			render(this: DgridBody) {
				const {
					items,
					columns,
					registry
				} = <DgridBodyProperties> this.properties;

				return v('div.dgrid-scroller', [
					v('div.dgrid-content', items.map((item) => {
						return w('row', {
							key: item.id,
							item,
							columns,
							registry
						});
					}))
				]);
			}
		}
	});

export default createBody;
