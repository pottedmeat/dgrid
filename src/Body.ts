import WidgetBase from '@dojo/widget-core/WidgetBase';
import { RegistryMixin, RegistryMixinProperties } from '@dojo/widget-core/mixins/Registry';
import { v, w } from '@dojo/widget-core/d';
import { HasColumns, HasItems } from './interfaces';
import { RowProperties } from './Row';
import { ThemeableMixin, theme, ThemeableProperties } from '@dojo/widget-core/mixins/Themeable';

import * as bodyClasses from './styles/body.css';

export interface BodyProperties extends ThemeableProperties, HasColumns, HasItems, RegistryMixinProperties { }

@theme(bodyClasses)
class Body extends ThemeableMixin(RegistryMixin(WidgetBase))<BodyProperties> {
	render() {
		const {
			items,
			columns,
			registry,
			theme
		} = this.properties;

		return v('div', {
				classes: this.classes(bodyClasses.scroller)
			},
			[
				v('div', {
					classes: this.classes(bodyClasses.content)
				},
				items.map((item) => {
					return w('row', <RowProperties> {
						key: item.id,
						item,
						columns,
						registry,
						theme
					});
				}))
			]
		);
	}
}

export default Body;
