import WidgetBase from '@dojo/widget-core/WidgetBase';
import { WidgetProperties, PropertiesChangeEvent } from '@dojo/widget-core/interfaces';
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
import { theme, ThemeableMixin } from '@dojo/widget-core/mixins/Themeable';
import { onPropertiesChanged } from '@dojo/widget-core/WidgetBase';
import { includes } from '@dojo/shim/array';

import * as gridClasses from './styles/grid.css';
import { Subscription } from '@dojo/shim/Observable';

/**
 * @type GridProperties
 *
 * Properties that can be set on a Grid
 *
 * @property dataProvider	An observable object that responds to events and returns DataProperties
 * @property columns		Column definitions
 */
export interface GridProperties extends WidgetProperties, HasColumns {
	registry?: FactoryRegistry;
	dataProvider: DataProviderBase<any, Options>;
}

@theme(gridClasses)
class Grid extends ThemeableMixin(WidgetBase)<GridProperties> {
	private data: DataProperties<any>;
	private subscription: Subscription;

	constructor() {
		super();

		const registry = this.registry = new FactoryRegistry();
		registry.define('header', Header);
		registry.define('header-cell', HeaderCell);
		registry.define('body', Body);
		registry.define('row', Row);
		registry.define('cell', Cell);
	}

	@onPropertiesChanged
	myPropChangedListener(evt: PropertiesChangeEvent<this, GridProperties>) {
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
			registry,
			data: {
				items = [],
				sort = []
			} = {},
			properties: {
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
				columns,
				sortDetails: sort,
				onSortRequest: onSortRequest && onSortRequest.bind(dataProvider)
			}),
			w('body', <BodyProperties> {
				registry,
				columns,
				items
			})
		]);
	}
}

export default Grid;
