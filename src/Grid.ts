import WidgetBase from '@dojo/widget-core/WidgetBase';
import { PropertiesChangeEvent } from '@dojo/widget-core/interfaces';
import { v, w } from '@dojo/widget-core/d';
import FactoryRegistry from '@dojo/widget-core/FactoryRegistry';
import Header from './Header';
import HeaderCell from './HeaderCell';
import Body from './Body';
import Row from './Row';
import Cell from './Cell';
import { DataProperties, HasColumns } from './interfaces';
import DataProviderBase, { Options } from './bases/DataProviderBase';
import { HeaderProperties } from './Header';
import { BodyProperties } from './Body';
import { theme, ThemeableMixin, ThemeableProperties } from '@dojo/widget-core/mixins/Themeable';
import { onPropertiesChanged } from '@dojo/widget-core/WidgetBase';
import { includes } from '@dojo/shim/array';
import { Subscription } from '@dojo/shim/Observable';

import * as gridClasses from './styles/grid.css';

/**
 * @type GridProperties
 *
 * Properties that can be set on a Grid
 *
 * @property dataProvider	An observable object that responds to events and returns DataProperties
 * @property columns		Column definitions
 */
export interface GridProperties extends ThemeableProperties, HasColumns {
	registry?: FactoryRegistry;
	dataProvider: DataProviderBase<any, Options>;
}

@theme(gridClasses)
class Grid extends ThemeableMixin(WidgetBase)<GridProperties> {
	private data: DataProperties<any>;
	private subscription: Subscription;

	@onPropertiesChanged
	protected onPropertiesChanged(evt: PropertiesChangeEvent<this, GridProperties>) {
		let {
			dataProvider,
			registry
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

		if (includes(evt.changedPropertyKeys, 'registry')) {
			this.registry = new FactoryRegistry();
			this.registry.define('header', (registry && registry.get('header')) || Header);
			this.registry.define('header-cell', (registry && registry.get('header-cell')) || HeaderCell);
			this.registry.define('body', (registry && registry.get('body')) || Body);
			this.registry.define('row', (registry && registry.get('row')) || Row);
			this.registry.define('cell', (registry && registry.get('cell')) || Cell);
		}
	}

	render() {
		const {
			registry,
			data: {
				items = [],
				sort = []
			} = {},
			properties: {
				theme,
				columns,
				dataProvider
			}
		} = this;
		const {
			sort: onSortRequest
		} = dataProvider;

		return v('div', {
			classes: this.classes(gridClasses.grid),
			role: 'grid'
		}, [
			w('header', <HeaderProperties> {
				registry,
				theme,
				columns,
				sortDetails: sort,
				onSortRequest: onSortRequest && onSortRequest.bind(dataProvider)
			}),
			w('body', <BodyProperties> {
				registry,
				theme,
				columns,
				items
			})
		]);
	}
}

export default Grid;
