import createWidgetBase from '@dojo/widget-core/createWidgetBase';
import { WidgetMixin, Widget, WidgetFactory, WidgetProperties, DNode } from '@dojo/widget-core/interfaces';
import { DgridDataProvider } from './bases/createDataProviderBase';
import { v, w } from '@dojo/widget-core/d';
import FactoryRegistry from '@dojo/widget-core/FactoryRegistry';
import WeakMap from '@dojo/shim/WeakMap';
import createHeader from './createHeader';
import createHeaderCell from './createHeaderCell';
import createBody from './createBody';
import createRow from './createRow';
import createCell from './createCell';

export interface SortDetail {
	columnId: string;
	descending?: boolean;
}

export interface ItemProperties<T> {
	id: string;
	data: T;
}

export interface DataProperties {
	items: ItemProperties<any>[];
	sortDetails?: SortDetail[];
}

export interface Column<T> {
	id: string;
	label?: string;
	field?: string;
	sortable?: boolean; // default true
	renderer?(item: ItemProperties<T>, value: any): string | DNode;
}

export interface DgridPropertiesInterface extends WidgetProperties {
	data: DgridDataProvider;
}

export interface DgridProperties extends DgridPropertiesInterface {
	columns: Column<any>[];
}

export interface DgridMixin extends WidgetMixin<WidgetProperties> {

}

export type Dgrid = DgridMixin & Widget<DgridProperties>

export interface DgridFactory extends WidgetFactory<Dgrid, DgridProperties> { }

interface DgridState {
	data: DataProperties;
}

const instanceStateMap = new WeakMap<Dgrid, DgridState>();

const createGrid: DgridFactory = createWidgetBase
	.override({
		render(this: Dgrid) {
			const {
				registry,
				properties: {
					columns,
					data
				}
			} = <{ registry?: FactoryRegistry; properties: DgridProperties }> this;
			const {
				onSortRequest
			} = data;
			const {
				data: {
					items,
					sortDetails
				}
			} = instanceStateMap.get(this);

			return v('div.dgrid.dgrid-grid', {
				role: 'grid'
			}, [
				w('header', {
					registry,
					columns,
					sortDetails,
					onSortRequest: onSortRequest && onSortRequest.bind(data)
				}),
				w('body', {
					registry,
					columns,
					items
				})
			]);
		}
	})
	.mixin({
		initialize(instance: Dgrid, { properties: { data } }: { properties: DgridProperties }) {
			const registry = instance.registry = new FactoryRegistry();
			registry.define('header', createHeader);
			registry.define('header-cell', createHeaderCell);
			registry.define('body', createBody);
			registry.define('row', createRow);
			registry.define('cell', createCell);

			const state: DgridState = { data: { items: [] } };
			instanceStateMap.set(instance, state);

			if (data) {
				data.observe().subscribe((data) => {
					state.data = data;
					instance.invalidate();
				});
			}
		}
	});

export default createGrid;
