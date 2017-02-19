import { WidgetProperties } from '@dojo/widget-core/interfaces';
import WidgetBase from '@dojo/widget-core/WidgetBase';
import { RegistryMixin, RegistryMixinProperties } from '@dojo/widget-core/mixins/Registry';
import { v, w } from '@dojo/widget-core/d';
import { HasColumns, HasItems } from './interfaces';
import { RowProperties } from './Row';

export interface BodyProperties extends WidgetProperties, HasColumns, HasItems, RegistryMixinProperties { }

class Body extends RegistryMixin(WidgetBase)<BodyProperties> {
	render() {
		const {
			items,
			columns,
			registry
		} = this.properties;

		return v('div.dgrid-scroller', [
			v('div.dgrid-content', items.map((item) => {
				return w('row', <RowProperties> {
					key: item.id,
					item,
					columns,
					registry
				});
			}))
		]);
	}
}

export default Body;
