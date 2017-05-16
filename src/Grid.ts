import { includes } from '@dojo/shim/array';
import { Subscription } from '@dojo/shim/Observable';
import { v, w } from '@dojo/widget-core/d';
import WidgetRegistry from '@dojo/widget-core/WidgetRegistry';
import { DNode, PropertyChangeRecord } from '@dojo/widget-core/interfaces';
import { theme, ThemeableMixin, ThemeableProperties } from '@dojo/widget-core/mixins/Themeable';
import WidgetBase, { diffProperty } from '@dojo/widget-core/WidgetBase';
import DataProviderBase from './bases/DataProviderBase';
import Body from './Body';
import Cell from './Cell';
import Header	 from './Header';
import HeaderCell from './HeaderCell';
import { DataProperties, HasColumns, HasEstimatedRowHeight, HasScrollTo } from './interfaces';
import Row from './Row';

import * as gridClasses from './styles/grid.m.css';
import Footer from './Footer';

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
	dataProvider: DataProviderBase<any>;
	footers?: DNode[];
}

const gridRegistry = new WidgetRegistry();
gridRegistry.define('header', Header);
gridRegistry.define('header-cell', HeaderCell);
gridRegistry.define('body', Body);
gridRegistry.define('row', Row);
gridRegistry.define('cell', Cell);
gridRegistry.define('footer', Footer);

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

	@diffProperty('dataProvider')
	protected diffPropertyDataProvider(previousDataProvider: DataProviderBase, dataProvider: DataProviderBase): PropertyChangeRecord {
		const changed = (previousDataProvider !== dataProvider);
		if (changed) {
			this.subscription && this.subscription.unsubscribe();
			this.subscription = dataProvider.observe().subscribe((data) => {
				this.data = (data || {});
				// TODO: Remove setTimeout when invalidation loop is adjusted (https://github.com/dojo/widget-core/pull/494/files)
				setTimeout(this.invalidate.bind(this));
			});
		}

		return {
			changed,
			value: dataProvider
		};
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
				footers = [],
				dataProvider,
				scrollTo = this.scrollTo,
				estimatedRowHeight = 20
			}
		} = this;
		const {
			slice: onSliceRequest,
			sort: onSortRequest,
			toggleExpanded: onToggleExpandedRequest
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
				onScrollToRequest: this.onScrollToRequest,
				onToggleExpandedRequest: onToggleExpandedRequest && onToggleExpandedRequest.bind(dataProvider)
			}),
			w<Footer>('footer', {
				registry,
				theme
			}, footers)
		]);
	}
}

export default Grid;
