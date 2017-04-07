import { v, w } from '@dojo/widget-core/d';
import { DNode } from '@dojo/widget-core/interfaces';
import { RegistryMixin, RegistryMixinProperties } from '@dojo/widget-core/mixins/Registry';
import { ThemeableMixin, theme, ThemeableProperties } from '@dojo/widget-core/mixins/Themeable';
import WidgetBase from '@dojo/widget-core/WidgetBase';
import { HasColumns, HasItems } from './interfaces';
import { RowProperties } from './Row';

import * as css from './styles/body.m.css';

export const BodyBase = ThemeableMixin(RegistryMixin(WidgetBase));

export interface BodyProperties extends ThemeableProperties, HasColumns, HasItems, RegistryMixinProperties { }

@theme(css)
class Body extends BodyBase<BodyProperties> {
	render(): DNode {
		const {
			items,
			columns,
			registry,
			theme
		} = this.properties;

		return v('div', {
				classes: this.classes(css.scroller)
			},
			[
				v('div', {
					classes: this.classes(css.content)
				},
				items.map((item) => {
					return w<RowProperties>('row', {
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
