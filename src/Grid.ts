import global from '@dojo/core/global';
import { Subscription } from '@dojo/shim/Observable';
import { v, w } from '@dojo/widget-core/d';
import { reference } from '@dojo/widget-core/diff';
import { DNode, PropertyChangeRecord } from '@dojo/widget-core/interfaces';
import { RegistryMixin }  from '@dojo/widget-core/mixins/Registry';
import { theme, ThemeableMixin, ThemeableProperties } from '@dojo/widget-core/mixins/Themeable';
import WidgetBase, { diffProperty } from '@dojo/widget-core/WidgetBase';
import DataProviderBase from './bases/DataProviderBase';
import Body from './Body';
import ColumnHeaders from './ColumnHeaders';
import Footer from './Footer';
import GridRegistry, { gridRegistry } from './GridRegistry';
import Header, { HeaderType } from './Header';
import {  DataProperties, HasBufferRows,  HasColumns, HasScrollTo, ScrollToDetails, SliceRequestListener, SortRequestListener } from './interfaces';

import * as css from './styles/grid.m.css';

export const GridBase = ThemeableMixin(RegistryMixin(WidgetBase));

/**
 * @type GridProperties
 *
 * Properties that can be set on a Grid
 *
 * @property columns		Column definitions
 * @property dataProvider	An observable object that responds to events and returns {@link DataProperties}
 */
export interface GridProperties extends ThemeableProperties, HasBufferRows, HasColumns, HasScrollTo {
	dataProvider: DataProviderBase;
	registry?: GridRegistry;
	footers?: (HeaderType | DNode)[];
	headers?: (HeaderType | DNode)[];
}

@theme(css)
class Grid extends GridBase<GridProperties> {
	private _data: DataProperties<object> = <DataProperties<object>> {};
	private _invalidating: number;
	private _scrollTo: ScrollToDetails;
	private _subscription: Subscription;
	private _sortRequestListener: SortRequestListener;
	private _sliceRequestListener: SliceRequestListener;

	constructor() {
		super();

		this.getRegistries().add(gridRegistry);
	}

	@diffProperty('dataProvider', reference)
	protected diffPropertyDataProvider({ dataProvider: previousDataProvider }: { dataProvider: DataProviderBase }, { dataProvider }: { dataProvider: DataProviderBase }): PropertyChangeRecord {
		const changed = (previousDataProvider !== dataProvider);
		if (changed) {
			this._sliceRequestListener = dataProvider.slice.bind(dataProvider);
			this._sortRequestListener = dataProvider.sort.bind(dataProvider);

			this._subscription && this._subscription.unsubscribe();
			this._subscription = dataProvider.observe().subscribe((data) => {
				console.log('new data', data);
				this._data = data;
				global.cancelAnimationFrame(this._invalidating);
				this._invalidating = global.requestAnimationFrame(this.invalidate.bind(this));
			});
		}

		return {
			changed,
			value: dataProvider
		};
	}

	private onScrollToRequest(scrollTo: ScrollToDetails) {
		this._scrollTo = scrollTo;
		this.invalidate();
	}

	private onScrollToComplete(scrollTo: ScrollToDetails) {
		delete this._scrollTo;
		const {
			onScrollToComplete
		} = this.properties;
		onScrollToComplete && onScrollToComplete(scrollTo);
	}

	protected inflateHeaderTypes(nodes: (HeaderType | DNode)[]): DNode[] {
		const {
			_data: {
				sort: sortDetails = []
			},
			_sortRequestListener: onSortRequest,
			properties: {
				columns,
				theme,
				registry = gridRegistry
			}
		} = this;

		return nodes.map((child) => {
			return (child === HeaderType.COLUMN_HEADERS) ? w<ColumnHeaders>('column-headers', {
				columns,
				registry,
				sortDetails,
				theme,
				onSortRequest
			}) : <DNode> child;
		});
	}

	render(): DNode {
		console.log('Grid.render');
		const {
			_data: {
				items = [],
				size = { dataLength: 0, totalLength: 0 },
				slice,
				sort: sortDetails = []
			},
			_sliceRequestListener: onSliceRequest,
			_sortRequestListener: onSortRequest,
			onScrollToComplete,
			onScrollToRequest,
			properties: {
				bufferRows,
				columns,
				footers = [],
				headers = [ HeaderType.COLUMN_HEADERS ],
				theme,
				registry = gridRegistry,
				rowDrift,
				scrollTo = this._scrollTo
			}
		} = this;

		console.log('data', items);
		return v('div', {
			classes: this.classes(css.grid),
			role: 'grid'
		}, [
			w<Header>('header', {
				registry,
				theme
			}, this.inflateHeaderTypes(headers)),
			w<Body>('body', {
				bufferRows,
				columns,
				items,
				onScrollToComplete,
				onScrollToRequest,
				onSliceRequest,
				registry,
				scrollTo,
				size,
				slice,
				rowDrift,
				theme
			}),
			w<Footer>('footer', {
				registry,
				theme
			}, this.inflateHeaderTypes(footers))
		]);
	}
}

export default Grid;
