import { includes } from '@dojo/shim/array';
import { Subscription } from '@dojo/shim/Observable';
import { v, w } from '@dojo/widget-core/d';
import WidgetRegistry from '@dojo/widget-core/WidgetRegistry';
import { PropertiesChangeEvent } from '@dojo/widget-core/interfaces';
import { theme, ThemeableMixin, ThemeableProperties } from '@dojo/widget-core/mixins/Themeable';
import WidgetBase, { onPropertiesChanged } from '@dojo/widget-core/WidgetBase';
import DataProviderBase, { Options } from './bases/DataProviderBase';
import Body from './Body';
import Cell from './Cell';
import Header	 from './Header';
import HeaderCell from './HeaderCell';
import { DataProperties, HasColumns, HasEstimatedRowHeight, HasScrollTo } from './interfaces';
import Row from './Row';

import * as gridClasses from './styles/grid.m.css';

export const GridBase = ThemeableMixin(WidgetBase);

export interface ScrollTo {
	index: number;
	position?: 'none' | 'top' | 'middle' | 'bottom'; // default none
}

/**
 * @type GridProperties
 *
 * Properties that can be set on a Grid
 *
 * @property dataProvider	An observable object that responds to events and returns DataProperties
 * @property columns		Column definitions
 */
export interface GridProperties extends ThemeableProperties, HasColumns, Partial<HasEstimatedRowHeight>, Partial<HasScrollTo> {
	registry?: WidgetRegistry;
	dataProvider: DataProviderBase<any, Options, any>;
}

const gridRegistry = new WidgetRegistry();
gridRegistry.define('header', Header);
gridRegistry.define('header-cell', HeaderCell);
gridRegistry.define('body', Body);
gridRegistry.define('row', Row);
gridRegistry.define('cell', Cell);

@theme(gridClasses)
class Grid extends GridBase<GridProperties> {
	private data: DataProperties<any>;
	private subscription: Subscription;
	private scrollTo?: ScrollTo;
	protected registry: WidgetRegistry;

	constructor() {
		super();

		this.registries.add(gridRegistry);
	}

	private onScrollToRequest(scrollTo: ScrollTo) {
		this.scrollTo = scrollTo;
		this.invalidate();
	}

	private onScrollToComplete() {
		delete this.scrollTo;
		const onScrollToComplete = this.properties.onScrollToComplete;
		onScrollToComplete && onScrollToComplete();
	}

	@onPropertiesChanged()
	protected onPropertiesChanged(evt: PropertiesChangeEvent<this, GridProperties>) {
		const {
			dataProvider
		} = evt.properties;

		if (includes(evt.changedPropertyKeys, 'dataProvider')) {
			if (this.subscription) {
				this.subscription.unsubscribe();
			}

			this.subscription = dataProvider.observe().subscribe((data) => {
				this.data = data;
				this.invalidate();
			});
		}
	}

	render() {
		const {
			data: {
				items = [],
				sort = [],
				size
			} = <DataProperties<any>> {},
			properties: {
				theme,
				columns,
				dataProvider,
				scrollTo = this.scrollTo,
				estimatedRowHeight = 20
			}
		} = this;
		const {
			slice: onSliceRequest,
			sort: onSortRequest
		} = dataProvider;
		const registry: WidgetRegistry = <any> this.registries;

		return v('div', {
			classes: this.classes(gridClasses.grid),
			role: 'grid'
		}, [
			w<Header>('header', {
				registry,
				theme,
				columns,
				sortDetails: sort,
				onSortRequest: onSortRequest && onSortRequest.bind(dataProvider)
			}),
			w<Body>('body', {
				registry,
				theme,
				columns,
				estimatedRowHeight,
				items,
				size,
				onSliceRequest: onSliceRequest && onSliceRequest.bind(dataProvider),
				scrollTo,
				onScrollToComplete: this.onScrollToComplete,
				onScrollToRequest: this.onScrollToRequest
			})
		]);
	}
}

export default Grid;
